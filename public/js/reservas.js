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
let isLoading = false;
let reservationsData = [];
let clientsData = [];
let roomsData = [];
let currentEditingReservation = null;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeReservationsPage();
});

async function initializeReservationsPage() {
    // Verificar autenticação
    if (!checkAuthentication()) {
        return;
    }

    // Inicializar partials
    await initializePage({
        page: 'reservas',
        title: 'Gestão de Reservas',
        subtitle: 'Gerencie todas as reservas do hotel',
        icon: 'bi-calendar-check',
        loadingText: 'Carregando gestão de reservas...',
        headerButtons: `
            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#reservaModal">
                <i class="bi bi-plus-circle me-2"></i>Nova Reserva
            </button>
        `
    });

    // Carregar modais específicos da página
    await loadPartial('../partials/modals-reservas.html', 'body');

    // Configurar interface específica
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
    
    // Atualizar informações do usuário na sidebar
    if (userData) {
        try {
            const user = JSON.parse(userData);
            document.getElementById('userName').textContent = user.nome || 'Funcionário';
            document.getElementById('userRole').textContent = user.tipo_usuario || 'Funcionário';
        } catch (error) {
            console.error('Erro ao parsear dados do usuário:', error);
        }
    }
    
    return true;
}

// ===== CONFIGURAÇÃO DA INTERFACE =====
function setupInterface() {
    // Configurar relógio (partials já configuram sidebar toggle)
    updateClock();
    setInterval(updateClock, 1000);

    // Configurar filtros
    setupFilters();

    // Configurar formulário de reserva
    setupReservationForm();
}

// ===== CARREGAMENTO DE DADOS INICIAIS =====
async function loadInitialData() {
    const loadingContainer = document.getElementById('loadingContainer');
    const dashboardContent = document.getElementById('dashboardContent');
    
    try {
        // Mostrar loading
        loadingContainer.style.display = 'flex';
        dashboardContent.style.display = 'none';
        
        // Carregar dados em paralelo
        const [reservations, clients, rooms, statistics] = await Promise.all([
            fetchWithAuth('/api/reservas'),
            fetchWithAuth('/api/clientes'),
            fetchWithAuth('/api/quartos'),
            fetchWithAuth('/api/reservas/statistics')
        ]);
        
        // Armazenar dados
        reservationsData = reservations.reservas || reservations || [];
        clientsData = clients.clientes || clients || [];
        roomsData = rooms.quartos || rooms || [];
        
        // Atualizar interface
        updateStatistics(statistics);
        populateClientSelect();
        populateRoomSelect();
        renderReservationsTable();
        
        // Ocultar loading
        loadingContainer.style.display = 'none';
        dashboardContent.style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        showAlert('Erro ao carregar dados. Tente novamente.', 'danger');
        
        // Ocultar loading mesmo com erro
        loadingContainer.style.display = 'none';
        dashboardContent.style.display = 'block';
    }
}

// ===== FUNÇÕES DE API =====
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
    
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
            window.location.href = 'login.html';
            return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// ===== ATUALIZAÇÃO DE ESTATÍSTICAS =====
function updateStatistics(stats) {
    if (!stats) return;
    
    // Total de reservas
    const total = stats.total || 0;
    document.getElementById('totalReservas').textContent = total;
    
    // Reservas confirmadas
    const confirmadas = stats.confirmadas || 0;
    document.getElementById('reservasConfirmadas').textContent = confirmadas;
    
    // Reservas pendentes
    const pendentes = stats.pendentes || 0;
    document.getElementById('reservasPendentes').textContent = pendentes;
    
    // Check-ins hoje
    const checkinsHoje = stats.checkins_hoje || 0;
    document.getElementById('checkinsHoje').textContent = checkinsHoje;
    
    // Atualizar indicadores de tendência
    updateTrendIndicators(stats);
}

function updateTrendIndicators(stats) {
    // Metas definidas
    const metas = {
        total: 100,
        confirmadas: 80,
        pendentes: 10,
        checkins: 5
    };
    
    // Atualizar cada indicador
    updateTrendIndicator(null, 'reservasChange', stats.total || 0, metas.total, 'reservas');
    updateTrendIndicator(null, 'confirmadasChange', stats.confirmadas || 0, metas.confirmadas, 'confirmadas');
    updateTrendIndicator(null, 'pendentesChange', stats.pendentes || 0, metas.pendentes, 'pendentes');
    updateTrendIndicator(null, 'checkinsChange', stats.checkins_hoje || 0, metas.checkins, 'check-ins');
}

function updateTrendIndicator(iconId, changeId, atual, meta, tipo) {
    const change = document.getElementById(changeId);

    if (!change) return;

    if (atual === 0) {
        change.textContent = 'Sem dados';
        change.className = 'stat-change neutral';
    } else {
        const diferenca = atual - meta;

        if (diferenca > 0) {
            change.textContent = `+${Math.abs(diferenca)} ${tipo}`;
            change.className = 'stat-change positive';
        } else if (diferenca < 0) {
            change.textContent = `-${Math.abs(diferenca)} ${tipo}`;
            change.className = 'stat-change negative';
        } else {
            change.textContent = `Meta atingida`;
            change.className = 'stat-change positive';
        }
    }
}

// ===== RELÓGIO =====
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

// ===== CONFIGURAÇÃO DE FILTROS =====
function setupFilters() {
    // Configurar datas mínimas
    const today = new Date().toISOString().split('T')[0];
    const filterDataInicio = document.getElementById('filterDataInicio');
    const filterDataFim = document.getElementById('filterDataFim');
    
    if (filterDataInicio) {
        filterDataInicio.min = today;
    }
    
    if (filterDataFim) {
        filterDataFim.min = today;
    }
    
    // Event listeners para filtros
    const filterElements = [
        'filterStatus', 'filterDataInicio', 'filterDataFim', 
        'filterCliente', 'filterQuarto'
    ];
    
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', debounce(applyFilters, 500));
            if (element.type === 'text') {
                element.addEventListener('input', debounce(applyFilters, 500));
            }
        }
    });
}

// ===== CONFIGURAÇÃO DO FORMULÁRIO DE RESERVA =====
function setupReservationForm() {
    // Event listeners para cálculos automáticos
    const dataCheckin = document.getElementById('dataCheckin');
    const dataCheckout = document.getElementById('dataCheckout');
    const quartoSelect = document.getElementById('quartoSelect');
    
    if (dataCheckin) {
        dataCheckin.addEventListener('change', calculateReservationValues);
        dataCheckin.min = new Date().toISOString().split('T')[0];
    }
    
    if (dataCheckout) {
        dataCheckout.addEventListener('change', calculateReservationValues);
    }
    
    if (quartoSelect) {
        quartoSelect.addEventListener('change', updateRoomPrice);
    }
}

// ===== POPULAÇÃO DE SELECTS =====
function populateClientSelect() {
    const select = document.getElementById('clienteSelect');
    if (!select || !clientsData) return;
    
    // Limpar opções existentes (exceto a primeira)
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    
    // Adicionar clientes
    clientsData.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.nome_completo} - ${client.cpf}`;
        select.appendChild(option);
    });
}

function populateRoomSelect() {
    const select = document.getElementById('quartoSelect');
    if (!select || !roomsData) return;
    
    // Limpar opções existentes (exceto a primeira)
    select.innerHTML = '<option value="">Selecione um quarto</option>';
    
    // Adicionar apenas quartos disponíveis
    const availableRooms = roomsData.filter(room => room.status === 'disponivel');
    
    availableRooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = `Quarto ${room.numero} - ${room.tipo} (R$ ${parseFloat(room.preco_diaria).toFixed(2)})`;
        option.dataset.price = room.preco_diaria;
        select.appendChild(option);
    });
}

// ===== UTILITÁRIOS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
            <i class="bi bi-${getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

function getAlertIcon(type) {
    const icons = {
        success: 'check-circle',
        danger: 'exclamation-triangle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ===== RENDERIZAÇÃO DA TABELA DE RESERVAS =====
function renderReservationsTable() {
    const tbody = document.getElementById('reservationsTableBody');
    if (!tbody) return;

    if (!reservationsData || reservationsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-calendar-x display-6"></i>
                    <p class="mt-2">Nenhuma reserva encontrada</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = reservationsData.map(reservation => `
        <tr>
            <td><strong>#${reservation.id}</strong></td>
            <td>
                <div class="client-info">
                    <div class="client-name">${reservation.cliente_nome || 'N/A'}</div>
                    <div class="client-details">${reservation.cliente_cpf || ''}</div>
                </div>
            </td>
            <td>
                <div class="room-info">
                    <div class="room-number">Quarto ${reservation.quarto_numero || 'N/A'}</div>
                    <div class="room-type">${reservation.quarto_tipo || ''}</div>
                </div>
            </td>
            <td>
                <div class="date-value">${formatDate(reservation.data_checkin)}</div>
            </td>
            <td>
                <div class="date-value">${formatDate(reservation.data_checkout)}</div>
            </td>
            <td>
                <span class="status-badge status-${reservation.status}">
                    <i class="bi bi-${getStatusIcon(reservation.status)}"></i>
                    ${getStatusText(reservation.status)}
                </span>
            </td>
            <td>
                <div class="currency-value">R$ ${parseFloat(reservation.valor_total || 0).toFixed(2)}</div>
            </td>
            <td>
                <div class="action-buttons">
                    ${generateActionButtons(reservation)}
                </div>
            </td>
        </tr>
    `).join('');
}

function generateActionButtons(reservation) {
    const buttons = [];

    // Botão Ver Detalhes
    buttons.push(`
        <button class="action-btn action-btn-info" onclick="viewReservationDetails(${reservation.id})" title="Ver Detalhes">
            <i class="bi bi-eye"></i>
        </button>
    `);

    // Botões baseados no status
    switch (reservation.status) {
        case 'pendente':
            buttons.push(`
                <button class="action-btn action-btn-success" onclick="confirmReservation(${reservation.id})" title="Confirmar">
                    <i class="bi bi-check-circle"></i>
                </button>
            `);
            buttons.push(`
                <button class="action-btn action-btn-primary" onclick="editReservation(${reservation.id})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
            `);
            buttons.push(`
                <button class="action-btn action-btn-danger" onclick="cancelReservation(${reservation.id})" title="Cancelar">
                    <i class="bi bi-x-circle"></i>
                </button>
            `);
            break;

        case 'confirmada':
            buttons.push(`
                <button class="action-btn action-btn-warning" onclick="checkInReservation(${reservation.id})" title="Check-in">
                    <i class="bi bi-box-arrow-in-right"></i>
                </button>
            `);
            buttons.push(`
                <button class="action-btn action-btn-primary" onclick="editReservation(${reservation.id})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
            `);
            break;

        case 'checkin':
            buttons.push(`
                <button class="action-btn action-btn-secondary" onclick="checkOutReservation(${reservation.id})" title="Check-out">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            `);
            break;
    }

    return buttons.join('');
}

// ===== FUNÇÕES DE FORMATAÇÃO =====
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    } catch (error) {
        return 'Data inválida';
    }
}

function getStatusIcon(status) {
    const icons = {
        pendente: 'clock',
        confirmada: 'check-circle',
        checkin: 'box-arrow-in-right',
        checkout: 'box-arrow-right',
        cancelada: 'x-circle'
    };
    return icons[status] || 'question-circle';
}

function getStatusText(status) {
    const texts = {
        pendente: 'Pendente',
        confirmada: 'Confirmada',
        checkin: 'Check-in',
        checkout: 'Check-out',
        cancelada: 'Cancelada'
    };
    return texts[status] || 'Desconhecido';
}

// ===== FUNÇÕES DE FILTROS =====
function applyFilters() {
    const filters = {
        status: document.getElementById('filterStatus')?.value || '',
        dataInicio: document.getElementById('filterDataInicio')?.value || '',
        dataFim: document.getElementById('filterDataFim')?.value || '',
        cliente: document.getElementById('filterCliente')?.value || '',
        quarto: document.getElementById('filterQuarto')?.value || ''
    };

    currentFilters = filters;

    // Aplicar filtros aos dados
    let filteredData = [...reservationsData];

    if (filters.status) {
        filteredData = filteredData.filter(r => r.status === filters.status);
    }

    if (filters.dataInicio) {
        filteredData = filteredData.filter(r => r.data_checkin >= filters.dataInicio);
    }

    if (filters.dataFim) {
        filteredData = filteredData.filter(r => r.data_checkout <= filters.dataFim);
    }

    if (filters.cliente) {
        const clienteFilter = filters.cliente.toLowerCase();
        filteredData = filteredData.filter(r =>
            (r.cliente_nome && r.cliente_nome.toLowerCase().includes(clienteFilter)) ||
            (r.cliente_cpf && r.cliente_cpf.includes(clienteFilter))
        );
    }

    if (filters.quarto) {
        filteredData = filteredData.filter(r =>
            r.quarto_numero && r.quarto_numero.includes(filters.quarto)
        );
    }

    // Atualizar dados filtrados e renderizar
    reservationsData = filteredData;
    renderReservationsTable();
}

function clearFilters() {
    // Limpar campos de filtro
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterDataInicio').value = '';
    document.getElementById('filterDataFim').value = '';
    document.getElementById('filterCliente').value = '';
    document.getElementById('filterQuarto').value = '';

    // Recarregar dados
    loadReservations();
}

// ===== FUNÇÕES DE CRUD DE RESERVAS =====
async function loadReservations() {
    try {
        const response = await fetchWithAuth('/api/reservas');
        reservationsData = response.reservas || response || [];
        renderReservationsTable();
    } catch (error) {
        console.error('Erro ao carregar reservas:', error);
        showAlert('Erro ao carregar reservas', 'danger');
    }
}

function updateRoomPrice() {
    const quartoSelect = document.getElementById('quartoSelect');
    const valorDiariaInput = document.getElementById('valorDiaria');

    if (!quartoSelect || !valorDiariaInput) return;

    const selectedOption = quartoSelect.options[quartoSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.price) {
        valorDiariaInput.value = parseFloat(selectedOption.dataset.price).toFixed(2);
        calculateReservationValues();
    } else {
        valorDiariaInput.value = '';
    }
}

function calculateReservationValues() {
    const dataCheckin = document.getElementById('dataCheckin')?.value;
    const dataCheckout = document.getElementById('dataCheckout')?.value;
    const valorDiaria = parseFloat(document.getElementById('valorDiaria')?.value || 0);

    const numeroDiariasInput = document.getElementById('numeroDiarias');
    const valorTotalInput = document.getElementById('valorTotal');

    if (!dataCheckin || !dataCheckout || !valorDiaria) {
        if (numeroDiariasInput) numeroDiariasInput.value = '';
        if (valorTotalInput) valorTotalInput.value = '';
        return;
    }

    const checkin = new Date(dataCheckin);
    const checkout = new Date(dataCheckout);

    if (checkout <= checkin) {
        if (numeroDiariasInput) numeroDiariasInput.value = '';
        if (valorTotalInput) valorTotalInput.value = '';
        return;
    }

    const diffTime = Math.abs(checkout - checkin);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const valorTotal = diffDays * valorDiaria;

    if (numeroDiariasInput) numeroDiariasInput.value = diffDays;
    if (valorTotalInput) valorTotalInput.value = valorTotal.toFixed(2);
}

async function saveReservation() {
    const form = document.getElementById('reservaForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const reservaId = document.getElementById('reservaId')?.value;
    const isEditing = !!reservaId;

    const reservationData = {
        cliente_id: parseInt(document.getElementById('clienteSelect').value),
        quarto_id: parseInt(document.getElementById('quartoSelect').value),
        data_checkin: document.getElementById('dataCheckin').value,
        data_checkout: document.getElementById('dataCheckout').value,
        numero_hospedes: parseInt(document.getElementById('numeroHospedes').value),
        valor_pago: parseFloat(document.getElementById('valorPago').value || 0),
        forma_pagamento: document.getElementById('formaPagamento').value || null,
        observacoes: document.getElementById('observacoes').value || null
    };

    try {
        let response;
        if (isEditing) {
            response = await fetchWithAuth(`/api/reservas/${reservaId}`, {
                method: 'PUT',
                body: JSON.stringify(reservationData)
            });
        } else {
            response = await fetchWithAuth('/api/reservas', {
                method: 'POST',
                body: JSON.stringify(reservationData)
            });
        }

        showAlert(
            isEditing ? 'Reserva atualizada com sucesso!' : 'Reserva criada com sucesso!',
            'success'
        );

        // Fechar modal e recarregar dados
        const modal = bootstrap.Modal.getInstance(document.getElementById('reservaModal'));
        modal.hide();

        await loadInitialData();

    } catch (error) {
        console.error('Erro ao salvar reserva:', error);
        showAlert('Erro ao salvar reserva. Tente novamente.', 'danger');
    }
}

function editReservation(id) {
    const reservation = reservationsData.find(r => r.id === id);
    if (!reservation) {
        showAlert('Reserva não encontrada', 'danger');
        return;
    }

    currentEditingReservation = reservation;

    // Preencher formulário
    document.getElementById('reservaId').value = reservation.id;
    document.getElementById('clienteSelect').value = reservation.cliente_id;
    document.getElementById('quartoSelect').value = reservation.quarto_id;
    document.getElementById('dataCheckin').value = reservation.data_checkin;
    document.getElementById('dataCheckout').value = reservation.data_checkout;
    document.getElementById('numeroHospedes').value = reservation.numero_hospedes || 1;
    document.getElementById('valorDiaria').value = parseFloat(reservation.valor_diaria || 0).toFixed(2);
    document.getElementById('numeroDiarias').value = reservation.numero_diarias || '';
    document.getElementById('valorTotal').value = parseFloat(reservation.valor_total || 0).toFixed(2);
    document.getElementById('valorPago').value = parseFloat(reservation.valor_pago || 0).toFixed(2);
    document.getElementById('formaPagamento').value = reservation.forma_pagamento || '';
    document.getElementById('observacoes').value = reservation.observacoes || '';

    // Atualizar título do modal
    document.getElementById('reservaModalLabel').innerHTML = `
        <i class="bi bi-pencil me-2"></i>Editar Reserva #${reservation.id}
    `;

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('reservaModal'));
    modal.show();
}

async function confirmReservation(id) {
    try {
        await fetchWithAuth(`/api/reservas/${id}/confirm`, {
            method: 'PATCH'
        });

        showAlert('Reserva confirmada com sucesso!', 'success');
        await loadInitialData();

    } catch (error) {
        console.error('Erro ao confirmar reserva:', error);
        showAlert('Erro ao confirmar reserva', 'danger');
    }
}

async function cancelReservation(id) {
    const reservation = reservationsData.find(r => r.id === id);
    if (!reservation) return;

    showConfirmModal(
        'Cancelar Reserva',
        `Tem certeza que deseja cancelar a reserva #${id} de ${reservation.cliente_nome}?`,
        async () => {
            try {
                await fetchWithAuth(`/api/reservas/${id}/cancel`, {
                    method: 'PATCH'
                });

                showAlert('Reserva cancelada com sucesso!', 'success');
                await loadInitialData();

            } catch (error) {
                console.error('Erro ao cancelar reserva:', error);
                showAlert('Erro ao cancelar reserva', 'danger');
            }
        }
    );
}

async function checkInReservation(id) {
    const reservation = reservationsData.find(r => r.id === id);
    if (!reservation) return;

    showConfirmModal(
        'Realizar Check-in',
        `Confirmar check-in da reserva #${id} de ${reservation.cliente_nome}?`,
        async () => {
            try {
                await fetchWithAuth(`/api/reservas/${id}/checkin`, {
                    method: 'PATCH'
                });

                showAlert('Check-in realizado com sucesso!', 'success');
                await loadInitialData();

            } catch (error) {
                console.error('Erro ao realizar check-in:', error);
                showAlert('Erro ao realizar check-in', 'danger');
            }
        }
    );
}

async function checkOutReservation(id) {
    const reservation = reservationsData.find(r => r.id === id);
    if (!reservation) return;

    showConfirmModal(
        'Realizar Check-out',
        `Confirmar check-out da reserva #${id} de ${reservation.cliente_nome}?`,
        async () => {
            try {
                await fetchWithAuth(`/api/reservas/${id}/checkout`, {
                    method: 'PATCH'
                });

                showAlert('Check-out realizado com sucesso!', 'success');
                await loadInitialData();

            } catch (error) {
                console.error('Erro ao realizar check-out:', error);
                showAlert('Erro ao realizar check-out', 'danger');
            }
        }
    );
}

async function viewReservationDetails(id) {
    try {
        const reservation = await fetchWithAuth(`/api/reservas/${id}`);

        const detalhesContent = document.getElementById('detalhesContent');
        if (!detalhesContent) return;

        detalhesContent.innerHTML = `
            <div class="row g-4">
                <div class="col-md-6">
                    <h6 class="form-section-title">
                        <i class="bi bi-person me-2"></i>Informações do Cliente
                    </h6>
                    <div class="detail-item">
                        <strong>Nome:</strong> ${reservation.cliente_nome || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>CPF:</strong> ${reservation.cliente_cpf || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Telefone:</strong> ${reservation.cliente_telefone || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Email:</strong> ${reservation.cliente_email || 'N/A'}
                    </div>
                </div>

                <div class="col-md-6">
                    <h6 class="form-section-title">
                        <i class="bi bi-door-closed me-2"></i>Informações do Quarto
                    </h6>
                    <div class="detail-item">
                        <strong>Número:</strong> ${reservation.quarto_numero || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Tipo:</strong> ${reservation.quarto_tipo || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Andar:</strong> ${reservation.quarto_andar || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Nº Hóspedes:</strong> ${reservation.numero_hospedes || 1}
                    </div>
                </div>

                <div class="col-md-6">
                    <h6 class="form-section-title">
                        <i class="bi bi-calendar me-2"></i>Datas da Reserva
                    </h6>
                    <div class="detail-item">
                        <strong>Check-in:</strong> ${formatDate(reservation.data_checkin)}
                    </div>
                    <div class="detail-item">
                        <strong>Check-out:</strong> ${formatDate(reservation.data_checkout)}
                    </div>
                    <div class="detail-item">
                        <strong>Nº Diárias:</strong> ${reservation.numero_diarias || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Data da Reserva:</strong> ${formatDateTime(reservation.data_reserva)}
                    </div>
                </div>

                <div class="col-md-6">
                    <h6 class="form-section-title">
                        <i class="bi bi-currency-dollar me-2"></i>Informações Financeiras
                    </h6>
                    <div class="detail-item">
                        <strong>Valor da Diária:</strong> R$ ${parseFloat(reservation.valor_diaria || 0).toFixed(2)}
                    </div>
                    <div class="detail-item">
                        <strong>Valor Total:</strong> R$ ${parseFloat(reservation.valor_total || 0).toFixed(2)}
                    </div>
                    <div class="detail-item">
                        <strong>Valor Pago:</strong> R$ ${parseFloat(reservation.valor_pago || 0).toFixed(2)}
                    </div>
                    <div class="detail-item">
                        <strong>Forma de Pagamento:</strong> ${getPaymentMethodText(reservation.forma_pagamento)}
                    </div>
                </div>

                <div class="col-12">
                    <h6 class="form-section-title">
                        <i class="bi bi-info-circle me-2"></i>Status e Observações
                    </h6>
                    <div class="detail-item">
                        <strong>Status:</strong>
                        <span class="status-badge status-${reservation.status}">
                            <i class="bi bi-${getStatusIcon(reservation.status)}"></i>
                            ${getStatusText(reservation.status)}
                        </span>
                    </div>
                    ${reservation.observacoes ? `
                        <div class="detail-item">
                            <strong>Observações:</strong>
                            <div class="mt-2 p-3 bg-light rounded">${reservation.observacoes}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('detalhesModal'));
        modal.show();

    } catch (error) {
        console.error('Erro ao carregar detalhes da reserva:', error);
        showAlert('Erro ao carregar detalhes da reserva', 'danger');
    }
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    } catch (error) {
        return 'Data inválida';
    }
}

function getPaymentMethodText(method) {
    const methods = {
        dinheiro: 'Dinheiro',
        cartao_credito: 'Cartão de Crédito',
        cartao_debito: 'Cartão de Débito',
        pix: 'PIX',
        transferencia: 'Transferência'
    };
    return methods[method] || 'Não informado';
}

// ===== FUNÇÕES DE MODAL DE CONFIRMAÇÃO =====
function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleElement = document.getElementById('confirmModalLabel');
    const bodyElement = document.getElementById('confirmModalBody');
    const actionButton = document.getElementById('confirmModalAction');

    if (!modal || !titleElement || !bodyElement || !actionButton) return;

    titleElement.textContent = title;
    bodyElement.innerHTML = message;

    // Remover event listeners anteriores
    const newActionButton = actionButton.cloneNode(true);
    actionButton.parentNode.replaceChild(newActionButton, actionButton);

    // Adicionar novo event listener
    newActionButton.addEventListener('click', () => {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        bootstrapModal.hide();
        onConfirm();
    });

    // Abrir modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

// ===== FUNÇÕES AUXILIARES =====
function refreshData() {
    loadInitialData();
}

function exportReservations() {
    // Implementar exportação de reservas (CSV, Excel, etc.)
    showAlert('Funcionalidade de exportação em desenvolvimento', 'info');
}

// ===== RESET DO FORMULÁRIO =====
document.addEventListener('DOMContentLoaded', function() {
    // Reset form when modal is hidden
    const reservaModal = document.getElementById('reservaModal');
    if (reservaModal) {
        reservaModal.addEventListener('hidden.bs.modal', function() {
            // Reset form
            document.getElementById('reservaForm').reset();
            document.getElementById('reservaId').value = '';
            currentEditingReservation = null;

            // Reset modal title
            document.getElementById('reservaModalLabel').innerHTML = `
                <i class="bi bi-calendar-plus me-2"></i>Nova Reserva
            `;
        });
    }
});

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_TYPE);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER_TYPE);
    sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);

    window.location.href = 'login.html';
}
