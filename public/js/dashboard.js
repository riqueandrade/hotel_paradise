// ===== CONFIGURAÇÕES E CONSTANTES =====
const API_BASE_URL = '/api';
const STORAGE_KEYS = {
    TOKEN: 'hotel_paradise_token',
    USER_TYPE: 'hotel_paradise_user_type',
    USER_DATA: 'hotel_paradise_user_data'
};

// Variáveis globais
let occupancyChart = null;
let dashboardData = {};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    // Verificar autenticação
    if (!checkAuthentication()) {
        return;
    }
    
    // Configurar interface
    setupInterface();
    
    // Carregar dados
    await loadDashboardData();
    
    // Configurar atualizações automáticas
    setupAutoRefresh();
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

    // Configurar relógio
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // Configurar eventos de redimensionamento
    window.addEventListener('resize', handleResize);

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

    // Quick Actions
    const quickActionsBtn = document.getElementById('quickActionsBtn');
    if (quickActionsBtn) {
        quickActionsBtn.addEventListener('click', showQuickActions);
    }

    // Check-in/Check-out
    const checkInBtn = document.getElementById('checkInBtn');
    if (checkInBtn) {
        checkInBtn.addEventListener('click', showCheckInModal);
    }

    const checkOutBtn = document.getElementById('checkOutBtn');
    if (checkOutBtn) {
        checkOutBtn.addEventListener('click', showCheckOutModal);
    }

    // Botões de navegação
    const goToButtons = document.querySelectorAll('[data-go-to]');
    goToButtons.forEach(button => {
        button.addEventListener('click', function() {
            const page = this.getAttribute('data-go-to');
            goToPage(page);
        });
    });

    // Links "Coming Soon"
    const comingSoonLinks = document.querySelectorAll('[data-coming-soon]');
    comingSoonLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const feature = this.getAttribute('data-coming-soon');
            showComingSoon(feature);
        });
    });
}

// ===== CARREGAMENTO DE DADOS =====
async function loadDashboardData() {
    const loadingContainer = document.getElementById('loadingContainer');
    const dashboardContent = document.getElementById('dashboardContent');
    
    try {
        // Mostrar loading
        loadingContainer.style.display = 'flex';
        dashboardContent.style.display = 'none';
        
        // Carregar dados em paralelo
        const [quartosStats, reservasStats, clientesStats, reservasHoje, quartos] = await Promise.all([
            fetchWithAuth('/api/quartos/admin/statistics'),
            fetchWithAuth('/api/reservas/statistics'),
            fetchWithAuth('/api/clientes/statistics'),
            fetchWithAuth('/api/reservas/today'),
            fetchWithAuth('/api/quartos')
        ]);
        
        // Armazenar dados
        dashboardData = {
            quartos: quartosStats,
            reservas: reservasStats,
            clientes: clientesStats,
            reservasHoje: reservasHoje,
            quartosLista: quartos
        };
        
        // Atualizar interface
        updateStatistics();
        updateReservationsToday();
        updateRoomStatus();
        updateOccupancyChart();
        
        // Mostrar conteúdo
        loadingContainer.style.display = 'none';
        dashboardContent.style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        showAlert('Erro ao carregar dados do dashboard. Tente novamente.', 'danger');
        
        // Mostrar conteúdo mesmo com erro
        loadingContainer.style.display = 'none';
        dashboardContent.style.display = 'block';
    }
}

// ===== ATUALIZAÇÃO DE ESTATÍSTICAS - DADOS REAIS =====
function updateStatistics() {
    const { quartos, reservas, clientes } = dashboardData;

    // Calcular taxa de ocupação real
    if (quartos && quartos.statistics) {
        const stats = quartos.statistics;
        const total = stats.total_quartos || 1;
        const ocupados = stats.ocupados || 0;
        const taxaOcupacao = Math.round((ocupados / total) * 100);

        // Atualizar taxa de ocupação
        document.getElementById('taxaOcupacao').textContent = `${taxaOcupacao}%`;
        document.getElementById('quartosDisponiveis').textContent = `${stats.disponiveis || 0} quartos disponíveis`;

        // Calcular tendência baseada na taxa de ocupação
        const ocupacaoIdeal = 75; // Meta de 75% de ocupação
        const diferenca = taxaOcupacao - ocupacaoIdeal;
        updateRealTrendIndicator('quartosIcon', 'quartosChange', diferenca, 'ocupação', taxaOcupacao);
    }

    // Estatísticas de receita real
    if (reservas && reservas.statistics) {
        const stats = reservas.statistics;
        const receita = stats.receita_total || 0;
        const ticket = stats.ticket_medio || 0;

        document.getElementById('receitaTotal').textContent = formatCurrency(receita);
        document.getElementById('ticketMedio').textContent = `Ticket médio: ${formatCurrency(ticket)}`;

        // Mostrar status da receita
        const metaReceita = 30000; // Meta mensal de R$ 30.000
        const diferenca = receita - metaReceita;
        updateRealTrendIndicator('receitaIcon', 'receitaChange', diferenca, 'receita', receita);
    }

    // Estatísticas de reservas reais
    if (reservas && reservas.statistics) {
        const stats = reservas.statistics;
        const ativas = (stats.confirmadas || 0) + (stats.checkins || 0);
        const checkins = dashboardData.reservasHoje?.total || 0;

        document.getElementById('totalReservas').textContent = ativas;
        document.getElementById('reservasHoje').textContent = `${checkins} check-ins hoje`;

        // Status das reservas
        const metaReservas = 50; // Meta de 50 reservas ativas
        const diferenca = ativas - metaReservas;
        updateRealTrendIndicator('reservasIcon', 'reservasChange', diferenca, 'reservas', ativas);
    }

    // Estatísticas de clientes cadastrados
    if (clientes && clientes.statistics) {
        const statsClientes = clientes.statistics;
        const totalClientes = statsClientes.total_clientes || 0;

        document.getElementById('totalClientes').textContent = totalClientes;

        // Calcular hóspedes ativos baseado em quartos ocupados
        const hospedesAtivos = quartos && quartos.statistics ?
            (quartos.statistics.ocupados || 0) * 2 : 0; // Estimativa: 2 pessoas por quarto ocupado

        document.getElementById('clientesAtivos').textContent = `${hospedesAtivos} hóspedes no hotel`;

        // Status baseado no número de clientes cadastrados (não hóspedes ativos)
        const metaClientes = 100; // Meta de 100 clientes cadastrados
        const diferenca = totalClientes - metaClientes;
        updateRealTrendIndicator('clientesIcon', 'clientesChange', diferenca, 'clientes', totalClientes);
    }
}

// Função para atualizar indicadores baseados em dados reais
function updateRealTrendIndicator(iconId, changeId, diferenca, tipo, valorAtual = 0) {
    const iconElement = document.getElementById(iconId);
    const changeElement = document.getElementById(changeId);

    if (!iconElement || !changeElement) return;

    let statusText = '';
    let isPositive = false;
    let isNeutral = false;

    // Se não há dados ainda (valor atual é 0), mostrar estado neutro
    if (valorAtual === 0) {
        isNeutral = true;
        statusText = 'Sem dados';
    }
    // Determinar status baseado na diferença com a meta
    else if (diferenca > 0) {
        isPositive = true;
        if (tipo === 'ocupação') {
            statusText = `+${Math.abs(diferenca)}%`;
        } else if (tipo === 'receita') {
            statusText = `+R$ ${Math.abs(diferenca).toLocaleString('pt-BR')}`;
        } else {
            statusText = `+${Math.abs(diferenca)}`;
        }
    } else if (diferenca < 0) {
        isPositive = false;
        if (tipo === 'ocupação') {
            statusText = `-${Math.abs(diferenca)}%`;
        } else if (tipo === 'receita') {
            statusText = `-R$ ${Math.abs(diferenca).toLocaleString('pt-BR')}`;
        } else {
            statusText = `-${Math.abs(diferenca)}`;
        }
    } else {
        isNeutral = true;
        statusText = 'Meta atingida';
    }

    // Atualizar ícone baseado no status
    if (isNeutral) {
        iconElement.className = 'bi bi-dash-circle stat-trend-icon stat-trend-neutral';
        changeElement.className = 'stat-change neutral';
    } else if (isPositive) {
        iconElement.className = 'bi bi-arrow-up-right stat-trend-icon stat-trend-up';
        changeElement.className = 'stat-change positive';
    } else {
        iconElement.className = 'bi bi-arrow-down-left stat-trend-icon stat-trend-down';
        changeElement.className = 'stat-change negative';
    }

    // Atualizar texto
    changeElement.textContent = statusText;
}

// ===== ATUALIZAÇÃO DE RESERVAS DE HOJE =====
function updateReservationsToday() {
    const container = document.getElementById('reservationsToday');
    const reservas = dashboardData.reservasHoje?.reservas || [];
    
    if (reservas.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="bi bi-calendar-x display-6"></i>
                <p class="mt-2">Nenhuma reserva para hoje</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reservas.map(reserva => `
        <div class="reservation-item">
            <div class="reservation-time">
                ${reserva.status === 'checkin' ? 'Check-in' : 'Check-out'}
            </div>
            <div class="reservation-details">
                <div class="reservation-guest">${reserva.cliente_nome || 'Cliente'}</div>
                <div class="reservation-room">Quarto ${reserva.quarto_numero || reserva.quarto_id}</div>
            </div>
            <span class="reservation-status status-${reserva.status}">
                ${getStatusLabel(reserva.status)}
            </span>
        </div>
    `).join('');
}

// ===== ATUALIZAÇÃO DE STATUS DOS QUARTOS =====
function updateRoomStatus() {
    const container = document.getElementById('roomStatusGrid');
    const quartos = dashboardData.quartosLista?.quartos || [];
    
    if (quartos.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="bi bi-house display-6"></i>
                <p class="mt-2">Nenhum quarto encontrado</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = quartos.map(quarto => `
        <div class="room-status-item room-${quarto.status}"
             data-room-id="${quarto.id}"
             title="Quarto ${quarto.numero} - ${getStatusLabel(quarto.status)}">
            <div>${quarto.numero}</div>
            <div style="font-size: 0.6rem;">${quarto.status}</div>
        </div>
    `).join('');

    // Adicionar event listeners para os quartos
    const roomItems = container.querySelectorAll('.room-status-item');
    roomItems.forEach(item => {
        item.addEventListener('click', function() {
            const roomId = this.getAttribute('data-room-id');
            showRoomDetails(roomId);
        });
    });
}

// ===== GRÁFICO DE OCUPAÇÃO =====
function updateOccupancyChart() {
    const ctx = document.getElementById('occupancyChart');
    if (!ctx) return;
    
    const { quartos } = dashboardData;
    if (!quartos || !quartos.statistics) return;
    
    const stats = quartos.statistics;
    
    // Destruir gráfico anterior se existir
    if (occupancyChart) {
        occupancyChart.destroy();
    }
    
    occupancyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Disponíveis', 'Ocupados', 'Manutenção', 'Limpeza'],
            datasets: [{
                data: [
                    stats.disponiveis || 0,
                    stats.ocupados || 0,
                    stats.manutencao || 0,
                    stats.limpeza || 0
                ],
                backgroundColor: [
                    '#27AE60',
                    '#E74C3C',
                    '#F39C12',
                    '#3498DB'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
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

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

function getStatusLabel(status) {
    const labels = {
        'disponivel': 'Disponível',
        'ocupado': 'Ocupado',
        'manutencao': 'Manutenção',
        'limpeza': 'Limpeza',
        'pendente': 'Pendente',
        'confirmada': 'Confirmada',
        'checkin': 'Check-in',
        'checkout': 'Check-out',
        'cancelada': 'Cancelada'
    };
    
    return labels[status] || status;
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

function handleResize() {
    if (occupancyChart) {
        occupancyChart.resize();
    }
}

function setupAutoRefresh() {
    // Atualizar dados a cada 5 minutos
    setInterval(async () => {
        try {
            await loadDashboardData();
        } catch (error) {
            console.error('Erro na atualização automática:', error);
        }
    }, 5 * 60 * 1000);
}

// ===== FUNÇÕES DE NAVEGAÇÃO =====
function goToPage(page) {
    window.location.href = page;
}

function showRoomDetails(roomId) {
    // Implementar modal de detalhes do quarto
    showAlert(`Detalhes do quarto ${roomId} - Funcionalidade em desenvolvimento`, 'info');
}

function showCheckInModal() {
    showAlert('Modal de check-in será implementado em breve!', 'info');
}

function showCheckOutModal() {
    showAlert('Modal de check-out será implementado em breve!', 'info');
}

function showQuickActions() {
    showAlert('Menu de ações rápidas será implementado em breve!', 'info');
}

function showComingSoon(feature) {
    showAlert(`${feature} será implementado em breve!`, 'info');
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
