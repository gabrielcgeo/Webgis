/**
 * Dados de Exemplo para Relatório Geográfico
 * Contém exemplos completos de relatórios com todos os tipos de mídia
 */

const SAMPLE_REPORTS = {
    // Relatório principal sobre RMSP
    '3': {
        id: 3,
        title: 'Análise Geográfica da Região Metropolitana de São Paulo',
        description: 'Relatório completo sobre desenvolvimento urbano, demografia e infraestrutura da RMSP',
        author: 'Equipe de Geografia Urbana',
        company: 'Instituto de Pesquisas Metropolitanas',
        created_at: '2024-01-15',
        updated_at: '2024-01-20',
        status: 'published',
        config: {
            template: 'modern',
            basemap: 'osm',
            theme: 'light',
            colors: {
                primary: '#007bff',
                secondary: '#6c757d',
                success: '#28a745',
                warning: '#ffc107',
                danger: '#dc3545',
                info: '#17a2b8'
            }
        },
        layers: [
            { id: 1, name: 'Limites Municipais', type: 'polygon', visible: true, color: '#007bff' },
            { id: 2, name: 'Rede Viária', type: 'line', visible: true, color: '#28a745' },
            { id: 3, name: 'Pontos de Interesse', type: 'point', visible: true, color: '#ffc107' },
            { id: 4, name: 'Áreas Verdes', type: 'polygon', visible: false, color: '#28a745' },
            { id: 5, name: 'Zonas de Uso do Solo', type: 'polygon', visible: false, color: '#6c757d' },
            { id: 6, name: 'Transporte Público', type: 'line', visible: true, color: '#dc3545' },
            { id: 7, name: 'Centros Comerciais', type: 'point', visible: false, color: '#17a2b8' }
        ],
        stops: [
            {
                id: 1,
                title: 'Visão Geral da Região',
                description: 'Introdução e contexto geográfico da RMSP',
                mapPosition: { lat: -23.5505, lng: -46.6333, zoom: 10 },
                transition: 'fly-to',
                duration: 2000,
                content: {
                    text: 'A Região Metropolitana de São Paulo (RMSP) é a maior aglomeração urbana do Brasil, com aproximadamente 21 milhões de habitantes distribuídos em 39 municípios. Esta região representa o principal centro econômico, político e cultural do país, concentrando cerca de 18% do PIB brasileiro em apenas 0,1% do território nacional.',
                    images: [
                        { 
                            name: 'vista_aerea_rmsp.jpg', 
                            caption: 'Vista aérea da região metropolitana', 
                            url: '/static/images/sample/vista_aerea_rmsp.jpg',
                            description: 'Imagem aérea mostrando a extensão urbana da RMSP'
                        },
                        { 
                            name: 'mapa_regional.jpg', 
                            caption: 'Mapa político da RMSP', 
                            url: '/static/images/sample/mapa_regional.jpg',
                            description: 'Divisão político-administrativa dos 39 municípios'
                        },
                        { 
                            name: 'satelite_rmsp.jpg', 
                            caption: 'Imagem de satélite da região', 
                            url: '/static/images/sample/satelite_rmsp.jpg',
                            description: 'Visão de satélite destacando a densidade urbana'
                        }
                    ],
                    videos: [
                        { 
                            name: 'overview_rmsp.mp4', 
                            caption: 'Vídeo introdutório da região', 
                            url: '/static/videos/sample/overview_rmsp.mp4',
                            duration: '2:30',
                            description: 'Apresentação geral da RMSP com dados demográficos'
                        }
                    ],
                    documents: [
                        { 
                            name: 'relatorio_rmsp_2024.pdf', 
                            caption: 'Relatório oficial da RMSP 2024', 
                            url: '/static/documents/sample/relatorio_rmsp_2024.pdf',
                            pages: 45,
                            description: 'Relatório completo com estatísticas oficiais'
                        },
                        { 
                            name: 'plano_diretor_rmsp.pdf', 
                            caption: 'Plano Diretor Metropolitano', 
                            url: '/static/documents/sample/plano_diretor_rmsp.pdf',
                            pages: 120,
                            description: 'Documento de planejamento urbano regional'
                        }
                    ],
                    charts: [
                        { 
                            name: 'evolucao_populacional.png', 
                            caption: 'Evolução populacional 2000-2024', 
                            url: '/static/charts/sample/evolucao_populacional.png',
                            type: 'line',
                            description: 'Gráfico mostrando o crescimento populacional ao longo dos anos'
                        },
                        { 
                            name: 'distribuicao_municipios.png', 
                            caption: 'Distribuição populacional por município', 
                            url: '/static/charts/sample/distribuicao_municipios.png',
                            type: 'bar',
                            description: 'Comparativo populacional entre os municípios da RMSP'
                        }
                    ]
                },
                layerVisibility: { 1: true, 2: true, 3: false, 4: false, 5: false, 6: false, 7: false }
            },
            {
                id: 2,
                title: 'Análise Demográfica',
                description: 'Características populacionais e distribuição demográfica',
                mapPosition: { lat: -23.5489, lng: -46.6388, zoom: 12 },
                transition: 'fly-to',
                duration: 2500,
                content: {
                    text: 'A população da RMSP apresenta características demográficas únicas, com alta densidade populacional no centro expandido e crescimento acelerado nas periferias. A região concentra 10% da população brasileira em apenas 0,1% do território nacional, resultando em uma das maiores densidades populacionais do mundo.',
                    images: [
                        { 
                            name: 'densidade_populacional.jpg', 
                            caption: 'Mapa de densidade populacional', 
                            url: '/static/images/sample/densidade_populacional.jpg',
                            description: 'Visualização da distribuição populacional por área'
                        },
                        { 
                            name: 'piramide_etaria.jpg', 
                            caption: 'Pirâmide etária da RMSP', 
                            url: '/static/images/sample/piramide_etaria.jpg',
                            description: 'Estrutura etária da população metropolitana'
                        },
                        { 
                            name: 'crescimento_urbano.jpg', 
                            caption: 'Expansão urbana 1990-2024', 
                            url: '/static/images/sample/crescimento_urbano.jpg',
                            description: 'Sequência temporal mostrando o crescimento urbano'
                        }
                    ],
                    videos: [
                        { 
                            name: 'crescimento_populacional.mp4', 
                            caption: 'Análise do crescimento populacional', 
                            url: '/static/videos/sample/crescimento_populacional.mp4',
                            duration: '3:45',
                            description: 'Análise detalhada das tendências demográficas'
                        },
                        { 
                            name: 'migracao_rmsp.mp4', 
                            caption: 'Fluxos migratórios na RMSP', 
                            url: '/static/videos/sample/migracao_rmsp.mp4',
                            duration: '2:15',
                            description: 'Documentário sobre migração interna para a região'
                        }
                    ],
                    documents: [
                        { 
                            name: 'analise_demografica_ibge.pdf', 
                            caption: 'Análise demográfica IBGE 2024', 
                            url: '/static/documents/sample/analise_demografica_ibge.pdf',
                            pages: 78,
                            description: 'Relatório oficial do IBGE sobre demografia metropolitana'
                        },
                        { 
                            name: 'estudo_migracao.pdf', 
                            caption: 'Estudo sobre migração interna', 
                            url: '/static/documents/sample/estudo_migracao.pdf',
                            pages: 56,
                            description: 'Pesquisa sobre padrões migratórios na RMSP'
                        }
                    ],
                    charts: [
                        { 
                            name: 'distribuicao_etaria.png', 
                            caption: 'Distribuição por faixa etária', 
                            url: '/static/charts/sample/distribuicao_etaria.png',
                            type: 'pie',
                            description: 'Composição populacional por grupos etários'
                        },
                        { 
                            name: 'migracao_interna.png', 
                            caption: 'Fluxos migratórios internos', 
                            url: '/static/charts/sample/migracao_interna.png',
                            type: 'flow',
                            description: 'Mapa de fluxos migratórios entre regiões'
                        },
                        { 
                            name: 'densidade_historica.png', 
                            caption: 'Evolução da densidade populacional', 
                            url: '/static/charts/sample/densidade_historica.png',
                            type: 'heatmap',
                            description: 'Mapa de calor mostrando mudanças na densidade'
                        }
                    ]
                },
                layerVisibility: { 1: true, 2: false, 3: true, 4: false, 5: true, 6: false, 7: false }
            },
            {
                id: 3,
                title: 'Infraestrutura e Mobilidade',
                description: 'Sistema de transportes e infraestrutura urbana',
                mapPosition: { lat: -23.5525, lng: -46.6319, zoom: 13 },
                transition: 'fly-to',
                duration: 2000,
                content: {
                    text: 'A infraestrutura de transportes da RMSP é composta por uma rede complexa de metrô, trens metropolitanos, ônibus e vias expressas. O sistema metroferroviário transporta diariamente mais de 7 milhões de passageiros, sendo um dos mais extensos da América Latina.',
                    images: [
                        { 
                            name: 'rede_metro.jpg', 
                            caption: 'Rede metroferroviária da RMSP', 
                            url: '/static/images/sample/rede_metro.jpg',
                            description: 'Mapa completo da rede de metrô e trens'
                        },
                        { 
                            name: 'estacao_central.jpg', 
                            caption: 'Estação Central do Metrô', 
                            url: '/static/images/sample/estacao_central.jpg',
                            description: 'Estação central com maior fluxo de passageiros'
                        },
                        { 
                            name: 'corredor_bus.jpg', 
                            caption: 'Corredor de ônibus', 
                            url: '/static/images/sample/corredor_bus.jpg',
                            description: 'Sistema de corredores exclusivos para ônibus'
                        },
                        { 
                            name: 'ciclovias.jpg', 
                            caption: 'Rede de ciclovias', 
                            url: '/static/images/sample/ciclovias.jpg',
                            description: 'Infraestrutura para mobilidade ativa'
                        }
                    ],
                    videos: [
                        { 
                            name: 'sistema_transporte.mp4', 
                            caption: 'Visão geral do sistema de transportes', 
                            url: '/static/videos/sample/sistema_transporte.mp4',
                            duration: '4:20',
                            description: 'Documentário sobre a evolução dos transportes'
                        },
                        { 
                            name: 'estacao_metropolitana.mp4', 
                            caption: 'Funcionamento das estações', 
                            url: '/static/videos/sample/estacao_metropolitana.mp4',
                            duration: '2:30',
                            description: 'Como funcionam as estações de metrô'
                        }
                    ],
                    documents: [
                        { 
                            name: 'plano_mobilidade_rmsp.pdf', 
                            caption: 'Plano de Mobilidade da RMSP', 
                            url: '/static/documents/sample/plano_mobilidade_rmsp.pdf',
                            pages: 95,
                            description: 'Plano estratégico de mobilidade urbana'
                        },
                        { 
                            name: 'relatorio_transporte_2024.pdf', 
                            caption: 'Relatório de Transportes 2024', 
                            url: '/static/documents/sample/relatorio_transporte_2024.pdf',
                            pages: 67,
                            description: 'Relatório anual sobre o sistema de transportes'
                        },
                        { 
                            name: 'estudo_ciclovias.pdf', 
                            caption: 'Estudo sobre rede de ciclovias', 
                            url: '/static/documents/sample/estudo_ciclovias.pdf',
                            pages: 34,
                            description: 'Análise da infraestrutura cicloviária'
                        }
                    ],
                    charts: [
                        { 
                            name: 'fluxo_passageiros.png', 
                            caption: 'Fluxo de passageiros por modal', 
                            url: '/static/charts/sample/fluxo_passageiros.png',
                            type: 'stacked-bar',
                            description: 'Comparativo de uso entre diferentes modais'
                        },
                        { 
                            name: 'investimentos_transporte.png', 
                            caption: 'Investimentos em transportes', 
                            url: '/static/charts/sample/investimentos_transporte.png',
                            type: 'area',
                            description: 'Evolução dos investimentos ao longo dos anos'
                        },
                        { 
                            name: 'cobertura_metro.png', 
                            caption: 'Cobertura da rede metroferroviária', 
                            url: '/static/charts/sample/cobertura_metro.png',
                            type: 'choropleth',
                            description: 'Mapa mostrando a cobertura por município'
                        }
                    ]
                },
                layerVisibility: { 1: true, 2: true, 3: true, 4: false, 5: false, 6: true, 7: false }
            },
            {
                id: 4,
                title: 'Desenvolvimento Econômico',
                description: 'Atividade econômica e principais polos industriais',
                mapPosition: { lat: -23.5445, lng: -46.6412, zoom: 11 },
                transition: 'fly-to',
                duration: 2200,
                content: {
                    text: 'A RMSP concentra 18% do PIB brasileiro, sendo o principal centro financeiro e industrial do país. A região abriga importantes polos tecnológicos, como o Vale do Silício brasileiro em São José dos Campos, e concentra a maior parte das sedes de empresas brasileiras.',
                    images: [
                        { 
                            name: 'centro_financeiro.jpg', 
                            caption: 'Centro financeiro de São Paulo', 
                            url: '/static/images/sample/centro_financeiro.jpg',
                            description: 'Concentração de bancos e instituições financeiras'
                        },
                        { 
                            name: 'polo_tecnologico.jpg', 
                            caption: 'Polo tecnológico da região', 
                            url: '/static/images/sample/polo_tecnologico.jpg',
                            description: 'Centro de inovação e tecnologia'
                        },
                        { 
                            name: 'industria_automotiva.jpg', 
                            caption: 'Indústria automotiva', 
                            url: '/static/images/sample/industria_automotiva.jpg',
                            description: 'Complexo industrial automotivo da região'
                        }
                    ],
                    videos: [
                        { 
                            name: 'economia_rmsp.mp4', 
                            caption: 'Análise da economia regional', 
                            url: '/static/videos/sample/economia_rmsp.mp4',
                            duration: '3:15',
                            description: 'Visão geral da economia metropolitana'
                        }
                    ],
                    documents: [
                        { 
                            name: 'relatorio_economico_seade.pdf', 
                            caption: 'Relatório Econômico SEADE 2024', 
                            url: '/static/documents/sample/relatorio_economico_seade.pdf',
                            pages: 89,
                            description: 'Análise econômica oficial da região'
                        },
                        { 
                            name: 'estudo_polos_industriais.pdf', 
                            caption: 'Estudo sobre polos industriais', 
                            url: '/static/documents/sample/estudo_polos_industriais.pdf',
                            pages: 72,
                            description: 'Mapeamento dos principais polos industriais'
                        }
                    ],
                    charts: [
                        { 
                            name: 'pib_setorial.png', 
                            caption: 'Composição do PIB por setor', 
                            url: '/static/charts/sample/pib_setorial.png',
                            type: 'donut',
                            description: 'Distribuição do PIB por setores econômicos'
                        },
                        { 
                            name: 'emprego_formal.png', 
                            caption: 'Evolução do emprego formal', 
                            url: '/static/charts/sample/emprego_formal.png',
                            type: 'line',
                            description: 'Tendências do mercado de trabalho formal'
                        },
                        { 
                            name: 'exportacoes_rmsp.png', 
                            caption: 'Exportações por município', 
                            url: '/static/charts/sample/exportacoes_rmsp.png',
                            type: 'bubble',
                            description: 'Volume de exportações por município'
                        }
                    ]
                },
                layerVisibility: { 1: true, 2: false, 3: true, 4: false, 5: true, 6: false, 7: true }
            },
            {
                id: 5,
                title: 'Sustentabilidade e Meio Ambiente',
                description: 'Áreas verdes, qualidade do ar e iniciativas sustentáveis',
                mapPosition: { lat: -23.5567, lng: -46.6600, zoom: 12 },
                transition: 'fly-to',
                duration: 2000,
                content: {
                    text: 'A RMSP enfrenta desafios ambientais significativos, mas também possui importantes áreas verdes como o Parque Ibirapuera e a Serra da Cantareira. Iniciativas de sustentabilidade incluem corredores verdes, políticas de redução de emissões e programas de reciclagem.',
                    images: [
                        { 
                            name: 'parque_ibirapuera.jpg', 
                            caption: 'Parque Ibirapuera', 
                            url: '/static/images/sample/parque_ibirapuera.jpg',
                            description: 'Principal parque urbano da cidade de São Paulo'
                        },
                        { 
                            name: 'serra_cantareira.jpg', 
                            caption: 'Serra da Cantareira', 
                            url: '/static/images/sample/serra_cantareira.jpg',
                            description: 'Reserva florestal importante para a qualidade do ar'
                        },
                        { 
                            name: 'corredor_verde.jpg', 
                            caption: 'Corredor verde urbano', 
                            url: '/static/images/sample/corredor_verde.jpg',
                            description: 'Sistema de corredores verdes conectando parques'
                        },
                        { 
                            name: 'energia_solar.jpg', 
                            caption: 'Instalações de energia solar', 
                            url: '/static/images/sample/energia_solar.jpg',
                            description: 'Painéis solares em edifícios públicos'
                        }
                    ],
                    videos: [
                        { 
                            name: 'sustentabilidade_rmsp.mp4', 
                            caption: 'Iniciativas de sustentabilidade', 
                            url: '/static/videos/sample/sustentabilidade_rmsp.mp4',
                            duration: '4:10',
                            description: 'Documentário sobre projetos sustentáveis'
                        },
                        { 
                            name: 'areas_verdes.mp4', 
                            caption: 'Importância das áreas verdes', 
                            url: '/static/videos/sample/areas_verdes.mp4',
                            duration: '2:45',
                            description: 'Benefícios das áreas verdes para a qualidade de vida'
                        }
                    ],
                    documents: [
                        { 
                            name: 'plano_ambiental_rmsp.pdf', 
                            caption: 'Plano Ambiental da RMSP', 
                            url: '/static/documents/sample/plano_ambiental_rmsp.pdf',
                            pages: 112,
                            description: 'Estratégia ambiental para a região metropolitana'
                        },
                        { 
                            name: 'relatorio_qualidade_ar.pdf', 
                            caption: 'Relatório de Qualidade do Ar', 
                            url: '/static/documents/sample/relatorio_qualidade_ar.pdf',
                            pages: 45,
                            description: 'Monitoramento da qualidade do ar regional'
                        }
                    ],
                    charts: [
                        { 
                            name: 'qualidade_ar.png', 
                            caption: 'Índice de qualidade do ar', 
                            url: '/static/charts/sample/qualidade_ar.png',
                            type: 'gauge',
                            description: 'Medidores de qualidade do ar por região'
                        },
                        { 
                            name: 'areas_verdes.png', 
                            caption: 'Distribuição de áreas verdes', 
                            url: '/static/charts/sample/areas_verdes.png',
                            type: 'choropleth',
                            description: 'Mapa de cobertura vegetal por município'
                        },
                        { 
                            name: 'emissoes_co2.png', 
                            caption: 'Emissões de CO2 por setor', 
                            url: '/static/charts/sample/emissoes_co2.png',
                            type: 'stacked-area',
                            description: 'Evolução das emissões ao longo do tempo'
                        }
                    ]
                },
                layerVisibility: { 1: true, 2: false, 3: false, 4: true, 5: false, 6: false, 7: false }
            }
        ]
    }
};

// Função para obter dados de exemplo
function getSampleReport(reportId) {
    return SAMPLE_REPORTS[reportId] || null;
}

// Função para obter lista de relatórios de exemplo
function getSampleReportsList() {
    return Object.values(SAMPLE_REPORTS).map(report => ({
        id: report.id,
        title: report.title,
        description: report.description,
        author: report.author,
        company: report.company,
        created_at: report.created_at,
        updated_at: report.updated_at,
        status: report.status,
        stops_count: report.stops.length
    }));
}

// Função para obter estatísticas dos relatórios
function getSampleReportsStats() {
    const reports = Object.values(SAMPLE_REPORTS);
    const totalStops = reports.reduce((sum, report) => sum + report.stops.length, 0);
    const totalMedia = reports.reduce((sum, report) => {
        return sum + report.stops.reduce((stopSum, stop) => {
            return stopSum + stop.content.images.length + 
                   stop.content.videos.length + 
                   stop.content.documents.length + 
                   stop.content.charts.length;
        }, 0);
    }, 0);

    return {
        total_reports: reports.length,
        total_stops: totalStops,
        total_media: totalMedia,
        published_reports: reports.filter(r => r.status === 'published').length,
        draft_reports: reports.filter(r => r.status === 'draft').length
    };
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SAMPLE_REPORTS = SAMPLE_REPORTS;
    window.getSampleReport = getSampleReport;
    window.getSampleReportsList = getSampleReportsList;
    window.getSampleReportsStats = getSampleReportsStats;
}
