/**
 * Sistema de Relatório Geográfico - JavaScript Principal
 * Gerencia a funcionalidade da página principal de relatórios
 */

class GeographicReportManager {
    constructor() {
        this.reports = [];
        this.currentFilters = {
            search: '',
            status: '',
            sort: 'updated_at'
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadReports();
        this.loadStatistics();
    }

    setupEventListeners() {
        // Busca em tempo real
        const searchInput = document.getElementById('search-reports');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.currentFilters.search = searchInput.value;
                this.applyFilters();
            }, 300));
        }

        // Filtros
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.currentFilters.status = statusFilter.value;
                this.applyFilters();
            });
        }

        const sortSelect = document.getElementById('sort-reports');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.currentFilters.sort = sortSelect.value;
                this.applyFilters();
            });
        }
    }

    async loadReports() {
        try {
            // Simular carregamento de relatórios
            await this.simulateLoading();
            
            // Dados de exemplo
            this.reports = [
                {
                    id: 1,
                    title: 'Análise Demográfica da Região Metropolitana',
                    description: 'Estudo completo sobre a distribuição populacional e características socioeconômicas',
                    status: 'published',
                    created_at: '2024-01-15',
                    updated_at: '2024-01-20',
                    views: 156,
                    stops: 8
                },
                {
                    id: 2,
                    title: 'Planejamento de Rotas de Transporte',
                    description: 'Análise de rotas otimizadas para o sistema de transporte público',
                    status: 'draft',
                    created_at: '2024-01-18',
                    updated_at: '2024-01-18',
                    views: 0,
                    stops: 5
                },
                {
                    id: 3,
                    title: 'Análise de Mercado Imobiliário',
                    description: 'Estudo sobre tendências e oportunidades no mercado imobiliário local',
                    status: 'published',
                    created_at: '2024-01-10',
                    updated_at: '2024-01-16',
                    views: 89,
                    stops: 12
                }
            ];

            this.renderReports();
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            this.showError('Erro ao carregar relatórios. Tente novamente.');
        }
    }

    async loadStatistics() {
        try {
            const totalReports = this.reports.length;
            const publishedReports = this.reports.filter(r => r.status === 'published').length;
            const draftReports = this.reports.filter(r => r.status === 'draft').length;
            const totalViews = this.reports.reduce((sum, r) => sum + r.views, 0);

            document.getElementById('total-reports').textContent = totalReports;
            document.getElementById('published-reports').textContent = publishedReports;
            document.getElementById('draft-reports').textContent = draftReports;
            document.getElementById('total-views').textContent = totalViews;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    renderReports() {
        const container = document.getElementById('reports-container');
        if (!container) return;

        if (this.reports.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Nenhum relatório encontrado</h5>
                    <p class="text-muted">Comece criando seu primeiro relatório geográfico!</p>
                    <button class="btn btn-primary" onclick="createNewReport()">
                        <i class="fas fa-plus me-2"></i>Criar Primeiro Relatório
                    </button>
                </div>
            `;
            return;
        }

        const reportsHTML = this.reports.map(report => this.createReportCard(report)).join('');
        container.innerHTML = reportsHTML;
    }

    createReportCard(report) {
        const statusClass = this.getStatusClass(report.status);
        const statusText = this.getStatusText(report.status);
        const updatedDate = new Date(report.updated_at).toLocaleDateString('pt-BR');

        return `
            <div class="card mb-3 report-card" data-report-id="${report.id}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-start">
                                <div class="report-icon me-3">
                                    <i class="fas fa-map-marked-alt fa-2x text-primary"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <h5 class="card-title mb-1">
                                        <a href="/geographic-report/edit/${report.id}" class="text-decoration-none">
                                            ${report.title}
                                        </a>
                                    </h5>
                                    <p class="card-text text-muted mb-2">${report.description}</p>
                                    <div class="d-flex align-items-center gap-3">
                                        <span class="badge ${statusClass}">${statusText}</span>
                                        <small class="text-muted">
                                            <i class="fas fa-route me-1"></i>${report.stops} paradas
                                        </small>
                                        <small class="text-muted">
                                            <i class="fas fa-eye me-1"></i>${report.views} visualizações
                                        </small>
                                        <small class="text-muted">
                                            <i class="fas fa-clock me-1"></i>Atualizado em ${updatedDate}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="btn-group" role="group">
                                <button class="btn btn-outline-primary btn-sm" onclick="editReport(${report.id})">
                                    <i class="fas fa-edit me-1"></i>Editar
                                </button>
                                <button class="btn btn-outline-success btn-sm" onclick="previewReport(${report.id})">
                                    <i class="fas fa-eye me-1"></i>Visualizar
                                </button>
                                <button class="btn btn-outline-info btn-sm" onclick="shareReport(${report.id})">
                                    <i class="fas fa-share me-1"></i>Compartilhar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        switch (status) {
            case 'published': return 'bg-success';
            case 'draft': return 'bg-warning';
            case 'archived': return 'bg-secondary';
            default: return 'bg-secondary';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'published': return 'Publicado';
            case 'draft': return 'Rascunho';
            case 'archived': return 'Arquivado';
            default: return 'Desconhecido';
        }
    }

    applyFilters() {
        let filteredReports = [...this.reports];

        // Filtro de busca
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filteredReports = filteredReports.filter(report => 
                report.title.toLowerCase().includes(searchTerm) ||
                report.description.toLowerCase().includes(searchTerm)
            );
        }

        // Filtro de status
        if (this.currentFilters.status) {
            filteredReports = filteredReports.filter(report => 
                report.status === this.currentFilters.status
            );
        }

        // Ordenação
        filteredReports.sort((a, b) => {
            switch (this.currentFilters.sort) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'views':
                    return b.views - a.views;
                case 'created_at':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'updated_at':
                default:
                    return new Date(b.updated_at) - new Date(a.updated_at);
            }
        });

        this.renderFilteredReports(filteredReports);
    }

    renderFilteredReports(filteredReports) {
        const container = document.getElementById('reports-container');
        if (!container) return;

        if (filteredReports.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Nenhum relatório encontrado</h5>
                    <p class="text-muted">Tente ajustar os filtros de busca.</p>
                </div>
            `;
            return;
        }

        const reportsHTML = filteredReports.map(report => this.createReportCard(report)).join('');
        container.innerHTML = reportsHTML;
    }

    async simulateLoading() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    showError(message) {
        // Implementar exibição de erros
        console.error(message);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    window.geographicReportManager = new GeographicReportManager();
});

// Funções globais para compatibilidade
function createNewReport() {
    const modal = new bootstrap.Modal(document.getElementById('quickCreateModal'));
    modal.show();
}

function showTemplates() {
    loadTemplates();
    const modal = new bootstrap.Modal(document.getElementById('templatesModal'));
    modal.show();
}

function editReport(reportId) {
    window.location.href = `/geographic-report/edit/${reportId}`;
}

function previewReport(reportId) {
    window.open(`/geographic-report/view/${reportId}`, '_blank');
}

function shareReport(reportId) {
    // Implementar compartilhamento
    const url = `${window.location.origin}/geographic-report/view/${reportId}`;
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copiado para a área de transferência!');
    }).catch(() => {
        prompt('Copie este link:', url);
    });
}

function loadTemplates() {
    const container = document.getElementById('templates-grid');
    if (!container) return;

    const templates = [
        {
            name: 'Análise de Mercado',
            description: 'Template para análise de mercado com foco em localização e demografia',
            icon: 'fas fa-chart-line',
            color: 'primary'
        },
        {
            name: 'Linha do Tempo Histórica',
            description: 'Template para criar narrativas históricas com contexto geográfico',
            icon: 'fas fa-history',
            color: 'success'
        },
        {
            name: 'Planejamento de Rota',
            description: 'Template para planejamento de rotas e análise de acessibilidade',
            icon: 'fas fa-route',
            color: 'warning'
        },
        {
            name: 'Análise de Localização',
            description: 'Template para análise de localização e fatores de localização',
            icon: 'fas fa-map-marker-alt',
            color: 'info'
        }
    ];

    const templatesHTML = templates.map(template => `
        <div class="col-md-6 col-lg-3">
            <div class="card template-card h-100">
                <div class="card-body text-center">
                    <div class="template-icon mb-3">
                        <i class="${template.icon} fa-3x text-${template.color}"></i>
                    </div>
                    <h6 class="card-title">${template.name}</h6>
                    <p class="card-text small text-muted">${template.description}</p>
                    <button class="btn btn-outline-${template.color} btn-sm" onclick="useTemplate('${template.name.toLowerCase().replace(/\s+/g, '-')}')">
                        Usar Template
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = templatesHTML;
}

function useTemplate(templateName) {
    // Fechar modal de templates
    bootstrap.Modal.getInstance(document.getElementById('templatesModal')).hide();
    
    // Abrir modal de criação com template selecionado
    document.getElementById('quick-template').value = templateName;
    createNewReport();
}
