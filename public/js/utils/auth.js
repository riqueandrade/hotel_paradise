// ===== UTILITÁRIOS DE AUTENTICAÇÃO - HOTEL PARADISE =====
// Centraliza todas as funções relacionadas à autenticação

/**
 * Classe para gerenciar autenticação
 */
class AuthManager {
    constructor() {
        this.config = window.APP_CONFIG;
        this.storageKeys = this.config.STORAGE_KEYS;
    }

    // ===== STORAGE MANAGEMENT =====

    /**
     * Salva dados de autenticação
     * @param {Object} data - Dados do usuário
     * @param {string} token - Token JWT
     * @param {boolean} remember - Se deve lembrar do login
     */
    saveAuthData(data, token, remember = false) {
        const storage = remember ? localStorage : sessionStorage;
        const userData = {
            id: data.id,
            nome: data.nome,
            email: data.email,
            tipo_usuario: data.tipo_usuario,
            nivel_acesso: data.nivel_acesso
        };

        storage.setItem(this.storageKeys.TOKEN, token);
        storage.setItem(this.storageKeys.USER_TYPE, data.tipo_usuario);
        storage.setItem(this.storageKeys.USER_DATA, JSON.stringify(userData));
        
        if (remember) {
            localStorage.setItem(this.storageKeys.REMEMBER_LOGIN, 'true');
        }
    }

    /**
     * Obtém token de autenticação
     * @returns {string|null} Token ou null
     */
    getToken() {
        return localStorage.getItem(this.storageKeys.TOKEN) || 
               sessionStorage.getItem(this.storageKeys.TOKEN);
    }

    /**
     * Obtém tipo de usuário
     * @returns {string|null} Tipo de usuário ou null
     */
    getUserType() {
        return localStorage.getItem(this.storageKeys.USER_TYPE) || 
               sessionStorage.getItem(this.storageKeys.USER_TYPE);
    }

    /**
     * Obtém dados do usuário
     * @returns {Object|null} Dados do usuário ou null
     */
    getUserData() {
        const userData = localStorage.getItem(this.storageKeys.USER_DATA) || 
                        sessionStorage.getItem(this.storageKeys.USER_DATA);
        
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Verifica se deve lembrar do login
     * @returns {boolean} True se deve lembrar
     */
    shouldRememberLogin() {
        return localStorage.getItem(this.storageKeys.REMEMBER_LOGIN) === 'true';
    }

    /**
     * Limpa todos os dados de autenticação
     */
    clearAuthData() {
        // Limpar localStorage
        localStorage.removeItem(this.storageKeys.TOKEN);
        localStorage.removeItem(this.storageKeys.USER_TYPE);
        localStorage.removeItem(this.storageKeys.USER_DATA);
        localStorage.removeItem(this.storageKeys.REMEMBER_LOGIN);

        // Limpar sessionStorage
        sessionStorage.removeItem(this.storageKeys.TOKEN);
        sessionStorage.removeItem(this.storageKeys.USER_TYPE);
        sessionStorage.removeItem(this.storageKeys.USER_DATA);
    }

    // ===== AUTHENTICATION CHECKS =====

    /**
     * Verifica se o usuário está autenticado
     * @returns {boolean} True se autenticado
     */
    isAuthenticated() {
        const token = this.getToken();
        const userType = this.getUserType();
        return !!(token && userType);
    }

    /**
     * Verifica se o usuário é funcionário
     * @returns {boolean} True se é funcionário
     */
    isStaff() {
        const userType = this.getUserType();
        return userType === this.config.USER_TYPES.RECEPCIONISTA || 
               userType === this.config.USER_TYPES.ADMINISTRADOR;
    }

    /**
     * Verifica se o usuário é administrador
     * @returns {boolean} True se é administrador
     */
    isAdmin() {
        const userType = this.getUserType();
        return userType === this.config.USER_TYPES.ADMINISTRADOR;
    }

    /**
     * Verifica se o usuário é hóspede
     * @returns {boolean} True se é hóspede
     */
    isGuest() {
        const userType = this.getUserType();
        return userType === this.config.USER_TYPES.HOSPEDE;
    }

    // ===== TOKEN VERIFICATION =====

    /**
     * Verifica se o token é válido no servidor
     * @returns {Promise<boolean>} True se válido
     */
    async verifyToken() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const response = await fetch(`${this.config.API.BASE_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            return false;
        }
    }

    // ===== AUTHENTICATION FLOW =====

    /**
     * Verifica autenticação e redireciona se necessário
     * @param {string} requiredUserType - Tipo de usuário necessário
     * @param {string} redirectUrl - URL para redirecionamento
     * @returns {boolean} True se autenticado corretamente
     */
    checkAuthenticationAndRedirect(requiredUserType = null, redirectUrl = null) {
        const token = this.getToken();
        const userType = this.getUserType();
        const userData = this.getUserData();

        // Verificar se está autenticado
        if (!token || !userType) {
            this.redirectToLogin('Acesso negado. Faça login para continuar.');
            return false;
        }

        // Verificar tipo de usuário se especificado
        if (requiredUserType && userType !== requiredUserType) {
            this.redirectToLogin('Acesso negado. Você não tem permissão para acessar esta área.');
            return false;
        }

        // Verificar se é funcionário (para páginas administrativas)
        if (requiredUserType === 'funcionario' && !this.isStaff()) {
            this.redirectToLogin('Acesso negado. Esta área é exclusiva para funcionários.');
            return false;
        }

        // Atualizar interface com dados do usuário
        this.updateUserInterface(userData);

        return true;
    }

    /**
     * Atualiza interface com dados do usuário
     * @param {Object} userData - Dados do usuário
     */
    updateUserInterface(userData) {
        if (!userData) return;

        // Atualizar nome do usuário
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userData.nome || 'Usuário';
        }

        // Atualizar role do usuário
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement) {
            userRoleElement.textContent = userData.nivel_acesso || userData.tipo_usuario || 'Usuário';
        }

        // Atualizar avatar (iniciais do nome)
        const userAvatarElement = document.querySelector('.user-avatar');
        if (userAvatarElement && userData.nome) {
            const initials = userData.nome.split(' ')
                .map(name => name.charAt(0))
                .join('')
                .substring(0, 2)
                .toUpperCase();
            userAvatarElement.textContent = initials;
        }
    }

    /**
     * Redireciona para página de login
     * @param {string} message - Mensagem a ser exibida
     */
    redirectToLogin(message = null) {
        if (message && window.showAlert) {
            window.showAlert(message, 'warning');
        }

        setTimeout(() => {
            window.location.href = this.config.PATHS.LOGIN;
        }, message ? 2000 : 0);
    }

    /**
     * Faz logout do usuário
     * @param {string} redirectUrl - URL para redirecionamento após logout
     */
    logout(redirectUrl = null) {
        this.clearAuthData();
        
        if (window.showAlert) {
            window.showAlert('Logout realizado com sucesso!', 'success');
        }

        setTimeout(() => {
            window.location.href = redirectUrl || this.config.PATHS.LOGIN;
        }, 1000);
    }

    // ===== EXISTING LOGIN CHECK =====

    /**
     * Verifica se já existe login válido
     * @returns {Promise<boolean>} True se login válido existe
     */
    async checkExistingLogin() {
        if (!this.isAuthenticated()) {
            return false;
        }

        const isValid = await this.verifyToken();
        if (!isValid) {
            this.clearAuthData();
            return false;
        }

        return true;
    }

    /**
     * Redireciona para dashboard baseado no tipo de usuário
     * @param {string} userType - Tipo de usuário
     */
    redirectToDashboard(userType = null) {
        const type = userType || this.getUserType();
        
        if (type === this.config.USER_TYPES.HOSPEDE) {
            window.location.href = '../index.html'; // Área do hóspede
        } else if (this.isStaff()) {
            window.location.href = this.config.PATHS.DASHBOARD;
        } else {
            this.redirectToLogin('Tipo de usuário inválido.');
        }
    }
}

// ===== INSTÂNCIA GLOBAL =====
window.AuthManager = new AuthManager();

// ===== FUNÇÕES GLOBAIS PARA COMPATIBILIDADE =====

/**
 * Função global de verificação de autenticação (compatibilidade)
 * @param {string} requiredType - Tipo de usuário necessário
 * @returns {boolean} True se autenticado
 */
window.checkAuthentication = function(requiredType = 'funcionario') {
    return window.AuthManager.checkAuthenticationAndRedirect(requiredType);
};

/**
 * Função global de logout (compatibilidade)
 */
window.logout = function() {
    window.AuthManager.logout();
};

// Log de inicialização
console.log('🔐 AuthManager carregado e disponível globalmente');
