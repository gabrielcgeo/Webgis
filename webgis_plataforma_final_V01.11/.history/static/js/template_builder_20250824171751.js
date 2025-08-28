/**
 * Construtor de Templates - Estilo Wix.com
 * Sistema completo de construção visual de templates com drag & drop
 */

class TemplateBuilder {
    constructor() {
        this.elements = [];
        this.selectedElement = null;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        this.elementCounter = 0;
        this.currentView = 'desktop';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupViewControls();
        this.loadTemplateBuilder();
        console.log('TemplateBuilder inicializado com sucesso');
    }

    setupEventListeners() {
        // Controles de painéis
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="toggleLeftPanel"]')) {
                this.toggleLeftPanel();
            } else if (e.target.matches('[onclick*="toggleRightPanel"]')) {
                this.toggleRightPanel();
            }
        });

        // Controles de histórico
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="undoAction"]')) {
                this.undoAction();
            } else if (e.target.matches('[onclick*="redoAction"]')) {
                this.redoAction();
            }
        });

        // Controles principais
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="previewTemplate"]')) {
                this.showPreview();
            } else if (e.target.matches('[onclick*="saveTemplate"]')) {
                this.showSaveModal();
            } else if (e.target.matches('[onclick*="publishTemplate"]')) {
                this.showPublishModal();
            }
        });

        // Seleção de elementos
        document.addEventListener('click', (e) => {
            if (e.target.closest('.canvas-element')) {
                this.selectElement(e.target.closest('.canvas-element'));
            } else if (!e.target.closest('.element-controls')) {
                this.deselectElement();
            }
        });

        // Controles de elementos
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-edit')) {
                this.editElement(e.target.closest('.canvas-element'));
            } else if (e.target.matches('.btn-delete')) {
                this.deleteElement(e.target.closest('.canvas-element'));
            } else if (e.target.matches('.btn-duplicate')) {
                this.duplicateElement(e.target.closest('.canvas-element'));
            }
        });

        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redoAction();
                        } else {
                            this.undoAction();
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        this.showSaveModal();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.showPreview();
                        break;
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedElement) {
                    e.preventDefault();
                    this.deleteElement(this.selectedElement);
                }
            }
        });
    }

    setupDragAndDrop() {
        const elementItems = document.querySelectorAll('.element-item');
        const dropZone = document.getElementById('drop-zone');

        elementItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.element);
                e.dataTransfer.effectAllowed = 'copy';
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
            });
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const elementType = e.dataTransfer.getData('text/plain');
            const rect = dropZone.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.addElement(elementType, x, y);
        });
    }

    setupViewControls() {
        const viewButtons = document.querySelectorAll('.view-controls .btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                viewButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.setView(e.target.dataset.view);
            });
        });
    }

    setView(view) {
        this.currentView = view;
        const canvas = document.getElementById('main-canvas');
        
        // Aplicar estilos de viewport
        switch(view) {
            case 'desktop':
                canvas.style.maxWidth = '100%';
                canvas.style.margin = '0 auto';
                break;
            case 'tablet':
                canvas.style.maxWidth = '768px';
                canvas.style.margin = '0 auto';
                canvas.style.border = '2px solid #007bff';
                break;
            case 'mobile':
                canvas.style.maxWidth = '375px';
                canvas.style.margin = '0 auto';
                canvas.style.border = '2px solid #28a745';
                break;
        }
    }

    addElement(type, x, y) {
        const element = this.createElement(type);
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        
        this.elements.push(element);
        this.addToHistory();
        
        const canvas = document.getElementById('main-canvas');
        canvas.appendChild(element);
        
        // Remover drop zone se for o primeiro elemento
        const dropZone = document.getElementById('drop-zone');
        if (dropZone && this.elements.length === 1) {
            dropZone.style.display = 'none';
        }
        
        this.selectElement(element);
        console.log(`Elemento ${type} adicionado em (${x}, ${y})`);
    }

    createElement(type) {
        this.elementCounter++;
        const element = document.createElement('div');
        element.className = `canvas-element ${type}-element`;
        element.dataset.elementId = `element-${this.elementCounter}`;
        element.dataset.elementType = type;
        
        // Conteúdo padrão baseado no tipo
        switch(type) {
            case 'text':
                element.innerHTML = `
                    <div class="element-content">
                        <p>Digite seu texto aqui...</p>
                    </div>
                    <div class="element-controls">
                        <button class="btn-edit" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-duplicate" title="Duplicar"><i class="fas fa-copy"></i></button>
                        <button class="btn-delete" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                element.contentEditable = true;
                break;
                
            case 'heading':
                element.innerHTML = `
                    <div class="element-content">
                        <h2>Título do Seu Relatório</h2>
                    </div>
                    <div class="element-controls">
                        <button class="btn-edit" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-duplicate" title="Duplicar"><i class="fas fa-copy"></i></button>
                        <button class="btn-delete" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                element.contentEditable = true;
                break;
                
            case 'image':
                element.innerHTML = `
                    <div class="element-content">
                        <img src="https://via.placeholder.com/300x200/007bff/ffffff?text=Imagem" alt="Imagem">
                    </div>
                    <div class="element-controls">
                        <button class="btn-edit" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-duplicate" title="Duplicar"><i class="fas fa-copy"></i></button>
                        <button class="btn-delete" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
                
            case 'button':
                element.innerHTML = `
                    <div class="element-content">
                        <button class="btn btn-primary">Clique Aqui</button>
                    </div>
                    <div class="element-controls">
                        <button class="btn-edit" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-duplicate" title="Duplicar"><i class="fas fa-copy"></i></button>
                        <button class="btn-delete" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
                
            case 'map':
                element.innerHTML = `
                    <div class="element-content">
                        <div class="map-placeholder">
                            <i class="fas fa-map fa-3x"></i>
                            <p>Mapa Interativo</p>
                            <small>Clique para configurar</small>
                        </div>
                    </div>
                    <div class="element-controls">
                        <button class="btn-edit" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-duplicate" title="Duplicar"><i class="fas fa-copy"></i></button>
                        <button class="btn-delete" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
                
            case 'container':
                element.innerHTML = `
                    <div class="element-content">
                        <div class="container-placeholder">
                            <i class="fas fa-square-full fa-2x"></i>
                            <p>Container</p>
                            <small>Arraste elementos aqui</small>
                        </div>
                    </div>
                    <div class="element-controls">
                        <button class="btn-edit" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-duplicate" title="Duplicar"><i class="fas fa-copy"></i></button>
                        <button class="btn-delete" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                break;
                
            default:
                element.innerHTML = `
                    <div class="element-content">
                        <p>Elemento ${type}</p>
                    </div>
                    <div class="element-controls">
                        <button class="btn-edit" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-duplicate" title="Duplicar"><i class="fas fa-copy"></i></button>
                        <button class="btn-delete" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                `;
        }
        
        return element;
    }

    selectElement(element) {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }
        
        this.selectedElement = element;
        element.classList.add('selected');
        this.showElementProperties(element);
    }

    deselectElement() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
            this.selectedElement = null;
            this.hideElementProperties();
        }
    }

    showElementProperties(element) {
        const propertiesPanel = document.getElementById('properties-panel');
        const elementType = element.dataset.elementType;
        
        propertiesPanel.innerHTML = this.generatePropertiesHTML(elementType, element);
        this.setupPropertyListeners(element);
    }

    hideElementProperties() {
        const propertiesPanel = document.getElementById('properties-panel');
        propertiesPanel.innerHTML = `
            <div class="no-selection">
                <i class="fas fa-mouse-pointer fa-2x text-muted mb-3"></i>
                <p class="text-muted">Selecione um elemento para editar suas propriedades</p>
            </div>
        `;
    }

    generatePropertiesHTML(type, element) {
        const baseProperties = `
            <div class="element-properties">
                <div class="property-group">
                    <h6><i class="fas fa-cog"></i> Propriedades Gerais</h6>
                    <div class="property-item">
                        <label>ID do Elemento</label>
                        <input type="text" value="${element.dataset.elementId}" readonly>
                    </div>
                    <div class="property-item">
                        <label>Tipo</label>
                        <input type="text" value="${type}" readonly>
                    </div>
                </div>
                
                <div class="property-group">
                    <h6><i class="fas fa-palette"></i> Estilo</h6>
                    <div class="property-item">
                        <label>Cor de Fundo</label>
                        <div class="color-picker">
                            <input type="color" value="#ffffff" onchange="templateBuilder.updateElementStyle('${element.dataset.elementId}', 'background-color', this.value)">
                            <input type="text" value="#ffffff" onchange="templateBuilder.updateElementStyle('${element.dataset.elementId}', 'background-color', this.value)">
                        </div>
                    </div>
                    <div class="property-item">
                        <label>Cor do Texto</label>
                        <div class="color-picker">
                            <input type="color" value="#000000" onchange="templateBuilder.updateElementStyle('${element.dataset.elementId}', 'color', this.value)">
                            <input type="text" value="#000000" onchange="templateBuilder.updateElementStyle('${element.dataset.elementId}', 'color', this.value)">
                        </div>
                    </div>
                    <div class="property-item">
                        <label>Padding</label>
                        <input type="number" value="15" min="0" max="100" onchange="templateBuilder.updateElementStyle('${element.dataset.elementId}', 'padding', this.value + 'px')">
                    </div>
                    <div class="property-item">
                        <label>Margem</label>
                        <input type="number" value="10" min="0" max="100" onchange="templateBuilder.updateElementStyle('${element.dataset.elementId}', 'margin', this.value + 'px')">
                    </div>
                </div>
                
                <div class="property-group">
                    <h6><i class="fas fa-arrows-alt"></i> Posição</h6>
                    <div class="property-item">
                        <label>Posição X</label>
                        <input type="number" value="${parseInt(element.style.left) || 0}" onchange="templateBuilder.updateElementPosition('${element.dataset.elementId}', 'left', this.value)">
                    </div>
                    <div class="property-item">
                        <label>Posição Y</label>
                        <input type="number" value="${parseInt(element.style.top) || 0}" onchange="templateBuilder.updateElementPosition('${element.dataset.elementId}', 'top', this.value)">
                    </div>
                    <div class="property-item">
                        <label>Largura</label>
                        <input type="number" value="${element.offsetWidth}" onchange="templateBuilder.updateElementSize('${element.dataset.elementId}', 'width', this.value)">
                    </div>
                    <div class="property-item">
                        <label>Altura</label>
                        <input type="number" value="${element.offsetHeight}" onchange="templateBuilder.updateElementSize('${element.dataset.elementId}', 'height', this.value)">
                    </div>
                </div>
        `;
        
        // Propriedades específicas por tipo
        let specificProperties = '';
        switch(type) {
            case 'text':
                specificProperties = `
                    <div class="property-group">
                        <h6><i class="fas fa-font"></i> Propriedades de Texto</h6>
                        <div class="property-item">
                            <label>Tamanho da Fonte</label>
                            <select onchange="templateBuilder.updateElementStyle('${element.dataset.elementId}', 'font-size', this.value)">
                                <option value="12px">12px</option>
                                <option value="14px">14px</option>
                                <option value="16px" selected>16px</option>
                                <option value="18px">18px</option>
                                <option value="20px">20px</option>
                                <option value="24px">24px</option>
                            </select>
                        </div>
                        <div class="property-item">
                            <label>Peso da Fonte</label>
                            <select onchange="templateBuilder.updateElementStyle('${element.dataset.elementId}', 'font-weight', this.value)">
                                <option value="normal">Normal</option>
                                <option value="bold">Negrito</option>
                                <option value="600">Semi-negrito</option>
                            </select>
                        </div>
                        <div class="property-item">
                            <label>Alinhamento</label>
                            <div class="layout-controls">
                                <button onclick="templateBuilder.updateElementStyle('${element.dataset.elementId}', 'text-align', 'left')">Esquerda</button>
                                <button onclick="templateBuilder.updateElementStyle('${element.dataset.elementId}', 'text-align', 'center')">Centro</button>
                                <button onclick="templateBuilder.updateElementStyle('${element.dataset.elementId}', 'text-align', 'right')">Direita</button>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            case 'heading':
                specificProperties = `
                    <div class="property-group">
                        <h6><i class="fas fa-heading"></i> Propriedades do Título</h6>
                        <div class="property-item">
                            <label>Nível do Título</label>
                            <select onchange="templateBuilder.updateHeadingLevel('${element.dataset.elementId}', this.value)">
                                <option value="h1">H1 - Principal</option>
                                <option value="h2" selected>H2 - Secundário</option>
                                <option value="h3">H3 - Terciário</option>
                                <option value="h4">H4 - Quaternário</option>
                            </select>
                        </div>
                    </div>
                `;
                break;
                
            case 'image':
                specificProperties = `
                    <div class="property-group">
                        <h6><i class="fas fa-image"></i> Propriedades da Imagem</h6>
                        <div class="property-item">
                            <label>URL da Imagem</label>
                            <input type="url" placeholder="https://exemplo.com/imagem.jpg" onchange="templateBuilder.updateImageSource('${element.dataset.elementId}', this.value)">
                        </div>
                        <div class="property-item">
                            <label>Alt Text</label>
                            <input type="text" placeholder="Descrição da imagem" onchange="templateBuilder.updateImageAlt('${element.dataset.elementId}', this.value)">
                        </div>
                        <div class="property-item">
                            <label>Borda</label>
                            <input type="number" value="0" min="0" max="20" onchange="templateBuilder.updateElementStyle('${element.dataset.elementId}', 'border-width', this.value + 'px')">
                        </div>
                    </div>
                `;
                break;
        }
        
        return baseProperties + specificProperties + '</div>';
    }

    setupPropertyListeners(element) {
        // Implementar listeners específicos se necessário
    }

    updateElementStyle(elementId, property, value) {
        const element = document.querySelector(`[data-element-id="${elementId}"]`);
        if (element) {
            element.style[property] = value;
            this.addToHistory();
        }
    }

    updateElementPosition(elementId, property, value) {
        const element = document.querySelector(`[data-element-id="${elementId}"]`);
        if (element) {
            element.style[property] = value + 'px';
            this.addToHistory();
        }
    }

    updateElementSize(elementId, property, value) {
        const element = document.querySelector(`[data-element-id="${elementId}"]`);
        if (element) {
            element.style[property] = value + 'px';
            this.addToHistory();
        }
    }

    updateHeadingLevel(elementId, level) {
        const element = document.querySelector(`[data-element-id="${elementId}"]`);
        if (element) {
            const content = element.querySelector('.element-content');
            const currentText = content.textContent || content.innerText;
            content.innerHTML = `<${level}>${currentText}</${level}>`;
            this.addToHistory();
        }
    }

    updateImageSource(elementId, url) {
        const element = document.querySelector(`[data-element-id="${elementId}"]`);
        if (element && url) {
            const img = element.querySelector('img');
            if (img) {
                img.src = url;
                this.addToHistory();
            }
        }
    }

    updateImageAlt(elementId, alt) {
        const element = document.querySelector(`[data-element-id="${elementId}"]`);
        if (element) {
            const img = element.querySelector('img');
            if (img) {
                img.alt = alt;
                this.addToHistory();
            }
        }
    }

    editElement(element) {
        // Implementar edição inline
        if (element.contentEditable) {
            element.focus();
        }
    }

    duplicateElement(element) {
        const clone = element.cloneNode(true);
        const newId = `element-${++this.elementCounter}`;
        clone.dataset.elementId = newId;
        
        // Ajustar posição
        const rect = element.getBoundingClientRect();
        clone.style.left = (rect.left + 20) + 'px';
        clone.style.top = (rect.top + 20) + 'px';
        
        this.elements.push(clone);
        element.parentNode.appendChild(clone);
        this.addToHistory();
        
        this.selectElement(clone);
    }

    deleteElement(element) {
        if (confirm('Tem certeza que deseja excluir este elemento?')) {
            const index = this.elements.indexOf(element);
            if (index > -1) {
                this.elements.splice(index, 1);
                element.remove();
                this.addToHistory();
                
                if (this.selectedElement === element) {
                    this.deselectElement();
                }
                
                // Mostrar drop zone se não houver elementos
                if (this.elements.length === 0) {
                    const dropZone = document.getElementById('drop-zone');
                    if (dropZone) {
                        dropZone.style.display = 'flex';
                    }
                }
            }
        }
    }

    addToHistory() {
        // Remover histórico futuro se estivermos no meio
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Adicionar estado atual
        const currentState = this.serializeCanvas();
        this.history.push(currentState);
        
        // Manter limite de histórico
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        this.historyIndex = this.history.length - 1;
        this.updateHistoryButtons();
    }

    undoAction() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreCanvas(this.history[this.historyIndex]);
            this.updateHistoryButtons();
        }
    }

    redoAction() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreCanvas(this.history[this.historyIndex]);
            this.updateHistoryButtons();
        }
    }

    updateHistoryButtons() {
        const undoBtn = document.querySelector('[onclick*="undoAction"]');
        const redoBtn = document.querySelector('[onclick*="redoAction"]');
        
        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
    }

    serializeCanvas() {
        return this.elements.map(element => ({
            id: element.dataset.elementId,
            type: element.dataset.elementType,
            content: element.innerHTML,
            style: element.getAttribute('style') || '',
            position: {
                left: element.style.left,
                top: element.style.top
            }
        }));
    }

    restoreCanvas(state) {
        // Limpar canvas atual
        const canvas = document.getElementById('main-canvas');
        const dropZone = document.getElementById('drop-zone');
        
        // Manter drop zone se não houver elementos
        if (state.length === 0) {
            if (dropZone) {
                dropZone.style.display = 'flex';
            }
        } else {
            if (dropZone) {
                dropZone.style.display = 'none';
            }
        }
        
        // Remover elementos existentes
        this.elements.forEach(element => element.remove());
        this.elements = [];
        
        // Restaurar elementos
        state.forEach(elementData => {
            const element = this.createElement(elementData.type);
            element.dataset.elementId = elementData.id;
            element.innerHTML = elementData.content;
            element.setAttribute('style', elementData.style);
            
            this.elements.push(element);
            canvas.appendChild(element);
        });
        
        this.elementCounter = Math.max(...this.elements.map(el => parseInt(el.dataset.elementId.split('-')[1])), 0);
    }

    showPreview() {
        const previewContent = document.getElementById('preview-content');
        const canvas = document.getElementById('main-canvas');
        
        // Clonar canvas para preview
        const clone = canvas.cloneNode(true);
        clone.id = 'preview-canvas';
        clone.style.position = 'relative';
        clone.style.left = 'auto';
        clone.style.top = 'auto';
        
        // Remover controles de edição
        clone.querySelectorAll('.element-controls').forEach(control => control.remove());
        clone.querySelectorAll('.canvas-element').forEach(element => {
            element.classList.remove('selected');
            element.style.cursor = 'default';
        });
        
        previewContent.innerHTML = '';
        previewContent.appendChild(clone);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('previewModal'));
        modal.show();
    }

    showSaveModal() {
        const modal = new bootstrap.Modal(document.getElementById('saveModal'));
        modal.show();
    }

    showPublishModal() {
        const modal = new bootstrap.Modal(document.getElementById('publishModal'));
        modal.show();
    }

    toggleLeftPanel() {
        const panel = document.getElementById('left-panel');
        panel.classList.toggle('collapsed');
        
        const mainEditor = document.querySelector('.main-editor');
        if (panel.classList.contains('collapsed')) {
            mainEditor.style.marginLeft = '0';
        } else {
            mainEditor.style.marginLeft = '300px';
        }
    }

    toggleRightPanel() {
        const panel = document.getElementById('right-panel');
        panel.classList.toggle('collapsed');
        
        const mainEditor = document.querySelector('.main-editor');
        if (panel.classList.contains('collapsed')) {
            mainEditor.style.marginRight = '0';
        } else {
            mainEditor.style.marginRight = '300px';
        }
    }

    loadTemplateBuilder() {
        // Carregar construtor por padrão
        document.getElementById('template-builder').style.display = 'flex';
        document.getElementById('templates-section').style.display = 'none';
    }

    // Funções públicas para modais
    confirmSave() {
        const name = document.getElementById('template-name').value;
        const description = document.getElementById('template-description').value;
        const category = document.getElementById('template-category').value;
        
        if (!name.trim()) {
            alert('Por favor, insira um nome para o template.');
            return;
        }
        
        const templateData = {
            name: name,
            description: description,
            category: category,
            elements: this.serializeCanvas(),
            created_at: new Date().toISOString()
        };
        
        // Salvar no localStorage por enquanto
        const savedTemplates = JSON.parse(localStorage.getItem('savedTemplates') || '[]');
        savedTemplates.push(templateData);
        localStorage.setItem('savedTemplates', JSON.stringify(savedTemplates));
        
        // Fechar modal
        bootstrap.Modal.getInstance(document.getElementById('saveModal')).hide();
        
        // Mostrar confirmação
        alert('Template salvo com sucesso!');
    }

    confirmPublish() {
        const name = document.getElementById('publish-template-name').value;
        const description = document.getElementById('publish-template-description').value;
        const tags = document.getElementById('publish-template-tags').value;
        
        if (!name.trim()) {
            alert('Por favor, insira um nome para o template.');
            return;
        }
        
        const templateData = {
            name: name,
            description: description,
            tags: tags.split(',').map(tag => tag.trim()),
            elements: this.serializeCanvas(),
            published_at: new Date().toISOString(),
            status: 'published'
        };
        
        // Salvar template publicado
        const publishedTemplates = JSON.parse(localStorage.getItem('publishedTemplates') || '[]');
        publishedTemplates.push(templateData);
        localStorage.setItem('publishedTemplates', JSON.stringify(publishedTemplates));
        
        // Fechar modal
        bootstrap.Modal.getInstance(document.getElementById('publishModal')).hide();
        
        // Mostrar confirmação
        alert('Template publicado com sucesso!');
    }
}

// Funções globais para compatibilidade com onclick
let templateBuilder;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    templateBuilder = new TemplateBuilder();
    
    // Expor funções globalmente
    window.toggleLeftPanel = () => templateBuilder.toggleLeftPanel();
    window.toggleRightPanel = () => templateBuilder.toggleRightPanel();
    window.undoAction = () => templateBuilder.undoAction();
    window.redoAction = () => templateBuilder.redoAction();
    window.previewTemplate = () => templateBuilder.showPreview();
    window.saveTemplate = () => templateBuilder.showSaveModal();
    window.publishTemplate = () => templateBuilder.showPublishModal();
    window.confirmSave = () => templateBuilder.confirmSave();
    window.confirmPublish = () => templateBuilder.confirmPublish();
    
    console.log('TemplateBuilder carregado e funções expostas globalmente');
});
