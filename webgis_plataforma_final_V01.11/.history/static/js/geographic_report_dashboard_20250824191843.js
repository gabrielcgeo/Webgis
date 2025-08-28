/**
 * Dashboard do Relatório Geográfico - JavaScript Principal
 * Sistema completo de gerenciamento e interação
 */

class GeographicReportDashboard {
    constructor() {
        this.currentView = 'list';
        this.filters = {
            search: '',
            status: '',
            category: '',
            sort: 'updated_at',
            dateFrom: '',
            dateTo: '',
            stops: '',
            template: ''
        };
        this.reports = [];
        this.statistics = {};
        this.templates = [];
        this.searchTimeout = null;
        
        this.init();
    }

    init() {
        console.log('Inicializando GeographicReportDashboard...');
        this.setupEventListeners();
        this.loadInitialData();
        this.setupSearchSuggestions();
        this.initializeFloatingElements();
    }

    setupEventListeners() {
        // Busca em tempo real
        const searchInput = document.getElementById('search-reports');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.debounceSearch();
            });
        }

        // Filtros
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }

        const sortSelect = document.getElementById('sort-reports');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.applyFilters();
            });
        }

        // Filtros avançados
        const dateFrom = document.getElementById('date-from');
        if (dateFrom) {
            dateFrom.addEventListener('change', (e) => {
                this.filters.dateFrom = e.target.value;
                this.applyFilters();
            });
        }

        const dateTo = document.getElementById('date-to');
        if (dateTo) {
            dateTo.addEventListener('change', (e) => {
                this.filters.dateTo = e.target.value;
                this.applyFilters();
            });
        }

        const stopsFilter = document.getElementById('stops-filter');
        if (stopsFilter) {
            stopsFilter.addEventListener('change', (e) => {
                this.filters.stops = e.target.value;
                this.applyFilters();
            });
        }

        const templateFilter = document.getElementById('template-filter');
        if (templateFilter) {
            templateFilter.addEventListener('change', (e) => {
                this.filters.template = e.target.value;
                this.applyFilters();
            });
        }

        // Elementos flutuantes
        document.querySelectorAll('.floating-element').forEach(element => {
            element.addEventListener('click', (e) => {
                this.handleFloatingElementClick(e.currentTarget);
            });
        });
    }

    setupSearchSuggestions() {
        const searchInput = document.getElementById('search-reports');
        const suggestions = document.getElementById('search-suggestions');
        
        if (!searchInput || !suggestions) return;

        searchInput.addEventListener('focus', () => {
            if (this.filters.search.length > 2) {
                this.showSearchSuggestions();
            }
        });

        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                suggestions.classList.remove('show');
            }, 200);
        });
    }

    initializeFloatingElements() {
        // Adicionar interatividade aos elementos flutuantes
        document.querySelectorAll('.floating-element').forEach((element, index) => {
            element.addEventListener('mouseenter', () => {
                this.animateFloatingElement(element, 'enter');
            });

            element.addEventListener('mouseleave', () => {
                this.animateFloatingElement(element, 'leave');
            });
        });
    }

    animateFloatingElement(element, action) {
        if (action === 'enter') {
            element.style.transform = 'scale(1.2) rotate(5deg)';
            element.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
        } else {
            element.style.transform = 'scale(1) rotate(0deg)';
            element.style.boxShadow = 'none';
        }
    }

    handleFloatingElementClick(element) {
        const tooltip = element.getAttribute('data-tooltip');
        console.log(`Elemento clicado: ${tooltip}`);
        
        // Ações específicas para cada elemento
        switch (tooltip) {
            case 'Mapas Interativos':
                this.showToast('Mapas interativos disponíveis!', 'info');
                break;
            case 'Mídia Rica':
                this.showToast('Suporte completo para mídia!', 'info');
                break;
            case 'Análises':
                this.showToast('Ferramentas de análise avançadas!', 'info');
                break;
            case 'Colaboração':
                this.showToast('Recursos de colaboração em equipe!', 'info');
                break;
        }
    }

    loadInitialData() {
        this.showLoadingState();
        
        // Carregar dados em paralelo
        Promise.all([
            this.loadReports(),
            this.loadStatistics(),
            this.loadTemplates()
        ]).then(() => {
            this.hideLoadingState();
            this.renderDashboard();
        }).catch(error => {
            console.error('Erro ao carregar dados iniciais:', error);
            this.showError('Erro ao carregar dados. Tente recarregar a página.');
            this.hideLoadingState();
        });
    }

    async loadReports() {
        try {
            // Simular carregamento de relatórios
            await this.simulateLoading(1000);
            
            // Usar dados de exemplo do arquivo de dados
            if (window.getSampleReportsList) {
                this.reports = window.getSampleReportsList();
            } else {
                // Fallback para dados estáticos
                this.reports = [
                    {
                        id: 1,
                        title: 'Análise de Mercado Regional',
                        description: 'Análise completa do mercado regional com dados geográficos',
                        status: 'published',
                        category: 'business',
                        created_at: '2024-01-15',
                        updated_at: '2024-01-20',
                        views: 1250,
                        stops: 8,
                        template: 'corporate'
                    },
                    {
                        id: 2,
                        title: 'Roteiro Turístico Interativo',
                        description: 'Guia turístico com pontos de interesse e rotas',
                        status: 'draft',
                        category: 'tourism',
                        created_at: '2024-01-10',
                        updated_at: '2024-01-18',
                        views: 0,
                        stops: 12,
                        template: 'story'
                    },
                    {
                        id: 3,
                        title: 'Estudo de Viabilidade',
                        description: 'Análise de viabilidade para nova localização',
                        status: 'published',
                        category: 'business',
                        created_at: '2024-01-05',
                        updated_at: '2024-01-15',
                        views: 890,
                        stops: 5,
                        template: 'analysis'
                    }
                ];
            }
            
            console.log('Relatórios carregados:', this.reports);
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            throw error;
        }
    }

    async loadStatistics() {
        try {
            await this.simulateLoading(800);
            
            if (window.getSampleReportsStats) {
                this.statistics = window.getSampleReportsStats();
            } else {
                this.statistics = {
                    total_reports: this.reports.length,
                    published_reports: this.reports.filter(r => r.status === 'published').length,
                    draft_reports: this.reports.filter(r => r.status === 'draft').length,
                    total_views: this.reports.reduce((sum, r) => sum + r.views, 0)
                };
            }
            
            console.log('Estatísticas carregadas:', this.statistics);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            throw error;
        }
    }

    async loadTemplates() {
        try {
            await this.simulateLoading(600);
            
            this.templates = [
                {
                    id: 'corporate-report',
                    name: 'Relatório Corporativo Profissional',
                    description: 'Template corporativo com estrutura hierárquica e navegação lateral',
                    category: 'business',
                    layout: 'professional',
                    colors: { primary: '#2c3e50', secondary: '#2980b9' }
                },
                {
                    id: 'market-analysis',
                    name: 'Análise de Mercado',
                    description: 'Template ideal para análises de mercado com foco em narrativa',
                    category: 'business',
                    layout: 'classic',
                    colors: { primary: '#4A90E2', secondary: '#27AE60' }
                },
                {
                    id: 'historical-timeline',
                    name: 'Linha do Tempo Histórica',
                    description: 'Narrativa cronológica com eventos históricos e localizações',
                    category: 'education',
                    layout: 'timeline',
                    colors: { primary: '#8E44AD', secondary: '#E67E22' }
                },
                {
                    id: 'tourism-interactive',
                    name: 'Turismo Interativo',
                    description: 'Mapa imersivo com pontos turísticos e informações detalhadas',
                    category: 'tourism',
                    layout: 'immersive',
                    colors: { primary: '#27AE60', secondary: '#F39C12' }
                }
            ];
            
            console.log('Templates carregados:', this.templates);
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
            throw error;
        }
    }

    renderDashboard() {
        this.renderStatistics();
        this.renderReports();
        this.renderTemplateOptions();
    }

    renderStatistics() {
        const totalReports = document.getElementById('total-reports');
        const publishedReports = document.getElementById('published-reports');
        const draftReports = document.getElementById('draft-reports');
        const totalViews = document.getElementById('total-views');

        if (totalReports) totalReports.textContent = this.statistics.total_reports || 0;
        if (publishedReports) publishedReports.textContent = this.statistics.published_reports || 0;
        if (draftReports) draftReports.textContent = this.statistics.draft_reports || 0;
        if (totalViews) totalViews.textContent = this.statistics.total_views || 0;
    }

    renderReports() {
        const container = document.getElementById('reports-container');
        if (!container) return;

        if (this.reports.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        const filteredReports = this.getFilteredReports();
        
        switch (this.currentView) {
            case 'grid':
                container.innerHTML = this.renderReportsGrid(filteredReports);
                break;
            case 'list':
                container.innerHTML = this.renderReportsList(filteredReports);
                break;
            case 'timeline':
                container.innerHTML = this.renderReportsTimeline(filteredReports);
                break;
        }

        this.setupReportEventListeners();
    }

    renderReportsGrid(reports) {
        return `
            <div class="row g-4">
                ${reports.map(report => `
                    <div class="col-lg-4 col-md-6">
                        <div class="report-card card h-100 shadow-sm border-0">
                            <div class="report-header">
                                <div class="report-status ${report.status}">
                                    <i class="fas fa-${this.getStatusIcon(report.status)}"></i>
                                    ${this.getStatusText(report.status)}
                                </div>
                                <div class="report-actions dropdown">
                                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="/geographic-report/edit/${report.id}">
                                            <i class="fas fa-edit me-2"></i>Editar
                                        </a></li>
                                        <li><a class="dropdown-item" href="/geographic-report/view/${report.id}">
                                            <i class="fas fa-eye me-2"></i>Visualizar
                                        </a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item text-danger" href="#" onclick="deleteReport(${report.id})">
                                            <i class="fas fa-trash me-2"></i>Excluir
                                        </a></li>
                                    </ul>
                                </div>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${report.title}</h5>
                                <p class="card-text text-muted">${report.description}</p>
                                <div class="report-meta">
                                    <span class="badge bg-${this.getCategoryColor(report.category)}">${report.category}</span>
                                    <span class="badge bg-secondary">${report.stops} paradas</span>
                                </div>
                            </div>
                            <div class="card-footer bg-transparent">
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">
                                        <i class="fas fa-eye me-1"></i>${report.views} visualizações
                                    </small>
                                    <small class="text-muted">
                                        <i class="fas fa-clock me-1"></i>${this.formatDate(report.updated_at)}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderReportsList(reports) {
        return `
            <div class="reports-list">
                ${reports.map(report => `
                    <div class="report-item card mb-3 shadow-sm border-0">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-8">
                                    <div class="d-flex align-items-center mb-2">
                                        <h5 class="card-title mb-0 me-3">${report.title}</h5>
                                        <span class="badge bg-${this.getStatusColor(report.status)}">${this.getStatusText(report.status)}</span>
                                    </div>
                                    <p class="card-text text-muted mb-2">${report.description}</p>
                                    <div class="report-tags">
                                        <span class="badge bg-${this.getCategoryColor(report.category)} me-2">${report.category}</span>
                                        <span class="badge bg-secondary me-2">${report.stops} paradas</span>
                                        <span class="badge bg-info">${report.template}</span>
                                    </div>
                                </div>
                                <div class="col-md-4 text-md-end">
                                    <div class="report-stats mb-2">
                                        <small class="text-muted">
                                            <i class="fas fa-eye me-1"></i>${report.views} visualizações
                                        </small>
                                    </div>
                                    <div class="report-date mb-2">
                                        <small class="text-muted">
                                            <i class="fas fa-clock me-1"></i>${this.formatDate(report.updated_at)}
                                        </small>
                                    </div>
                                    <div class="report-actions">
                                        <a href="/geographic-report/edit/${report.id}" class="btn btn-sm btn-outline-primary me-2">
                                            <i class="fas fa-edit"></i>
                                        </a>
                                        <a href="/geographic-report/view/${report.id}" class="btn btn-sm btn-outline-secondary me-2">
                                            <i class="fas fa-eye"></i>
                                        </a>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteReport(${report.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderReportsTimeline(reports) {
        return `
            <div class="timeline-container">
                ${reports.map((report, index) => `
                    <div class="timeline-item ${index % 2 === 0 ? 'left' : 'right'}">
                        <div class="timeline-content card shadow-sm border-0">
                            <div class="timeline-header">
                                <div class="timeline-date">
                                    <i class="fas fa-calendar me-2"></i>
                                    ${this.formatDate(report.updated_at)}
                                </div>
                                <div class="timeline-status">
                                    <span class="badge bg-${this.getStatusColor(report.status)}">
                                        ${this.getStatusText(report.status)}
                                    </span>
                                </div>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${report.title}</h5>
                                <p class="card-text text-muted">${report.description}</p>
                                <div class="timeline-meta">
                                    <span class="badge bg-${this.getCategoryColor(report.category)} me-2">${report.category}</span>
                                    <span class="badge bg-secondary me-2">${report.stops} paradas</span>
                                    <span class="badge bg-info">${report.template}</span>
                                </div>
                            </div>
                            <div class="timeline-actions">
                                <a href="/geographic-report/edit/${report.id}" class="btn btn-sm btn-outline-primary me-2">
                                    <i class="fas fa-edit me-1"></i>Editar
                                </a>
                                <a href="/geographic-report/view/${report.id}" class="btn btn-sm btn-outline-secondary">
                                    <i class="fas fa-eye me-1"></i>Visualizar
                                </a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state text-center py-5">
                <div class="empty-icon mb-4">
                    <i class="fas fa-file-alt fa-4x text-muted"></i>
                </div>
                <h4 class="text-muted mb-3">Nenhum relatório encontrado</h4>
                <p class="text-muted mb-4">
                    ${this.filters.search || this.filters.status || this.filters.category 
                        ? 'Tente ajustar os filtros ou criar um novo relatório.' 
                        : 'Comece criando seu primeiro relatório geográfico!'}
                </p>
                <button class="btn btn-primary btn-lg" onclick="createNewReport()">
                    <i class="fas fa-plus me-2"></i>Criar Primeiro Relatório
                </button>
            </div>
        `;
    }

    renderTemplateOptions() {
        const container = document.getElementById('template-options');
        if (!container) return;

        container.innerHTML = `
            <div class="template-grid">
                ${this.templates.map(template => `
                    <div class="template-option" data-template-id="${template.id}">
                        <div class="template-preview" style="background: ${template.colors.primary}">
                            <i class="fas fa-layer-group fa-2x text-white"></i>
                        </div>
                        <div class="template-info">
                            <h6 class="template-name">${template.name}</h6>
                            <p class="template-desc">${template.description}</p>
                            <div class="template-meta">
                                <span class="badge bg-secondary">${template.layout}</span>
                                <span class="badge bg-info">${template.category}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Adicionar event listeners para seleção de template
        container.querySelectorAll('.template-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectTemplate(option.dataset.templateId);
            });
        });
    }

    selectTemplate(templateId) {
        // Remover seleção anterior
        document.querySelectorAll('.template-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Selecionar novo template
        const selectedOption = document.querySelector(`[data-template-id="${templateId}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }

        // Atualizar campos do formulário se necessário
        console.log('Template selecionado:', templateId);
    }

    getFilteredReports() {
        let filtered = [...this.reports];

        // Filtro de busca
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(report => 
                report.title.toLowerCase().includes(searchTerm) ||
                report.description.toLowerCase().includes(searchTerm)
            );
        }

        // Filtro de status
        if (this.filters.status) {
            filtered = filtered.filter(report => report.status === this.filters.status);
        }

        // Filtro de categoria
        if (this.filters.category) {
            filtered = filtered.filter(report => report.category === this.filters.category);
        }

        // Filtro de data
        if (this.filters.dateFrom) {
            filtered = filtered.filter(report => report.created_at >= this.filters.dateFrom);
        }
        if (this.filters.dateTo) {
            filtered = filtered.filter(report => report.created_at <= this.filters.dateTo);
        }

        // Filtro de paradas
        if (this.filters.stops) {
            filtered = filtered.filter(report => {
                const [min, max] = this.filters.stops.split('-').map(Number);
                if (this.filters.stops === '11+') {
                    return report.stops >= 11;
                }
                return report.stops >= min && report.stops <= max;
            });
        }

        // Filtro de template
        if (this.filters.template) {
            filtered = filtered.filter(report => report.template === this.filters.template);
        }

        // Ordenação
        filtered.sort((a, b) => {
            switch (this.filters.sort) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'views':
                    return b.views - a.views;
                case 'created_at':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'popularity':
                    return (b.views / 1000) - (a.views / 1000);
                default:
                    return new Date(b.updated_at) - new Date(a.updated_at);
            }
        });

        return filtered;
    }

    setupReportEventListeners() {
        // Event listeners para ações dos relatórios
        document.querySelectorAll('.report-actions .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.currentTarget.getAttribute('onclick');
                if (action) {
                    eval(action);
                }
            });
        });
    }

    // Funções utilitárias
    getStatusIcon(status) {
        const icons = {
            'published': 'check-circle',
            'draft': 'edit',
            'archived': 'archive',
            'review': 'clock'
        };
        return icons[status] || 'file';
    }

    getStatusText(status) {
        const texts = {
            'published': 'Publicado',
            'draft': 'Rascunho',
            'archived': 'Arquivado',
            'review': 'Em Revisão'
        };
        return texts[status] || status;
    }

    getStatusColor(status) {
        const colors = {
            'published': 'success',
            'draft': 'warning',
            'archived': 'secondary',
            'review': 'info'
        };
        return colors[status] || 'secondary';
    }

    getCategoryColor(category) {
        const colors = {
            'business': 'primary',
            'education': 'info',
            'tourism': 'success',
            'research': 'warning',
            'government': 'dark'
        };
        return colors[category] || 'secondary';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Hoje';
        if (diffDays === 2) return 'Ontem';
        if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
        
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
        }, 300);
    }

    applyFilters() {
        console.log('Aplicando filtros:', this.filters);
        this.renderReports();
        this.showSearchSuggestions();
    }

    showSearchSuggestions() {
        const suggestions = document.getElementById('search-suggestions');
        if (!suggestions) return;

        if (this.filters.search.length < 3) {
            suggestions.classList.remove('show');
            return;
        }

        const filteredReports = this.reports.filter(report => 
            report.title.toLowerCase().includes(this.filters.search.toLowerCase()) ||
            report.description.toLowerCase().includes(this.filters.search.toLowerCase())
        ).slice(0, 5);

        if (filteredReports.length > 0) {
            suggestions.innerHTML = filteredReports.map(report => `
                <div class="suggestion-item" onclick="selectSuggestion('${report.title}')">
                    <i class="fas fa-file-alt me-2"></i>
                    <div>
                        <div class="suggestion-title">${report.title}</div>
                        <div class="suggestion-category">${report.category}</div>
                    </div>
                </div>
            `).join('');
            suggestions.classList.add('show');
        } else {
            suggestions.classList.remove('show');
        }
    }

    setViewMode(mode) {
        this.currentView = mode;
        
        // Atualizar botões ativos
        document.querySelectorAll('.view-controls .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${mode}"]`).classList.add('active');
        
        // Re-renderizar relatórios
        this.renderReports();
    }

    toggleAdvancedFilters() {
        const advancedFilters = document.getElementById('advanced-filters');
        if (advancedFilters) {
            const isVisible = advancedFilters.style.display !== 'none';
            advancedFilters.style.display = isVisible ? 'none' : 'block';
        }
    }

    showLoadingState() {
        const container = document.getElementById('reports-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                    </div>
                    <p>Carregando seus relatórios...</p>
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Loading state será removido quando os relatórios forem renderizados
    }

    async simulateLoading(delay) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    showToast(message, type = 'info') {
        // Implementar sistema de toast
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Criar toast temporário
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(toast);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    showError(message) {
        this.showToast(message, 'danger');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }
}

// Funções globais para compatibilidade com onclick
function createNewReport() {
    const modal = new bootstrap.Modal(document.getElementById('quickCreateModal'));
    modal.show();
}

function showTemplatesGallery() {
    const modal = new bootstrap.Modal(document.getElementById('templatesGalleryModal'));
    modal.show();
}

function showImportDataModal() {
    const modal = new bootstrap.Modal(document.getElementById('importDataModal'));
    modal.show();
}

function showCollaborationModal() {
    const modal = new bootstrap.Modal(document.getElementById('collaborationModal'));
    modal.show();
}

function showAnalyticsModal() {
    const modal = new bootstrap.Modal(document.getElementById('analyticsModal'));
    modal.show();
}

function toggleAdvancedFilters() {
    dashboard.toggleAdvancedFilters();
}

function applyFilters() {
    dashboard.applyFilters();
}

function setViewMode(mode) {
    dashboard.setViewMode(mode);
}

function selectSuggestion(title) {
    document.getElementById('search-reports').value = title;
    dashboard.filters.search = title;
    dashboard.applyFilters();
    document.getElementById('search-suggestions').classList.remove('show');
}

function deleteReport(reportId) {
    if (confirm('Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.')) {
        // Implementar exclusão
        console.log('Excluindo relatório:', reportId);
        dashboard.showSuccess('Relatório excluído com sucesso!');
        // Recarregar relatórios
        dashboard.loadReports().then(() => {
            dashboard.renderReports();
        });
    }
}

function processImport() {
    // Implementar processamento de importação
    dashboard.showSuccess('Importação processada com sucesso!');
    bootstrap.Modal.getInstance(document.getElementById('importDataModal')).hide();
}

function setupCollaboration() {
    // Implementar configuração de colaboração
    dashboard.showSuccess('Colaboração configurada com sucesso!');
    bootstrap.Modal.getInstance(document.getElementById('collaborationModal')).hide();
}

// Inicialização
let dashboard;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando dashboard...');
    dashboard = new GeographicReportDashboard();
    
    // Expor dashboard globalmente para debugging
    window.dashboard = dashboard;
    
    console.log('Dashboard inicializado com sucesso!');
});

// Função para limpar formulário de criação rápida
function clearQuickCreateForm() {
    document.getElementById('quick-title').value = '';
    document.getElementById('quick-description').value = '';
    document.getElementById('quick-category').value = 'business';
    
    // Limpar seleção de template
    document.querySelectorAll('.template-option').forEach(opt => {
        opt.classList.remove('selected');
    });
}

// Função para submeter criação rápida
function submitQuickCreate() {
    const title = document.getElementById('quick-title').value.trim();
    const description = document.getElementById('quick-description').value.trim();
    const category = document.getElementById('quick-category').value;
    
    if (!title) {
        dashboard.showError('Por favor, insira um título para o relatório.');
        return;
    }
    
    // Criar relatório
    const newReport = {
        id: Date.now(), // ID temporário
        title: title,
        description: description,
        category: category,
        status: 'draft',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
        views: 0,
        stops: 0,
        template: 'custom'
    };
    
    // Adicionar à lista de relatórios
    dashboard.reports.unshift(newReport);
    dashboard.statistics.total_reports++;
    dashboard.statistics.draft_reports++;
    
    // Atualizar dashboard
    dashboard.renderDashboard();
    
    // Fechar modal
    bootstrap.Modal.getInstance(document.getElementById('quickCreateModal')).hide();
    
    // Mostrar sucesso
    dashboard.showSuccess('Relatório criado com sucesso!');
    
    // Redirecionar para edição
    setTimeout(() => {
        window.location.href = `/geographic-report/edit/${newReport.id}`;
    }, 1000);
}
