
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

# NOVO MODELO PARA CONFIGURAÇÕES DE PREÇOS
class PricingConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)  # Nome da configuração (ex: "Projeto", "Camada", etc.)
    category = db.Column(db.String(50), nullable=False)  # Categoria: "base", "tier", "multiplier"
    base_price = db.Column(db.Float, nullable=False, default=0.0)  # Preço base
    tier_1_price = db.Column(db.Float, nullable=True)  # Preço tier 1
    tier_2_price = db.Column(db.Float, nullable=True)  # Preço tier 2
    tier_3_price = db.Column(db.Float, nullable=True)  # Preço tier 3
    tier_1_limit = db.Column(db.Integer, nullable=True)  # Limite tier 1
    tier_2_limit = db.Column(db.Integer, nullable=True)  # Limite tier 2
    tier_3_limit = db.Column(db.Integer, nullable=True)  # Limite tier 3
    weight_factor = db.Column(db.Float, nullable=False, default=1.0)  # Fator de peso
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


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

@app.route('/calculator')
def calculator():
    """Rota específica para a calculadora de preços - acessível para todos os usuários"""
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

# --- ROTAS DE CONFIGURAÇÃO DE PREÇOS (SUPER ADMIN) ---
@app.route('/admin/pricing')
@login_required
@super_admin_required
def manage_pricing():
    """Página principal de gerenciamento de preços"""
    configs = PricingConfig.query.filter_by(is_active=True).all()
    return render_template('admin/manage_pricing.html', configs=configs)

@app.route('/admin/pricing/form', defaults={'id': 0}, methods=['GET', 'POST'])
@app.route('/admin/pricing/form/<int:id>', methods=['GET', 'POST'])
@login_required
@super_admin_required
def edit_pricing_config(id):
    """Criar ou editar configuração de preços"""
    if id:
        config = PricingConfig.query.get_or_404(id)
    else:
        config = PricingConfig()

    if request.method == 'POST':
        config.name = request.form.get('name')
        config.category = request.form.get('category')
        config.base_price = float(request.form.get('base_price', 0))
        config.tier_1_price = float(request.form.get('tier_1_price')) if request.form.get('tier_1_price') else None
        config.tier_2_price = float(request.form.get('tier_2_price')) if request.form.get('tier_2_price') else None
        config.tier_3_price = float(request.form.get('tier_3_price')) if request.form.get('tier_3_price') else None
        config.tier_1_limit = int(request.form.get('tier_1_limit')) if request.form.get('tier_1_limit') else None
        config.tier_2_limit = int(request.form.get('tier_2_limit')) if request.form.get('tier_2_limit') else None
        config.tier_3_limit = int(request.form.get('tier_3_limit')) if request.form.get('tier_3_limit') else None
        config.weight_factor = float(request.form.get('weight_factor', 1.0))
        config.is_active = bool(request.form.get('is_active'))
        
        if not id:
            db.session.add(config)
        
        db.session.commit()
        flash('Configuração de preços salva com sucesso!', 'success')
        return redirect(url_for('manage_pricing'))
    
    return render_template('admin/edit_pricing_config.html', config=config)

@app.route('/admin/pricing/delete/<int:id>', methods=['POST'])
@login_required
@super_admin_required
def delete_pricing_config(id):
    """Desativar configuração de preços"""
    config = PricingConfig.query.get_or_404(id)
    config.is_active = False
    db.session.commit()
    flash('Configuração de preços desativada!', 'success')
    return redirect(url_for('manage_pricing'))

# --- API PARA CALCULADORA DE PREÇOS ---
@app.route('/api/pricing/calculate', methods=['POST'])
def calculate_pricing():
    """API para calcular preços baseado nas configurações"""
    try:
        data = request.get_json()
        print(f"DEBUG: Dados recebidos: {data}")
        
        if not data:
            print("DEBUG: Nenhum dado recebido")
            return jsonify({'error': 'Nenhum dado recebido'}), 400
        
        # Buscar configurações ativas
        configs = {config.name: config for config in PricingConfig.query.filter_by(is_active=True).all()}
        print(f"DEBUG: Configurações encontradas: {list(configs.keys())}")
        
        # Verificar se há configurações
        if not configs:
            print("DEBUG: Nenhuma configuração ativa encontrada")
            return jsonify({'error': 'Nenhuma configuração de preços ativa encontrada'}), 500
        
        projects = int(data.get('projects', 0))
        layers = int(data.get('layers', 0))
        public_maps = int(data.get('public_maps', 0))
        page_views = int(data.get('page_views', 0))
        employees = int(data.get('employees', 0))
        server_usage = float(data.get('server_usage', 0))
        
        print(f"DEBUG: Valores processados - Projetos: {projects}, Camadas: {layers}, Mapas: {public_maps}, Visualizações: {page_views}, Funcionários: {employees}, Servidor: {server_usage}")
        
        total_cost = 0
        breakdown = {}
        
        # Calcular custo dos projetos
        if 'Projeto' in configs:
            config = configs['Projeto']
            cost = calculate_tiered_price(projects, config)
            total_cost += cost * config.weight_factor
            breakdown['projects'] = {'cost': cost, 'weighted_cost': cost * config.weight_factor, 'weight': config.weight_factor}
            print(f"DEBUG: Custo projetos: {cost}, Peso: {config.weight_factor}, Total: {cost * config.weight_factor}")
        else:
            print("DEBUG: Configuração 'Projeto' não encontrada")
        
        # Calcular custo das camadas
        if 'Camada' in configs:
            config = configs['Camada']
            cost = calculate_tiered_price(layers, config)
            total_cost += cost * config.weight_factor
            breakdown['layers'] = {'cost': cost, 'weighted_cost': cost * config.weight_factor, 'weight': config.weight_factor}
            print(f"DEBUG: Custo camadas: {cost}, Peso: {config.weight_factor}, Total: {cost * config.weight_factor}")
        else:
            print("DEBUG: Configuração 'Camada' não encontrada")
        
        # Calcular custo dos mapas públicos
        if 'Mapa Público' in configs:
            config = configs['Mapa Público']
            cost = calculate_tiered_price(public_maps, config)
            total_cost += cost * config.weight_factor
            breakdown['public_maps'] = {'cost': cost, 'weighted_cost': cost * config.weight_factor, 'weight': config.weight_factor}
            print(f"DEBUG: Custo mapas: {cost}, Peso: {config.weight_factor}, Total: {cost * config.weight_factor}")
        else:
            print("DEBUG: Configuração 'Mapa Público' não encontrada")
        
        # Calcular custo das visualizações
        if 'Visualização' in configs:
            config = configs['Visualização']
            cost = calculate_tiered_price(page_views, config)
            total_cost += cost * config.weight_factor
            breakdown['page_views'] = {'cost': cost, 'weighted_cost': cost * config.weight_factor, 'weight': config.weight_factor}
            print(f"DEBUG: Custo visualizações: {cost}, Peso: {config.weight_factor}, Total: {cost * config.weight_factor}")
        else:
            print("DEBUG: Configuração 'Visualização' não encontrada")
        
        # Calcular custo dos funcionários
        if 'Funcionário' in configs:
            config = configs['Funcionário']
            cost = calculate_tiered_price(employees, config)
            total_cost += cost * config.weight_factor
            breakdown['employees'] = {'cost': cost, 'weighted_cost': cost * config.weight_factor, 'weight': config.weight_factor}
            print(f"DEBUG: Custo funcionários: {cost}, Peso: {config.weight_factor}, Total: {cost * config.weight_factor}")
        else:
            print("DEBUG: Configuração 'Funcionário' não encontrada")
        
        # Calcular custo do servidor
        if 'Servidor' in configs:
            config = configs['Servidor']
            cost = server_usage * config.base_price
            total_cost += cost * config.weight_factor
            breakdown['server_usage'] = {'cost': cost, 'weighted_cost': cost * config.weight_factor, 'weight': config.weight_factor}
            print(f"DEBUG: Custo servidor: {cost}, Peso: {config.weight_factor}, Total: {cost * config.weight_factor}")
        else:
            print("DEBUG: Configuração 'Servidor' não encontrada")
        
        print(f"DEBUG: Custo total: {total_cost}")
        print(f"DEBUG: Breakdown: {breakdown}")
        
        return jsonify({
            'total_cost': round(total_cost, 2),
            'breakdown': breakdown,
            'currency': 'BRL'
        })
        
    except Exception as e:
        print(f"DEBUG: ERRO na função calculate_pricing: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

def calculate_tiered_price(quantity, config):
    """Calcula preço baseado em tiers"""
    if not config.tier_1_limit:
        # Preço simples sem tiers
        return quantity * config.base_price
    
    total_cost = 0
    remaining = quantity
    
    # Tier 1
    if remaining > 0 and config.tier_1_limit:
        tier_1_quantity = min(remaining, config.tier_1_limit)
        total_cost += tier_1_quantity * config.base_price
        remaining -= tier_1_quantity
    
    # Tier 2
    if remaining > 0 and config.tier_2_limit and config.tier_1_price:
        tier_2_quantity = min(remaining, config.tier_2_limit - config.tier_1_limit)
        total_cost += tier_2_quantity * config.tier_1_price
        remaining -= tier_2_quantity
    
    # Tier 3
    if remaining > 0 and config.tier_3_limit and config.tier_2_price:
        tier_3_quantity = min(remaining, config.tier_3_limit - config.tier_2_limit)
        total_cost += tier_3_quantity * config.tier_2_price
        remaining -= tier_3_quantity
    
    # Tier 4+ (ilimitado)
    if remaining > 0 and config.tier_3_price:
        total_cost += remaining * config.tier_3_price
    
    return total_cost

def initialize_default_pricing():
    """Inicializa configurações de preços padrão"""
    try:
        print("DEBUG: Iniciando criação de configurações de preços padrão...")
        
        # Verificar se já existem configurações
        existing_configs = PricingConfig.query.all()
        print(f"DEBUG: Configurações existentes: {len(existing_configs)}")
        for config in existing_configs:
            print(f"DEBUG: - {config.name}: ativo={config.is_active}, preço_base={config.base_price}")
        
        default_configs = [
            {
                'name': 'Projeto',
                'category': 'base',
                'base_price': 25.0,
                'tier_1_price': 20.0,
                'tier_2_price': 15.0,
                'tier_3_price': 10.0,
                'tier_1_limit': 10,
                'tier_2_limit': 50,
                'tier_3_limit': 200,
                'weight_factor': 1.0
            },
            {
                'name': 'Camada',
                'category': 'base',
                'base_price': 5.0,
                'tier_1_price': 4.0,
                'tier_2_price': 3.0,
                'tier_3_price': 2.0,
                'tier_1_limit': 100,
                'tier_2_limit': 500,
                'tier_3_limit': 2000,
                'weight_factor': 1.2
            },
            {
                'name': 'Mapa Público',
                'category': 'base',
                'base_price': 15.0,
                'tier_1_price': 12.0,
                'tier_2_price': 8.0,
                'tier_3_price': 5.0,
                'tier_1_limit': 20,
                'tier_2_limit': 100,
                'tier_3_limit': 500,
                'weight_factor': 1.5
            },
            {
                'name': 'Visualização',
                'category': 'tier',
                'base_price': 0.002,
                'tier_1_price': 0.001,
                'tier_2_price': 0.0005,
                'tier_3_price': 0.0002,
                'tier_1_limit': 10000,
                'tier_2_limit': 100000,
                'tier_3_limit': 1000000,
                'weight_factor': 0.8
            },
            {
                'name': 'Funcionário',
                'category': 'base',
                'base_price': 10.0,
                'tier_1_price': 8.0,
                'tier_2_price': 6.0,
                'tier_3_price': 4.0,
                'tier_1_limit': 25,
                'tier_2_limit': 100,
                'tier_3_limit': 500,
                'weight_factor': 1.0
            },
            {
                'name': 'Servidor',
                'category': 'multiplier',
                'base_price': 0.5,  # R$ por GB de uso
                'weight_factor': 2.0
            }
        ]
        
        for config_data in default_configs:
            existing = PricingConfig.query.filter_by(name=config_data['name']).first()
            if not existing:
                config = PricingConfig(**config_data)
                db.session.add(config)
                print(f"DEBUG: Criando configuração: {config_data['name']}")
            else:
                print(f"DEBUG: Configuração já existe: {config_data['name']}")
                # Atualizar se necessário
                if not existing.is_active:
                    existing.is_active = True
                    print(f"DEBUG: Ativando configuração: {config_data['name']}")
        
        db.session.commit()
        print("DEBUG: Configurações de preços criadas com sucesso!")
        
        # Verificar configurações finais
        final_configs = PricingConfig.query.filter_by(is_active=True).all()
        print(f"DEBUG: Configurações ativas finais: {len(final_configs)}")
        for config in final_configs:
            print(f"DEBUG: - {config.name}: ativo={config.is_active}, preço_base={config.base_price}")
        
    except Exception as e:
        print(f"DEBUG: ERRO ao criar configurações de preços: {str(e)}")
        import traceback
        traceback.print_exc()

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
    
    # Inicializar configurações de preços padrão
    initialize_default_pricing()
    print("Configurações de preços inicializadas.")

if __name__ == '__main__':
    app.run(debug=True)
