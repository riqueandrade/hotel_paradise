// ===== UTILITÁRIO PARA CARREGAR PARTIALS =====

/**
 * Carrega um partial HTML e insere no elemento especificado
 * @param {string} partialPath - Caminho para o arquivo partial
 * @param {string} targetSelector - Seletor do elemento onde inserir o partial
 * @returns {Promise<void>}
 */
async function loadPartial(partialPath, targetSelector) {
    try {
        const response = await fetch(partialPath);
        if (!response.ok) {
            throw new Error(`Erro ao carregar partial: ${response.status}`);
        }
        
        const html = await response.text();
        const targetElement = document.querySelector(targetSelector);
        
        if (targetElement) {
            targetElement.innerHTML = html;
        } else {
            console.error(`Elemento não encontrado: ${targetSelector}`);
        }
    } catch (error) {
        console.error('Erro ao carregar partial:', error);
    }
}

/**
 * Carrega múltiplos partials
 * @param {Array<{path: string, target: string}>} partials - Array de objetos com path e target
 * @returns {Promise<void>}
 */
async function loadPartials(partials) {
    const promises = partials.map(partial => 
        loadPartial(partial.path, partial.target)
    );
    
    await Promise.all(promises);
}

/**
 * Configura a página atual na sidebar
 * @param {string} currentPage - Nome da página atual (ex: 'dashboard', 'reservas')
 */
function setActivePage(currentPage) {
    // Remove active de todos os links
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Adiciona active ao link da página atual
    const currentLink = document.querySelector(`.sidebar .nav-link[data-page="${currentPage}"]`);
    if (currentLink) {
        currentLink.classList.add('active');
    }
}

/**
 * Configura o título e subtítulo da página
 * @param {string} title - Título da página
 * @param {string} subtitle - Subtítulo da página
 * @param {string} icon - Classe do ícone Bootstrap
 */
function setPageTitle(title, subtitle, icon = 'bi-speedometer2') {
    const titleElement = document.getElementById('pageTitleText');
    const subtitleElement = document.getElementById('pageSubtitle');
    const iconElement = document.getElementById('pageIcon');
    
    if (titleElement) titleElement.textContent = title;
    if (subtitleElement) subtitleElement.textContent = subtitle;
    if (iconElement) iconElement.className = `${icon} me-2`;
}

/**
 * Adiciona botões específicos da página no header
 * @param {string} buttonsHtml - HTML dos botões
 */
function setHeaderButtons(buttonsHtml) {
    const headerButtons = document.getElementById('headerButtons');
    if (headerButtons) {
        headerButtons.innerHTML = buttonsHtml;
    }
}

/**
 * Configura o texto do loading
 * @param {string} text - Texto a ser exibido no loading
 */
function setLoadingText(text) {
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
        loadingText.textContent = text;
    }
}

/**
 * Inicializa os partials básicos de uma página
 * @param {Object} config - Configuração da página
 * @param {string} config.page - Nome da página
 * @param {string} config.title - Título da página
 * @param {string} config.subtitle - Subtítulo da página
 * @param {string} config.icon - Ícone da página
 * @param {string} config.loadingText - Texto do loading
 * @param {string} config.headerButtons - HTML dos botões do header
 */
async function initializePage(config) {
    // Carregar partials básicos
    await loadPartials([
        { path: '../partials/loading.html', target: 'body' },
        { path: '../partials/sidebar.html', target: '.dashboard-wrapper' },
        { path: '../partials/header.html', target: '.main-content' }
    ]);
    
    // Configurar página
    setActivePage(config.page);
    setPageTitle(config.title, config.subtitle, config.icon);
    setLoadingText(config.loadingText || 'Carregando...');
    
    if (config.headerButtons) {
        setHeaderButtons(config.headerButtons);
    }
    
    // Configurar sidebar toggle
    setupSidebarToggle();

    // Iniciar relógio
    startClock();
}

/**
 * Configura o toggle da sidebar
 */
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggleMobile');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
}

/**
 * Mostra a tela de loading
 */
function showLoading() {
    const loadingContainer = document.getElementById('loadingContainer');
    const dashboardContent = document.getElementById('dashboardContent');

    if (loadingContainer) loadingContainer.style.display = 'flex';
    if (dashboardContent) dashboardContent.style.display = 'none';
}

/**
 * Oculta a tela de loading e mostra o conteúdo
 */
function hideLoading() {
    const loadingContainer = document.getElementById('loadingContainer');
    const dashboardContent = document.getElementById('dashboardContent');

    if (loadingContainer) loadingContainer.style.display = 'none';
    if (dashboardContent) dashboardContent.style.display = 'block';
}

/**
 * Função de logout reutilizável
 */
function logout() {
    // Chaves de armazenamento
    const STORAGE_KEYS = {
        TOKEN: 'hotel_token',
        USER_TYPE: 'hotel_user_type',
        USER_DATA: 'hotel_user_data'
    };

    // Limpar dados de autenticação
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_TYPE);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER_TYPE);
    sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);

    // Redirecionar para login
    window.location.href = '../login-funcionario.html';
}

/**
 * Atualiza o relógio no header
 */
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const clockElement = document.getElementById('currentTime');
    if (clockElement) {
        clockElement.innerHTML = `
            <div class="time">${timeString}</div>
            <div class="date">${dateString}</div>
        `;
    }
}

/**
 * Inicia o relógio automático
 */
function startClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

// Exportar funções para uso global
window.loadPartial = loadPartial;
window.loadPartials = loadPartials;
window.setActivePage = setActivePage;
window.setPageTitle = setPageTitle;
window.setHeaderButtons = setHeaderButtons;
window.setLoadingText = setLoadingText;
window.initializePage = initializePage;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.logout = logout;
window.updateClock = updateClock;
window.startClock = startClock;
