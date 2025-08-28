/**
 * Editor de Relatório Geográfico - JavaScript
 * Gerencia a funcionalidade do editor de relatórios
 */

class GeographicReportEditor {
    constructor() {
        this.reportId = null;
        this.report = null;
        this.map = null;
        this.currentStop = null;
        this.stops = [];
        this.layers = [];
        this.init();
    }

    init() {
        this.reportId = this.getReportIdFromUrl();
        this.loadReport();
        this.setupMap();
        this.setupEventListeners();
    }

    getReportIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    async loadReport() {
        try {
            // Simular carregamento do relatório
            await this.simulateLoading();
            
            // Dados de exemplo
            this.report = {
                id: this.reportId,
                title: 'Relatório de Exemplo',
                description: 'Descrição do relatório de exemplo',
                config: {
                    template: '',
                }
            };

            this.stops = [
                {
                    id: 1,
                    title: 'Introdução',
                    description: 'Visão geral da área de estudo',
                    mapPosition: { lat: -23.5505, lng: -46.6333, zoom: 10 },
                    content: {
                        text: 'Esta é uma introdução ao nosso relatório geográfico.',
                        images: [],
                        videos: [],
                        documents: [],
                        charts: []
                    },
                    layerVisibility: {}
                }
            ];

            this.updateInterface();
        } catch (error) {
            console.error('Erro ao carregar relatório:', error);
            this.showError('Erro ao carregar relatório. Tente novamente.');
        }
    }

    setupMap() {
        // Inicializar mapa Leaflet
        this.map = L.map('map-container').setView([-23.5505, -46.6333], 10);
        
        // Adicionar camada base
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Adicionar controles de camadas
        this.setupLayerControls();

        // Event listeners do mapa
        this.map.on('moveend', () => {
            this.updateMapPosition();
        });

        this.map.on('zoomend', () => {
            this.updateMapPosition();
        });
    }

    setupLayerControls() {
        // Controles de camadas base
        const baseLayers = {
            'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
            'Satélite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'),
            'Topográfico': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png')
        };

        L.control.layers(baseLayers).addTo(this.map);
    }

    setupEventListeners() {
        // Event listeners para controles do editor
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveReport();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.previewReport();
                        break;
                }
            }
        });
    }

    updateInterface() {
        // Atualizar título e descrição
        document.getElementById('report-title').textContent = this.report.title;
        document.getElementById('report-description').textContent = this.report.description;

        // Atualizar lista de paradas
        this.renderStops();

        // Atualizar progresso
        this.updateProgress();
    }

    renderStops() {
        const container = document.getElementById('stops-container');
        if (!container) return;

        if (this.stops.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-route fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Nenhuma parada criada</p>
                    <button class="btn btn-primary btn-sm" onclick="addNewStop()">
                        <i class="fas fa-plus me-1"></i>Primeira Parada
                    </button>
                </div>
            `;
            return;
        }

        const stopsHTML = this.stops.map(stop => this.createStopElement(stop)).join('');
        container.innerHTML = stopsHTML;
    }

    createStopElement(stop) {
        const hasMapPosition = stop.mapPosition && stop.mapPosition.lat && stop.mapPosition.lng;
        const positionIcon = hasMapPosition ? 'fas fa-map-marker-alt text-success' : 'fas fa-map-marker-alt text-muted';
        const positionText = hasMapPosition ? 'Posição definida' : 'Posição não definida';

        return `
            <div class="list-group-item list-group-item-action" data-stop-id="${stop.id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${stop.title}</h6>
                        <p class="mb-1 small text-muted">${stop.description || 'Sem descrição'}</p>
                        <small class="text-muted">
                            <i class="${positionIcon} me-1"></i>${positionText}
                        </small>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="editStop(${stop.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteStop(${stop.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    addStop(stopData) {
        const newStop = {
            id: Date.now(),
            title: stopData.title,
            description: stopData.description,
            transition: stopData.transition,
            mapPosition: null,
            content: {
                text: '',
                images: [],
                videos: [],
                documents: [],
                charts: []
            },
            layerVisibility: {}
        };

        this.stops.push(newStop);
        this.renderStops();
        this.updateProgress();
        this.selectStop(newStop.id);

        return newStop;
    }

    selectStop(stopId) {
        this.currentStop = this.stops.find(stop => stop.id === stopId);
        if (!this.currentStop) return;

        // Atualizar seleção visual
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('active');
        });

        const stopElement = document.querySelector(`[data-stop-id="${stopId}"]`);
        if (stopElement) {
            stopElement.classList.add('active');
        }

        // Carregar conteúdo da parada
        this.loadStopContent();

        // Atualizar mapa se houver posição
        if (this.currentStop.mapPosition) {
            this.map.setView(
                [this.currentStop.mapPosition.lat, this.currentStop.mapPosition.lng],
                this.currentStop.mapPosition.zoom
            );
        }
    }

    loadStopContent() {
        const contentArea = document.getElementById('content-editor');
        if (!contentArea || !this.currentStop) return;

        contentArea.innerHTML = `
            <div class="mb-3">
                <h6>Editar Parada: ${this.currentStop.title}</h6>
                <hr>
            </div>

            <div class="mb-3">
                <label class="form-label">Título</label>
                <input type="text" class="form-control" value="${this.currentStop.title}" 
                       onchange="updateStopTitle(${this.currentStop.id}, this.value)">
            </div>

            <div class="mb-3">
                <label class="form-label">Descrição</label>
                <textarea class="form-control" rows="2" 
                          onchange="updateStopDescription(${this.currentStop.id}, this.value)">${this.currentStop.description || ''}</textarea>
            </div>

            <div class="mb-3">
                <label class="form-label">Posição do Mapa</label>
                <div class="d-flex gap-2 mb-2">
                    <button class="btn btn-primary btn-sm" onclick="captureMapPosition()">
                        <i class="fas fa-camera me-1"></i>Capturar Posição Atual
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="goToStopPosition()">
                        <i class="fas fa-location-arrow me-1"></i>Ir para Posição
                    </button>
                </div>
                <small class="text-muted">
                    ${this.currentStop.mapPosition ? 
                        `Lat: ${this.currentStop.mapPosition.lat.toFixed(4)}, Lng: ${this.currentStop.mapPosition.lng.toFixed(4)}, Zoom: ${this.currentStop.mapPosition.zoom}` : 
                        'Posição não definida'}
                </small>
            </div>

            <div class="mb-3">
                <label class="form-label">Conteúdo</label>
                <div class="mb-2">
                    <button class="btn btn-outline-primary btn-sm me-2" onclick="addTextContent()">
                        <i class="fas fa-font me-1"></i>Texto
                    </button>
                    <button class="btn btn-outline-success btn-sm me-2" onclick="addImageContent()">
                        <i class="fas fa-image me-1"></i>Imagem
                    </button>
                    <button class="btn btn-outline-warning btn-sm me-2" onclick="addVideoContent()">
                        <i class="fas fa-video me-1"></i>Vídeo
                    </button>
                    <button class="btn btn-outline-info btn-sm me-2" onclick="addDocumentContent()">
                        <i class="fas fa-file-pdf me-1"></i>Documento
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="addChartContent()">
                        <i class="fas fa-chart-bar me-1"></i>Gráfico
                    </button>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label">Visibilidade das Camadas</label>
                <div id="layers-visibility">
                    ${this.renderLayersVisibility()}
                </div>
            </div>
        `;
    }

    renderLayersVisibility() {
        if (this.layers.length === 0) {
            return '<p class="text-muted small">Nenhuma camada disponível</p>';
        }

        return this.layers.map(layer => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="layer-${layer.id}" 
                       ${this.currentStop.layerVisibility[layer.id] ? 'checked' : ''}
                       onchange="updateLayerVisibility(${this.currentStop.id}, ${layer.id}, this.checked)">
                <label class="form-check-label" for="layer-${layer.id}">
                    ${layer.name}
                </label>
            </div>
        `).join('');
    }

    updateMapPosition() {
        if (!this.currentStop) return;

        const center = this.map.getCenter();
        const zoom = this.map.getZoom();

        this.currentStop.mapPosition = {
            lat: center.lat,
            lng: center.lng,
            zoom: zoom
        };

        // Atualizar interface se estiver carregada
        this.loadStopContent();
    }

    updateProgress() {
        const totalSteps = 4;
        let completedSteps = 0;

        // Configuração básica
        if (this.report && this.report.title) {
            completedSteps++;
        }

        // Pontos de parada
        if (this.stops.length > 0) {
            completedSteps++;
        }

        // Conteúdo
        if (this.stops.some(stop => stop.content.text || stop.content.images.length > 0)) {
            completedSteps++;
        }

        // Design (sempre considerado como completo para simplificar)
        completedSteps++;

        const percentage = Math.round((completedSteps / totalSteps) * 100);
        
        document.getElementById('progress-percentage').textContent = `${percentage}%`;
        document.getElementById('progress-bar').style.width = `${percentage}%`;

        // Atualizar classe da barra de progresso
        const progressBar = document.getElementById('progress-bar');
        progressBar.className = 'progress-bar';
        
        if (percentage < 25) {
            progressBar.classList.add('bg-danger');
        } else if (percentage < 50) {
            progressBar.classList.add('bg-warning');
        } else if (percentage < 75) {
            progressBar.classList.add('bg-info');
        } else {
            progressBar.classList.add('bg-success');
        }
    }

    async saveReport() {
        try {
            // Simular salvamento
            await this.simulateSaving();
            
            // Atualizar relatório
            this.report.config.stops = this.stops;
            
            console.log('Relatório salvo com sucesso!');
            this.showSuccess('Relatório salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar relatório:', error);
            this.showError('Erro ao salvar relatório. Tente novamente.');
        }
    }

    async simulateLoading() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    async simulateSaving() {
        return new Promise(resolve => {
            setTimeout(resolve, 500);
        });
    }

    showSuccess(message) {
        // Implementar exibição de sucesso
        console.log('✅', message);
    }

    showError(message) {
        // Implementar exibição de erro
        console.error('❌', message);
    }
}

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    window.geographicReportEditor = new GeographicReportEditor();
});

// Funções globais para compatibilidade
function addNewStop() {
    const modal = new bootstrap.Modal(document.getElementById('newStopModal'));
    modal.show();
}

function createNewStop() {
    const title = document.getElementById('stop-title').value;
    const description = document.getElementById('stop-description').value;
    const transition = document.getElementById('stop-transition').value;
    
    if (!title.trim()) {
        alert('Por favor, insira um título para a parada.');
        return;
    }
    
    const newStop = window.geographicReportEditor.addStop({
        title: title,
        description: description,
        transition: transition
    });
    
    // Fechar modal
    bootstrap.Modal.getInstance(document.getElementById('newStopModal')).hide();
    
    // Limpar formulário
    document.getElementById('new-stop-form').reset();
}

function selectStop(stopId) {
    window.geographicReportEditor.selectStop(stopId);
}

function editStop(stopId) {
    window.geographicReportEditor.selectStop(stopId);
}

function deleteStop(stopId) {
    if (confirm('Tem certeza que deseja excluir esta parada?')) {
        const editor = window.geographicReportEditor;
        editor.stops = editor.stops.filter(stop => stop.id !== stopId);
        editor.renderStops();
        editor.updateProgress();
        
        if (editor.currentStop && editor.currentStop.id === stopId) {
            editor.currentStop = null;
            document.getElementById('content-editor').innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-hand-pointer fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Selecione uma parada para editar o conteúdo</p>
                </div>
            `;
        }
    }
}

function updateStopTitle(stopId, title) {
    const editor = window.geographicReportEditor;
    const stop = editor.stops.find(s => s.id === stopId);
    if (stop) {
        stop.title = title;
        editor.renderStops();
        editor.updateProgress();
    }
}

function updateStopDescription(stopId, description) {
    const editor = window.geographicReportEditor;
    const stop = editor.stops.find(s => s.id === stopId);
    if (stop) {
        stop.description = description;
        editor.renderStops();
    }
}

function captureMapPosition() {
    const editor = window.geographicReportEditor;
    if (editor.currentStop) {
        editor.updateMapPosition();
        editor.showSuccess('Posição do mapa capturada com sucesso!');
    }
}

function goToStopPosition() {
    const editor = window.geographicReportEditor;
    if (editor.currentStop && editor.currentStop.mapPosition) {
        editor.map.setView(
            [editor.currentStop.mapPosition.lat, editor.currentStop.mapPosition.lng],
            editor.currentStop.mapPosition.zoom
        );
    }
}

function updateLayerVisibility(stopId, layerId, visible) {
    const editor = window.geographicReportEditor;
    const stop = editor.stops.find(s => s.id === stopId);
    if (stop) {
        if (!stop.layerVisibility) {
            stop.layerVisibility = {};
        }
        stop.layerVisibility[layerId] = visible;
    }
}

function addTextContent() {
    const text = prompt('Digite o texto para esta parada:');
    if (text && window.geographicReportEditor.currentStop) {
        window.geographicReportEditor.currentStop.content.text = text;
        window.geographicReportEditor.loadStopContent();
        window.geographicReportEditor.updateProgress();
    }
}

function addImageContent() {
    // Implementar upload de imagem
    alert('Funcionalidade de upload de imagem será implementada em breve!');
}

function addVideoContent() {
    // Implementar upload de vídeo
    alert('Funcionalidade de upload de vídeo será implementada em breve!');
}

function addDocumentContent() {
    // Implementar upload de documento
    alert('Funcionalidade de upload de documento será implementada em breve!');
}

function addChartContent() {
    // Implementar criação de gráfico
    alert('Funcionalidade de criação de gráfico será implementada em breve!');
}

function previewReport() {
    alert('Funcionalidade de pré-visualização será implementada em breve!');
}

function publishReport() {
    alert('Funcionalidade de publicação será implementada em breve!');
}

function resetMapView() {
    if (window.geographicReportEditor && window.geographicReportEditor.map) {
        window.geographicReportEditor.map.setView([-23.5505, -46.6333], 10);
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}
