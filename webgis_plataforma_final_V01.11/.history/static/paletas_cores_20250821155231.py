# -*- coding: utf-8 -*-
"""
Paletas de Cores Aprovadas para Aplicação WebGIS

Este script contém um dicionário de paletas de cores selecionadas,
inspiradas em padrões de softwares de geoprocessamento (QGIS, ArcGIS)
e ambientes de análise de dados (R, Python).

As paletas estão separadas em três categorias:
1.  Sequencial: Para dados quantitativos ordenados.
2.  Divergente: Para dados quantitativos que se afastam de um ponto central.
3.  Qualitativo: Para dados categóricos distintos.

Aprovado em: 21 de agosto de 2025
"""

PALETAS = {
    "sequencial": {
        
        # Paleta moderna, perceptualmente uniforme, ideal para dados científicos.
        "Viridis": ['#440154', '#472d7b', '#3b528b', '#2c728e', '#21918c', '#28ae80', '#5ec962', '#addc30', '#fde725'],
        
        # Otimizada para ser legível por daltônicos, similar à Viridis.
        "Cividis": ['#00224e', '#1a386f', '#434e6c', '#61656f', '#7d7c78', '#9b9476', '#bcae6c', '#dec958', '#fee838'],
        
        # Clássica para representar intensidade de água, precipitação, etc.
        "Blues": ['#f7fbff', '#deebf7', '#c6dbef', '#9dcae1', '#6aaed6', '#4191c6', '#2070b4', '#08509b', '#08306b'],
        
        # Excelente para temas de vegetação, agricultura e meio ambiente.
        "Greens": ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a0d99b', '#73c476', '#40aa5d', '#228a44', '#006c2c', '#00441b'],
        
        # Muito usada em mapas de calor (choropleth) para densidade ou risco.
        "YlOrRd": ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8c3c', '#fc4d2a', '#e2191c', '#bb0026', '#800026'],
        
        # Uma alternativa elegante para representar magnitude.
        "Purples": ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807cba', '#6950a3', '#53268f', '#3f007d'],
        
        # Ideal para mapas base ou quando a cor não deve chamar muita atenção.
        "Greys": ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#959595', '#727272', '#515151', '#242424', '#000000'],
    },
    
    "divergente": {
        
        # Padrão para anomalias (ex: temperatura), segura para daltonismo.
        "RdYlBu": ['#a50026', '#d62f27', '#f46d43', '#fdad60', '#fee090', '#feffc0', '#e0f3f8', '#aad8e9', '#74add1', '#4574b3', '#313695'],
        
        # Clássica, mas atenção com daltonismo vermelho-verde.
        "RdYlGn": ['#a50026', '#d62f27', '#f46d43', '#fdad60', '#fee08b', '#feffbe', '#d9ef8b', '#a5d86a', '#66bd63', '#199750', '#006837'],
        
        # Ótima para temas de vegetação vs. solo/áreas secas. Segura para daltonismo.
        "BrBG": ['#543005', '#8b500a', '#bf812d', '#dec17b', '#f6e8c3', '#f4f5f5', '#c7eae5', '#7fccc0', '#35978f', '#01655d', '#003c30'],
        
        # Alternativa ao RdYlGn, segura para daltonismo.
        "PiYG": ['#8e0152', '#c41a7c', '#de77ae', '#f1b5d9', '#fde0ef', '#f7f7f6', '#e6f5d0', '#b7e085', '#7fbc41', '#4c9121', '#276419'],
        
        # Padrão do Matplotlib (Python) para divergência azul-vermelho.
        "Coolwarm": ['#3b4cc0', '#5977e3', '#7b9ff9', '#9ebeff', '#c0d4f5', '#dddcdc', '#f2cbb7', '#f7ac8e', '#ee8468', '#d65244', '#b40426'],
        
        # Usada para representar um amplo espectro de desvios, como em topografia.
        "Spectral": ['#9e0142', '#d43d4f', '#f46d43', '#fdad60', '#fee08b', '#ffffbe', '#e6f598', '#aadca4', '#66c2a5', '#3387bc', '#5e4fa2'],
    },
    
    "qualitativo": {
        
        # Paleta vívida personalizada com matizes iniciando no verde.
        "Vivid (Início Verde)": ['#16d916', '#16d98b', '#16b2d9', '#163dd9', '#6416d9', '#d916d9', '#d91664', '#d93d16', '#d9b216', '#8bd916'],
        
        # Paleta vívida personalizada com matizes iniciando no azul.
        "Vivid (Início Azul)": ['#1616d9', '#8b16d9', '#d916b2', '#d9163d', '#d96416', '#d9d916', '#64d916', '#16d93d', '#16d9b2', '#168bd9'],
        
        # Padrão moderno e claro do Tableau, excelente para até 10 classes.
        "Tableau Tab10": ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
        
        # Ideal para quando as categorias podem ser agrupadas em pares (ex: antes/depois).
        "ColorBrewer Paired": ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
        
        # Tons mais suaves, boa para muitas classes sem sobrecarregar o mapa.
        "ColorBrewer Set3": ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
    }
}


if __name__ == '__main__':
    # --- Exemplo de como acessar e usar as paletas ---

    print("Exemplo de como usar as paletas de cores:")

    # 1. Acessar uma paleta sequencial específica
    paleta_ylorrd = PALETAS['sequencial']['YlOrRd']
    print(f"\nPaleta Sequencial 'YlOrRd' ({len(paleta_ylorrd)} cores):")
    print(paleta_ylorrd)

    # 2. Acessar uma paleta divergente
    paleta_rdylbu = PALETAS['divergente']['RdYlBu']
    print(f"\nPaleta Divergente 'RdYlBu' ({len(paleta_rdylbu)} cores):")
    print(paleta_rdylbu)

    # 3. Acessar uma paleta qualitativa
    paleta_vivid_verde = PALETAS['qualitativo']['Vivid (Início Verde)']
    print(f"\nPaleta Qualitativa 'Vivid (Início Verde)' ({len(paleta_vivid_verde)} cores):")
    print(paleta_vivid_verde)

    # 4. Listar todas as paletas qualitativas disponíveis
    print("\nNomes de todas as paletas qualitativas disponíveis:")
    for nome in PALETAS['qualitativo'].keys():
        print(f"- {nome}")
