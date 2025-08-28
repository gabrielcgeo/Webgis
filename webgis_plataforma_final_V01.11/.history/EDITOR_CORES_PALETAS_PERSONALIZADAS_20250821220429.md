# Editor de Cores e Paletas Personalizadas

## Resumo das Novas Funcionalidades

Implementadas funcionalidades avançadas para edição individual de cores e criação de paletas personalizadas na página de simbologia, dando ao usuário controle total sobre a aparência visual das camadas.

## 🎨 **Editor de Cores Individual**

### **Funcionalidades Implementadas:**

1. **Seletor de Cor Visual**
   - Input de cor nativo do navegador
   - Atualização em tempo real do preview
   - Sincronização automática com outros formatos

2. **Campo de Código HEX**
   - Entrada direta de códigos hexadecimais
   - Validação automática de formato
   - Conversão instantânea para outros formatos

3. **Campos RGB Numericos**
   - Controles individuais para Vermelho (0-255)
   - Controles individuais para Verde (0-255)
   - Controles individuais para Azul (0-255)
   - Botão para mostrar/ocultar campos RGB

4. **Sincronização Automática**
   - Todas as formas de entrada se sincronizam
   - Mudança em um formato atualiza os outros
   - Preview visual atualizado instantaneamente

### **Interface do Editor:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [🟦] Nome da Classe                    [🎨] [#FF5733] [RGB]   │
│ Faixa de valores                      [R] [G] [B]             │
│                                      [0-255][0-255][0-255]    │
└─────────────────────────────────────────────────────────────────┘
```

### **Como Usar:**

1. **Seletor de Cor**: Clique no seletor de cor para escolher visualmente
2. **Campo HEX**: Digite códigos como `#FF5733`, `#00FF00`, etc.
3. **Campos RGB**: Clique em "RGB" para mostrar campos numéricos
4. **Sincronização**: Todas as mudanças são aplicadas automaticamente

## 🎨 **Sistema de Paletas Personalizadas**

### **Funcionalidades Implementadas:**

1. **Criar Nova Paleta**
   - Geração automática de cores únicas
   - Configuração de nome e descrição
   - Definição do número de cores (3-12)

2. **Salvar Paleta Atual**
   - Captura da paleta selecionada no momento
   - Personalização de nome e descrição
   - Armazenamento para uso futuro

3. **Gerenciar Paletas**
   - Lista de todas as paletas personalizadas
   - Exclusão de paletas não desejadas
   - Visualização de informações detalhadas

### **Controles na Interface:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [➕ Criar Nova Paleta] [💾 Salvar Paleta Atual] [⚙️ Gerenciar] │
└─────────────────────────────────────────────────────────────────┘
```

### **Como Criar uma Paleta:**

1. **Clique em "Criar Nova Paleta"**
2. **Digite o nome** (ex: "Minha Paleta")
3. **Digite a descrição** (ex: "Cores para mapas de densidade")
4. **Defina o número de cores** (ex: 5)
5. **Sistema gera cores únicas automaticamente**

### **Como Salvar uma Paleta:**

1. **Selecione uma paleta existente** (ex: Viridis)
2. **Clique em "Salvar Paleta Atual"**
3. **Digite o nome** (ex: "Viridis Personalizada")
4. **Digite a descrição** (ex: "Baseada em Viridis")
5. **Paleta é salva e disponibilizada**

## 🔧 **Implementação Técnica**

### **Funções Principais:**

#### **Conversão de Cores:**
```javascript
// HEX para RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// RGB para HEX
function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
```

#### **Validação HEX:**
```javascript
function isValidHex(hex) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}
```

#### **Atualização de Cores:**
```javascript
function updateClassColor(index, newColor) {
  // Atualiza preview, seletor, campos HEX e RGB
  // Salva no localStorage
  // Atualiza preview do mapa
  // Força atualização da legenda
}
```

### **Armazenamento:**

- **Cores personalizadas**: `graduated_class_color_${layerId}_${field}_${index}`
- **Paletas personalizadas**: `custom_palettes` (array JSON)
- **Nomes de classes**: `graduated_class_${layerId}_${field}_${index}`

### **Estrutura de Paleta Personalizada:**
```json
{
  "name": "Minha Paleta",
  "description": "Cores para mapas de densidade",
  "colors": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"]
}
```

## 📱 **Interface do Usuário**

### **Layout Responsivo:**
- **Desktop**: Todos os controles em linha horizontal
- **Tablet**: Controles organizados em grupos
- **Mobile**: Controles empilhados verticalmente

### **Feedback Visual:**
- **Hover effects** nos botões e campos
- **Validação visual** para códigos HEX inválidos
- **Sincronização visual** entre todos os formatos
- **Toast notifications** para ações importantes

### **Acessibilidade:**
- **Tooltips informativos** em todos os controles
- **Labels descritivos** para campos de entrada
- **Validação em tempo real** com feedback claro
- **Navegação por teclado** em todos os campos

## 🎯 **Casos de Uso**

### **1. Ajuste Fino de Cores**
- **Cenário**: Usuário quer ajustar uma cor específica para melhor contraste
- **Solução**: Usar seletor de cor ou campo HEX para ajuste preciso
- **Resultado**: Cor personalizada aplicada instantaneamente

### **2. Criação de Paletas Corporativas**
- **Cenário**: Empresa quer usar suas cores institucionais
- **Solução**: Criar paleta personalizada com cores da marca
- **Resultado**: Paleta reutilizável em todos os projetos

### **3. Ajuste de Acessibilidade**
- **Cenário**: Usuário com daltonismo precisa de cores específicas
- **Solução**: Editar cores individuais para melhor distinção
- **Resultado**: Mapa acessível para todos os usuários

### **4. Experimentação Visual**
- **Cenário**: Designer quer testar diferentes combinações
- **Solução**: Criar múltiplas paletas e testar rapidamente
- **Resultado**: Encontra a melhor combinação visual

## 🔄 **Integração com Sistema Existente**

### **Compatibilidade:**
- ✅ **Distribuição otimizada** funciona com cores personalizadas
- ✅ **Inversão de paletas** mantida
- ✅ **Número de classes** respeitado
- ✅ **Opacidade** e outros parâmetros inalterados

### **Fluxo de Dados:**
1. **Usuário edita cor** → `updateClassColor()`
2. **Cor é salva** → `localStorage`
3. **Preview atualizado** → `renderMapPreview()`
4. **Legenda atualizada** → `renderPreview()`
5. **Configuração salva** → `saveUserConfig()`

## 🧪 **Testes Recomendados**

### **1. Editor de Cores:**
- Testar seletor de cor visual
- Validar entrada de códigos HEX
- Verificar campos RGB numéricos
- Confirmar sincronização entre formatos

### **2. Paletas Personalizadas:**
- Criar nova paleta com diferentes números de cores
- Salvar paleta existente com nome personalizado
- Gerenciar paletas (listar, excluir)
- Verificar persistência após recarregar página

### **3. Integração:**
- Aplicar cores personalizadas em diferentes números de classes
- Verificar se distribuição otimizada funciona
- Testar com inversão de paletas
- Confirmar que legenda reflete mudanças

### **4. Performance:**
- Testar com muitas classes (10+)
- Verificar tempo de resposta das conversões
- Confirmar que localStorage não causa lentidão
- Testar com múltiplas paletas personalizadas

## 🚀 **Próximas Melhorias**

### **Funcionalidades Futuras:**
1. **Importar/Exportar paletas** (formato JSON)
2. **Biblioteca de paletas** compartilháveis
3. **Histórico de cores** usadas
4. **Sugestões de cores** baseadas em teoria de cores
5. **Análise de contraste** automática
6. **Templates de paletas** para diferentes tipos de dados

### **Melhorias de Interface:**
1. **Color picker avançado** com HSL/HSV
2. **Preview em tempo real** da paleta completa
3. **Drag & drop** para reordenar cores
4. **Undo/Redo** para mudanças de cores
5. **Comparação visual** entre paletas

## 📋 **Resumo de Comandos**

### **Atalhos de Teclado:**
- **Tab**: Navegar entre campos
- **Enter**: Confirmar entrada
- **Escape**: Cancelar edição

### **Comandos de Mouse:**
- **Clique**: Selecionar/selecionar cor
- **Hover**: Ver tooltips informativos
- **Drag**: Arrastar seletor de cor

### **Validações Automáticas:**
- **HEX**: Formato #RRGGBB ou #RGB
- **RGB**: Valores entre 0-255
- **Nome**: Máximo 50 caracteres
- **Paleta**: 3-12 cores

## 🎉 **Conclusão**

A implementação do editor de cores individual e sistema de paletas personalizadas representa um salto significativo na flexibilidade e controle do usuário sobre a simbologia das camadas. 

**Benefícios principais:**
- ✅ **Controle total** sobre cores individuais
- ✅ **Flexibilidade** para criar paletas únicas
- ✅ **Persistência** de configurações personalizadas
- ✅ **Integração perfeita** com sistema existente
- ✅ **Interface intuitiva** e responsiva

**Impacto na experiência do usuário:**
- 🎨 Maior criatividade na criação de mapas
- 🔧 Ajustes precisos para necessidades específicas
- 💾 Reutilização de paletas personalizadas
- 🚀 Workflow mais eficiente para designers
- ♿ Melhor acessibilidade para usuários com necessidades especiais

A solução é robusta, escalável e mantém a compatibilidade com todas as funcionalidades existentes, proporcionando uma experiência de usuário significativamente melhorada.
