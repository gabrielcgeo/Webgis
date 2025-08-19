import os
import io
import zipfile
import glob
import uuid
import json
from flask import (Flask, render_template, jsonify, send_file, send_from_directory,
                   request, redirect, url_for, flash, abort)
from flask_sqlalchemy import SQLAlchemy
from flask_login import (LoginManager, UserMixin, login_user, logout_user,
                       login_required, current_user)
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import geopandas as gpd
import warnings
from datetime import datetime, timedelta
from dateutil.parser import parse

warnings.filterwarnings('ignore', 'CRS related issues')

# --- CONFIGURAÇÃO INICIAL DA APLICAÇÃO FLASK ---
app = Flask(__name__, instance_relative_config=True)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'uma-chave-secreta-muito-forte-para-desenvolvimento')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dados')
app.config['UPLOAD_FOLDER'] = DATA_DIR

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = "Por favor, faça login para acessar esta página."
login_manager.login_message_category = "info"

# --- MODELOS DO BANCO DE DADOS ---
class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False)
    logo_url = db.Column(db.String(255), nullable=True, default='/static/default_logo.png')
    primary_color = db.Column(db.String(7), default='#00d28f')
    layer_limit = db.Column(db.Integer, nullable=False, default=5)
    storage_limit_mb = db.Column(db.Integer, nullable=False, default=100)
    expiry_date = db.Column(db.DateTime, nullable=True)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='admin')
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=True)
    company = db.relationship('Company', backref='users')

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    company = db.relationship('Company', backref='projects')

class Layer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    thematic_group = db.Column(db.String(100), default="Geral")
    creation_date = db.Column(db.DateTime, default=datetime.utcnow)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    project = db.relationship('Project', backref='layers')
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    owner = db.relationship('User', backref='layers')
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    company = db.relationship('Company', backref='layers')

class SharedMap(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(120), nullable=False)
    configuration = db.Column(db.Text, nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    owner = db.relationship('User', backref='shared_maps')

# --- LÓGICA DE LOGIN E PERMISSÕES ---
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def super_admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'super_admin':
            abort(403)
        return f(*args, **kwargs)
    return decorated_function

@app.context_processor
def inject_context():
    context = {}
    company_slug = request.view_args.get('company_slug') if request.view_args else None
    if current_user.is_authenticated:
        if current_user.role == 'super_admin':
             context['company_theme'] = {'name': 'WebGIS Super Admin', 'slug': None, 'primary_color': '#343a40', 'logo_url': url_for('static', filename='default_logo.png')}
        elif current_user.company:
            context['company_theme'] = current_user.company
        else:
            context['company_theme'] = {'name': 'Admin Sem Empresa', 'slug': None, 'primary_color': '#6c757d', 'logo_url': url_for('static', filename='default_logo.png')}
    elif company_slug:
        company = Company.query.filter_by(slug=company_slug).first()
        if company:
            context['company_theme'] = company
        else:
            context['company_theme'] = {'name': 'Portal não encontrado', 'slug': None, 'primary_color': '#dc3545', 'logo_url': url_for('static', filename='default_logo.png')}
    else:
        context['company_theme'] = {'name': 'WebGIS', 'slug': None, 'primary_color': '#00d28f', 'logo_url': url_for('static', filename='default_logo.png')}
    return context

@app.before_request
def check_subscription_status():
    if not current_user.is_authenticated or request.endpoint in ['logout', 'static', 'login', 'subscription_expired', 'home', 'public_map', 'public_api_layers', 'public_api_layer_data']:
        return
    if current_user.role != 'super_admin' and current_user.company and current_user.company.expiry_date:
        if datetime.utcnow() > current_user.company.expiry_date:
            if request.endpoint != 'subscription_expired':
                return redirect(url_for('subscription_expired'))
        elif datetime.utcnow() > current_user.company.expiry_date - timedelta(days=15):
             days_left = (current_user.company.expiry_date - datetime.utcnow()).days
             flash(f'Atenção: Sua assinatura expira em {days_left+1} dia(s).', 'warning')

# --- ROTAS DE AUTENTICAÇÃO E PÁGINAS GERAIS ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated: return redirect(url_for('home'))
    if request.method == 'POST':
        user = User.query.filter_by(email=request.form.get('email')).first()
        if user and check_password_hash(user.password_hash, request.form.get('password')):
            login_user(user)
            return redirect(url_for('home'))
        flash('Email ou senha inválidos.', 'danger')
    return render_template('auth/login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/subscription-expired')
@login_required
def subscription_expired():
    return render_template('subscription_expired.html')

@app.route('/')
def home():
    if current_user.is_authenticated:
        if current_user.role == 'super_admin':
            return redirect(url_for('admin_dashboard'))
        if current_user.company:
            return redirect(url_for('company_portal', company_slug=current_user.company.slug))
        else:
            return redirect(url_for('admin_dashboard'))
    return render_template('home.html')

# --- ROTAS PÚBLICAS E DOS PORTAIS ---
@app.route('/portal/<string:company_slug>')
def company_portal(company_slug):
    company = Company.query.filter_by(slug=company_slug).first_or_404()
    return render_template('index.html', company=company)

@app.route('/public/map/<string:public_id>')
def public_map(public_id):
    shared_map = SharedMap.query.filter_by(public_id=public_id).first_or_404()
    return render_template('public_map.html', shared_map=shared_map)

# --- ROTAS DE API (PARA O MAPA) ---
def get_layers_from_config(config):
    query = Layer.query
    if config.get('projects'):
        query = query.filter(Layer.project_id.in_(config['projects']))
    return query.all()

@app.route('/public/api/layers/<string:public_id>')
def public_api_layers(public_id):
    shared_map = SharedMap.query.filter_by(public_id=public_id).first_or_404()
    config = json.loads(shared_map.configuration)
    layers = get_layers_from_config(config)
    return jsonify([{'name': layer.name, 'filename': layer.filename, 'theme': layer.thematic_group} for layer in layers])

@app.route('/public/api/layer_data/<string:filename>')
def public_api_layer_data(filename):
    if '..' in filename or filename.startswith('/'):
        abort(400)
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        gdf = gpd.read_file(filepath)
        return jsonify(gdf.to_crs(epsg=4326).__geo_interface__)
    abort(404)

@app.route('/portal/<string:company_slug>/api/camadas')
def listar_camadas(company_slug):
    company = Company.query.filter_by(slug=company_slug).first_or_404()
    layers = Layer.query.filter_by(company_id=company.id).all()
    projects_dict = {}
    for l in layers:
        proj_name = l.project.name
        if proj_name not in projects_dict:
            projects_dict[proj_name] = []
        projects_dict[proj_name].append({'name': l.name, 'filename': l.filename, 'theme': l.thematic_group})
    return jsonify(projects_dict)

def calculate_company_storage(company_id):
    total_size_bytes = 0
    layers = Layer.query.filter_by(company_id=company_id).all()
    for layer in layers:
        base_path = os.path.join(DATA_DIR, os.path.splitext(layer.filename)[0])
        for filepath in glob.glob(f"{base_path}.*"):
            if os.path.exists(filepath):
                total_size_bytes += os.path.getsize(filepath)
    return total_size_bytes / (1024 * 1024)

# --- ROTAS DE ADMIN ---
@app.route('/admin/dashboard')
@login_required
def admin_dashboard(): return render_template('admin/dashboard.html')

@app.route('/admin/upload', methods=['GET'])
@login_required
def upload_layer_page():
    if not current_user.company_id:
        flash('Associe seu usuário a uma empresa para fazer upload.', 'warning')
        return redirect(url_for('admin_dashboard'))
    projects = Project.query.filter_by(company_id=current_user.company_id).all()
    return render_template('admin/upload_layer.html', projects=projects)

@app.route('/admin/upload_action', methods=['POST'])
@login_required
def upload_file_action():
    if not current_user.company_id:
        flash('Você precisa estar associado a uma empresa para fazer upload.', 'danger')
        return redirect(url_for('admin_dashboard'))
    
    company = current_user.company
    
    current_layer_count = Layer.query.filter_by(company_id=company.id).count()
    if current_layer_count >= company.layer_limit:
        flash(f'Erro: Limite de {company.layer_limit} camadas atingido.', 'danger')
        return redirect(url_for('upload_layer_page'))

    file = request.files.get('file')
    project_id = request.form.get('project_id')
    if not file or file.filename == '' or not project_id:
        flash('Arquivo e projeto são obrigatórios.', 'warning')
        return redirect(url_for('upload_layer_page'))
        
    file.seek(0, os.SEEK_END)
    new_file_size_mb = file.tell() / (1024 * 1024)
    file.seek(0)
    current_storage_usage_mb = calculate_company_storage(company.id)
    if (current_storage_usage_mb + new_file_size_mb) > company.storage_limit_mb:
        flash(f'Erro: Upload excederia seu limite de armazenamento de {company.storage_limit_mb} MB.', 'danger')
        return redirect(url_for('upload_layer_page'))

    filename = file.filename
    base_name = os.path.splitext(filename)[0]
    final_filename = filename

    if filename.lower().endswith('.zip'):
        try:
            zip_buffer = io.BytesIO(file.read())
            with zipfile.ZipFile(zip_buffer, 'r') as zip_ref:
                shp_files = [s for s in zip_ref.namelist() if s.lower().endswith('.shp')]
                if not shp_files:
                    flash('Arquivo ZIP não contém um arquivo .shp.', 'danger')
                    return redirect(url_for('upload_layer_page'))
                base_name = os.path.splitext(shp_files[0])[0]
                final_filename = f"{base_name}.shp"
                zip_ref.extractall(app.config['UPLOAD_FOLDER'])
        except Exception as e:
            flash(f"Erro ao processar ZIP: {e}", 'danger')
            return redirect(url_for('upload_layer_page'))
    else:
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    
    novo_nome_camada = request.form.get('layer_name') or base_name
    
    nova_camada = Layer(
        name=novo_nome_camada, filename=final_filename,
        thematic_group=request.form.get('thematic_group'),
        project_id=project_id,
        owner_id=current_user.id, company_id=current_user.company_id
    )
    db.session.add(nova_camada)
    db.session.commit()
    
    flash(f"Camada '{novo_nome_camada}' enviada com sucesso!", 'success')
    return redirect(url_for('company_portal', company_slug=company.slug))

@app.route('/admin/projects', methods=['GET', 'POST'])
@login_required
def manage_projects():
    if not current_user.company_id:
        flash('Associe seu usuário a uma empresa para criar projetos.', 'warning')
        return redirect(url_for('admin_dashboard'))
    if request.method == 'POST':
        name = request.form.get('name')
        new_project = Project(name=name, company_id=current_user.company_id)
        db.session.add(new_project)
        db.session.commit()
        flash('Projeto criado com sucesso!', 'success')
        return redirect(url_for('manage_projects'))
    projects = Project.query.filter_by(company_id=current_user.company_id).all()
    return render_template('admin/manage_projects.html', projects=projects)

@app.route('/admin/shared_maps', methods=['GET', 'POST'])
@login_required
def manage_shared_maps():
    if not current_user.company_id:
        flash('Associe seu usuário a uma empresa para gerenciar mapas.', 'warning')
        return redirect(url_for('admin_dashboard'))

    if request.method == 'POST':
        name = request.form.get('name')
        project_ids = request.form.getlist('project_ids', type=int)
        valid_projects = Project.query.filter(Project.id.in_(project_ids), Project.company_id==current_user.company_id).all()
        valid_project_ids = [p.id for p in valid_projects]
        
        config = {'projects': valid_project_ids}
        new_map = SharedMap(name=name, configuration=json.dumps(config), owner_id=current_user.id)
        db.session.add(new_map)
        db.session.commit()
        flash('Mapa público criado com sucesso!', 'success')
        return redirect(url_for('manage_shared_maps'))

    projects = Project.query.filter_by(company_id=current_user.company_id).all()
    shared_maps = SharedMap.query.filter_by(owner_id=current_user.id).all()
    return render_template('admin/manage_shared_maps.html', projects=projects, shared_maps=shared_maps)

# --- ROTAS DE SUPER ADMIN ---
@app.route('/admin/companies')
@login_required
@super_admin_required
def manage_companies():
    companies = Company.query.all()
    return render_template('admin/manage_companies.html', companies=companies)

@app.route('/admin/companies/form', defaults={'id': 0}, methods=['GET', 'POST'])
@app.route('/admin/companies/form/<int:id>', methods=['GET', 'POST'])
@login_required
@super_admin_required
def edit_company(id):
    if id:
        company = Company.query.get_or_404(id)
    else:
        company = Company()

    if request.method == 'POST':
        slug = request.form.get('slug')
        existing_company = Company.query.filter(Company.slug == slug, Company.id != id).first()
        if existing_company:
            flash('Este "slug" de URL já está em uso.', 'danger')
            return render_template('admin/edit_company.html', company=company)
        
        company.name = request.form.get('name')
        company.slug = slug
        company.primary_color = request.form.get('primary_color')
        company.layer_limit = request.form.get('layer_limit', type=int)
        company.storage_limit_mb = request.form.get('storage_limit_mb', type=int)
        expiry_date_str = request.form.get('expiry_date')
        company.expiry_date = parse(expiry_date_str) if expiry_date_str else None
        
        if not id:
            db.session.add(company)
        db.session.commit()
        flash(f'Empresa "{company.name}" salva com sucesso!', 'success')
        return redirect(url_for('manage_companies'))

    return render_template('admin/edit_company.html', company=company)

@app.route('/admin/users')
@login_required
@super_admin_required
def manage_users():
    users = User.query.filter(User.role != 'super_admin').all()
    return render_template('admin/manage_users.html', users=users)

@app.route('/admin/users/create', methods=['GET', 'POST'])
@login_required
@super_admin_required
def create_user():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        company_id = request.form.get('company_id')
        if User.query.filter_by(email=email).first():
            flash('Email já cadastrado.', 'warning')
        else:
            hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
            new_user = User(email=email, password_hash=hashed_password, role='admin', company_id=company_id)
            db.session.add(new_user)
            db.session.commit()
            flash('Administrador secundário criado.', 'success')
            return redirect(url_for('manage_users'))
    companies = Company.query.all()
    return render_template('admin/create_user.html', companies=companies)

# --- SETUP INICIAL DO BANCO DE DADOS ---
with app.app_context():
    os.makedirs(DATA_DIR, exist_ok=True)
    db.create_all()
    if not User.query.filter_by(role='super_admin').first():
        email = 'profgabrielcaldeira@gmail.com'
        password = 'Geografi@'
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        super_admin = User(email=email, password_hash=hashed_password, role='super_admin')
        db.session.add(super_admin)
        db.session.commit()
        print(f"Usuário Super Admin '{email}' criado.")