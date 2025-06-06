// ===== CONFIGURAÇÕES GLOBAIS - HOTEL PARADISE =====
// Sistema de Gestão Hoteleira - Rio Negro, Paraná

/**
 * Configurações centralizadas do sistema
 * Evita duplicação de constantes entre arquivos
 */
window.APP_CONFIG = {
    // ===== CONFIGURAÇÕES DE API =====
    API: {
        BASE_URL: '/api',
        TIMEOUT: 30000, // 30 segundos
        RETRY_ATTEMPTS: 3
    },

    // ===== CHAVES DE ARMAZENAMENTO =====
    STORAGE_KEYS: {
        TOKEN: 'hotel_paradise_token',
        USER_TYPE: 'hotel_paradise_user_type',
        USER_DATA: 'hotel_paradise_user_data',
        REMEMBER_LOGIN: 'hotel_paradise_remember'
    },

    // ===== TIPOS DE USUÁRIO =====
    USER_TYPES: {
        HOSPEDE: 'hospede',
        RECEPCIONISTA: 'recepcionista',
        ADMINISTRADOR: 'administrador'
    },

    // ===== STATUS DE QUARTOS =====
    ROOM_STATUS: {
        DISPONIVEL: 'disponivel',
        OCUPADO: 'ocupado',
        MANUTENCAO: 'manutencao',
        LIMPEZA: 'limpeza'
    },

    // ===== STATUS DE RESERVAS =====
    RESERVATION_STATUS: {
        PENDENTE: 'pendente',
        CONFIRMADA: 'confirmada',
        CHECKIN: 'checkin',
        CHECKOUT: 'checkout',
        CANCELADA: 'cancelada'
    },

    // ===== CONFIGURAÇÕES DE UI =====
    UI: {
        ALERT_TIMEOUT: 5000, // 5 segundos
        LOADING_MIN_TIME: 500, // Tempo mínimo de loading
        ANIMATION_DURATION: 300,
        PAGINATION_SIZE: 10
    },

    // ===== CONFIGURAÇÕES DE VALIDAÇÃO =====
    VALIDATION: {
        PASSWORD_MIN_LENGTH: 6,
        CPF_REGEX: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE_REGEX: /^\(\d{2}\)\s\d{4,5}-\d{4}$/
    },

    // ===== MENSAGENS PADRÃO =====
    MESSAGES: {
        LOADING: 'Carregando...',
        ERROR_GENERIC: 'Erro interno do servidor. Tente novamente.',
        ERROR_NETWORK: 'Erro de conexão. Verifique sua internet.',
        ERROR_AUTH: 'Sessão expirada. Faça login novamente.',
        SUCCESS_SAVE: 'Dados salvos com sucesso!',
        SUCCESS_DELETE: 'Item removido com sucesso!',
        CONFIRM_DELETE: 'Tem certeza que deseja excluir este item?'
    },

    // ===== CONFIGURAÇÕES DE FORMATAÇÃO =====
    FORMAT: {
        CURRENCY: {
            style: 'currency',
            currency: 'BRL',
            locale: 'pt-BR'
        },
        DATE: {
            locale: 'pt-BR',
            options: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }
        },
        DATETIME: {
            locale: 'pt-BR',
            options: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }
        }
    },

    // ===== CONFIGURAÇÕES DE METAS =====
    TARGETS: {
        OCCUPANCY_RATE: 75, // 75% de ocupação
        MONTHLY_REVENUE: 30000, // R$ 30.000 por mês
        ACTIVE_RESERVATIONS: 50, // 50 reservas ativas
        REGISTERED_CLIENTS: 100 // 100 clientes cadastrados
    },

    // ===== CONFIGURAÇÕES DE REFRESH =====
    REFRESH: {
        DASHBOARD_INTERVAL: 5 * 60 * 1000, // 5 minutos
        CLOCK_INTERVAL: 1000, // 1 segundo
        STATS_INTERVAL: 2 * 60 * 1000 // 2 minutos
    },

    // ===== CONFIGURAÇÕES DE PATHS =====
    PATHS: {
        LOGIN: 'login.html',
        DASHBOARD: 'dashboard.html',
        QUARTOS: 'quartos.html',
        RESERVAS: 'reservas.html',
        CLIENTES: 'clientes.html',
        PARTIALS: '../partials/',
        UTILS: '../js/utils/'
    }
};

// ===== FUNÇÕES UTILITÁRIAS DE CONFIGURAÇÃO =====

/**
 * Obtém uma configuração usando notação de ponto
 * @param {string} path - Caminho da configuração (ex: 'API.BASE_URL')
 * @param {*} defaultValue - Valor padrão se não encontrar
 * @returns {*} Valor da configuração
 */
window.getConfig = function(path, defaultValue = null) {
    const keys = path.split('.');
    let current = window.APP_CONFIG;
    
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return defaultValue;
        }
    }
    
    return current;
};

/**
 * Verifica se uma configuração existe
 * @param {string} path - Caminho da configuração
 * @returns {boolean} True se existe
 */
window.hasConfig = function(path) {
    return window.getConfig(path) !== null;
};

/**
 * Formata valor monetário usando configurações
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado
 */
window.formatCurrency = function(value) {
    const config = window.getConfig('FORMAT.CURRENCY');
    return new Intl.NumberFormat(config.locale, {
        style: config.style,
        currency: config.currency
    }).format(value || 0);
};

/**
 * Formata data usando configurações
 * @param {Date|string} date - Data a ser formatada
 * @param {boolean} includeTime - Se deve incluir horário
 * @returns {string} Data formatada
 */
window.formatDate = function(date, includeTime = false) {
    const dateObj = date instanceof Date ? date : new Date(date);
    const configKey = includeTime ? 'FORMAT.DATETIME' : 'FORMAT.DATE';
    const config = window.getConfig(configKey);
    
    return dateObj.toLocaleDateString(config.locale, config.options);
};

/**
 * Obtém label de status traduzido
 * @param {string} status - Status em inglês
 * @param {string} type - Tipo (room, reservation)
 * @returns {string} Label traduzido
 */
window.getStatusLabel = function(status, type = 'room') {
    const labels = {
        room: {
            'disponivel': 'Disponível',
            'ocupado': 'Ocupado',
            'manutencao': 'Manutenção',
            'limpeza': 'Limpeza'
        },
        reservation: {
            'pendente': 'Pendente',
            'confirmada': 'Confirmada',
            'checkin': 'Check-in',
            'checkout': 'Check-out',
            'cancelada': 'Cancelada'
        }
    };
    
    return labels[type]?.[status] || status;
};

// Log de inicialização
console.log('🔧 APP_CONFIG carregado:', window.APP_CONFIG);
