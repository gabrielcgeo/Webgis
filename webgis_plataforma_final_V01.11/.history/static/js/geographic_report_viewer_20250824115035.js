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
                description: 'Descrição do relatório de exemplo'
            };

            this.stops = [
                {
                    id: 1,
                    title: 'Introdução',
                    description: 'Visão geral da área de estudo',
                    content: {
                        text: 'Esta é uma introdução ao nosso relatório geográfico. Aqui você encontrará informações sobre a área de estudo e os objetivos da análise.',
                        images: ['sample1.jpg', 'sample2.jpg'],
                        videos: [],
                        documents: ['relatorio.pdf'],
                        charts: []
                    }
                },
                {
                    id: 2,
                    title: 'Análise Demográfica',
                    description: 'Características populacionais da região',
                    content: {
                        text: 'Análise detalhada da demografia da região, incluindo densidade populacional, distribuição etária e indicadores socioeconômicos.',
                        images: ['demografia1.jpg', 'demografia2.jpg'],
                        videos: ['video_demografia.mp4'],
                        documents: ['analise_demografica.pdf'],
                        charts: ['grafico_populacao.png']
                    }
                },
                {
                    id: 3,
                    title: 'Infraestrutura',
                    description: 'Análise da infraestrutura disponível',
                    content: {
                        text: 'Avaliação da infraestrutura da região, incluindo transportes, serviços públicos e equipamentos urbanos.',
                        images: ['infra1.jpg', 'infra2.jpg', 'infra3.jpg'],
                        videos: [],
                        documents: ['relatorio_infraestrutura.pdf'],
                        charts: ['grafico_infraestrutura.png']
                    }
                }
            ];

            this.totalStops = this.stops.length;
            this.updateInterface();
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

    addStopMarkers() {
        // Adicionar marcadores para cada parada
        this.stops.forEach((stop, index) => {
            const marker = L.marker([-23.5505 + (index * 0.01), -46.6333 + (index * 0.01)])
                .addTo(this.map)
                .bindPopup(`
                    <div class="text-center">
                        <h6>${stop.title}</h6>
                        <p class="small">${stop.description}</p>
                        <button class="btn btn-primary btn-sm" onclick="goToStop(${index})">
                            Ver Conteúdo
                        </button>
                    </div>
                `);

            // Adicionar evento de clique
            marker.on('click', () => {
                this.selectStop(index);
            });
        });
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

            stopElement.innerHTML = `
                <h6>${stop.title}</h6>
                <p>${stop.description}</p>
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
            <div class="content-card">
                <h6>${stop.title}</h6>
                <p>${content.text}</p>
            </div>
            
            <div class="content-card">
                <h6>Mídia e Documentos</h6>
                <div class="media-grid">
                    ${this.renderMediaGrid(content.media)}
                </div>
            </div>
        `;
    }

    renderMediaGrid(media) {
        if (!media || media.length === 0) {
            return '<p class="text-muted small">Nenhuma mídia disponível</p>';
        }

        return media.map(item => {
            if (item.match(/\.(jpg|jpeg|png|gif)$/i)) {
                return `
                    <div class="media-item" onclick="showImage('${item}')">
                        <img src="/static/images/${item}" alt="${item}" 
                             onerror="this.parentElement.innerHTML='<div class=\\'media-icon\\'><i class=\\'fas fa-image\\'></i></div>'">
                    </div>
                `;
            } else if (item.match(/\.(mp4|avi|mov)$/i)) {
                return `
                    <div class="media-item" onclick="showVideo('${item}')">
                        <div class="media-icon">
                            <i class="fas fa-video"></i>
                        </div>
                    </div>
                `;
            } else if (item.match(/\.pdf$/i)) {
                return `
                    <div class="media-item" onclick="showDocument('${item}')">
                        <div class="media-icon">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="media-item" onclick="showChart('${item}')">
                        <div class="media-icon">
                            <i class="fas fa-chart-bar"></i>
                        </div>
                    </div>
                `;
            }
        }).join('');
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
        // Simular atualização da visualização do mapa
        // Em uma implementação real, isso moveria o mapa para a posição da parada
        console.log(`Atualizando visualização do mapa para parada ${index}`);
        
        // Adicionar efeito visual para indicar mudança
        const mapContainer = document.getElementById('main-map');
        if (mapContainer) {
            mapContainer.style.transition = 'all 0.3s ease';
            mapContainer.style.transform = 'scale(1.02)';
            setTimeout(() => {
                mapContainer.style.transform = 'scale(1)';
            }, 300);
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

function showImage(imagePath) {
    // Implementar visualização de imagem
    console.log(`Mostrando imagem: ${imagePath}`);
    
    // Criar modal para visualização da imagem
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Visualização de Imagem</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <img src="/static/images/${imagePath}" class="img-fluid" alt="${imagePath}">
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

function showVideo(videoPath) {
    // Implementar visualização de vídeo
    console.log(`Mostrando vídeo: ${videoPath}`);
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Visualização de Vídeo</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <video controls class="w-100">
                        <source src="/static/videos/${videoPath}" type="video/mp4">
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

function showDocument(documentPath) {
    // Implementar visualização de documento
    console.log(`Mostrando documento: ${documentPath}`);
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Visualização de Documento</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <iframe src="/static/documents/${documentPath}" width="100%" height="600px" frameborder="0"></iframe>
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

function showChart(chartPath) {
    // Implementar visualização de gráfico
    console.log(`Mostrando gráfico: ${chartPath}`);
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Visualização de Gráfico</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <img src="/static/charts/${chartPath}" class="img-fluid" alt="${chartPath}">
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
