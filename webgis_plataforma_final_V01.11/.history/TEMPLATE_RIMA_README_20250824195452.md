# Template RIMA - Relatório de Impacto Ambiental

## Visão Geral

O template RIMA foi implementado no sistema de relatórios geográficos para atender às necessidades específicas de relatórios de impacto ambiental. Este template oferece uma estrutura profissional e navegação hierárquica ideal para documentos técnicos ambientais.

## Características Principais

### 🎯 **Foco**
- **Categoria**: História como Foco
- **Layout**: Clássico
- **Complexidade**: Avançado
- **Tipo**: Profissional

### 🏗️ **Estrutura**
- Navegação hierárquica com capítulos e subcapítulos
- Sidebar lateral com índice expandível
- Área de conteúdo responsiva
- Sistema de scroll suave entre seções

### 🗺️ **Funcionalidades de Mapa**
- Múltiplos mapas Leaflet integrados
- Diferentes tipos de basemaps (OSM, Satélite, CARTO)
- Marcadores, polígonos e círculos interativos
- Popups informativos nos elementos do mapa

### 📱 **Responsividade**
- Design adaptativo para dispositivos móveis
- Sidebar colapsável em telas pequenas
- Navegação horizontal em dispositivos móveis

## Estrutura do Template

### Capítulos Principais
1. **Introdução**
   - 1.1 Caracterização do Empreendimento

2. **Meio Físico**
   - 2.2 Geologia
   - 2.3 Geomorfologia
   - 2.4 Recursos Hídricos

3. **Meio Biótico**
   - 3.1 Flora
   - 3.2 Fauna

4. **Meio Socioeconômico**
   - 4.1 Demografia

5. **Análise Integrada**

6. **Considerações Finais**

## Elementos de Mídia Integrados

### 🎥 **Vídeos**
- Modelo 3D interativo da barragem (Sketchfab)
- Vídeo de drone mostrando geomorfologia local (YouTube)

### 🗺️ **Mapas Interativos**
- **Mapa de Geologia**: Pontos de sondagem geológica
- **Mapa de Hidrografia**: Pontos de monitoramento da qualidade da água
- **Mapa de Flora**: Áreas de supressão e preservação permanente

### 📊 **Gráficos e Imagens**
- Gráfico de pirâmide etária
- Imagens de fauna local
- Documentos PDF para download

## Implementação Técnica

### 📁 **Arquivos Criados/Modificados**

1. **Template HTML**: `templates/geographic_report/templates/rima.html`
2. **Página de Templates**: `templates/geographic_report/templates.html`
3. **JavaScript de Templates**: `static/js/geographic_report_templates.js`
4. **CSS de Templates**: `static/css/geographic_report_templates.css`
5. **Dados de Exemplo**: `static/js/geographic_report_data.js`
6. **Rota da Aplicação**: `app.py`

### 🔧 **Funcionalidades Implementadas**

#### Preview Interativo
- Modal de preview com iframe do template
- Carregamento dinâmico do template RIMA
- Botões de ação integrados

#### Navegação Inteligente
- Sistema de expansão/colapso de capítulos
- Scroll suave entre seções
- Indicador visual de seção ativa
- Intersection Observer para atualização automática

#### Mapas Leaflet
- Inicialização automática de múltiplos mapas
- Diferentes estilos de basemap por contexto
- Elementos interativos com popups informativos
- Coordenadas centralizadas na região do projeto

### 🎨 **Design System**

#### Cores
- **Primária**: #2c3e50 (Azul escuro profissional)
- **Secundária**: #34495e (Cinza azulado)
- **Acento**: #2980b9 (Azul médio)
- **Fundo**: #fcfcfc (Branco suave)

#### Tipografia
- **Títulos**: Lato (sans-serif) - Peso 900
- **Corpo**: Noto Serif (serif) - Peso 400/700
- **Hierarquia**: Tamanhos escalonados (2.8rem, 2rem, 1.1rem)

#### Componentes
- Cards com sombras suaves
- Bordas arredondadas (8px)
- Transições suaves (0.2s - 0.4s)
- Hover effects com transformações

## Como Usar

### 1. **Acesso ao Template**
- Navegue para `/geographic-report/templates`
- Localize o card "RIMA - Relatório de Impacto Ambiental"
- Clique em "Visualizar" para preview ou "Usar Template" para implementar

### 2. **Preview Interativo**
- O preview mostra o template completo em um iframe
- Navegue pelos capítulos usando o menu lateral
- Interaja com os mapas e elementos

### 3. **Implementação**
- Clique em "Usar Este Template"
- O sistema redirecionará para a criação de relatório
- O template será aplicado automaticamente

## Personalização

### 🎨 **Modificar Cores**
```css
:root {
    --nav-bg: #2c3e50;        /* Cor da sidebar */
    --primary-accent: #2980b9; /* Cor de destaque */
    --text-dark: #34495e;      /* Cor do texto principal */
}
```

### 📝 **Alterar Conteúdo**
- Edite o arquivo `rima.html` para modificar textos
- Atualize coordenadas dos mapas conforme necessário
- Adicione/remova capítulos e subcapítulos

### 🗺️ **Personalizar Mapas**
```javascript
// Coordenadas centrais
const centerCoord = [-19.91, -43.94];

// Adicionar novos pontos
const novosPontos = [
    { lat: -19.92, lng: -43.96, name: "Novo Ponto" }
];
```

## Exemplos de Uso

### 🏭 **Projetos Industriais**
- Relatórios de impacto ambiental
- Estudos de viabilidade
- Documentação técnica

### 🌿 **Projetos Ambientais**
- Avaliações de impacto
- Relatórios de sustentabilidade
- Documentação de projetos verdes

### 🏗️ **Infraestrutura**
- Projetos hidrelétricos
- Construção de rodovias
- Desenvolvimento urbano

## Requisitos Técnicos

### 🌐 **Dependências Externas**
- Leaflet 1.9.4 (biblioteca de mapas)
- Google Fonts (Lato, Noto Serif)
- Sketchfab (modelos 3D)
- YouTube (vídeos)

### 💻 **Compatibilidade**
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Dispositivos móveis responsivos
- Suporte a JavaScript ES6+

### 📱 **Responsividade**
- Breakpoints: 992px, 768px, 480px
- Sidebar adaptativa
- Navegação otimizada para mobile

## Manutenção e Atualizações

### 🔄 **Atualizações Regulares**
- Verificar compatibilidade com novas versões do Leaflet
- Atualizar dependências externas conforme necessário
- Manter compatibilidade com mudanças no sistema principal

### 🐛 **Solução de Problemas**
- Verificar console do navegador para erros JavaScript
- Confirmar carregamento das dependências externas
- Validar coordenadas dos mapas

### 📈 **Melhorias Futuras**
- Adicionar mais tipos de visualizações
- Implementar sistema de temas
- Integrar com APIs de dados ambientais

## Suporte e Contribuições

Para dúvidas, sugestões ou contribuições:
- Abra uma issue no repositório
- Documente problemas encontrados
- Sugira melhorias e novos recursos

---

**Template RIMA** - Desenvolvido para relatórios profissionais de impacto ambiental com foco em usabilidade e apresentação visual de alta qualidade.
