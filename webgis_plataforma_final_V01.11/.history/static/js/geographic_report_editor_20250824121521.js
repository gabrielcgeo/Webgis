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
        this.stopMarkers = new Map(); // Mapa para armazenar marcadores das paradas
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
            
            // Tentar carregar dados de exemplo se disponíveis
            if (window.getSampleReport && window.getSampleReport(this.reportId)) {
                const sampleData = window.getSampleReport(this.reportId);
                this.report = {
                    id: sampleData.id,
                    title: sampleData.title,
                    description: sampleData.description,
                    config: sampleData.config || { template: 'modern', basemap: 'osm' }
                };
                this.layers = sampleData.layers || [];
                this.stops = sampleData.stops || [];
            } else {
                // Dados de exemplo mais completos
                this.report = {
                    id: this.reportId,
                    title: 'Análise Geográfica da Região Metropolitana de São Paulo',
                    description: 'Relatório completo sobre desenvolvimento urbano, demografia e infraestrutura da RMSP',
                    config: {
                        template: 'modern',
                        basemap: 'osm'
                    }
                };

                // Camadas de exemplo
                this.layers = [
                    { id: 1, name: 'Limites Municipais', type: 'polygon', visible: true },
                    { id: 2, name: 'Rede Viária', type: 'line', visible: true },
                    { id: 3, name: 'Pontos de Interesse', type: 'point', visible: true },
                    { id: 4, name: 'Áreas Verdes', type: 'polygon', visible: false },
                    { id: 5, name: 'Zonas de Uso do Solo', type: 'polygon', visible: false }
                ];

                // Paradas de exemplo com conteúdo rico
                this.stops = [
                {
                    id: 1,
                    title: 'Visão Geral da Região',
                    description: 'Introdução e contexto geográfico da RMSP',
                    mapPosition: { lat: -23.5505, lng: -46.6333, zoom: 10 },
                    content: {
                        text: 'A Região Metropolitana de São Paulo (RMSP) é a maior aglomeração urbana do Brasil, com aproximadamente 21 milhões de habitantes distribuídos em 39 municípios. Esta região representa o principal centro econômico, político e cultural do país.',
                        images: [
                            { name: 'vista_aerea_rmsp.jpg', caption: 'Vista aérea da região metropolitana', url: '/static/images/sample/vista_aerea_rmsp.jpg' },
                            { name: 'mapa_regional.jpg', caption: 'Mapa político da RMSP', url: '/static/images/sample/mapa_regional.jpg' }
                        ],
                        videos: [
                            { name: 'overview_rmsp.mp4', caption: 'Vídeo introdutório da região', url: '/static/videos/sample/overview_rmsp.mp4' }
                        ],
                        documents: [
                            { name: 'relatorio_rmsp_2024.pdf', caption: 'Relatório oficial da RMSP 2024', url: '/static/documents/sample/relatorio_rmsp_2024.pdf' }
                        ],
                        charts: [
                            { name: 'evolucao_populacional.png', caption: 'Evolução populacional 2000-2024', url: '/static/charts/sample/evolucao_populacional.png' }
                        ]
                    },
                    layerVisibility: { 1: true, 2: true, 3: false, 4: false, 5: false }
                },
                {
                    id: 2,
                    title: 'Análise Demográfica',
                    description: 'Características populacionais e distribuição demográfica',
                    mapPosition: { lat: -23.5489, lng: -46.6388, zoom: 12 },
                    content: {
                        text: 'A população da RMSP apresenta características demográficas únicas, com alta densidade populacional no centro expandido e crescimento acelerado nas periferias. A região concentra 10% da população brasileira em apenas 0,1% do território nacional.',
                        images: [
                            { name: 'densidade_populacional.jpg', caption: 'Mapa de densidade populacional', url: '/static/images/sample/densidade_populacional.jpg' },
                            { name: 'piramide_etaria.jpg', caption: 'Pirâmide etária da RMSP', url: '/static/images/sample/piramide_etaria.jpg' }
                        ],
                        videos: [
                            { name: 'crescimento_populacional.mp4', caption: 'Análise do crescimento populacional', url: '/static/videos/sample/crescimento_populacional.mp4' }
                        ],
                        documents: [
                            { name: 'analise_demografica_ibge.pdf', caption: 'Análise demográfica IBGE 2024', url: '/static/documents/sample/analise_demografica_ibge.pdf' }
                        ],
                        charts: [
                            { name: 'distribuicao_etaria.png', caption: 'Distribuição por faixa etária', url: '/static/charts/sample/distribuicao_etaria.png' },
                            { name: 'migracao_interna.png', caption: 'Fluxos migratórios internos', url: '/static/charts/sample/migracao_interna.png' }
                        ]
                    },
                    layerVisibility: { 1: true, 2: false, 3: true, 4: false, 5: true }
                },
                {
                    id: 3,
                    title: 'Infraestrutura e Mobilidade',
                    description: 'Sistema de transportes e infraestrutura urbana',
                    mapPosition: { lat: -23.5525, lng: -46.6319, zoom: 13 },
                    content: {
                        text: 'A infraestrutura de transportes da RMSP é composta por uma rede complexa de metrô, trens metropolitanos, ônibus e vias expressas. O sistema metroferroviário transporta diariamente mais de 7 milhões de passageiros.',
                        images: [
                            { name: 'rede_metro.jpg', caption: 'Rede metroferroviária da RMSP', url: '/static/images/sample/rede_metro.jpg' },
                            { name: 'estacao_central.jpg', caption: 'Estação Central do Metrô', url: '/static/images/sample/estacao_central.jpg' },
                            { name: 'corredor_bus.jpg', caption: 'Corredor de ônibus', url: '/static/images/sample/corredor_bus.jpg' }
                        ],
                        videos: [
                            { name: 'sistema_transporte.mp4', caption: 'Visão geral do sistema de transportes', url: '/static/videos/sample/sistema_transporte.mp4' }
                        ],
                        documents: [
                            { name: 'plano_mobilidade_rmsp.pdf', caption: 'Plano de Mobilidade da RMSP', url: '/static/documents/sample/plano_mobilidade_rmsp.pdf' },
                            { name: 'relatorio_transporte_2024.pdf', caption: 'Relatório de Transportes 2024', url: '/static/documents/sample/relatorio_transporte_2024.pdf' }
                        ],
                        charts: [
                            { name: 'fluxo_passageiros.png', caption: 'Fluxo de passageiros por modal', url: '/static/charts/sample/fluxo_passageiros.png' },
                            { name: 'investimentos_transporte.png', caption: 'Investimentos em transportes', url: '/static/charts/sample/investimentos_transporte.png' }
                        ]
                    },
                    layerVisibility: { 1: true, 2: true, 3: true, 4: false, 5: false }
                },
                {
                    id: 4,
                    title: 'Desenvolvimento Econômico',
                    description: 'Atividade econômica e principais polos industriais',
                    mapPosition: { lat: -23.5445, lng: -46.6412, zoom: 11 },
                    content: {
                        text: 'A RMSP concentra 18% do PIB brasileiro, sendo o principal centro financeiro e industrial do país. A região abriga importantes polos tecnológicos, como o Vale do Silício brasileiro em São José dos Campos.',
                        images: [
                            { name: 'centro_financeiro.jpg', caption: 'Centro financeiro de São Paulo', url: '/static/images/sample/centro_financeiro.jpg' },
                            { name: 'polo_tecnologico.jpg', caption: 'Polo tecnológico da região', url: '/static/images/sample/polo_tecnologico.jpg' }
                        ],
                        videos: [
                            { name: 'economia_rmsp.mp4', caption: 'Análise da economia regional', url: '/static/videos/sample/economia_rmsp.mp4' }
                        ],
                        documents: [
                            { name: 'relatorio_economico_seade.pdf', caption: 'Relatório Econômico SEADE 2024', url: '/static/documents/sample/relatorio_economico_seade.pdf' }
                        ],
                        charts: [
                            { name: 'pib_setorial.png', caption: 'Composição do PIB por setor', url: '/static/charts/sample/pib_setorial.png' },
                            { name: 'emprego_formal.png', caption: 'Evolução do emprego formal', url: '/static/charts/sample/emprego_formal.png' }
                        ]
                    },
                    layerVisibility: { 1: true, 2: false, 3: true, 4: false, 5: true }
                },
                {
                    id: 5,
                    title: 'Sustentabilidade e Meio Ambiente',
                    description: 'Áreas verdes, qualidade do ar e iniciativas sustentáveis',
                    mapPosition: { lat: -23.5567, lng: -46.6600, zoom: 12 },
                    content: {
                        text: 'A RMSP enfrenta desafios ambientais significativos, mas também possui importantes áreas verdes como o Parque Ibirapuera e a Serra da Cantareira. Iniciativas de sustentabilidade incluem corredores verdes e políticas de redução de emissões.',
                        images: [
                            { name: 'parque_ibirapuera.jpg', caption: 'Parque Ibirapuera', url: '/static/images/sample/parque_ibirapuera.jpg' },
                            { name: 'serra_cantareira.jpg', caption: 'Serra da Cantareira', url: '/static/images/sample/serra_cantareira.jpg' },
                            { name: 'corredor_verde.jpg', caption: 'Corredor verde urbano', url: '/static/images/sample/corredor_verde.jpg' }
                        ],
                        videos: [
                            { name: 'sustentabilidade_rmsp.mp4', caption: 'Iniciativas de sustentabilidade', url: '/static/videos/sample/sustentabilidade_rmsp.mp4' }
                        ],
                        documents: [
                            { name: 'plano_ambiental_rmsp.pdf', caption: 'Plano Ambiental da RMSP', url: '/static/documents/sample/plano_ambiental_rmsp.pdf' }
                        ],
                        charts: [
                            { name: 'qualidade_ar.png', caption: 'Índice de qualidade do ar', url: '/static/charts/sample/qualidade_ar.png' },
                            { name: 'areas_verdes.png', caption: 'Distribuição de áreas verdes', url: '/static/charts/sample/areas_verdes.png' }
                        ]
                    },
                    layerVisibility: { 1: true, 2: false, 3: false, 4: true, 5: false }
                }
            ];

            this.updateInterface();
            this.createStopMarkers(); // Criar marcadores para todas as paradas
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

        // Event listener para clique no mapa
        this.map.on('click', (e) => {
            this.handleMapClick(e);
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

    createStopMarkers() {
        // Limpar marcadores existentes
        this.stopMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.stopMarkers.clear();

        // Criar marcadores para cada parada
        this.stops.forEach((stop, index) => {
            if (stop.mapPosition && stop.mapPosition.lat && stop.mapPosition.lng) {
                const marker = L.marker([stop.mapPosition.lat, stop.mapPosition.lng], {
                    icon: L.divIcon({
                        className: 'custom-stop-marker',
                        html: `<div class="marker-content">
                                <span class="marker-number">${index + 1}</span>
                                <span class="marker-title">${stop.title}</span>
                               </div>`,
                        iconSize: [120, 40],
                        iconAnchor: [60, 20]
                    })
                }).addTo(this.map);

                // Adicionar popup informativo
                marker.bindPopup(`
                    <div class="stop-popup">
                        <h6><strong>${stop.title}</strong></h6>
                        <p class="small mb-2">${stop.description}</p>
                        <div class="d-grid">
                            <button class="btn btn-primary btn-sm" onclick="selectStop(${stop.id})">
                                <i class="fas fa-edit me-1"></i>Editar
                            </button>
                        </div>
                    </div>
                `);

                // Armazenar referência do marcador
                this.stopMarkers.set(stop.id, marker);

                // Adicionar evento de clique
                marker.on('click', () => {
                    this.selectStop(stop.id);
                });
            }
        });
    }

    handleMapClick(e) {
        // Se uma parada estiver selecionada, permitir capturar posição
        if (this.currentStop) {
            const { lat, lng } = e.latlng;
            const zoom = this.map.getZoom();
            
            this.currentStop.mapPosition = { lat, lng, zoom };
            
            // Atualizar marcador da parada
            this.updateStopMarker(this.currentStop.id);
            
            // Atualizar interface
            this.loadStopContent();
            this.updateProgress();
            
            this.showSuccess('Posição da parada atualizada no mapa!');
        }
    }

    updateStopMarker(stopId) {
        const stop = this.stops.find(s => s.id === stopId);
        if (!stop || !stop.mapPosition) return;

        // Remover marcador antigo
        const oldMarker = this.stopMarkers.get(stopId);
        if (oldMarker) {
            this.map.removeLayer(oldMarker);
        }

        // Criar novo marcador
        const stopIndex = this.stops.findIndex(s => s.id === stopId);
        const marker = L.marker([stop.mapPosition.lat, stop.mapPosition.lng], {
            icon: L.divIcon({
                className: 'custom-stop-marker',
                html: `<div class="marker-content">
                        <span class="marker-number">${stopIndex + 1}</span>
                        <span class="marker-title">${stop.title}</span>
                       </div>`,
                iconSize: [120, 40],
                iconAnchor: [60, 20]
            })
        }).addTo(this.map);

        // Adicionar popup e eventos
        marker.bindPopup(`
            <div class="stop-popup">
                <h6><strong>${stop.title}</strong></h6>
                <p class="small mb-2">${stop.description}</p>
                <div class="d-grid">
                    <button class="btn btn-primary btn-sm" onclick="selectStop(${stop.id})">
                        <i class="fas fa-edit me-1"></i>Editar
                    </button>
                </div>
            </div>
        `);

        marker.on('click', () => {
            this.selectStop(stop.id);
        });

        // Atualizar referência
        this.stopMarkers.set(stopId, marker);
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
        
        const hasContent = stop.content.text || 
                          stop.content.images.length > 0 || 
                          stop.content.videos.length > 0 || 
                          stop.content.documents.length > 0 || 
                          stop.content.charts.length > 0;
        const contentIcon = hasContent ? 'fas fa-file-alt text-success' : 'fas fa-file-alt text-muted';
        const contentText = hasContent ? 'Conteúdo adicionado' : 'Sem conteúdo';

        return `
            <div class="list-group-item list-group-item-action" data-stop-id="${stop.id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${stop.title}</h6>
                        <p class="mb-1 small text-muted">${stop.description || 'Sem descrição'}</p>
                        <div class="d-flex gap-3 small text-muted">
                            <span><i class="${positionIcon} me-1"></i>${positionText}</span>
                            <span><i class="${contentIcon} me-1"></i>${contentText}</span>
                        </div>
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
                    <button class="btn btn-outline-info btn-sm" onclick="centerMapOnStop()">
                        <i class="fas fa-crosshairs me-1"></i>Centralizar no Mapa
                    </button>
                </div>
                <small class="text-muted">
                    ${this.currentStop.mapPosition ? 
                        `Lat: ${this.currentStop.mapPosition.lat.toFixed(4)}, Lng: ${this.currentStop.mapPosition.lng.toFixed(4)}, Zoom: ${this.currentStop.mapPosition.zoom}` : 
                        'Clique no mapa para definir a posição ou use "Capturar Posição Atual"'}
                </small>
            </div>

            <div class="mb-3">
                <label class="form-label">Conteúdo da Parada</label>
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
                
                ${this.renderCurrentStopContent()}
            </div>

            <div class="mb-3">
                <label class="form-label">Visibilidade das Camadas</label>
                <div id="layers-visibility">
                    ${this.renderLayersVisibility()}
                </div>
            </div>
        `;
    }

    renderCurrentStopContent() {
        const content = this.currentStop.content;
        let html = '<div class="current-content-preview">';
        
        if (content.text) {
            html += `
                <div class="content-item mb-2">
                    <h6 class="text-primary"><i class="fas fa-font me-1"></i>Texto</h6>
                    <p class="small">${content.text.substring(0, 100)}${content.text.length > 100 ? '...' : ''}</p>
                </div>
            `;
        }
        
        if (content.images.length > 0) {
            html += `
                <div class="content-item mb-2">
                    <h6 class="text-success"><i class="fas fa-image me-1"></i>Imagens (${content.images.length})</h6>
                    <div class="d-flex gap-1 flex-wrap">
                        ${content.images.map(img => `
                            <span class="badge bg-success">${img.name}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (content.videos.length > 0) {
            html += `
                <div class="content-item mb-2">
                    <h6 class="text-warning"><i class="fas fa-video me-1"></i>Vídeos (${content.videos.length})</h6>
                    <div class="d-flex gap-1 flex-wrap">
                        ${content.videos.map(video => `
                            <span class="badge bg-warning">${video.name}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (content.documents.length > 0) {
            html += `
                <div class="content-item mb-2">
                    <h6 class="text-info"><i class="fas fa-file-pdf me-1"></i>Documentos (${content.documents.length})</h6>
                    <div class="d-flex gap-1 flex-wrap">
                        ${content.documents.map(doc => `
                            <span class="badge bg-info">${doc.name}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (content.charts.length > 0) {
            html += `
                <div class="content-item mb-2">
                    <h6 class="text-secondary"><i class="fas fa-chart-bar me-1"></i>Gráficos (${content.charts.length})</h6>
                    <div class="d-flex gap-1 flex-wrap">
                        ${content.charts.map(chart => `
                            <span class="badge bg-secondary">${chart.name}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (!content.text && content.images.length === 0 && content.videos.length === 0 && 
            content.documents.length === 0 && content.charts.length === 0) {
            html += '<p class="text-muted small">Nenhum conteúdo adicionado ainda</p>';
        }
        
        html += '</div>';
        return html;
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
                    <i class="fas fa-${this.getLayerIcon(layer.type)} me-1"></i>
                    ${layer.name}
                </label>
            </div>
        `).join('');
    }

    getLayerIcon(type) {
        switch (type) {
            case 'point': return 'map-marker-alt';
            case 'line': return 'route';
            case 'polygon': return 'draw-polygon';
            default: return 'layer-group';
        }
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

        // Atualizar marcador da parada
        this.updateStopMarker(this.currentStop.id);

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
        
        // Criar toast de sucesso
        this.showToast(message, 'success');
    }

    showError(message) {
        // Implementar exibição de erro
        console.error('❌', message);
        
        // Criar toast de erro
        this.showToast(message, 'danger');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remover toast após ser escondido
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
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
        
        // Remover marcador do mapa
        const marker = editor.stopMarkers.get(stopId);
        if (marker) {
            editor.map.removeLayer(marker);
            editor.stopMarkers.delete(stopId);
        }
        
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
        
        // Atualizar marcador no mapa
        editor.updateStopMarker(stopId);
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

function centerMapOnStop() {
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
    const name = prompt('Nome da imagem:');
    const caption = prompt('Legenda da imagem:');
    const url = prompt('URL da imagem:');
    
    if (name && window.geographicReportEditor.currentStop) {
        const image = { name, caption, url };
        window.geographicReportEditor.currentStop.content.images.push(image);
        window.geographicReportEditor.loadStopContent();
        window.geographicReportEditor.updateProgress();
        window.geographicReportEditor.showSuccess('Imagem adicionada com sucesso!');
    }
}

function addVideoContent() {
    const name = prompt('Nome do vídeo:');
    const caption = prompt('Legenda do vídeo:');
    const url = prompt('URL do vídeo:');
    
    if (name && window.geographicReportEditor.currentStop) {
        const video = { name, caption, url };
        window.geographicReportEditor.currentStop.content.videos.push(video);
        window.geographicReportEditor.loadStopContent();
        window.geographicReportEditor.updateProgress();
        window.geographicReportEditor.showSuccess('Vídeo adicionado com sucesso!');
    }
}

function addDocumentContent() {
    const name = prompt('Nome do documento:');
    const caption = prompt('Legenda do documento:');
    const url = prompt('URL do documento:');
    
    if (name && window.geographicReportEditor.currentStop) {
        const document = { name, caption, url };
        window.geographicReportEditor.currentStop.content.documents.push(document);
        window.geographicReportEditor.loadStopContent();
        window.geographicReportEditor.updateProgress();
        window.geographicReportEditor.showSuccess('Documento adicionado com sucesso!');
    }
}

function addChartContent() {
    const name = prompt('Nome do gráfico:');
    const caption = prompt('Legenda do gráfico:');
    const url = prompt('URL do gráfico:');
    
    if (name && window.geographicReportEditor.currentStop) {
        const chart = { name, caption, url };
        window.geographicReportEditor.currentStop.content.charts.push(chart);
        window.geographicReportEditor.loadStopContent();
        window.geographicReportEditor.updateProgress();
        window.geographicReportEditor.showSuccess('Gráfico adicionado com sucesso!');
    }
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
