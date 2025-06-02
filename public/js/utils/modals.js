// ===== UTILITÁRIOS PARA MODAIS COMUNS =====

/**
 * Exibe modal de confirmação
 * @param {Object} options - Opções do modal
 * @param {string} options.title - Título do modal
 * @param {string} options.message - Mensagem do modal
 * @param {string} options.confirmText - Texto do botão confirmar
 * @param {string} options.cancelText - Texto do botão cancelar
 * @param {string} options.type - Tipo do modal (danger, warning, info)
 * @param {Function} options.onConfirm - Callback ao confirmar
 * @param {Function} options.onCancel - Callback ao cancelar
 */
function showConfirmModal(options = {}) {
    const {
        title = 'Confirmar Ação',
        message = 'Tem certeza que deseja continuar?',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        type = 'info',
        onConfirm = () => {},
        onCancel = () => {}
    } = options;

    // Elementos do modal
    const modal = document.getElementById('confirmModal');
    const titleElement = document.getElementById('confirmModalTitle');
    const bodyElement = document.getElementById('confirmModalBody');
    const iconElement = document.getElementById('confirmModalIcon');
    const confirmButton = document.getElementById('confirmModalAction');
    const cancelButton = document.getElementById('confirmModalCancel');

    // Configurar conteúdo
    titleElement.textContent = title;
    bodyElement.innerHTML = message;
    confirmButton.textContent = confirmText;
    cancelButton.textContent = cancelText;

    // Configurar ícone e estilo baseado no tipo
    const typeConfig = {
        danger: { icon: 'bi-exclamation-triangle', class: 'btn-danger' },
        warning: { icon: 'bi-exclamation-circle', class: 'btn-warning' },
        info: { icon: 'bi-info-circle', class: 'btn-primary' },
        success: { icon: 'bi-check-circle', class: 'btn-success' }
    };

    const config = typeConfig[type] || typeConfig.info;
    iconElement.className = `${config.icon} me-2`;
    confirmButton.className = `btn ${config.class}`;

    // Configurar eventos
    confirmButton.onclick = () => {
        onConfirm();
        bootstrap.Modal.getInstance(modal)?.hide();
    };

    cancelButton.onclick = () => {
        onCancel();
        bootstrap.Modal.getInstance(modal)?.hide();
    };

    // Exibir modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

/**
 * Exibe modal de loading
 * @param {Object} options - Opções do modal
 * @param {string} options.title - Título do loading
 * @param {string} options.message - Mensagem do loading
 */
function showLoadingModal(options = {}) {
    const {
        title = 'Processando...',
        message = 'Aguarde enquanto processamos sua solicitação.'
    } = options;

    const modal = document.getElementById('loadingModal');
    const titleElement = document.getElementById('loadingModalTitle');
    const textElement = document.getElementById('loadingModalText');

    titleElement.textContent = title;
    textElement.textContent = message;

    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();

    return bootstrapModal;
}

/**
 * Oculta modal de loading
 */
function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    const bootstrapModal = bootstrap.Modal.getInstance(modal);
    if (bootstrapModal) {
        bootstrapModal.hide();
    }
}

/**
 * Exibe modal de alerta
 * @param {Object} options - Opções do modal
 * @param {string} options.title - Título do alerta
 * @param {string} options.message - Mensagem do alerta
 * @param {string} options.type - Tipo do alerta (success, error, warning, info)
 * @param {string} options.buttonText - Texto do botão
 * @param {Function} options.onClose - Callback ao fechar
 */
function showAlertModal(options = {}) {
    const {
        title = 'Informação',
        message = '',
        type = 'info',
        buttonText = 'OK',
        onClose = () => {}
    } = options;

    const modal = document.getElementById('alertModal');
    const headerElement = document.getElementById('alertModalHeader');
    const titleElement = document.getElementById('alertModalTitle');
    const bodyElement = document.getElementById('alertModalBody');
    const iconElement = document.getElementById('alertModalIcon');
    const buttonElement = document.getElementById('alertModalButton');

    // Configurar conteúdo
    titleElement.textContent = title;
    bodyElement.innerHTML = message;
    buttonElement.textContent = buttonText;

    // Configurar estilo baseado no tipo
    const typeConfig = {
        success: { 
            icon: 'bi-check-circle-fill', 
            headerClass: 'bg-success text-white',
            buttonClass: 'btn-success'
        },
        error: { 
            icon: 'bi-x-circle-fill', 
            headerClass: 'bg-danger text-white',
            buttonClass: 'btn-danger'
        },
        warning: { 
            icon: 'bi-exclamation-triangle-fill', 
            headerClass: 'bg-warning text-dark',
            buttonClass: 'btn-warning'
        },
        info: { 
            icon: 'bi-info-circle-fill', 
            headerClass: 'bg-primary text-white',
            buttonClass: 'btn-primary'
        }
    };

    const config = typeConfig[type] || typeConfig.info;
    iconElement.className = `${config.icon} me-2`;
    headerElement.className = `modal-header ${config.headerClass}`;
    buttonElement.className = `btn ${config.buttonClass}`;

    // Configurar evento
    buttonElement.onclick = () => {
        onClose();
        bootstrap.Modal.getInstance(modal)?.hide();
    };

    // Exibir modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

/**
 * Exibe modal de visualização genérico
 * @param {Object} options - Opções do modal
 * @param {string} options.title - Título do modal
 * @param {string} options.content - Conteúdo HTML do modal
 * @param {string} options.icon - Classe do ícone
 * @param {Array} options.actions - Array de botões de ação
 */
function showViewModal(options = {}) {
    const {
        title = 'Visualizar',
        content = '',
        icon = 'bi-eye',
        actions = []
    } = options;

    const modal = document.getElementById('viewModal');
    const titleElement = document.getElementById('viewModalTitle');
    const bodyElement = document.getElementById('viewModalBody');
    const iconElement = document.getElementById('viewModalIcon');
    const actionsElement = document.getElementById('viewModalActions');

    // Configurar conteúdo
    titleElement.textContent = title;
    bodyElement.innerHTML = content;
    iconElement.className = `${icon} me-2`;

    // Configurar ações
    actionsElement.innerHTML = '';
    actions.forEach(action => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn ${action.class || 'btn-primary'} me-2`;
        button.innerHTML = action.text;
        button.onclick = action.onclick || (() => {});
        actionsElement.appendChild(button);
    });

    // Exibir modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

/**
 * Carrega modais específicos da página
 * @param {string} page - Nome da página
 */
async function loadPageModals(page) {
    // Sempre carregar modais comuns
    await loadPartial('../partials/modals-common.html', 'body');
    
    // Carregar específicos conforme necessário
    const specificModals = {
        'reservas': 'modals-reservas.html',
        'quartos': 'modals-quartos.html',
        'clientes': 'modals-clientes.html',
        'funcionarios': 'modals-funcionarios.html'
    };
    
    if (specificModals[page]) {
        await loadPartial(`../partials/${specificModals[page]}`, 'body');
    }
}

// Exportar funções para uso global
window.showConfirmModal = showConfirmModal;
window.showLoadingModal = showLoadingModal;
window.hideLoadingModal = hideLoadingModal;
window.showAlertModal = showAlertModal;
window.showViewModal = showViewModal;
window.loadPageModals = loadPageModals;
