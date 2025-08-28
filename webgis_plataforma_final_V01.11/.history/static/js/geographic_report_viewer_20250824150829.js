/**
 * Visualizador de Relatório Geográfico - JavaScript
 * Gerencia a funcionalidade do visualizador público
 */

class GeographicReportViewer {
    constructor() {
        this.reportId = null;
        this.report = null;
        this.map = null;
        this.currentStopIndex = 0;
        this.totalStops = 0;
        this.stops = [];
        this.autoplayEnabled = false;
        this.autoplayInterval = null;
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
                    config: sampleData.config || { template: 'modern', basemap: 'osm', theme: 'light' }
                };
                this.stops = sampleData.stops || [];
            } else {
                // Dados de exemplo mais completos
                this.report = {
                    id: this.reportId,
                    title: 'Análise Geográfica da Região Metropolitana de São Paulo',
                    description: 'Relatório completo sobre desenvolvimento urbano, demografia e infraestrutura da RMSP',
                    config: {
                        template: 'modern',
                        basemap: 'osm',
                        theme: 'light'
                    }
                };

                // Paradas de exemplo com conteúdo rico e posições no mapa
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
                    }
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
                    }
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
                    }
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
                    }
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
                    }
                }
            ];
        }

        this.totalStops = this.stops.length;
        this.updateInterface();
        this.createStopMarkers(); // Criar marcadores para todas as paradas
    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
        this.showError('Erro ao carregar relatório. Tente novamente.');
    }
}

    setupMap() {
        // Inicializar mapa Leaflet
        this.map = L.map('main-map').setView([-23.5505, -46.6333], 10);
        
        // Adicionar camada base
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Adicionar controles de camadas base
        this.setupBaseLayers();

        // Adicionar marcadores para as paradas
        this.addStopMarkers();
    }

    setupBaseLayers() {
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
                            <button class="btn btn-primary btn-sm" onclick="goToStop(${index})">
                                <i class="fas fa-play me-1"></i>Ver Conteúdo
                            </button>
                        </div>
                    </div>
                `);

                // Armazenar referência do marcador
                this.stopMarkers.set(stop.id, marker);

                // Adicionar evento de clique
                marker.on('click', () => {
                    this.selectStop(index);
                });
            }
        });
    }

    addStopMarkers() {
        // Esta função agora chama createStopMarkers
        this.createStopMarkers();
    }

    setupEventListeners() {
        // Event listeners para controles de navegação
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousStop();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextStop();
                    break;
                case ' ':
                    e.preventDefault();
                    this.toggleAutoplay();
                    break;
            }
        });

        // Event listeners para botões de navegação
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousStop());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStop());
        }

        // Event listener para autoplay
        const autoplayBtn = document.getElementById('autoplay-btn');
        if (autoplayBtn) {
            autoplayBtn.addEventListener('click', () => this.toggleAutoplay());
        }
    }

    updateInterface() {
        // Atualizar título e descrição
        document.getElementById('report-title').textContent = this.report.title;
        document.getElementById('report-description').textContent = this.report.description;

        // Atualizar contadores
        document.getElementById('total-stops').textContent = this.totalStops;

        // Carregar lista de paradas
        this.loadStopsList();

        // Atualizar navegação
        this.updateNavigation();

        // Selecionar primeira parada
        this.selectStop(0);
    }

    loadStopsList() {
        const container = document.getElementById('stops-list');
        if (!container) return;

        // Remover mensagem de carregamento
        const loadingElement = container.querySelector('.text-center');
        if (loadingElement) {
            loadingElement.remove();
        }

        this.stops.forEach((stop, index) => {
            const stopElement = document.createElement('div');
            stopElement.className = 'stop-item';
            stopElement.setAttribute('data-stop-index', index);
            stopElement.onclick = () => this.selectStop(index);

            // Verificar se a parada tem conteúdo
            const hasContent = stop.content.text || 
                              stop.content.images.length > 0 || 
                              stop.content.videos.length > 0 || 
                              stop.content.documents.length > 0 || 
                              stop.content.charts.length > 0;

            stopElement.innerHTML = `
                <div class="stop-item-header">
                    <span class="stop-number">${index + 1}</span>
                    <h6 class="stop-title">${stop.title}</h6>
                </div>
                <p class="stop-description">${stop.description}</p>
                <div class="stop-content-indicators">
                    ${stop.content.text ? '<span class="badge bg-primary"><i class="fas fa-font"></i></span>' : ''}
                    ${stop.content.images.length > 0 ? `<span class="badge bg-success"><i class="fas fa-image"></i> ${stop.content.images.length}</span>` : ''}
                    ${stop.content.videos.length > 0 ? `<span class="badge bg-warning"><i class="fas fa-video"></i> ${stop.content.videos.length}</span>` : ''}
                    ${stop.content.documents.length > 0 ? `<span class="badge bg-info"><i class="fas fa-file-pdf"></i> ${stop.content.documents.length}</span>` : ''}
                    ${stop.content.charts.length > 0 ? `<span class="badge bg-secondary"><i class="fas fa-chart-bar"></i> ${stop.content.charts.length}</span>` : ''}
                </div>
            `;

            container.appendChild(stopElement);
        });
    }

    selectStop(index) {
        if (index < 0 || index >= this.totalStops) return;

        // Atualizar índice atual
        this.currentStopIndex = index;

        // Atualizar seleção visual
        document.querySelectorAll('.stop-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        // Atualizar navegação
        this.updateNavigation();

        // Atualizar progresso
        this.updateProgress();

        // Carregar conteúdo da parada
        this.loadStopContent(index);

        // Atualizar mapa
        this.updateMapView(index);

        // Parar autoplay se estiver ativo
        if (this.autoplayEnabled) {
            this.stopAutoplay();
        }
    }

    loadStopContent(index) {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        const stop = this.stops[index];
        if (!stop) return;

        const content = stop.content;

        contentArea.innerHTML = `
            <div class="content-header mb-3">
                <h4 class="content-title">${stop.title}</h4>
                <p class="content-subtitle">${stop.description}</p>
            </div>
            
            ${content.text ? `
                <div class="content-card mb-3">
                    <h6><i class="fas fa-font text-primary me-2"></i>Descrição</h6>
                    <p class="content-text">${content.text}</p>
                </div>
            ` : ''}
            
            ${this.renderMediaContent(content)}
        `;
    }

    renderMediaContent(content) {
        let html = '<div class="content-card">';
        html += '<h6><i class="fas fa-images text-success me-2"></i>Mídia e Documentos</h6>';
        
        if (content.images.length === 0 && content.videos.length === 0 && 
            content.documents.length === 0 && content.charts.length === 0) {
            html += '<p class="text-muted small">Nenhuma mídia disponível para esta parada</p>';
        } else {
            html += '<div class="media-grid">';
            
            // Imagens
            content.images.forEach(img => {
                html += `
                    <div class="media-item" onclick="showImage('${img.url}', '${img.caption}')">
                        <div class="media-preview">
                            <img src="${img.url}" alt="${img.caption}" 
                                 onerror="this.parentElement.innerHTML='<div class=\\'media-icon\\'><i class=\\'fas fa-image\\'></i></div>'">
                        </div>
                        <div class="media-caption">${img.caption}</div>
                    </div>
                `;
            });
            
            // Vídeos
            content.videos.forEach(video => {
                html += `
                    <div class="media-item" onclick="showVideo('${video.url}', '${video.caption}')">
                        <div class="media-preview">
                            <div class="media-icon">
                                <i class="fas fa-video"></i>
                            </div>
                        </div>
                        <div class="media-caption">${video.caption}</div>
                    </div>
                `;
            });
            
            // Documentos
            content.documents.forEach(doc => {
                html += `
                    <div class="media-item" onclick="showDocument('${doc.url}', '${doc.caption}')">
                        <div class="media-preview">
                            <div class="media-icon">
                                <i class="fas fa-file-pdf"></i>
                            </div>
                        </div>
                        <div class="media-caption">${doc.caption}</div>
                    </div>
                `;
            });
            
            // Gráficos
            content.charts.forEach(chart => {
                html += `
                    <div class="media-item" onclick="showChart('${chart.url}', '${chart.caption}')">
                        <div class="media-preview">
                            <div class="media-icon">
                                <i class="fas fa-chart-bar"></i>
                            </div>
                        </div>
                        <div class="media-caption">${chart.caption}</div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentStopIndex === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentStopIndex === this.totalStops - 1;
        }
        
        const currentStopElement = document.getElementById('current-stop');
        if (currentStopElement) {
            currentStopElement.textContent = this.currentStopIndex + 1;
        }
    }

    updateProgress() {
        const progress = ((this.currentStopIndex + 1) / this.totalStops) * 100;
        const progressBar = document.getElementById('story-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    previousStop() {
        if (this.currentStopIndex > 0) {
            this.selectStop(this.currentStopIndex - 1);
        }
    }

    nextStop() {
        if (this.currentStopIndex < this.totalStops - 1) {
            this.selectStop(this.currentStopIndex + 1);
        }
    }

    toggleAutoplay() {
        this.autoplayEnabled = !this.autoplayEnabled;
        const icon = document.getElementById('autoplay-icon');
        
        if (this.autoplayEnabled) {
            icon.className = 'fas fa-pause';
            this.startAutoplay();
        } else {
            icon.className = 'fas fa-play';
            this.stopAutoplay();
        }
    }

    startAutoplay() {
        this.autoplayInterval = setInterval(() => {
            if (this.currentStopIndex < this.totalStops - 1) {
                this.nextStop();
            } else {
                this.stopAutoplay();
                this.autoplayEnabled = false;
                const icon = document.getElementById('autoplay-icon');
                if (icon) {
                    icon.className = 'fas fa-play';
                }
            }
        }, 5000); // 5 segundos por parada
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    updateMapView(index) {
        const stop = this.stops[index];
        if (!stop || !stop.mapPosition) return;

        // Mover mapa para a posição da parada com animação suave
        this.map.flyTo(
            [stop.mapPosition.lat, stop.mapPosition.lng], 
            stop.mapPosition.zoom, 
            { duration: 1.5 }
        );

        // Destacar marcador da parada atual
        this.highlightCurrentStopMarker(index);
    }

    highlightCurrentStopMarker(index) {
        // Remover destaque de todos os marcadores
        this.stopMarkers.forEach(marker => {
            marker.getElement().classList.remove('current-stop-highlight');
        });

        // Destacar marcador atual
        const currentStop = this.stops[index];
        if (currentStop) {
            const marker = this.stopMarkers.get(currentStop.id);
            if (marker) {
                marker.getElement().classList.add('current-stop-highlight');
            }
        }
    }

    goToStop(index) {
        this.selectStop(index);
    }

    async simulateLoading() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    showError(message) {
        console.error('❌', message);
        // Implementar exibição de erro na interface
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
    window.geographicReportViewer = new GeographicReportViewer();
});

// Funções globais para compatibilidade
function previousStop() {
    if (window.geographicReportViewer) {
        window.geographicReportViewer.previousStop();
    }
}

function nextStop() {
    if (window.geographicReportViewer) {
        window.geographicReportViewer.nextStop();
    }
}

function toggleAutoplay() {
    if (window.geographicReportViewer) {
        window.geographicReportViewer.toggleAutoplay();
    }
}

function goToStop(index) {
    if (window.geographicReportViewer) {
        window.geographicReportViewer.goToStop(index);
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function showImage(imagePath, caption) {
    console.log(`Mostrando imagem: ${imagePath}`);
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${caption || 'Visualização de Imagem'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <img src="${imagePath}" class="img-fluid" alt="${caption || 'Imagem'}" 
                         onerror="this.parentElement.innerHTML='<div class=\\'text-muted\\'><i class=\\'fas fa-exclamation-triangle fa-2x\\'></i><p>Erro ao carregar imagem</p></div>'">
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function showVideo(videoPath, caption) {
    console.log(`Mostrando vídeo: ${videoPath}`);
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${caption || 'Visualização de Vídeo'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <video controls class="w-100">
                        <source src="${videoPath}" type="video/mp4">
                        Seu navegador não suporta o elemento de vídeo.
                    </video>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function showDocument(documentPath, caption) {
    console.log(`Mostrando documento: ${documentPath}`);
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${caption || 'Visualização de Documento'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <iframe src="${documentPath}" width="100%" height="600px" frameborder="0"
                            onerror="this.parentElement.innerHTML='<div class=\\'text-muted text-center\\'><i class=\\'fas fa-exclamation-triangle fa-2x\\'></i><p>Erro ao carregar documento</p></div>'"></iframe>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function showChart(chartPath, caption) {
    console.log(`Mostrando gráfico: ${chartPath}`);
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${caption || 'Visualização de Gráfico'}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <img src="${chartPath}" class="img-fluid" alt="${caption || 'Gráfico'}"
                         onerror="this.parentElement.innerHTML='<div class=\\'text-muted\\'><i class=\\'fas fa-exclamation-triangle fa-2x\\'></i><p>Erro ao carregar gráfico</p></div>'">
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}
