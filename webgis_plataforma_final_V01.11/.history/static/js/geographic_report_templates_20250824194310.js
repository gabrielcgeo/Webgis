/**
 * Gerenciador de Templates para Relatórios Geográficos
 * Funcionalidades: filtros, preview, uso de templates
 */

class TemplateManager {
    constructor() {
        this.templates = {};
        this.currentFilters = {
            category: '',
            layout: '',
            complexity: ''
        };
        this.init();
    }

    init() {
        this.loadTemplates();
        this.setupEventListeners();
        this.setupAnimations();
    }

    loadTemplates() {
        // Carregar dados dos templates
        this.templates = {
            'market-analysis': {
                id: 'market-analysis',
                title: 'Análise de Mercado',
                description: 'Template ideal para análises de mercado com foco em narrativa e dados geográficos.',
                category: 'story-focused',
                layout: 'classic',
                complexity: 'medium',
                focus: 'story',
                elements: ['title', 'text', 'chart', 'map', 'data'],
                preview: 'https://via.placeholder.com/400x300/4A90E2/ffffff?text=Preview+Análise+de+Mercado',
                color: '#4A90E2'
            },
            'historical-timeline': {
                id: 'historical-timeline',
                title: 'Linha do Tempo Histórica',
                description: 'Narrativa cronológica com eventos históricos e localizações geográficas.',
                category: 'story-focused',
                layout: 'timeline',
                complexity: 'advanced',
                focus: 'story',
                elements: ['timeline', 'events', 'history', 'chronology'],
                preview: 'https://via.placeholder.com/400x300/8E44AD/ffffff?text=Preview+Linha+do+Tempo',
                color: '#8E44AD'
            },
            'tourism-interactive': {
                id: 'tourism-interactive',
                title: 'Turismo Interativo',
                description: 'Mapa imersivo com pontos turísticos, fotos e informações detalhadas.',
                category: 'map-focused',
                layout: 'immersive',
                complexity: 'medium',
                focus: 'map',
                elements: ['photos', 'videos', 'map', 'tourism'],
                preview: 'https://via.placeholder.com/400x300/27AE60/ffffff?text=Preview+Turismo+Interativo',
                color: '#27AE60'
            },
            'location-analysis': {
                id: 'location-analysis',
                title: 'Análise de Localização',
                description: 'Equilíbrio perfeito entre mapa e conteúdo para análises de localização.',
                category: 'balanced',
                layout: 'classic',
                complexity: 'simple',
                focus: 'balanced',
                elements: ['analysis', 'location', 'data', 'map'],
                preview: 'https://via.placeholder.com/400x300/F39C12/ffffff?text=Preview+Análise+de+Localização',
                color: '#F39C12'
            },
            'project-portfolio': {
                id: 'project-portfolio',
                title: 'Portfólio de Projetos',
                description: 'Apresentação visual de projetos em formato de grid com mapa interativo.',
                category: 'map-focused',
                layout: 'grid',
                complexity: 'medium',
                focus: 'map',
                elements: ['projects', 'grid', 'map', 'portfolio'],
                preview: 'https://via.placeholder.com/400x300/E74C3C/ffffff?text=Preview+Portfólio+de+Projetos',
                color: '#E74C3C'
            },
            'educational-guide': {
                id: 'educational-guide',
                title: 'Guia Educacional',
                description: 'Template educativo com foco na narrativa e aprendizado geográfico.',
                category: 'story-focused',
                layout: 'classic',
                complexity: 'simple',
                focus: 'story',
                elements: ['education', 'narrative', 'learning', 'guide'],
                preview: 'https://via.placeholder.com/400x300/3498DB/ffffff?text=Preview+Guia+Educacional',
                color: '#3498DB'
            },
            'data-analysis': {
                id: 'data-analysis',
                title: 'Análise de Dados',
                description: 'Template avançado para análise de dados com visualizações interativas.',
                category: 'balanced',
                layout: 'centered',
                complexity: 'advanced',
                focus: 'balanced',
                elements: ['data', 'charts', 'analysis', 'interactive'],
                preview: 'https://via.placeholder.com/400x300/9B59B6/ffffff?text=Preview+Análise+de+Dados',
                color: '#9B59B6'
            },
            'travel-route': {
                id: 'travel-route',
                title: 'Roteiro de Viagem',
                description: 'Roteiro interativo com mapa imersivo e pontos de interesse.',
                category: 'map-focused',
                layout: 'immersive',
                complexity: 'medium',
                focus: 'map',
                elements: ['route', 'travel', 'map', 'tourism'],
                preview: 'https://via.placeholder.com/400x300/1ABC9C/ffffff?text=Preview+Roteiro+de+Viagem',
                color: '#1ABC9C'
            },
            'corporate-report': {
                id: 'corporate-report',
                title: 'Relatório Corporativo',
                description: 'Template profissional para relatórios corporativos com dados geográficos.',
                category: 'story-focused',
                layout: 'classic',
                complexity: 'advanced',
                focus: 'story',
                elements: ['corporate', 'professional', 'report', 'data'],
                preview: 'https://via.placeholder.com/400x300/34495E/ffffff?text=Preview+Relatório+Corporativo',
                color: '#34495E'
            },
            'events-map': {
                id: 'events-map',
                title: 'Mapa de Eventos',
                description: 'Template equilibrado para mapeamento de eventos e atividades.',
                category: 'balanced',
                layout: 'grid',
                complexity: 'simple',
                focus: 'balanced',
                elements: ['events', 'map', 'activities', 'agenda'],
                preview: 'https://via.placeholder.com/400x300/E67E22/ffffff?text=Preview+Mapa+de+Eventos',
                color: '#E67E22'
            },
            'rima': {
                id: 'rima',
                title: 'RIMA - Relatório de Impacto Ambiental',
                description: 'Template profissional para relatórios de impacto ambiental com navegação hierárquica e mapas interativos.',
                category: 'story-focused',
                layout: 'classic',
                complexity: 'advanced',
                focus: 'story',
                elements: ['environmental', 'navigation', 'maps', 'professional'],
                preview: 'https://via.placeholder.com/400x300/2C3E50/ffffff?text=Preview+RIMA',
                color: '#2C3E50'
            }
        };

        this.updateTemplateCount();
    }

    setupEventListeners() {
        // Filtros
        const categoryFilter = document.getElementById('category-filter');
        const layoutFilter = document.getElementById('layout-filter');
        const complexityFilter = document.getElementById('complexity-filter');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.applyFilters();
            });
        }

        if (layoutFilter) {
            layoutFilter.addEventListener('change', (e) => {
                this.currentFilters.layout = e.target.value;
                this.applyFilters();
            });
        }

        if (complexityFilter) {
            complexityFilter.addEventListener('change', (e) => {
                this.currentFilters.complexity = e.target.value;
                this.applyFilters();
            });
        }

        // Botão de filtro
        const filterBtn = document.querySelector('button[onclick="applyTemplateFilters()"]');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.applyFilters());
        }

        // Busca em tempo real
        const searchInput = document.getElementById('search-reports');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.applyFilters();
            }, 300));
        }
    }

    setupAnimations() {
        // Animações de entrada dos templates
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.template-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            observer.observe(card);
        });
    }

    applyFilters() {
        const searchTerm = document.getElementById('search-reports')?.value.toLowerCase() || '';
        const templates = document.querySelectorAll('.template-card');
        let visibleCount = 0;

        templates.forEach(template => {
            const templateId = this.getTemplateIdFromElement(template);
            const templateData = this.templates[templateId];
            
            if (!templateData) return;

            let show = true;

            // Filtro de categoria
            if (this.currentFilters.category && templateData.category !== this.currentFilters.category) {
                show = false;
            }

            // Filtro de layout
            if (this.currentFilters.layout && templateData.layout !== this.currentFilters.layout) {
                show = false;
            }

            // Filtro de complexidade
            if (this.currentFilters.complexity && templateData.complexity !== this.currentFilters.complexity) {
                show = false;
            }

            // Filtro de busca
            if (searchTerm) {
                const searchableText = `${templateData.title} ${templateData.description} ${templateData.elements.join(' ')}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    show = false;
                }
            }

            // Aplicar visibilidade
            const container = template.closest('.col-lg-4');
            if (container) {
                if (show) {
                    container.style.display = 'block';
                    visibleCount++;
                    template.classList.remove('filtered-out');
                } else {
                    container.style.display = 'none';
                    template.classList.add('filtered-out');
                }
            }
        });

        this.updateFilterResults(visibleCount);
        this.animateVisibleTemplates();
    }

    getTemplateIdFromElement(element) {
        // Tentar encontrar o ID do template de várias formas
        const previewBtn = element.querySelector('button[onclick*="previewTemplate"]');
        if (previewBtn) {
            const onclick = previewBtn.getAttribute('onclick');
            const match = onclick.match(/previewTemplate\('([^']+)'\)/);
            if (match) return match[1];
        }

        // Fallback: procurar por data attributes
        const container = element.closest('[data-category]');
        if (container) {
            const category = container.dataset.category;
            const layout = container.dataset.layout;
            const complexity = container.dataset.complexity;
            
            // Encontrar template que corresponda aos atributos
            for (const [id, template] of Object.entries(this.templates)) {
                if (template.category === category && template.layout === layout && template.complexity === complexity) {
                    return id;
                }
            }
        }

        return null;
    }

    updateFilterResults(visibleCount) {
        const totalCount = Object.keys(this.templates).length;
        const resultsInfo = document.getElementById('filter-results');
        
        if (!resultsInfo) {
            // Criar elemento de resultados se não existir
            const filterCard = document.querySelector('.card');
            if (filterCard) {
                const resultsDiv = document.createElement('div');
                resultsDiv.id = 'filter-results';
                resultsDiv.className = 'mt-3 p-2 bg-light rounded';
                resultsDiv.innerHTML = `
                    <small class="text-muted">
                        <i class="fas fa-filter me-1"></i>
                        Mostrando ${visibleCount} de ${totalCount} templates
                    </small>
                `;
                filterCard.appendChild(resultsDiv);
            }
        } else {
            resultsInfo.innerHTML = `
                <small class="text-muted">
                    <i class="fas fa-filter me-1"></i>
                    Mostrando ${visibleCount} de ${totalCount} templates
                </small>
            `;
        }
    }

    animateVisibleTemplates() {
        const visibleTemplates = document.querySelectorAll('.template-card:not(.filtered-out)');
        visibleTemplates.forEach((template, index) => {
            template.style.animationDelay = `${index * 0.1}s`;
            template.classList.add('animate-in');
        });
    }

    updateTemplateCount() {
        const totalCount = Object.keys(this.templates).length;
        const countElement = document.getElementById('template-count');
        if (countElement) {
            countElement.textContent = totalCount;
        }
    }

    previewTemplate(templateId) {
        const templateData = this.templates[templateId];
        if (!templateData) {
            console.error('Template não encontrado:', templateId);
            return;
        }

        // Atualizar modal de preview
        const modal = document.getElementById('templatePreviewModal');
        const title = document.getElementById('preview-title');
        const content = document.getElementById('template-preview-content');
        const useBtn = document.getElementById('use-template-btn');

        if (title) title.textContent = `Preview: ${templateData.title}`;
        if (content) content.innerHTML = this.generateTemplatePreview(templateData);
        if (useBtn) {
            useBtn.onclick = () => this.useTemplate(templateId);
        }

        // Mostrar modal
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    }

    generateTemplatePreview(templateData) {
        const focusLabels = {
            'story': 'História como Foco',
            'map': 'Mapa como Foco',
            'balanced': 'Equilibrado'
        };

        const complexityLabels = {
            'simple': 'Simples',
            'medium': 'Médio',
            'advanced': 'Avançado'
        };

        return `
            <div class="template-preview-container">
                <div class="row">
                    <div class="col-md-6">
                        <h4>${templateData.title}</h4>
                        <p class="text-muted">${templateData.description}</p>
                        
                        <div class="template-details">
                            <div class="row">
                                <div class="col-6">
                                    <strong>Layout:</strong> ${templateData.layout}
                                </div>
                                <div class="col-6">
                                    <strong>Foco:</strong> ${focusLabels[templateData.focus]}
                                </div>
                            </div>
                            <div class="row mt-2">
                                <div class="col-6">
                                    <strong>Categoria:</strong> ${templateData.category}
                                </div>
                                <div class="col-6">
                                    <strong>Complexidade:</strong> ${complexityLabels[templateData.complexity]}
                                </div>
                            </div>
                        </div>
                        
                        <div class="template-elements mt-3">
                            <h6>Elementos Incluídos:</h6>
                            <div class="d-flex flex-wrap gap-2">
                                ${templateData.elements.map(element => 
                                    `<span class="badge bg-primary">${element}</span>`
                                ).join('')}
                            </div>
                        </div>

                        <div class="template-actions mt-4">
                            <button class="btn btn-primary me-2" onclick="templateManager.useTemplate('${templateData.id}')">
                                <i class="fas fa-rocket me-2"></i>Usar Este Template
                            </button>
                            <button class="btn btn-outline-secondary" onclick="templateManager.showTemplateDetails('${templateData.id}')">
                                <i class="fas fa-info-circle me-2"></i>Mais Detalhes
                            </button>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="template-preview-visual">
                            <img src="${templateData.preview}" 
                                 class="img-fluid rounded" 
                                 alt="Preview ${templateData.title}"
                                 style="border: 3px solid ${templateData.color}">
                        </div>
                        
                        <div class="template-stats mt-3">
                            <div class="row text-center">
                                <div class="col-4">
                                    <div class="stat-item">
                                        <div class="stat-number">${templateData.elements.length}</div>
                                        <div class="stat-label">Elementos</div>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="stat-item">
                                        <div class="stat-number">${templateData.complexity === 'advanced' ? '3' : templateData.complexity === 'medium' ? '2' : '1'}</div>
                                        <div class="stat-label">Nível</div>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="stat-item">
                                        <div class="stat-number">${templateData.focus === 'balanced' ? '50/50' : templateData.focus === 'story' ? '70/30' : '30/70'}</div>
                                        <div class="stat-label">Mapa/História</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    useTemplate(templateId) {
        const templateData = this.templates[templateId];
        if (!templateData) {
            console.error('Template não encontrado:', templateId);
            return;
        }

        // Fechar modal
        const modal = document.getElementById('templatePreviewModal');
        if (modal) {
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) bootstrapModal.hide();
        }

        // Redirecionar para criação com template
        const createUrl = `/geographic-report/create?template=${templateId}`;
        
        // Mostrar loading
        this.showLoading('Preparando template...');
        
        setTimeout(() => {
            window.location.href = createUrl;
        }, 1000);
    }

    showTemplateDetails(templateId) {
        const templateData = this.templates[templateId];
        if (!templateData) return;

        // Implementar modal de detalhes avançados
        console.log('Detalhes do template:', templateData);
        
        // Aqui você pode implementar um modal mais detalhado
        // com informações sobre como usar o template, exemplos, etc.
    }

    showLoading(message) {
        // Criar overlay de loading
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="text-white mb-0">${message}</p>
            </div>
        `;

        document.body.appendChild(loadingOverlay);

        // Remover após 3 segundos
        setTimeout(() => {
            if (loadingOverlay.parentNode) {
                loadingOverlay.parentNode.removeChild(loadingOverlay);
            }
        }, 3000);
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

    // Métodos utilitários
    getTemplateById(id) {
        return this.templates[id];
    }

    getAllTemplates() {
        return Object.values(this.templates);
    }

    getTemplatesByCategory(category) {
        return Object.values(this.templates).filter(t => t.category === category);
    }

    getTemplatesByLayout(layout) {
        return Object.values(this.templates).filter(t => t.layout === layout);
    }

    getTemplatesByComplexity(complexity) {
        return Object.values(this.templates).filter(t => t.complexity === complexity);
    }
}

// Inicialização global
let templateManager;

document.addEventListener('DOMContentLoaded', function() {
    templateManager = new TemplateManager();
    
    // Expor métodos globalmente para compatibilidade
    window.previewTemplate = (templateId) => templateManager.previewTemplate(templateId);
    window.useTemplate = (templateId) => templateManager.useTemplate(templateId);
    window.applyTemplateFilters = () => templateManager.applyFilters();
});

// Estilos CSS adicionais para funcionalidades específicas
const additionalStyles = `
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }

    .loading-content {
        text-align: center;
        color: white;
    }

    .template-stats .stat-item {
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
    }

    .template-stats .stat-number {
        font-size: 1.5rem;
        font-weight: 700;
        color: #007bff;
    }

    .template-stats .stat-label {
        font-size: 0.8rem;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .template-actions {
        margin-top: 2rem;
    }

    .filtered-out {
        opacity: 0.3;
        transform: scale(0.95);
    }

    .animate-in {
        animation: slideInUp 0.5s ease forwards;
    }

    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
