
import os
import io
import zipfile
import glob
import uuid
import json
import subprocess
from flask import (Flask, render_template, jsonify, send_file, send_from_directory,
                   request, redirect, url_for, flash, abort)
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from flask_login import (LoginManager, UserMixin, login_user, logout_user,
                       login_required, current_user)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
import geopandas as gpd
import warnings
from datetime import datetime, timedelta, date
from dateutil.parser import parse
from shapely.geometry import shape, box
import requests
import xml.etree.ElementTree as ET
import numpy as np

warnings.filterwarnings('ignore', 'CRS related issues')

# --- CONFIGURAÇÃO INICIAL DA APLICAÇÃO FLASK ---
app = Flask(__name__, instance_relative_config=True)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'uma-chave-secreta-muito-forte-para-desenvolvimento')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', f"sqlite:///{os.path.join(app.instance_path, 'database.db')}")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dados')
app.config['UPLOAD_FOLDER'] = DATA_DIR
app.config['ALLOWED_EXTENSIONS'] = {'zip', 'kmz', 'kml', 'geojson', 'shp', 'tif', 'tiff'}

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = "Por favor, faça login para acessar esta página."
login_manager.login_message_category = "info"

# --- MODELOS DO BANCO DE DADOS (ATUALIZADOS) ---
class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False)
    logo_url = db.Column(db.String(255), nullable=True, default='/static/default_logo.png')
    primary_color = db.Column(db.String(7), default='#00d28f')
    layer_limit = db.Column(db.Integer, nullable=False, default=10)
    storage_limit_mb = db.Column(db.Integer, nullable=False, default=200)
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
    layer_type = db.Column(db.String(20), default='vector') # NOVO: 'vector' ou 'raster'
    thematic_group = db.Column(db.String(100), default="Geral")
    creation_date = db.Column(db.DateTime, default=datetime.utcnow)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    project = db.relationship('Project', backref='layers')
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    owner = db.relationship('User', backref='layers')
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    company = db.relationship('Company', backref='layers')
    # NOVOS CAMPOS DE METADADOS
    metadata_producer = db.Column(db.String(200), nullable=True)
    metadata_date = db.Column(db.Date, nullable=True)
    metadata_responsible = db.Column(db.String(200), nullable=True)
    metadata_crs = db.Column(db.String(50), nullable=True)
    # NOVO CAMPO DE SIMBOLOGIA
    symbology = db.Column(db.Text, nullable=True) # Armazenará um JSON

class SharedMap(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(120), nullable=False)
    configuration = db.Column(db.Text, nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    owner = db.relationship('User', backref='shared_maps')
    # NOVOS CAMPOS PARA MÉTRICAS E VÍNCULO
    access_count = db.Column(db.Integer, default=0)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=True)
    company = db.relationship('Company', backref='shared_maps')

# NOVO MODELO PARA SERVIÇOS EXTERNOS
class ExternalService(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    service_type = db.Column(db.String(10), nullable=False) # WMS ou WFS
    base_url = db.Column(db.String(500), nullable=False)
    layers = db.Column(db.Text, nullable=True) # JSON com as camadas selecionadas
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    company = db.relationship('Company', backref='external_services')


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

# --- LÓGICA DE NEGÓCIO E CONTEXTO ---
@app.context_processor
def inject_context():
    # ... (código original sem alterações)
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
    # ... (código original sem alterações)
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
    # ... (código original sem alterações)
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
    # ... (código original sem alterações)
    logout_user()
    return redirect(url_for('home'))

@app.route('/subscription-expired')
@login_required
def subscription_expired():
    # ... (código original sem alterações)
    return render_template('subscription_expired.html')

@app.route('/')
def home():
    # ... (código original sem alterações)
    if current_user.is_authenticated:
        if current_user.role == 'super_admin':
            return redirect(url_for('admin_dashboard'))
        if current_user.company:
            return redirect(url_for('company_portal', company_slug=current_user.company.slug))
        else:
            return redirect(url_for('admin_dashboard'))
    return render_template('home.html')

# --- ROTAS DOS PORTAIS E MAPAS PÚBLICOS ---
@app.route('/portal/<string:company_slug>')
def company_portal(company_slug):
    company = Company.query.filter_by(slug=company_slug).first_or_404()
    return render_template('index.html', company=company)

@app.route('/public/map/<string:public_id>')
def public_map(public_id):
    shared_map = SharedMap.query.filter_by(public_id=public_id).first_or_404()
    # MODIFICADO: Incrementa o contador de acesso
    shared_map.access_count = (shared_map.access_count or 0) + 1
    db.session.commit()
    return render_template('public_map.html', shared_map=shared_map)

# --- ROTAS DE API (ATUALIZADAS E NOVAS) ---
def get_layers_from_config(config):
    # ... (código original sem alterações)
    query = Layer.query
    if config.get('projects'):
        query = query.filter(Layer.project_id.in_(config['projects']))
    return query.all()

@app.route('/public/api/layers/<string:public_id>')
def public_api_layers(public_id):
    # ... (código original sem alterações)
    shared_map = SharedMap.query.filter_by(public_id=public_id).first_or_404()
    config = json.loads(shared_map.configuration)
    layers = get_layers_from_config(config)
    return jsonify([{'name': layer.name, 'filename': layer.filename, 'theme': layer.thematic_group} for layer in layers])

@app.route('/public/api/layer_data/<string:filename>')
def public_api_layer_data(filename):
    # ... (código original sem alterações)
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
        projects_dict[proj_name].append({
            'id': l.id,
            'name': l.name,
            'filename': l.filename,
            'theme': l.thematic_group,
            'type': l.layer_type,
            'symbology': json.loads(l.symbology) if l.symbology else None
        })
    return jsonify(projects_dict)

@app.route('/portal/<string:company_slug>/api/camada_data/<int:layer_id>', methods=['GET', 'POST'])
def get_camada_data(company_slug, layer_id):
    company = Company.query.filter_by(slug=company_slug).first_or_404()
    layer = Layer.query.filter_by(id=layer_id, company_id=company.id).first_or_404()
    filepath = os.path.join(DATA_DIR, layer.filename)
    if not os.path.exists(filepath): abort(404)

    gdf = gpd.read_file(filepath).to_crs(epsg=4326)

    # Lógica de recorte por área de estudo (se enviada)
    if request.method == 'POST' and request.json and 'clip_geometry' in request.json:
        try:
            clip_geom = request.json['clip_geometry']
            clip_gdf = gpd.GeoDataFrame.from_features([{'type': 'Feature', 'properties': {}, 'geometry': clip_geom}], crs="EPSG:4326")
            gdf = gpd.clip(gdf, clip_gdf)
        except Exception as e:
            print(f"Erro no recorte: {e}")

    # MODIFICADO: Filtro por extensão do mapa (BBOX)
    bbox_str = request.args.get('bbox') # ex: bbox=-44.1,-20.5,-43.5,-19.1
    if bbox_str:
        try:
            minx, miny, maxx, maxy = map(float, bbox_str.split(','))
            bbox_polygon = box(minx, miny, maxx, maxy)
            gdf = gdf[gdf.intersects(bbox_polygon)]
        except (ValueError, IndexError):
            pass # Ignora BBOX inválido

    return jsonify(gdf.__geo_interface__)

def calculate_company_storage(company_id):
    # ... (código original sem alterações)
    total_size_bytes = 0
    layers = Layer.query.filter_by(company_id=company_id).all()
    for layer in layers:
        base_path = os.path.join(DATA_DIR, os.path.splitext(layer.filename)[0])
        for filepath in glob.glob(f"{base_path}.*"):
            if os.path.exists(filepath):
                total_size_bytes += os.path.getsize(filepath)
    return total_size_bytes / (1024 * 1024)

# --- ROTAS DE ADMIN (ATUALIZADAS E NOVAS) ---
@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    stats = {}
    if current_user.role == 'super_admin':
        stats['title'] = "Visão Geral da Plataforma"
        stats['company_count'] = Company.query.count()
        stats['project_count'] = Project.query.count()
        stats['layer_count'] = Layer.query.count()
        stats['user_count'] = User.query.filter(User.role != 'super_admin').count()
        # MODIFICADO: Adiciona contagem de acessos total
        total_accesses = db.session.query(func.sum(SharedMap.access_count)).scalar()
        stats['map_access_count'] = total_accesses or 0
    elif current_user.company_id:
        stats['title'] = f"Visão Geral da Empresa: {current_user.company.name}"
        stats['project_count'] = Project.query.filter_by(company_id=current_user.company_id).count()
        stats['layer_count'] = Layer.query.filter_by(company_id=current_user.company_id).count()
        stats['storage_usage'] = calculate_company_storage(current_user.company_id)
        stats['storage_limit'] = current_user.company.storage_limit_mb
        # MODIFICADO: Adiciona contagem de acessos da empresa
        company_accesses = db.session.query(func.sum(SharedMap.access_count)).filter(SharedMap.company_id == current_user.company_id).scalar()
        stats['map_access_count'] = company_accesses or 0
    return render_template('admin/dashboard.html', stats=stats)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

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
    
    # Validações de cota
    # ... (código original sem alterações)

    file = request.files.get('file')
    project_id = request.form.get('project_id')
    
    if not file or file.filename == '' or not project_id:
        flash('Arquivo e projeto são obrigatórios.', 'warning')
        return redirect(url_for('upload_layer_page'))

    if not allowed_file(file.filename):
        flash('Tipo de arquivo não permitido.', 'danger')
        return redirect(url_for('upload_layer_page'))
    
    filename = secure_filename(file.filename)
    base_name, extension = os.path.splitext(filename)
    
    # Lógica de salvamento e extração
    saved_filename = f"{uuid.uuid4()}{extension}" # Nome de arquivo único para evitar conflitos
    temp_filepath = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
    file.save(temp_filepath)
    
    final_entry_filename = None
    layer_type = 'vector'

    if extension.lower() == '.zip':
        try:
            with zipfile.ZipFile(temp_filepath, 'r') as zip_ref:
                shp_files = [s for s in zip_ref.namelist() if s.lower().endswith('.shp')]
                if not shp_files:
                    flash('Arquivo .ZIP não contém um arquivo .shp.', 'danger')
                    os.remove(temp_filepath)
                    return redirect(url_for('upload_layer_page'))
                # Extrai todos os arquivos para uma pasta com o mesmo nome único
                extract_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.splitext(saved_filename)[0])
                os.makedirs(extract_path, exist_ok=True)
                zip_ref.extractall(extract_path)
                final_entry_filename = os.path.join(os.path.splitext(saved_filename)[0], shp_files[0])
            os.remove(temp_filepath) # Remove o zip original
        except Exception as e:
            flash(f"Erro ao processar arquivo ZIP: {e}", 'danger')
            return redirect(url_for('upload_layer_page'))
    elif extension.lower() in ['.tif', '.tiff']:
        layer_type = 'raster'
        final_entry_filename = saved_filename
        # AQUI entraria a lógica de processamento em background com gdal2tiles
        # Ex: start_tile_generation_task(temp_filepath)
    else:
        final_entry_filename = saved_filename
        
    novo_nome_camada = request.form.get('layer_name') or base_name
    
    # MODIFICADO: Salva os metadados
    try:
        metadata_date_obj = parse(request.form.get('metadata_date')).date() if request.form.get('metadata_date') else None
    except ValueError:
        metadata_date_obj = None

    nova_camada = Layer(
        name=novo_nome_camada,
        filename=final_entry_filename,
        layer_type=layer_type,
        thematic_group=request.form.get('thematic_group', 'Geral'),
        project_id=project_id,
        owner_id=current_user.id,
        company_id=current_user.company_id,
        metadata_producer=request.form.get('metadata_producer'),
        metadata_date=metadata_date_obj,
        metadata_responsible=request.form.get('metadata_responsible'),
        metadata_crs=request.form.get('metadata_crs')
    )
    db.session.add(nova_camada)
    db.session.commit()

    flash(f"Camada '{novo_nome_camada}' enviada com sucesso! Próximo passo: definir simbologia.", 'success')
    # Redireciona para o editor de simbologia (a ser criado)
    return redirect(url_for('edit_layer_symbology', layer_id=nova_camada.id))


@app.route('/admin/layer/<int:layer_id>/rename', methods=['POST'])
@login_required
def rename_layer(layer_id):
    layer = Layer.query.get_or_404(layer_id)
    if layer.company_id != current_user.company_id and current_user.role != 'super_admin':
        abort(403)
    new_name = request.form.get('name', '').strip()
    if not new_name:
        flash('Nome inválido.', 'warning')
        return redirect(url_for('admin_dashboard'))
    layer.name = new_name
    db.session.commit()
    flash('Nome da camada atualizado.', 'success')
    return redirect(url_for('admin_dashboard'))


@app.route('/admin/layer/<int:layer_id>/replace', methods=['POST'])
@login_required
def replace_layer_file(layer_id):
    layer = Layer.query.get_or_404(layer_id)
    if layer.company_id != current_user.company_id and current_user.role != 'super_admin':
        abort(403)
    file = request.files.get('file')
    if not file or file.filename == '':
        flash('Selecione um arquivo para atualizar a camada.', 'warning')
        return redirect(url_for('admin_dashboard'))
    if not allowed_file(file.filename):
        flash('Tipo de arquivo não permitido.', 'danger')
        return redirect(url_for('admin_dashboard'))
    filename = secure_filename(file.filename)
    base_name, extension = os.path.splitext(filename)
    saved_filename = f"{uuid.uuid4()}{extension}"
    temp_filepath = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
    file.save(temp_filepath)
    try:
        # Se ZIP (Shapefile), extrai
        if extension.lower() == '.zip':
            with zipfile.ZipFile(temp_filepath, 'r') as zip_ref:
                shp_files = [s for s in zip_ref.namelist() if s.lower().endswith('.shp')]
                if not shp_files:
                    flash('Arquivo .ZIP não contém um .shp.', 'danger')
                    os.remove(temp_filepath)
                    return redirect(url_for('admin_dashboard'))
                extract_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.splitext(saved_filename)[0])
                os.makedirs(extract_path, exist_ok=True)
                zip_ref.extractall(extract_path)
                final_entry_filename = os.path.join(os.path.splitext(saved_filename)[0], shp_files[0])
            os.remove(temp_filepath)
        else:
            final_entry_filename = saved_filename
        # Atualiza referência
        layer.filename = final_entry_filename
        db.session.commit()
        flash('Camada atualizada com novo arquivo.', 'success')
    except Exception as e:
        flash(f'Erro ao atualizar camada: {e}', 'danger')
    return redirect(url_for('admin_dashboard'))


@app.route('/admin/layer/<int:layer_id>/delete', methods=['POST'])
@login_required
def delete_layer(layer_id):
    layer = Layer.query.get_or_404(layer_id)
    if layer.company_id != current_user.company_id and current_user.role != 'super_admin':
        abort(403)
    try:
        # tentativa simples: remover arquivos-base (todas as extensões com mesmo base)
        base = os.path.splitext(layer.filename)[0]
        base_path = os.path.join(DATA_DIR, base)
        # remove pasta shapefile extraída
        folder = os.path.dirname(os.path.join(DATA_DIR, layer.filename))
        if folder and os.path.isdir(folder) and folder.startswith(DATA_DIR):
            for fp in glob.glob(os.path.join(folder, '*')):
                try:
                    os.remove(fp)
                except Exception:
                    pass
            try:
                os.rmdir(folder)
            except Exception:
                pass
        # remove arquivos soltos
        for fp in glob.glob(f"{base_path}.*"):
            try:
                os.remove(fp)
            except Exception:
                pass
        db.session.delete(layer)
        db.session.commit()
        flash('Camada excluída.', 'success')
    except Exception as e:
        flash(f'Erro ao excluir camada: {e}', 'danger')
    return redirect(url_for('admin_dashboard'))


@app.route('/admin/projects', methods=['GET', 'POST'])
@login_required
def manage_projects():
    # ... (código original sem alterações)
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
        new_map = SharedMap(
            name=name, 
            configuration=json.dumps(config), 
            owner_id=current_user.id,
            company_id=current_user.company_id # MODIFICADO: Vincula o mapa à empresa
        )
        db.session.add(new_map)
        db.session.commit()
        flash('Mapa público criado com sucesso!', 'success')
        return redirect(url_for('manage_shared_maps'))

    projects = Project.query.filter_by(company_id=current_user.company_id).all()
    shared_maps = SharedMap.query.filter_by(owner_id=current_user.id).all()
    return render_template('admin/manage_shared_maps.html', projects=projects, shared_maps=shared_maps)
    
# --- NOVAS ROTAS ESPECÍFICAS DAS FUNCIONALIDADES ---

@app.route('/admin/layer/<int:layer_id>/symbology', methods=['GET', 'POST'])
@login_required
def edit_layer_symbology(layer_id):
    layer = Layer.query.get_or_404(layer_id)
    # Adicionar verificação de permissão aqui
    return render_template('admin/edit_symbology.html', layer=layer)


@app.route('/admin/layer/<int:layer_id>/fields')
@login_required
def layer_fields(layer_id):
    layer = Layer.query.get_or_404(layer_id)
    if layer.company_id != current_user.company_id and current_user.role != 'super_admin':
        abort(403)
    filepath = os.path.join(DATA_DIR, layer.filename)
    if not os.path.exists(filepath):
        abort(404)
    try:
        gdf = gpd.read_file(filepath)
        fields = []
        for col in gdf.columns:
            if col == 'geometry':
                continue
            dtype = str(gdf[col].dtype)
            is_numeric = np.issubdtype(gdf[col].dtype, np.number)
            unique_count = int(gdf[col].nunique(dropna=True))
            fields.append({'name': col, 'dtype': dtype, 'is_numeric': bool(is_numeric), 'unique_count': unique_count})
        return jsonify({'fields': fields, 'layer_type': layer.layer_type})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/admin/layer/<int:layer_id>/classify', methods=['POST'])
@login_required
def classify_layer_field(layer_id):
    layer = Layer.query.get_or_404(layer_id)
    if layer.company_id != current_user.company_id and current_user.role != 'super_admin':
        abort(403)
    payload = request.get_json(force=True, silent=True) or {}
    field = payload.get('field')
    mode = payload.get('mode')  # 'categorized' or 'graduated'
    method = payload.get('method')  # 'equal', 'quantiles', 'jenks', 'log', 'manual'
    classes = int(payload.get('classes') or 5)
    manual_breaks = payload.get('breaks') or []

    filepath = os.path.join(DATA_DIR, layer.filename)
    if not os.path.exists(filepath):
        abort(404)
    try:
        gdf = gpd.read_file(filepath)
        if field not in gdf.columns:
            return jsonify({'error': 'Campo inválido'}), 400

        if mode == 'categorized':
            vc = gdf[field].value_counts(dropna=True)
            # limita categorias para evitar explosão
            top = vc.head(min(50, len(vc))).index.tolist()
            return jsonify({'categories': [None if (isinstance(v, float) and np.isnan(v)) else v for v in top]})

        # graduated
        series = gdf[field]
        # remove NaN e inf
        series = series.replace([np.inf, -np.inf], np.nan).dropna()
        if not np.issubdtype(series.dtype, np.number):
            return jsonify({'error': 'Campo não numérico'}), 400

        if method == 'manual':
            try:
                brks = sorted([float(x) for x in manual_breaks])
            except Exception:
                return jsonify({'error': 'Intervalos manuais inválidos'}), 400
        else:
            s = series.copy()
            if method == 'log':
                s = np.log1p(s - s.min() + 1e-9)
                # após log, usaremos equal intervals por padrão
                q = np.linspace(0, 1, classes + 1)
                brks = np.quantile(s, q).tolist()
                # converte de volta para a escala original aproximada
                brks = (np.expm1(brks) + series.min() - 1e-9).tolist()
            elif method == 'quantiles':
                q = np.linspace(0, 1, classes + 1)
                brks = np.quantile(s, q).tolist()
            elif method == 'jenks':
                # fallback simples para equal intervals se mapclassify não estiver disponível
                vmin, vmax = float(s.min()), float(s.max())
                brks = np.linspace(vmin, vmax, classes + 1).tolist()
            else:  # 'equal' padrão
                vmin, vmax = float(s.min()), float(s.max())
                brks = np.linspace(vmin, vmax, classes + 1).tolist()

        # garante ordenação e unicidade
        brks = sorted(list(dict.fromkeys([float(b) for b in brks])))
        return jsonify({'breaks': brks})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/admin/layer/<int:layer_id>/symbology/save', methods=['POST'])
@login_required
def save_layer_symbology(layer_id):
    layer = Layer.query.get_or_404(layer_id)
    if layer.company_id != current_user.company_id and current_user.role != 'super_admin':
        abort(403)
    try:
        payload = request.get_json(force=True)
        
        # Validação e normalização dos dados de simbologia
        if not isinstance(payload, dict):
            return jsonify({'status': 'error', 'message': 'Payload inválido'}), 400
        
        # Garantir que os campos obrigatórios estejam presentes
        required_fields = ['type', 'geometry_type', 'field']
        for field in required_fields:
            if field not in payload:
                return jsonify({'status': 'error', 'message': f'Campo obrigatório ausente: {field}'}), 400
        
        # Normalizar o campo 'type' para 'style_type' se necessário
        if 'type' in payload and 'style_type' not in payload:
            payload['style_type'] = payload['type']
        
        # Para simbologia categorizada, garantir que as categorias estejam presentes
        if payload.get('style_type') == 'categorized':
            if 'categories' not in payload or not payload['categories']:
                return jsonify({'status': 'error', 'message': 'Simbologia categorizada requer categorias'}), 400
            
            # Normalizar as categorias para o formato esperado pelo portal
            categories = payload['categories']
            rules = []
            for cat in categories:
                if isinstance(cat, dict) and 'category' in cat and 'color' in cat:
                    rule = {
                        'value': cat['category'],
                        'color': cat['color'],
                        'fill': cat['color'],
                        'weight': payload.get('border_width', 1),
                        'fillOpacity': payload.get('palette_opacity', 0.6)
                    }
                    rules.append(rule)
            
            payload['rules'] = rules
            
            # Incluir informações da paleta
            if 'palette' in payload:
                payload['palette_info'] = {
                    'name': payload['palette'],
                    'inverted': payload.get('palette_invert', False),
                    'opacity': payload.get('palette_opacity', 0.6)
                }
        
        # Para simbologia graduada, garantir que as classes estejam presentes
        elif payload.get('style_type') == 'graduated':
            if 'classes' not in payload:
                return jsonify({'status': 'error', 'message': 'Simbologia graduada requer número de classes'}), 400
        
        # Para simbologia única, garantir campos básicos
        elif payload.get('style_type') == 'single':
            if 'fill_color' not in payload and 'fill' not in payload:
                payload['fill'] = payload.get('fill_color', '#38bdf8')
            if 'stroke_color' not in payload and 'color' not in payload:
                payload['color'] = payload.get('stroke_color', '#333333')
        
        # Salvar a simbologia no banco de dados
        layer.symbology = json.dumps(payload)
        db.session.commit()
        
        flash('Simbologia aplicada com sucesso! A camada será exibida com o novo estilo no portal.', 'success')
        return jsonify({'status': 'success', 'message': 'Simbologia salva com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao salvar simbologia: {str(e)}', 'danger')
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/admin/layer/<int:layer_id>/symbology/import', methods=['POST'])
@login_required
def import_layer_style(layer_id):
    """
    Endpoint para importar arquivos de estilo (.qml, .lyr, .style, .stylx)
    usando bibliotecas nativas do QGIS/ArcGIS quando disponíveis
    """
    layer = Layer.query.get_or_404(layer_id)
    if layer.company_id != current_user.company_id and current_user.role != 'super_admin':
        abort(403)
    
    try:
        # Verificar se um arquivo foi enviado
        if 'style_file' not in request.files:
            return jsonify({'success': False, 'error': 'Nenhum arquivo foi enviado'}), 400
        
        file = request.files['style_file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'}), 400
        
        # Verificar extensão do arquivo
        filename = secure_filename(file.filename)
        file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        
        if file_ext not in ['qml', 'lyr', 'style', 'stylx', 'xml']:
            return jsonify({'success': False, 'error': f'Formato de arquivo não suportado: .{file_ext}'}), 400
        
        # Salvar arquivo temporariamente
        temp_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_styles')
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_filename = f"{uuid.uuid4()}_{filename}"
        temp_filepath = os.path.join(temp_dir, temp_filename)
        file.save(temp_filepath)
        
        try:
            print(f"Style Import Debug: Processando arquivo {filename} ({file_ext})")
            
            # Processar arquivo baseado na extensão
            if file_ext == 'qml':
                print("Style Import Debug: Usando processador QML")
                result = process_qml_file(temp_filepath, layer)
            elif file_ext in ['lyr', 'style', 'stylx']:
                print("Style Import Debug: Usando processador ArcGIS")
                result = process_arcgis_file(temp_filepath, layer, file_ext)
            elif file_ext == 'xml':
                print("Style Import Debug: Usando processador XML genérico")
                result = process_xml_file(temp_filepath, layer)
            else:
                result = {'success': False, 'error': f'Processador não implementado para .{file_ext}'}
            
            print(f"Style Import Debug: Resultado do processamento: {result}")
            return jsonify(result)
            
        finally:
            # Limpar arquivo temporário
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)
                
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erro ao processar arquivo: {str(e)}'}), 500


def process_qml_file(filepath, layer):
    """
    Processa arquivo QML usando bibliotecas QGIS quando disponíveis,
    caso contrário faz parse XML manual melhorado
    """
    try:
        # Tentar usar QGIS se disponível
        try:
            from qgis.core import QgsVectorLayer, QgsReadWriteContext
            
            # Criar camada temporária para carregar o estilo
            layer_path = os.path.join(DATA_DIR, layer.filename)
            temp_layer = QgsVectorLayer(layer_path, "temp", "ogr")
            
            if temp_layer.isValid():
                # Carregar estilo do arquivo QML
                success, error_msg = temp_layer.loadNamedStyle(filepath)
                
                if success:
                    # Extrair informações de simbologia da camada
                    renderer = temp_layer.renderer()
                    
                    if renderer.type() == 'categorizedSymbol':
                        return extract_qgis_categorized_style(renderer)
                    elif renderer.type() == 'graduatedSymbol':
                        return extract_qgis_graduated_style(renderer)
                    elif renderer.type() == 'singleSymbol':
                        return extract_qgis_single_style(renderer)
                    else:
                        return {'success': False, 'error': f'Tipo de simbologia não suportado: {renderer.type()}'}
                else:
                    return {'success': False, 'error': f'Erro ao carregar estilo QGIS: {error_msg}'}
            else:
                return {'success': False, 'error': 'Não foi possível criar camada temporária'}
                
        except ImportError:
            # QGIS não disponível, usar parser XML manual melhorado
            return process_qml_xml_manual(filepath)
            
    except Exception as e:
        return {'success': False, 'error': f'Erro ao processar QML: {str(e)}'}


def extract_qgis_categorized_style(renderer):
    """Extrai estilo categorizado usando API do QGIS"""
    try:
        categories = []
        for category in renderer.categories():
            symbol = category.symbol()
            color = symbol.color().name() if symbol and symbol.color().isValid() else '#cccccc'
            
            categories.append({
                'value': category.value(),
                'label': category.label(),
                'color': color
            })
        
        return {
            'success': True,
            'styleType': 'categorized',
            'categories': categories,
            'field': renderer.classAttribute()
        }
    except Exception as e:
        return {'success': False, 'error': f'Erro ao extrair estilo categorizado: {str(e)}'}


def extract_qgis_graduated_style(renderer):
    """Extrai estilo graduado usando API do QGIS"""
    try:
        ranges = []
        for range_item in renderer.ranges():
            symbol = range_item.symbol()
            color = symbol.color().name() if symbol and symbol.color().isValid() else '#cccccc'
            
            ranges.append({
                'lower': range_item.lowerValue(),
                'upper': range_item.upperValue(),
                'label': range_item.label(),
                'color': color
            })
        
        # Mapear método de classificação
        mode_map = {
            0: 'equal',      # EqualInterval
            1: 'quantiles',  # Quantile
            2: 'jenks',      # Jenks
            3: 'stddev',     # StdDev
            4: 'pretty'      # Pretty
        }
        
        method = mode_map.get(renderer.mode(), 'equal')
        
        return {
            'success': True,
            'styleType': 'graduated',
            'graduated': {
                'ranges': ranges,
                'method': method
            },
            'field': renderer.classAttribute()
        }
    except Exception as e:
        return {'success': False, 'error': f'Erro ao extrair estilo graduado: {str(e)}'}


def extract_qgis_single_style(renderer):
    """Extrai estilo único usando API do QGIS"""
    try:
        symbol = renderer.symbol()
        
        if symbol:
            fill_color = symbol.color().name() if symbol.color().isValid() else '#38bdf8'
            
            # Tentar extrair cor da borda se for polígono
            stroke_color = '#333333'
            stroke_width = 1
            
            if symbol.symbolLayerCount() > 0:
                layer = symbol.symbolLayer(0)
                if hasattr(layer, 'strokeColor') and layer.strokeColor().isValid():
                    stroke_color = layer.strokeColor().name()
                if hasattr(layer, 'strokeWidth'):
                    stroke_width = layer.strokeWidth()
            
            return {
                'success': True,
                'styleType': 'single',
                'fillColor': fill_color,
                'strokeColor': stroke_color,
                'strokeWidth': stroke_width
            }
        else:
            return {'success': False, 'error': 'Símbolo não encontrado'}
            
    except Exception as e:
        return {'success': False, 'error': f'Erro ao extrair estilo único: {str(e)}'}


def process_qml_xml_manual(filepath):
    """
    Parser XML manual melhorado para arquivos QML
    quando QGIS não está disponível
    """
    try:
        import xml.etree.ElementTree as ET
        
        tree = ET.parse(filepath)
        root = tree.getroot()
        
        # Procurar por renderer em diferentes locais
        renderer = None
        for elem in root.iter():
            if 'renderer' in elem.tag.lower() and elem.get('type'):
                renderer = elem
                break
        
        if not renderer:
            return {'success': False, 'error': 'Renderer não encontrado no arquivo QML'}
        
        renderer_type = renderer.get('type')
        
        if renderer_type == 'categorizedSymbol':
            return extract_xml_categorized_style(renderer)
        elif renderer_type == 'graduatedSymbol':
            return extract_xml_graduated_style(renderer)
        elif renderer_type == 'singleSymbol':
            return extract_xml_single_style(renderer)
        else:
            return {'success': False, 'error': f'Tipo de renderer não suportado: {renderer_type}'}
            
    except Exception as e:
        return {'success': False, 'error': f'Erro no parser XML manual: {str(e)}'}


def extract_xml_categorized_style(renderer):
    """Extrai estilo categorizado do XML com busca agressiva por cores"""
    try:
        categories = []
        
        for category in renderer.findall('.//category'):
            value = category.get('value', '')
            label = category.get('label', value)
            
            print(f"QML Debug: Processando categoria value='{value}', label='{label}'")
            
            # Busca agressiva por cores em múltiplos locais
            color = '#cccccc'
            color_found = False
            
            # 1. Procurar em propriedades diretas da categoria
            for prop in category.iter('prop'):
                key = prop.get('k', '')
                prop_value = prop.get('v', '')
                print(f"QML Debug: Prop encontrada: k='{key}', v='{prop_value}'")
                
                if 'color' in key.lower() or 'fill' in key.lower():
                    if prop_value and (prop_value.startswith('#') or prop_value.startswith('rgb') or 
                                     prop_value.lower() in ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'black']):
                        color = prop_value
                        color_found = True
                        print(f"QML Debug: Cor encontrada em prop direta: {color}")
                        break
            
            # 2. Se não encontrou, procurar no símbolo da categoria
            if not color_found:
                symbol = category.find('.//symbol')
                if symbol is not None:
                    print(f"QML Debug: Símbolo encontrado para categoria {value}")
                    
                    # Procurar em todas as propriedades do símbolo
                    for prop in symbol.iter('prop'):
                        key = prop.get('k', '')
                        prop_value = prop.get('v', '')
                        print(f"QML Debug: Prop do símbolo: k='{key}', v='{prop_value}'")
                        
                        if 'color' in key.lower() or 'fill' in key.lower():
                            if prop_value and (prop_value.startswith('#') or prop_value.startswith('rgb') or 
                                             prop_value.lower() in ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'black']):
                                color = prop_value
                                color_found = True
                                print(f"QML Debug: Cor encontrada no símbolo: {color}")
                                break
                    
                    # 3. Se ainda não encontrou, procurar em layers do símbolo
                    if not color_found:
                        for layer in symbol.iter('layer'):
                            print(f"QML Debug: Layer encontrado no símbolo")
                            for prop in layer.iter('prop'):
                                key = prop.get('k', '')
                                prop_value = prop.get('v', '')
                                print(f"QML Debug: Prop do layer: k='{key}', v='{prop_value}'")
                                
                                if 'color' in key.lower() or 'fill' in key.lower():
                                    if prop_value and (prop_value.startswith('#') or prop_value.startswith('rgb') or 
                                                     prop_value.lower() in ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'black']):
                                        color = prop_value
                                        color_found = True
                                        print(f"QML Debug: Cor encontrada no layer: {color}")
                                        break
                            if color_found:
                                break
            
            # 4. Busca final: procurar por qualquer valor que pareça cor
            if not color_found:
                print(f"QML Debug: Busca final por cores para categoria {value}")
                for elem in category.iter():
                    if elem.tag == 'prop':
                        key = elem.get('k', '')
                        prop_value = elem.get('v', '')
                        
                        # Verificar se o valor parece uma cor
                        if prop_value and (
                            prop_value.startswith('#') or 
                            prop_value.startswith('rgb') or 
                            prop_value.lower() in ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'black', 'orange', 'purple', 'brown', 'pink', 'gray', 'grey']
                        ):
                            color = prop_value
                            color_found = True
                            print(f"QML Debug: Cor encontrada na busca final: {color} (key: {key})")
                            break
            
            if not color_found:
                print(f"QML Debug: Nenhuma cor encontrada para categoria {value}, usando padrão: {color}")
            
            categories.append({
                'value': value,
                'label': label,
                'color': color
            })
        
        print(f"QML Debug: Total de categorias extraídas: {len(categories)}")
        for i, cat in enumerate(categories):
            print(f"QML Debug: Categoria {i}: value='{cat['value']}', color='{cat['color']}'")
        
        # Extrair campo de classificação
        field = renderer.get('attr', '')
        
        return {
            'success': True,
            'styleType': 'categorized',
            'categories': categories,
            'field': field
        }
        
    except Exception as e:
        print(f"QML Debug: Erro ao extrair categorias: {str(e)}")
        return {'success': False, 'error': f'Erro ao extrair categorias do XML: {str(e)}'}


def extract_xml_graduated_style(renderer):
    """Extrai estilo graduado do XML"""
    try:
        ranges = []
        
        for range_elem in renderer.findall('.//range'):
            lower = float(range_elem.get('lower', 0))
            upper = float(range_elem.get('upper', 0))
            label = range_elem.get('label', f'{lower} - {upper}')
            
            # Procurar cor
            color = '#cccccc'
            for prop in range_elem.iter('prop'):
                key = prop.get('k', '')
                if 'color' in key.lower() or 'fill' in key.lower():
                    prop_value = prop.get('v', '')
                    if prop_value.startswith('#') or prop_value.startswith('rgb'):
                        color = prop_value
                        break
            
            ranges.append({
                'lower': lower,
                'upper': upper,
                'label': label,
                'color': color
            })
        
        # Extrair método
        method_elem = renderer.find('.//method')
        method = method_elem.text if method_elem is not None else 'equal'
        
        # Extrair campo
        field = renderer.get('attr', '')
        
        return {
            'success': True,
            'styleType': 'graduated',
            'graduated': {
                'ranges': ranges,
                'method': method
            },
            'field': field
        }
        
    except Exception as e:
        return {'success': False, 'error': f'Erro ao extrair ranges do XML: {str(e)}'}


def extract_xml_single_style(renderer):
    """Extrai estilo único do XML"""
    try:
        # Procurar propriedades de cor
        fill_color = '#38bdf8'
        stroke_color = '#333333'
        stroke_width = 1
        
        for prop in renderer.iter('prop'):
            key = prop.get('k', '')
            value = prop.get('v', '')
            
            if key == 'color' or key == 'fill_color':
                fill_color = value
            elif key == 'outline_color' or key == 'stroke_color':
                stroke_color = value
            elif key == 'outline_width' or key == 'stroke_width':
                try:
                    stroke_width = float(value)
                except:
                    pass
        
        return {
            'success': True,
            'styleType': 'single',
            'fillColor': fill_color,
            'strokeColor': stroke_color,
            'strokeWidth': stroke_width
        }
        
    except Exception as e:
        return {'success': False, 'error': f'Erro ao extrair estilo único do XML: {str(e)}'}


def process_arcgis_file(filepath, layer, file_ext):
    """
    Processa arquivos ArcGIS (.lyr, .style, .stylx)
    """
    try:
        # Verificar se o arquivo é binário ou XML
        with open(filepath, 'rb') as f:
            first_bytes = f.read(10)
        
        # Se começa com PK, é um arquivo ZIP
        if first_bytes.startswith(b'PK'):
            return {'success': False, 'error': f'Arquivo .{file_ext} é um arquivo ZIP/compressed. Use arquivo descompactado.'}
        
        # Se começa com <?xml, é XML
        if first_bytes.startswith(b'<?xml'):
            if file_ext == 'lyr':
                return process_lyr_as_xml(filepath)
            else:
                return {'success': False, 'error': f'Arquivo .{file_ext} XML não suportado ainda.'}
        
        # Tentar usar ArcPy se disponível para arquivos binários
        try:
            import arcpy
            
            if file_ext == 'lyr':
                return process_lyr_with_arcpy(filepath, layer)
            else:
                return {'success': False, 'error': f'Processamento com ArcPy não implementado para .{file_ext}'}
                
        except ImportError:
            # ArcPy não disponível
            if file_ext == 'lyr':
                return {'success': False, 'error': 'Arquivo .lyr binário detectado. ArcPy não disponível para processamento.'}
            else:
                return {'success': False, 'error': f'Arquivo .{file_ext} binário. ArcPy não disponível para processamento.'}
                
    except Exception as e:
        return {'success': False, 'error': f'Erro ao processar arquivo ArcGIS: {str(e)}'}


def process_lyr_with_arcpy(filepath, layer):
    """Processa arquivo .lyr usando ArcPy"""
    try:
        import arcpy
        
        # Criar layer file temporário
        temp_layer = arcpy.mp.LayerFile(filepath)
        
        # Extrair propriedades de simbologia
        # Nota: Implementação específica dependeria da estrutura do arquivo
        
        return {'success': False, 'error': 'Processamento com ArcPy ainda não implementado completamente'}
        
    except Exception as e:
        return {'success': False, 'error': f'Erro no processamento ArcPy: {str(e)}'}


def process_lyr_as_xml(filepath):
    """Processa arquivo .lyr como XML"""
    try:
        import xml.etree.ElementTree as ET
        
        print(f"LYR Debug: Processando arquivo .lyr como XML: {filepath}")
        
        tree = ET.parse(filepath)
        root = tree.getroot()
        
        print(f"LYR Debug: Root element: {root.tag}")
        
        # Procurar por elementos de simbologia ArcGIS
        renderer = None
        
        # Tentar diferentes seletores para renderer
        renderer_selectors = [
            './/CIMUniqueValueRenderer',
            './/CIMClassBreaksRenderer', 
            './/CIMSimpleRenderer',
            './/UniqueValueRenderer',
            './/ClassBreaksRenderer',
            './/SimpleRenderer'
        ]
        
        for selector in renderer_selectors:
            renderer = root.find(selector)
            if renderer is not None:
                print(f"LYR Debug: Renderer encontrado: {renderer.tag}")
                break
        
        if renderer is None:
            # Busca mais ampla
            for elem in root.iter():
                if 'renderer' in elem.tag.lower():
                    renderer = elem
                    print(f"LYR Debug: Renderer encontrado na busca ampla: {elem.tag}")
                    break
        
        if renderer is None:
            return {'success': False, 'error': 'Nenhum renderer encontrado no arquivo .lyr'}
        
        # Determinar tipo de renderer
        renderer_type = renderer.tag
        
        if 'UniqueValue' in renderer_type:
            return extract_lyr_unique_value(renderer)
        elif 'ClassBreaks' in renderer_type:
            return extract_lyr_class_breaks(renderer)
        elif 'Simple' in renderer_type:
            return extract_lyr_simple(renderer)
        else:
            return {'success': False, 'error': f'Tipo de renderer não suportado: {renderer_type}'}
        
    except ET.ParseError as e:
        return {'success': False, 'error': f'Arquivo .lyr não é um XML válido: {str(e)}'}
    except Exception as e:
        return {'success': False, 'error': f'Erro no parser XML .lyr: {str(e)}'}


def extract_lyr_unique_value(renderer):
    """Extrai renderer de valores únicos do .lyr"""
    try:
        print("LYR Debug: Extraindo valores únicos")
        categories = []
        
        # Procurar por classes de valor único
        value_classes = renderer.findall('.//CIMUniqueValueClass') or renderer.findall('.//UniqueValueClass')
        
        for vc in value_classes:
            value = vc.find('.//Value')
            label = vc.find('.//Label')
            
            if value is not None:
                value_text = value.text or value.get('value', '')
                label_text = label.text if label is not None else value_text
                
                print(f"LYR Debug: Classe encontrada: value='{value_text}', label='{label_text}'")
                
                # Procurar cor no símbolo
                color = '#cccccc'
                symbol = vc.find('.//CIMPolygonSymbol') or vc.find('.//PolygonSymbol')
                
                if symbol is not None:
                    # Procurar por propriedades de cor
                    for prop in symbol.iter():
                        if 'color' in prop.tag.lower() or 'fill' in prop.tag.lower():
                            if prop.text and (prop.text.startswith('#') or prop.text.startswith('rgb')):
                                color = prop.text
                                print(f"LYR Debug: Cor encontrada: {color}")
                                break
                
                categories.append({
                    'value': value_text,
                    'label': label_text,
                    'color': color
                })
        
        print(f"LYR Debug: Total de categorias extraídas: {len(categories)}")
        
        return {
            'success': True,
            'styleType': 'categorized',
            'categories': categories
        }
        
    except Exception as e:
        print(f"LYR Debug: Erro ao extrair valores únicos: {str(e)}")
        return {'success': False, 'error': f'Erro ao extrair valores únicos: {str(e)}'}


def extract_lyr_class_breaks(renderer):
    """Extrai renderer de quebras de classe do .lyr"""
    try:
        print("LYR Debug: Extraindo quebras de classe")
        ranges = []
        
        # Procurar por quebras de classe
        class_breaks = renderer.findall('.//CIMClassBreak') or renderer.findall('.//ClassBreak')
        
        for cb in class_breaks:
            upper_bound = cb.find('.//UpperBound')
            label = cb.find('.//Label')
            
            if upper_bound is not None:
                upper_value = float(upper_bound.text or upper_bound.get('value', 0))
                label_text = label.text if label is not None else f'Classe {len(ranges) + 1}'
                
                print(f"LYR Debug: Quebra encontrada: upper={upper_value}, label='{label_text}'")
                
                # Procurar cor no símbolo
                color = '#cccccc'
                symbol = cb.find('.//CIMPolygonSymbol') or cb.find('.//PolygonSymbol')
                
                if symbol is not None:
                    for prop in symbol.iter():
                        if 'color' in prop.tag.lower() or 'fill' in prop.tag.lower():
                            if prop.text and (prop.text.startswith('#') or prop.text.startswith('rgb')):
                                color = prop.text
                                print(f"LYR Debug: Cor encontrada: {color}")
                                break
                
                ranges.append({
                    'upper': upper_value,
                    'label': label_text,
                    'color': color
                })
        
        print(f"LYR Debug: Total de ranges extraídos: {len(ranges)}")
        
        return {
            'success': True,
            'styleType': 'graduated',
            'graduated': {
                'ranges': ranges,
                'method': 'equal'
            }
        }
        
    except Exception as e:
        print(f"LYR Debug: Erro ao extrair quebras de classe: {str(e)}")
        return {'success': False, 'error': f'Erro ao extrair quebras de classe: {str(e)}'}


def extract_lyr_simple(renderer):
    """Extrai renderer simples do .lyr"""
    try:
        print("LYR Debug: Extraindo renderer simples")
        
        # Procurar por símbolo
        symbol = renderer.find('.//CIMPolygonSymbol') or renderer.find('.//PolygonSymbol')
        
        if symbol is not None:
            # Procurar por propriedades de cor
            fill_color = '#38bdf8'
            stroke_color = '#333333'
            
            for prop in symbol.iter():
                if 'color' in prop.tag.lower() or 'fill' in prop.tag.lower():
                    if prop.text and (prop.text.startswith('#') or prop.text.startswith('rgb')):
                        fill_color = prop.text
                        print(f"LYR Debug: Cor de preenchimento encontrada: {fill_color}")
                        break
            
            return {
                'success': True,
                'styleType': 'single',
                'fillColor': fill_color,
                'strokeColor': stroke_color
            }
        else:
            return {'success': False, 'error': 'Símbolo não encontrado no renderer simples'}
        
    except Exception as e:
        print(f"LYR Debug: Erro ao extrair renderer simples: {str(e)}")
        return {'success': False, 'error': f'Erro ao extrair renderer simples: {str(e)}'}


def process_xml_file(filepath, layer):
    """
    Processa arquivo XML genérico tentando detectar o formato
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Detectar tipo baseado no conteúdo
        if 'qgis' in content.lower():
            return process_qml_xml_manual(filepath)
        elif any(x in content for x in ['CIMUniqueValueRenderer', 'CIMClassBreaksRenderer', 'CIMSimpleRenderer']):
            return process_lyr_as_xml(filepath)
        else:
            return {'success': False, 'error': 'Formato XML não reconhecido'}
            
    except Exception as e:
        return {'success': False, 'error': f'Erro ao processar XML: {str(e)}'}


@app.route('/admin/portal_settings', methods=['GET', 'POST'])
@login_required
def portal_settings():
    if not current_user.company:
        flash('Você não está associado a uma empresa.', 'danger')
        return redirect(url_for('admin_dashboard'))

    company = current_user.company
    if request.method == 'POST':
        company.name = request.form.get('name')
        company.primary_color = request.form.get('primary_color')
        if 'logo' in request.files:
            logo_file = request.files['logo']
            if logo_file.filename != '':
                # Lógica para salvar logo...
                pass
        db.session.commit()
        flash('Configurações do portal atualizadas!', 'success')
        return redirect(url_for('portal_settings'))

    return render_template('admin/portal_settings.html', company=company)
    
@app.route('/api/layer/metadata/<int:layer_id>')
@login_required
def get_layer_metadata(layer_id):
    layer = Layer.query.get_or_404(layer_id)
    if layer.company_id != current_user.company_id and current_user.role != 'super_admin':
        abort(403)
    return jsonify({
        'name': layer.name,
        'producer': layer.metadata_producer,
        'date': layer.metadata_date.isoformat() if layer.metadata_date else None,
        'responsible': layer.metadata_responsible,
        'crs': layer.metadata_crs
    })

@app.route('/api/layer/download/<int:layer_id>')
@login_required
def download_layer(layer_id):
    layer = Layer.query.get_or_404(layer_id)
    if layer.company_id != current_user.company_id and current_user.role != 'super_admin':
        abort(403)

    # Verifica se o arquivo é um shapefile dentro de uma pasta
    if '/' in layer.filename or '\\' in layer.filename:
        dir_path = os.path.join(DATA_DIR, os.path.dirname(layer.filename))
        base_name = os.path.splitext(os.path.basename(layer.filename))[0]
        files_to_zip = glob.glob(os.path.join(dir_path, f"{base_name}.*"))
    else: # Arquivo simples (GeoJSON, KML, etc)
        base_path = os.path.join(DATA_DIR, os.path.splitext(layer.filename)[0])
        files_to_zip = glob.glob(f"{base_path}.*")

    if not files_to_zip:
        abort(404, "Arquivos da camada não encontrados.")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for file_path in files_to_zip:
            zip_file.write(file_path, os.path.basename(file_path))
    
    zip_buffer.seek(0)
    return send_file(zip_buffer, mimetype='application/zip', 
                     as_attachment=True, download_name=f'{secure_filename(layer.name)}.zip')

@app.route('/api/analysis/buffer', methods=['POST'])
@login_required
def create_buffer():
    data = request.json
    if not data or 'geometry' not in data or 'distance_meters' not in data:
        abort(400, 'Geometria e distância são obrigatórias.')
    try:
        input_geom = shape(data['geometry'])
        distance = float(data['distance_meters'])
        temp_gdf = gpd.GeoDataFrame([{'geometry': input_geom}], crs='EPSG:4326')
        utm_gdf = temp_gdf.to_crs(temp_gdf.estimate_utm_crs())
        utm_gdf['geometry'] = utm_gdf.geometry.buffer(distance)
        result_gdf = utm_gdf.to_crs('EPSG:4326')
        return jsonify(result_gdf.__geo_interface__)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/thematic_groups')
@login_required
def get_thematic_groups():
    if not current_user.company_id: return jsonify([])
    groups = db.session.query(Layer.thematic_group).filter_by(company_id=current_user.company_id).distinct().all()
    return jsonify([group[0] for group in groups if group[0]])

# --- ROTAS DE SUPER ADMIN ---
@app.route('/admin/companies')
@login_required
@super_admin_required
def manage_companies():
    # ... (código original sem alterações)
    companies = Company.query.all()
    return render_template('admin/manage_companies.html', companies=companies)


@app.route('/admin/companies/form', defaults={'id': 0}, methods=['GET', 'POST'])
@app.route('/admin/companies/form/<int:id>', methods=['GET', 'POST'])
@login_required
@super_admin_required
def edit_company(id):
    # ... (código original sem alterações)
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
    # ... (código original sem alterações)
    users = User.query.filter(User.role != 'super_admin').all()
    return render_template('admin/manage_users.html', users=users)

@app.route('/admin/users/create', methods=['GET', 'POST'])
@login_required
@super_admin_required
def create_user():
    # ... (código original sem alterações)
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

if __name__ == '__main__':
    app.run(debug=True)
