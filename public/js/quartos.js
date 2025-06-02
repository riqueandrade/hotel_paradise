// ===== CONFIGURAÇÕES E CONSTANTES =====
const API_BASE_URL = '/api';
const STORAGE_KEYS = {
    TOKEN: 'hotel_paradise_token',
    USER_TYPE: 'hotel_paradise_user_type',
    USER_DATA: 'hotel_paradise_user_data'
};

// Variáveis globais
let currentPage = 1;
let currentFilters = {};
let currentView = 'grid';
let isLoading = false;
let roomsData = [];
let currentEditingRoom = null;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeRoomsPage();
});

async function initializeRoomsPage() {
    // Verificar autenticação
    if (!checkAuthentication()) {
        return;
    }
    
    // Configurar interface
    setupInterface();
    
    // Carregar dados iniciais
    await loadInitialData();
}

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
function checkAuthentication() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    const userType = localStorage.getItem(STORAGE_KEYS.USER_TYPE) || sessionStorage.getItem(STORAGE_KEYS.USER_TYPE);
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA) || sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
    
    if (!token || userType !== 'funcionario') {
        showAlert('Acesso negado. Redirecionando para login...', 'danger');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }
    
    // Exibir dados do usuário
    if (userData) {
        const user = JSON.parse(userData);
        document.getElementById('userName').textContent = user.nome || 'Funcionário';
        document.getElementById('userRole').textContent = user.nivel_acesso || 'Funcionário';
    }
    
    return true;
}

// ===== CONFIGURAÇÃO DA INTERFACE =====
function setupInterface() {
    // Configurar sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggleMain');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    // Configurar event listeners
    setupEventListeners();
}

// ===== CONFIGURAR EVENT LISTENERS =====
function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Botão adicionar quarto
    const addRoomBtn = document.getElementById('addRoomBtn');
    if (addRoomBtn) {
        addRoomBtn.addEventListener('click', showAddRoomModal);
    }
    
    // Filtros
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Mudança de visualização
    const viewGrid = document.getElementById('viewGrid');
    const viewList = document.getElementById('viewList');
    
    if (viewGrid) {
        viewGrid.addEventListener('click', () => changeView('grid'));
    }
    
    if (viewList) {
        viewList.addEventListener('click', () => changeView('list'));
    }
    
    // Modal de quarto
    const saveRoomBtn = document.getElementById('saveRoomBtn');
    if (saveRoomBtn) {
        saveRoomBtn.addEventListener('click', saveRoom);
    }
    
    // Links "Coming Soon"
    const comingSoonLinks = document.querySelectorAll('[data-coming-soon]');
    comingSoonLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const feature = this.getAttribute('data-coming-soon');
            showComingSoon(feature);
        });
    });
    
    // Checkboxes de comodidades
    const amenityCheckboxes = document.querySelectorAll('.amenity-checkbox input[type="checkbox"]');
    amenityCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.closest('.amenity-checkbox');
            if (this.checked) {
                label.classList.add('checked');
            } else {
                label.classList.remove('checked');
            }
        });
    });
}

// ===== CARREGAMENTO DE DADOS INICIAIS =====
async function loadInitialData() {
    try {
        // Carregar estatísticas
        await loadStatistics();
        
        // Carregar lista de quartos
        await loadRooms();
        
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        showAlert('Erro ao carregar dados. Tente novamente.', 'danger');
    }
}

// ===== CARREGAR ESTATÍSTICAS =====
async function loadStatistics() {
    try {
        const response = await fetchWithAuth('/api/quartos/admin/statistics');
        
        if (response && response.statistics) {
            const stats = response.statistics;
            
            document.getElementById('totalRooms').textContent = stats.total_quartos || 0;
            document.getElementById('availableRooms').textContent = stats.disponiveis || 0;
            document.getElementById('occupiedRooms').textContent = stats.ocupados || 0;
            document.getElementById('maintenanceRooms').textContent = (stats.manutencao || 0) + (stats.limpeza || 0);
        }
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// ===== CARREGAR LISTA DE QUARTOS =====
async function loadRooms(page = 1, filters = {}) {
    if (isLoading) return;
    
    try {
        isLoading = true;
        currentPage = page;
        currentFilters = filters;
        
        // Mostrar loading
        showLoading(true);
        
        // Construir parâmetros da query
        const params = new URLSearchParams({
            page: page,
            limit: 12,
            ...filters
        });
        
        const response = await fetchWithAuth(`/api/quartos?${params}`);
        
        if (response && response.quartos) {
            roomsData = response.quartos;
            
            // Renderizar quartos
            renderRooms(response.quartos);
            
            // Renderizar paginação
            renderPagination(response.pagination);
            
            // Atualizar contador
            updateRoomsCount(response.pagination.total);
        }
        
    } catch (error) {
        console.error('Erro ao carregar quartos:', error);
        showAlert('Erro ao carregar lista de quartos.', 'danger');
        showEmptyState('Erro ao carregar quartos');
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

// ===== RENDERIZAR QUARTOS =====
function renderRooms(quartos) {
    const container = document.getElementById('roomsContainer');
    
    if (!quartos || quartos.length === 0) {
        showEmptyState('Nenhum quarto encontrado');
        return;
    }
    
    // Aplicar classe de visualização
    container.className = currentView === 'grid' ? 'rooms-grid-view' : 'rooms-list-view';
    
    container.innerHTML = quartos.map(quarto => createRoomCard(quarto)).join('');
    
    // Adicionar event listeners para os cards
    addRoomCardListeners();
    
    // Mostrar container
    container.style.display = 'block';
}

// ===== CRIAR CARD DE QUARTO =====
function createRoomCard(quarto) {
    const amenities = [];
    if (quarto.tem_sacada) amenities.push('<span class="amenity-badge active"><i class="bi bi-door-open"></i> Sacada</span>');
    if (quarto.tem_frigobar) amenities.push('<span class="amenity-badge active"><i class="bi bi-cup"></i> Frigobar</span>');
    if (quarto.tem_ar_condicionado) amenities.push('<span class="amenity-badge active"><i class="bi bi-snow"></i> A/C</span>');
    if (quarto.tem_tv) amenities.push('<span class="amenity-badge active"><i class="bi bi-tv"></i> TV</span>');
    if (quarto.tem_wifi) amenities.push('<span class="amenity-badge active"><i class="bi bi-wifi"></i> Wi-Fi</span>');
    
    return `
        <div class="room-card" data-room-id="${quarto.id}">
            <div class="room-card-header">
                <h4 class="room-number">Quarto ${quarto.numero}</h4>
                <p class="room-type">${getRoomTypeLabel(quarto.tipo)}</p>
                <span class="room-status-badge status-${quarto.status}">
                    ${getStatusLabel(quarto.status)}
                </span>
            </div>
            <div class="room-card-body">
                <div class="room-details">
                    <div class="room-detail-item">
                        <i class="bi bi-people"></i>
                        <span>Capacidade: ${quarto.capacidade_maxima} pessoas</span>
                    </div>
                    <div class="room-detail-item">
                        <i class="bi bi-eye"></i>
                        <span>Vista: ${getViewLabel(quarto.vista)}</span>
                    </div>
                    ${quarto.andar ? `
                        <div class="room-detail-item">
                            <i class="bi bi-building"></i>
                            <span>Andar: ${quarto.andar}º</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="room-price">
                    R$ ${parseFloat(quarto.preco_diaria).toFixed(2)}/dia
                </div>
                
                <div class="room-amenities">
                    ${amenities.join('')}
                </div>
                
                <div class="room-actions">
                    <button class="btn btn-outline-primary btn-sm" data-action="edit" data-room-id="${quarto.id}">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                                data-bs-toggle="dropdown">
                            <i class="bi bi-gear"></i> Status
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" data-action="status" data-room-id="${quarto.id}" data-status="disponivel">
                                <i class="bi bi-check-circle text-success"></i> Disponível
                            </a></li>
                            <li><a class="dropdown-item" href="#" data-action="status" data-room-id="${quarto.id}" data-status="ocupado">
                                <i class="bi bi-person-fill text-danger"></i> Ocupado
                            </a></li>
                            <li><a class="dropdown-item" href="#" data-action="status" data-room-id="${quarto.id}" data-status="manutencao">
                                <i class="bi bi-tools text-warning"></i> Manutenção
                            </a></li>
                            <li><a class="dropdown-item" href="#" data-action="status" data-room-id="${quarto.id}" data-status="limpeza">
                                <i class="bi bi-droplet text-info"></i> Limpeza
                            </a></li>
                        </ul>
                    </div>
                    <button class="btn btn-outline-danger btn-sm" data-action="delete" data-room-id="${quarto.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===== FUNÇÕES UTILITÁRIAS =====
async function fetchWithAuth(url) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

function getRoomTypeLabel(tipo) {
    const types = {
        'casal': 'Casal',
        'suite': 'Suíte',
        'casal_solteiro': 'Casal + Solteiro',
        'familia': 'Família'
    };
    return types[tipo] || tipo;
}

function getStatusLabel(status) {
    const labels = {
        'disponivel': 'Disponível',
        'ocupado': 'Ocupado',
        'manutencao': 'Manutenção',
        'limpeza': 'Limpeza'
    };
    return labels[status] || status;
}

function getViewLabel(vista) {
    const views = {
        'cidade': 'Cidade',
        'jardim': 'Jardim',
        'montanha': 'Montanha',
        'interna': 'Interna'
    };
    return views[vista] || vista;
}

function showLoading(show) {
    const loadingContainer = document.getElementById('loadingRooms');
    const roomsContainer = document.getElementById('roomsContainer');
    
    if (show) {
        loadingContainer.style.display = 'flex';
        roomsContainer.style.display = 'none';
    } else {
        loadingContainer.style.display = 'none';
        roomsContainer.style.display = 'block';
    }
}

function showEmptyState(message) {
    const container = document.getElementById('roomsContainer');
    container.innerHTML = `
        <div class="empty-state">
            <i class="bi bi-house"></i>
            <h5>Nenhum quarto encontrado</h5>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="clearFilters()">
                <i class="bi bi-arrow-clockwise me-2"></i>Limpar Filtros
            </button>
        </div>
    `;
    container.style.display = 'block';
}

function updateRoomsCount(total) {
    const countElement = document.getElementById('roomsCount');
    if (countElement) {
        countElement.textContent = `${total} quarto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    }
}

function logout() {
    // Limpar dados armazenados
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_TYPE);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER_TYPE);
    sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
    
    // Redirecionar para login
    window.location.href = 'login.html';
}

function showComingSoon(feature) {
    showAlert(`${feature} será implementado em breve!`, 'info');
}

// ===== FUNÇÕES DE FILTROS =====
function applyFilters() {
    const filters = {
        numero: document.getElementById('searchNumber').value.trim(),
        status: document.getElementById('filterStatus').value,
        tipo: document.getElementById('filterType').value,
        capacidade_minima: document.getElementById('filterCapacity').value
    };

    // Remover filtros vazios
    Object.keys(filters).forEach(key => {
        if (!filters[key]) {
            delete filters[key];
        }
    });

    loadRooms(1, filters);
}

function clearFilters() {
    document.getElementById('searchNumber').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterCapacity').value = '';

    loadRooms(1, {});
}

// ===== FUNÇÕES DE VISUALIZAÇÃO =====
function changeView(view) {
    currentView = view;

    // Atualizar botões
    const viewGrid = document.getElementById('viewGrid');
    const viewList = document.getElementById('viewList');

    if (view === 'grid') {
        viewGrid.classList.add('active');
        viewList.classList.remove('active');
    } else {
        viewList.classList.add('active');
        viewGrid.classList.remove('active');
    }

    // Re-renderizar quartos
    renderRooms(roomsData);
}

// ===== FUNÇÕES DO MODAL =====
function showAddRoomModal() {
    currentEditingRoom = null;
    document.getElementById('roomModalTitle').textContent = 'Novo Quarto';
    document.getElementById('roomForm').reset();

    // Resetar checkboxes de comodidades
    const checkboxes = document.querySelectorAll('.amenity-checkbox');
    checkboxes.forEach(checkbox => {
        const input = checkbox.querySelector('input[type="checkbox"]');
        if (input.checked) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
    });

    const modal = new bootstrap.Modal(document.getElementById('roomModal'));
    modal.show();
}

function showEditRoomModal(roomId) {
    const room = roomsData.find(r => r.id == roomId);
    if (!room) return;

    currentEditingRoom = room;
    document.getElementById('roomModalTitle').textContent = `Editar Quarto ${room.numero}`;

    // Preencher formulário
    document.getElementById('roomNumber').value = room.numero;
    document.getElementById('roomFloor').value = room.andar || '';
    document.getElementById('roomType').value = room.tipo;
    document.getElementById('roomCapacity').value = room.capacidade_maxima;
    document.getElementById('roomPrice').value = room.preco_diaria;
    document.getElementById('roomView').value = room.vista;
    document.getElementById('roomDescription').value = room.descricao || '';

    // Preencher comodidades
    document.getElementById('roomBalcony').checked = room.tem_sacada;
    document.getElementById('roomFrigobar').checked = room.tem_frigobar;
    document.getElementById('roomAC').checked = room.tem_ar_condicionado;
    document.getElementById('roomTV').checked = room.tem_tv;
    document.getElementById('roomWifi').checked = room.tem_wifi;

    // Atualizar visual dos checkboxes
    const checkboxes = document.querySelectorAll('.amenity-checkbox');
    checkboxes.forEach(checkbox => {
        const input = checkbox.querySelector('input[type="checkbox"]');
        if (input.checked) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
    });

    const modal = new bootstrap.Modal(document.getElementById('roomModal'));
    modal.show();
}

async function saveRoom() {
    const form = document.getElementById('roomForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const saveBtn = document.getElementById('saveRoomBtn');
    const originalText = saveBtn.innerHTML;

    try {
        // Mostrar loading
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Salvando...';

        const roomData = {
            numero: document.getElementById('roomNumber').value,
            andar: document.getElementById('roomFloor').value || null,
            tipo: document.getElementById('roomType').value,
            capacidade_maxima: parseInt(document.getElementById('roomCapacity').value),
            preco_diaria: parseFloat(document.getElementById('roomPrice').value),
            vista: document.getElementById('roomView').value,
            descricao: document.getElementById('roomDescription').value || null,
            tem_sacada: document.getElementById('roomBalcony').checked ? 1 : 0,
            tem_frigobar: document.getElementById('roomFrigobar').checked ? 1 : 0,
            tem_ar_condicionado: document.getElementById('roomAC').checked ? 1 : 0,
            tem_tv: document.getElementById('roomTV').checked ? 1 : 0,
            tem_wifi: document.getElementById('roomWifi').checked ? 1 : 0
        };

        const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
        let response;

        if (currentEditingRoom) {
            // Editar quarto existente
            response = await fetch(`${API_BASE_URL}/quartos/${currentEditingRoom.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(roomData)
            });
        } else {
            // Criar novo quarto
            response = await fetch(`${API_BASE_URL}/quartos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(roomData)
            });
        }

        const result = await response.json();

        if (response.ok) {
            showAlert(result.message || 'Quarto salvo com sucesso!', 'success');

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('roomModal'));
            modal.hide();

            // Recarregar dados
            await loadStatistics();
            await loadRooms(currentPage, currentFilters);

        } else {
            showAlert(result.error || 'Erro ao salvar quarto.', 'danger');
        }

    } catch (error) {
        console.error('Erro ao salvar quarto:', error);
        showAlert('Erro de conexão. Tente novamente.', 'danger');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

// ===== EVENT LISTENERS DOS CARDS =====
function addRoomCardListeners() {
    // Botões de editar
    const editButtons = document.querySelectorAll('[data-action="edit"]');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const roomId = this.getAttribute('data-room-id');
            showEditRoomModal(roomId);
        });
    });

    // Botões de mudança de status
    const statusButtons = document.querySelectorAll('[data-action="status"]');
    statusButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const roomId = this.getAttribute('data-room-id');
            const status = this.getAttribute('data-status');
            changeRoomStatus(roomId, status);
        });
    });

    // Botões de deletar
    const deleteButtons = document.querySelectorAll('[data-action="delete"]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const roomId = this.getAttribute('data-room-id');
            deleteRoom(roomId);
        });
    });
}

// ===== FUNÇÕES DE AÇÕES =====
async function changeRoomStatus(roomId, newStatus) {
    try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);

        const response = await fetch(`${API_BASE_URL}/quartos/${roomId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();

        if (response.ok) {
            showAlert(`Status alterado para ${getStatusLabel(newStatus)}`, 'success');

            // Recarregar dados
            await loadStatistics();
            await loadRooms(currentPage, currentFilters);
        } else {
            showAlert(result.error || 'Erro ao alterar status.', 'danger');
        }

    } catch (error) {
        console.error('Erro ao alterar status:', error);
        showAlert('Erro de conexão. Tente novamente.', 'danger');
    }
}

async function deleteRoom(roomId) {
    const room = roomsData.find(r => r.id == roomId);
    if (!room) return;

    if (!confirm(`Tem certeza que deseja deletar o Quarto ${room.numero}?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);

        const response = await fetch(`${API_BASE_URL}/quartos/${roomId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            showAlert(`Quarto ${room.numero} deletado com sucesso!`, 'success');

            // Recarregar dados
            await loadStatistics();
            await loadRooms(currentPage, currentFilters);
        } else {
            showAlert(result.error || 'Erro ao deletar quarto.', 'danger');
        }

    } catch (error) {
        console.error('Erro ao deletar quarto:', error);
        showAlert('Erro de conexão. Tente novamente.', 'danger');
    }
}

// ===== PAGINAÇÃO =====
function renderPagination(pagination) {
    const container = document.getElementById('paginationContainer');
    const paginationElement = document.getElementById('pagination');

    if (!pagination || pagination.pages <= 1) {
        container.style.display = 'none';
        return;
    }

    let paginationHTML = '';

    // Botão anterior
    if (pagination.page > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="${pagination.page - 1}">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `;
    }

    // Páginas
    for (let i = 1; i <= pagination.pages; i++) {
        if (i === pagination.page) {
            paginationHTML += `
                <li class="page-item active">
                    <span class="page-link">${i}</span>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
    }

    // Botão próximo
    if (pagination.page < pagination.pages) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="${pagination.page + 1}">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `;
    }

    paginationElement.innerHTML = paginationHTML;

    // Adicionar event listeners
    const pageLinks = paginationElement.querySelectorAll('a[data-page]');
    pageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            loadRooms(page, currentFilters);
        });
    });

    container.style.display = 'block';
}

// ===== ALERTAS =====
function showAlert(message, type) {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Criar novo alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Aplicar estilos inline para garantir que funcionem
    if (type === 'success') {
        alertDiv.style.backgroundColor = 'rgba(39, 174, 96, 0.1)';
        alertDiv.style.color = '#27AE60';
        alertDiv.style.borderLeft = '4px solid #27AE60';
        alertDiv.style.border = '1px solid rgba(39, 174, 96, 0.3)';
        alertDiv.style.borderRadius = '8px';
        alertDiv.style.fontWeight = '500';
    } else if (type === 'danger') {
        alertDiv.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
        alertDiv.style.color = '#E74C3C';
        alertDiv.style.borderLeft = '4px solid #E74C3C';
        alertDiv.style.border = '1px solid rgba(231, 76, 60, 0.3)';
        alertDiv.style.borderRadius = '8px';
        alertDiv.style.fontWeight = '500';
    } else if (type === 'info') {
        alertDiv.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
        alertDiv.style.color = '#3498DB';
        alertDiv.style.borderLeft = '4px solid #3498DB';
        alertDiv.style.border = '1px solid rgba(52, 152, 219, 0.3)';
        alertDiv.style.borderRadius = '8px';
        alertDiv.style.fontWeight = '500';
    } else if (type === 'warning') {
        alertDiv.style.backgroundColor = 'rgba(243, 156, 18, 0.1)';
        alertDiv.style.color = '#F39C12';
        alertDiv.style.borderLeft = '4px solid #F39C12';
        alertDiv.style.border = '1px solid rgba(243, 156, 18, 0.3)';
        alertDiv.style.borderRadius = '8px';
        alertDiv.style.fontWeight = '500';
    }

    // Inserir no topo do conteúdo
    const dashboardMain = document.querySelector('.dashboard-main');
    dashboardMain.insertBefore(alertDiv, dashboardMain.firstChild);

    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
