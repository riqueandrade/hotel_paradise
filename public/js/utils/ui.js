// ===== UTILITÁRIOS DE INTERFACE - HOTEL PARADISE =====
// Centraliza funções de UI, alertas, modais e loading

/**
 * Classe para gerenciar interface do usuário
 */
class UIManager {
    constructor() {
        this.config = window.APP_CONFIG;
        this.alertContainer = null;
        this.loadingElements = new Map();
        this.init();
    }

    /**
     * Inicializa o UIManager
     */
    init() {
        this.createAlertContainer();
        this.setupGlobalEventListeners();
    }

    // ===== ALERT SYSTEM =====

    /**
     * Cria container para alertas se não existir
     */
    createAlertContainer() {
        if (!document.getElementById('alertContainer')) {
            const container = document.createElement('div');
            container.id = 'alertContainer';
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
            this.alertContainer = container;
        } else {
            this.alertContainer = document.getElementById('alertContainer');
        }
    }

    /**
     * Exibe alerta na tela
     * @param {string} message - Mensagem do alerta
     * @param {string} type - Tipo do alerta (success, danger, warning, info)
     * @param {number} duration - Duração em ms (0 = não remove automaticamente)
     * @returns {HTMLElement} Elemento do alerta criado
     */
    showAlert(message, type = 'info', duration = null) {
        // Sanitização DOMPurify
        if (window.DOMPurify) {
            message = window.DOMPurify.sanitize(message);
        }
        const alertId = 'alert-' + Date.now();
        const alertDuration = duration || this.config.UI.ALERT_TIMEOUT;
        
        const alertElement = document.createElement('div');
        alertElement.id = alertId;
        alertElement.className = `alert alert-${type} alert-dismissible fade show`;
        alertElement.setAttribute('role', 'alert');
        
        alertElement.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${this.getAlertIcon(type)} me-2"></i>
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        this.alertContainer.appendChild(alertElement);

        // Auto-remover após duração especificada
        if (alertDuration > 0) {
            setTimeout(() => {
                this.removeAlert(alertId);
            }, alertDuration);
        }

        return alertElement;
    }

    /**
     * Remove alerta específico
     * @param {string} alertId - ID do alerta
     */
    removeAlert(alertId) {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.classList.remove('show');
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 150);
        }
    }

    /**
     * Remove todos os alertas
     */
    clearAllAlerts() {
        if (this.alertContainer) {
            this.alertContainer.innerHTML = '';
        }
    }

    /**
     * Obtém ícone para tipo de alerta
     * @param {string} type - Tipo do alerta
     * @returns {string} Classe do ícone
     */
    getAlertIcon(type) {
        const icons = {
            success: 'bi-check-circle-fill',
            danger: 'bi-exclamation-triangle-fill',
            warning: 'bi-exclamation-circle-fill',
            info: 'bi-info-circle-fill'
        };
        return icons[type] || icons.info;
    }

    // ===== LOADING SYSTEM =====

    /**
     * Mostra loading em um elemento específico
     * @param {string|HTMLElement} target - Seletor ou elemento
     * @param {string} text - Texto do loading
     */
    showLoading(target, text = null) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const loadingText = text || this.config.MESSAGES.LOADING;
        const loadingId = 'loading-' + Date.now();

        const loadingElement = document.createElement('div');
        loadingElement.id = loadingId;
        loadingElement.className = 'loading-overlay d-flex flex-column align-items-center justify-content-center';
        loadingElement.innerHTML = `
            <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            <div class="loading-text">${loadingText}</div>
        `;

        // Adicionar estilos inline
        loadingElement.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            z-index: 1000;
            font-size: 0.9rem;
            color: #6c757d;
        `;

        // Garantir que o elemento pai tenha position relative
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(loadingElement);
        this.loadingElements.set(element, loadingId);

        return loadingId;
    }

    /**
     * Remove loading de um elemento
     * @param {string|HTMLElement} target - Seletor ou elemento
     */
    hideLoading(target) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const loadingId = this.loadingElements.get(element);
        if (loadingId) {
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                loadingElement.remove();
            }
            this.loadingElements.delete(element);
        }
    }

    /**
     * Mostra loading global na página
     * @param {string} text - Texto do loading
     */
    showGlobalLoading(text = null) {
        const loadingContainer = document.getElementById('loadingContainer');
        const mainContent = document.getElementById('dashboardContent') || 
                           document.querySelector('.main-content') ||
                           document.querySelector('main');

        if (loadingContainer) {
            if (text) {
                const loadingText = loadingContainer.querySelector('#loadingText');
                if (loadingText) {
                    loadingText.textContent = text;
                }
            }
            loadingContainer.style.display = 'flex';
        }

        if (mainContent) {
            mainContent.style.display = 'none';
        }
    }

    /**
     * Remove loading global da página
     */
    hideGlobalLoading() {
        const loadingContainer = document.getElementById('loadingContainer');
        const mainContent = document.getElementById('dashboardContent') || 
                           document.querySelector('.main-content') ||
                           document.querySelector('main');

        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }

        if (mainContent) {
            mainContent.style.display = 'block';
        }
    }

    // ===== MODAL HELPERS =====

    /**
     * Mostra modal de confirmação
     * @param {string} title - Título do modal
     * @param {string} message - Mensagem do modal
     * @param {Function} onConfirm - Callback de confirmação
     * @param {Function} onCancel - Callback de cancelamento
     */
    showConfirmModal(title, message, onConfirm, onCancel = null) {
        const modalId = 'confirmModal-' + Date.now();
        
        const modalElement = document.createElement('div');
        modalElement.id = modalId;
        modalElement.className = 'modal fade';
        modalElement.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger" id="confirmBtn">Confirmar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modalElement);

        const modal = new bootstrap.Modal(modalElement);
        
        // Event listeners
        modalElement.querySelector('#confirmBtn').addEventListener('click', () => {
            modal.hide();
            if (onConfirm) onConfirm();
        });

        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
            if (onCancel) onCancel();
        });

        modal.show();
        return modal;
    }

    // ===== BUTTON HELPERS =====

    /**
     * Define estado de loading em um botão
     * @param {string|HTMLElement} button - Seletor ou elemento do botão
     * @param {boolean} loading - Se deve mostrar loading
     * @param {string} loadingText - Texto durante loading
     */
    setButtonLoading(button, loading, loadingText = 'Carregando...') {
        const btn = typeof button === 'string' ? document.querySelector(button) : button;
        if (!btn) return;

        if (loading) {
            btn.disabled = true;
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                ${loadingText}
            `;
        } else {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        }
    }

    // ===== FORM HELPERS =====

    /**
     * Limpa erros de validação de um formulário
     * @param {string|HTMLElement} form - Seletor ou elemento do formulário
     */
    clearFormErrors(form) {
        const formElement = typeof form === 'string' ? document.querySelector(form) : form;
        if (!formElement) return;

        // Remover classes de erro
        formElement.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });

        // Remover mensagens de erro
        formElement.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });
    }

    /**
     * Mostra erro em um campo específico
     * @param {string|HTMLElement} field - Seletor ou elemento do campo
     * @param {string} message - Mensagem de erro
     */
    showFieldError(field, message) {
        const fieldElement = typeof field === 'string' ? document.querySelector(field) : field;
        if (!fieldElement) return;

        fieldElement.classList.add('is-invalid');
        
        // Remover feedback anterior
        const existingFeedback = fieldElement.parentNode.querySelector('.invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Adicionar novo feedback
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.textContent = message;
        fieldElement.parentNode.appendChild(feedback);
    }

    // ===== EVENT LISTENERS =====

    /**
     * Configura event listeners globais
     */
    setupGlobalEventListeners() {
        // Fechar alertas ao clicar no X
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-close') && e.target.closest('.alert')) {
                const alert = e.target.closest('.alert');
                this.removeAlert(alert.id);
            }
        });

        // Esc para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.show');
                openModals.forEach(modal => {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                });
            }
        });
    }
}

// ===== INSTÂNCIA GLOBAL =====
window.UIManager = new UIManager();

// ===== FUNÇÕES GLOBAIS PARA COMPATIBILIDADE =====

/**
 * Função global showAlert (compatibilidade)
 */
window.showAlert = function(message, type = 'info', duration = null) {
    return window.UIManager.showAlert(message, type, duration);
};

/**
 * Função global showLoading (compatibilidade)
 */
window.showLoading = function(target = 'body', text = null) {
    if (target === 'body' || !target) {
        window.UIManager.showGlobalLoading(text);
    } else {
        window.UIManager.showLoading(target, text);
    }
};

/**
 * Função global hideLoading (compatibilidade)
 */
window.hideLoading = function(target = 'body') {
    if (target === 'body' || !target) {
        window.UIManager.hideGlobalLoading();
    } else {
        window.UIManager.hideLoading(target);
    }
};

/**
 * Função global setButtonLoading (compatibilidade)
 */
window.setButtonLoading = function(button, loading, text = 'Carregando...') {
    return window.UIManager.setButtonLoading(button, loading, text);
};

// Log de inicialização
console.log('🎨 UIManager carregado e disponível globalmente');
