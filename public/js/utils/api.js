// ===== UTILITÁRIOS DE API - HOTEL PARADISE =====
// Centraliza todas as chamadas de API e tratamento de erros

/**
 * Classe para gerenciar chamadas de API
 */
class ApiManager {
    constructor() {
        this.config = window.APP_CONFIG;
        this.baseUrl = this.config.API.BASE_URL;
        this.timeout = this.config.API.TIMEOUT;
        this.retryAttempts = this.config.API.RETRY_ATTEMPTS;
    }

    // ===== CORE FETCH METHODS =====

    /**
     * Faz requisição autenticada para API
     * @param {string} url - URL da requisição
     * @param {Object} options - Opções da requisição
     * @returns {Promise<Object>} Resposta da API
     */
    async fetchWithAuth(url, options = {}) {
        const token = window.AuthManager?.getToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        // Adicionar timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...mergedOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Verificar se a resposta é ok
            if (!response.ok) {
                await this.handleHttpError(response);
                return null;
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            this.handleNetworkError(error);
            throw error;
        }
    }

    /**
     * Faz requisição GET autenticada
     * @param {string} endpoint - Endpoint da API
     * @param {Object} params - Parâmetros de query
     * @returns {Promise<Object>} Resposta da API
     */
    async get(endpoint, params = {}) {
        const url = this.buildUrl(endpoint, params);
        return await this.fetchWithAuth(url, { method: 'GET' });
    }

    /**
     * Faz requisição POST autenticada
     * @param {string} endpoint - Endpoint da API
     * @param {Object} data - Dados a serem enviados
     * @returns {Promise<Object>} Resposta da API
     */
    async post(endpoint, data = {}) {
        const url = this.buildUrl(endpoint);
        return await this.fetchWithAuth(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Faz requisição PUT autenticada
     * @param {string} endpoint - Endpoint da API
     * @param {Object} data - Dados a serem enviados
     * @returns {Promise<Object>} Resposta da API
     */
    async put(endpoint, data = {}) {
        const url = this.buildUrl(endpoint);
        return await this.fetchWithAuth(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Faz requisição PATCH autenticada
     * @param {string} endpoint - Endpoint da API
     * @param {Object} data - Dados a serem enviados
     * @returns {Promise<Object>} Resposta da API
     */
    async patch(endpoint, data = {}) {
        const url = this.buildUrl(endpoint);
        return await this.fetchWithAuth(url, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    /**
     * Faz requisição DELETE autenticada
     * @param {string} endpoint - Endpoint da API
     * @returns {Promise<Object>} Resposta da API
     */
    async delete(endpoint) {
        const url = this.buildUrl(endpoint);
        return await this.fetchWithAuth(url, { method: 'DELETE' });
    }

    // ===== UTILITY METHODS =====

    /**
     * Constrói URL completa com parâmetros
     * @param {string} endpoint - Endpoint da API
     * @param {Object} params - Parâmetros de query
     * @returns {string} URL completa
     */
    buildUrl(endpoint, params = {}) {
        const url = new URL(endpoint, window.location.origin + this.baseUrl);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });

        return url.toString();
    }

    /**
     * Trata erros HTTP
     * @param {Response} response - Resposta da requisição
     */
    async handleHttpError(response) {
        const status = response.status;
        let errorData = null;

        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { error: 'Erro desconhecido' };
        }

        switch (status) {
            case 401:
                // Token inválido ou expirado
                if (window.AuthManager) {
                    window.AuthManager.clearAuthData();
                    window.AuthManager.redirectToLogin('Sessão expirada. Faça login novamente.');
                }
                break;

            case 403:
                // Acesso negado
                if (window.showAlert) {
                    window.showAlert('Acesso negado. Você não tem permissão para esta ação.', 'danger');
                }
                break;

            case 404:
                // Recurso não encontrado
                if (window.showAlert) {
                    window.showAlert('Recurso não encontrado.', 'warning');
                }
                break;

            case 409:
                // Conflito (ex: CPF já cadastrado)
                if (window.showAlert) {
                    window.showAlert(errorData.error || 'Conflito nos dados enviados.', 'warning');
                }
                break;

            case 422:
                // Dados inválidos
                if (window.showAlert) {
                    window.showAlert(errorData.error || 'Dados inválidos.', 'warning');
                }
                break;

            case 429:
                // Rate limit
                if (window.showAlert) {
                    window.showAlert('Muitas tentativas. Aguarde alguns minutos.', 'warning');
                }
                break;

            case 500:
            default:
                // Erro interno do servidor
                if (window.showAlert) {
                    window.showAlert(
                        errorData.error || this.config.MESSAGES.ERROR_GENERIC,
                        'danger'
                    );
                }
                break;
        }

        console.error(`HTTP Error ${status}:`, errorData);
    }

    /**
     * Trata erros de rede
     * @param {Error} error - Erro capturado
     */
    handleNetworkError(error) {
        console.error('Network Error:', error);

        if (error.name === 'AbortError') {
            if (window.showAlert) {
                window.showAlert('Requisição cancelada por timeout.', 'warning');
            }
        } else if (!navigator.onLine) {
            if (window.showAlert) {
                window.showAlert('Sem conexão com a internet.', 'danger');
            }
        } else {
            if (window.showAlert) {
                window.showAlert(this.config.MESSAGES.ERROR_NETWORK, 'danger');
            }
        }
    }

    // ===== SPECIALIZED API METHODS =====

    /**
     * Faz login de usuário
     * @param {string} userType - Tipo de usuário (hospede/funcionario)
     * @param {Object} credentials - Credenciais de login
     * @returns {Promise<Object>} Dados do usuário e token
     */
    async login(userType, credentials) {
        return await this.post(`/auth/login/${userType}`, credentials);
    }

    /**
     * Registra novo hóspede
     * @param {Object} userData - Dados do usuário
     * @returns {Promise<Object>} Dados do usuário criado
     */
    async register(userData) {
        return await this.post('/auth/register/hospede', userData);
    }

    /**
     * Verifica token de autenticação
     * @returns {Promise<Object>} Dados de verificação
     */
    async verifyToken() {
        return await this.get('/auth/verify');
    }

    /**
     * Obtém estatísticas de quartos
     * @returns {Promise<Object>} Estatísticas
     */
    async getRoomStatistics() {
        return await this.get('/quartos/admin/statistics');
    }

    /**
     * Obtém estatísticas de reservas
     * @returns {Promise<Object>} Estatísticas
     */
    async getReservationStatistics() {
        return await this.get('/reservas/statistics');
    }

    /**
     * Obtém estatísticas de clientes
     * @returns {Promise<Object>} Estatísticas
     */
    async getClientStatistics() {
        return await this.get('/clientes/statistics');
    }

    /**
     * Obtém reservas de hoje
     * @returns {Promise<Object>} Reservas do dia
     */
    async getTodayReservations() {
        return await this.get('/reservas/today');
    }
}

// ===== INSTÂNCIA GLOBAL =====
window.ApiManager = new ApiManager();

// ===== FUNÇÕES GLOBAIS PARA COMPATIBILIDADE =====

/**
 * Função global fetchWithAuth (compatibilidade)
 * @param {string} url - URL da requisição
 * @param {Object} options - Opções da requisição
 * @returns {Promise<Object>} Resposta da API
 */
window.fetchWithAuth = function(url, options = {}) {
    return window.ApiManager.fetchWithAuth(url, options);
};

/**
 * Função global para chamadas GET
 * @param {string} endpoint - Endpoint da API
 * @param {Object} params - Parâmetros de query
 * @returns {Promise<Object>} Resposta da API
 */
window.apiGet = function(endpoint, params = {}) {
    return window.ApiManager.get(endpoint, params);
};

/**
 * Função global para chamadas POST
 * @param {string} endpoint - Endpoint da API
 * @param {Object} data - Dados a serem enviados
 * @returns {Promise<Object>} Resposta da API
 */
window.apiPost = function(endpoint, data = {}) {
    return window.ApiManager.post(endpoint, data);
};

/**
 * Função global para chamadas PUT
 * @param {string} endpoint - Endpoint da API
 * @param {Object} data - Dados a serem enviados
 * @returns {Promise<Object>} Resposta da API
 */
window.apiPut = function(endpoint, data = {}) {
    return window.ApiManager.put(endpoint, data);
};

/**
 * Função global para chamadas DELETE
 * @param {string} endpoint - Endpoint da API
 * @returns {Promise<Object>} Resposta da API
 */
window.apiDelete = function(endpoint) {
    return window.ApiManager.delete(endpoint);
};

// Log de inicialização
console.log('🌐 ApiManager carregado e disponível globalmente');
