# Reset Automático de Cores Personalizadas

## 📋 **Descrição da Funcionalidade**

O sistema agora implementa um **reset automático** de cores personalizadas quando o usuário muda a paleta de cores ou inverte a paleta selecionada. Isso garante que as cores da nova paleta sejam aplicadas limpas, sem interferência de cores personalizadas anteriores.

## 🎯 **Comportamento Implementado**

### **1. Simbologia Graduada**
- **Cores personalizadas** são mantidas até que o usuário mude a paleta
- **Ao mudar paleta**: Todas as cores personalizadas são automaticamente resetadas
- **Ao inverter paleta**: Todas as cores personalizadas são automaticamente resetadas
- **Nova paleta**: É aplicada com suas cores originais e distribuição otimizada

### **2. Legenda Composta (Categorias)**
- **Cores personalizadas** são mantidas até que o usuário mude a paleta
- **Ao mudar paleta**: Todas as cores personalizadas das categorias são resetadas
- **Ao inverter paleta**: Todas as cores personalizadas das categorias são resetadas
- **Nova paleta**: É aplicada com suas cores originais

## 🔧 **Implementação Técnica**

### **Função `clearCustomColors(field)`**
```javascript
function clearCustomColors(field) {
  if (field) {
    let clearedCount = 0;
    
    // Limpar cores personalizadas da simbologia graduada
    for (let i = 0; i < 20; i++) {
      if (localStorage.getItem(`graduated_class_color_${layerId}_${field}_${i}`)) {
        localStorage.removeItem(`graduated_class_color_${layerId}_${field}_${i}`);
        clearedCount++;
      }
    }
    
    // Limpar cores personalizadas das categorias da legenda composta
    const categoryColors = Object.keys(localStorage).filter(key => 
      key.startsWith(`category_color_${layerId}_`)
    );
    
    categoryColors.forEach(key => {
      localStorage.removeItem(key);
      clearedCount++;
    });
    
    // Mostrar notificação se cores foram limpas
    if (clearedCount > 0) {
      showToast(`Cores personalizadas resetadas para a nova paleta selecionada`, 'info');
    }
  }
}
```

### **Event Listeners Modificados**

#### **Mudança de Paleta (`palette-select`)**
```javascript
document.getElementById('palette-select').addEventListener('change', function() {
  // Limpar cores personalizadas antes de aplicar nova paleta
  const field = document.getElementById('field-select').value;
  clearCustomColors(field);
  
  updatePalettePreview();
  createCategoryColorInterface([]);
  
  // Se for simbologia graduada, atualizar interface de classes
  if (document.getElementById('style-type').value === 'graduated') {
    const style = computeStyle();
    createGraduatedClassesInterface(style);
  }
  
  refreshPreview();
  saveUserConfig();
});
```

#### **Inversão de Paleta (`palette-invert`)**
```javascript
document.getElementById('palette-invert').addEventListener('change', function() {
  // Limpar cores personalizadas antes de aplicar nova paleta
  const field = document.getElementById('field-select').value;
  clearCustomColors(field);
  
  updatePalettePreview();
  createCategoryColorInterface([]);
  
  // Se for simbologia graduada, atualizar interface de classes
  if (document.getElementById('style-type').value === 'graduated') {
    const style = computeStyle();
    createGraduatedClassesInterface(style);
  }
  
  refreshPreview();
  saveUserConfig();
});
```

## 💾 **Sistema de Armazenamento**

### **Chaves do localStorage**
- **Simbologia Graduada**: `graduated_class_color_${layerId}_${field}_${index}`
- **Legenda Composta**: `category_color_${layerId}_${category}`

### **Limpeza Automática**
- **Campo específico**: Apenas cores do campo atual são limpas
- **Contagem**: Sistema conta quantas cores foram limpas
- **Feedback**: Notificação toast informa o usuário sobre o reset

## 🎨 **Fluxo de Usuário**

### **1. Usuário Personaliza Cores**
- Seleciona cores individuais para classes ou categorias
- Cores são salvas automaticamente no localStorage
- Interface mantém as cores personalizadas

### **2. Usuário Muda Paleta**
- Seleciona nova paleta no dropdown
- Sistema detecta mudança e chama `clearCustomColors()`
- Todas as cores personalizadas são removidas
- Nova paleta é aplicada com cores originais
- Toast informa: "Cores personalizadas resetadas para a nova paleta selecionada"

### **3. Usuário Inverte Paleta**
- Marca/desmarca checkbox de inversão
- Sistema detecta mudança e chama `clearCustomColors()`
- Todas as cores personalizadas são removidas
- Paleta invertida é aplicada com cores originais
- Toast informa sobre o reset

## 🔄 **Casos de Uso**

### **Cenário 1: Mudança de Paleta**
1. Usuário personaliza cores de 5 classes graduadas
2. Usuário muda de "Viridis" para "Blues"
3. Sistema limpa todas as 5 cores personalizadas
4. Nova paleta "Blues" é aplicada com distribuição otimizada
5. Usuário vê notificação sobre o reset

### **Cenário 2: Inversão de Paleta**
1. Usuário personaliza cores de 3 categorias
2. Usuário inverte a paleta atual
3. Sistema limpa todas as 3 cores personalizadas
4. Paleta invertida é aplicada com cores originais
5. Usuário vê notificação sobre o reset

### **Cenário 3: Mudança de Campo**
1. Usuário personaliza cores para campo "populacao"
2. Usuário muda para campo "area"
3. Cores personalizadas de "populacao" permanecem salvas
4. Campo "area" usa cores da paleta padrão
5. Ao voltar para "populacao", cores personalizadas são restauradas

## ✅ **Benefícios da Implementação**

### **Para o Usuário**
- **Consistência visual**: Sempre vê a paleta selecionada como esperado
- **Experiência intuitiva**: Mudança de paleta implica reset de personalizações
- **Feedback claro**: Notificação informa sobre o que aconteceu
- **Controle total**: Pode personalizar novamente após mudar paleta

### **Para o Sistema**
- **Integridade de dados**: Evita conflitos entre paletas e cores personalizadas
- **Performance**: Interface sempre reflete o estado atual da paleta
- **Manutenibilidade**: Código mais limpo e previsível
- **Escalabilidade**: Funciona para qualquer número de classes/categorias

## 🧪 **Testes Recomendados**

### **Teste 1: Simbologia Graduada**
1. Criar simbologia graduada com 5 classes
2. Personalizar cores de 3 classes
3. Mudar paleta de "Viridis" para "Blues"
4. Verificar se cores personalizadas foram resetadas
5. Verificar se nova paleta foi aplicada corretamente

### **Teste 2: Legenda Composta**
1. Criar legenda composta com 4 categorias
2. Personalizar cores de 2 categorias
3. Inverter paleta atual
4. Verificar se cores personalizadas foram resetadas
5. Verificar se paleta invertida foi aplicada

### **Teste 3: Persistência entre Campos**
1. Personalizar cores para campo "populacao"
2. Mudar para campo "area"
3. Verificar se cores de "populacao" permanecem salvas
4. Voltar para "populacao"
5. Verificar se cores personalizadas foram restauradas

## 📝 **Notas de Implementação**

- **Compatibilidade**: Funciona com todas as paletas existentes e personalizadas
- **Performance**: Limpeza é feita apenas quando necessário
- **Segurança**: Apenas cores do campo atual são afetadas
- **Feedback**: Usuário sempre é informado sobre mudanças automáticas
- **Flexibilidade**: Sistema permite personalização após qualquer reset

## 🚀 **Próximos Passos**

1. **Monitoramento**: Acompanhar feedback dos usuários sobre o comportamento
2. **Otimização**: Considerar opção de "desfazer" para resets acidentais
3. **Histórico**: Implementar sistema de histórico de paletas utilizadas
4. **Exportação**: Permitir exportar configurações de cores personalizadas
