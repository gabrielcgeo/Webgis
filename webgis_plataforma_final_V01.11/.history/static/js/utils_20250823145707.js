/**
 * Utilitários para formatação brasileira de números e moeda
 * Formato: vírgula (,) para decimal, ponto (.) para milhares
 */

/**
 * Formata um valor como moeda brasileira (R$)
 * @param {number} valor - Valor numérico
 * @param {boolean} incluirSimbolo - Se deve incluir o símbolo R$ (padrão: true)
 * @returns {string} Valor formatado como moeda brasileira
 */
function formatarMoeda(valor, incluirSimbolo = true) {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return incluirSimbolo ? 'R$ 0,00' : '0,00';
    }
    
    // Converter para número se for string
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    
    // Formatar com toLocaleString para garantir formato brasileiro
    const formatado = numero.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return incluirSimbolo ? `R$ ${formatado}` : formatado;
}

/**
 * Formata um valor numérico com separadores brasileiros
 * @param {number} valor - Valor numérico
 * @param {number} casasDecimais - Número de casas decimais (padrão: 0)
 * @returns {string} Valor formatado com separadores brasileiros
 */
function formatarNumero(valor, casasDecimais = 0) {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return '0';
    }
    
    // Converter para número se for string
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    
    // Formatar com toLocaleString para garantir formato brasileiro
    return numero.toLocaleString('pt-BR', {
        minimumFractionDigits: casasDecimais,
        maximumFractionDigits: casasDecimais
    });
}

/**
 * Formata um valor como porcentagem brasileira
 * @param {number} valor - Valor numérico (0-1 ou 0-100)
 * @param {boolean} jaEmPercentual - Se o valor já está em percentual (padrão: false)
 * @param {number} casasDecimais - Número de casas decimais (padrão: 1)
 * @returns {string} Valor formatado como porcentagem brasileira
 */
function formatarPercentual(valor, jaEmPercentual = false, casasDecimais = 1) {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return '0%';
    }
    
    // Converter para número se for string
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    
    // Converter para percentual se necessário
    const percentual = jaEmPercentual ? numero : numero * 100;
    
    // Formatar com toLocaleString para garantir formato brasileiro
    const formatado = percentual.toLocaleString('pt-BR', {
        minimumFractionDigits: casasDecimais,
        maximumFractionDigits: casasDecimais
    });
    
    return `${formatado}%`;
}

/**
 * Formata um valor de armazenamento em GB com separadores brasileiros
 * @param {number} valor - Valor em GB
 * @param {number} casasDecimais - Número de casas decimais (padrão: 1)
 * @returns {string} Valor formatado com separadores brasileiros
 */
function formatarArmazenamento(valor, casasDecimais = 1) {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return '0 GB';
    }
    
    // Converter para número se for string
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    
    // Formatar com toLocaleString para garantir formato brasileiro
    const formatado = numero.toLocaleString('pt-BR', {
        minimumFractionDigits: casasDecimais,
        maximumFractionDigits: casasDecimais
    });
    
    return `${formatado} GB`;
}

/**
 * Formata um valor de visualizações com separadores brasileiros
 * @param {number} valor - Valor numérico
 * @returns {string} Valor formatado com separadores brasileiros
 */
function formatarVisualizacoes(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return '0';
    }
    
    // Converter para número se for string
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    
    // Formatar com toLocaleString para garantir formato brasileiro
    return numero.toLocaleString('pt-BR');
}

/**
 * Converte um valor formatado brasileiro de volta para número
 * @param {string} valorFormatado - Valor formatado (ex: "1.234,56")
 * @returns {number} Valor numérico
 */
function parsearValorBrasileiro(valorFormatado) {
    if (!valorFormatado || typeof valorFormatado !== 'string') {
        return 0;
    }
    
    // Remover símbolos de moeda e espaços
    let valor = valorFormatado.replace(/R\$\s*/g, '').trim();
    
    // Substituir vírgula por ponto para conversão
    valor = valor.replace('.', '').replace(',', '.');
    
    const numero = parseFloat(valor);
    return isNaN(numero) ? 0 : numero;
}

// Exportar funções para uso global
window.formatarMoeda = formatarMoeda;
window.formatarNumero = formatarNumero;
window.formatarPercentual = formatarPercentual;
window.formatarArmazenamento = formatarArmazenamento;
window.formatarVisualizacoes = formatarVisualizacoes;
window.parsearValorBrasileiro = parsearValorBrasileiro;
