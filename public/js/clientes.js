// ===== CONFIGURAÇÕES E CONSTANTES =====
const API_BASE_URL = '/api';
const STORAGE_KEYS = {
    TOKEN: 'hotel_paradise_token',
    USER_TYPE: 'hotel_paradise_user_type',
    USER_DATA: 'hotel_paradise_user_data'
};

let currentPage = 1;
let currentFilters = {};
let isLoading = false;
let clientesData = [];
let currentEditingCliente = null;
let isAdmin = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeClientesPage();
});

async function initializeClientesPage() {
    if (!checkAuthentication()) return;
    await initializePage({
        page: 'clientes',
        title: 'Gestão de Clientes',
        subtitle: 'Gerencie todos os clientes do hotel',
        icon: 'bi-people',
        loadingText: 'Carregando gestão de clientes...',
        headerButtons: `<button class=\"btn btn-success\" id=\"addClienteBtn\"><i class=\"bi bi-plus-circle me-2\"></i>Novo Cliente</button>`
    });
    updateUserInfo();
    setupInterface();
    await loadInitialData();
}

function checkAuthentication() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    const userType = localStorage.getItem(STORAGE_KEYS.USER_TYPE) || sessionStorage.getItem(STORAGE_KEYS.USER_TYPE);
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA) || sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!token || userType !== 'funcionario') {
        showAlert('Acesso negado. Redirecionando para login...', 'danger');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        return false;
    }
    if (userData) {
        const user = JSON.parse(userData);
        isAdmin = user.nivel_acesso === 'admin';
    }
    return true;
}

function updateUserInfo() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA) || sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (userData) {
        const user = JSON.parse(userData);
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        if (userNameEl) userNameEl.textContent = user.nome || 'Funcionário';
        if (userRoleEl) userRoleEl.textContent = user.nivel_acesso || 'Funcionário';
    }
}

function setupInterface() {
    waitForElement('#addClienteBtn', (el) => el.addEventListener('click', showAddClienteModal));
    waitForElement('#applyFiltersBtn', (el) => el.addEventListener('click', applyFilters));
    waitForElement('#clearFiltersBtn', (el) => el.addEventListener('click', clearFilters));
    waitForElement('#refreshDataBtn', (el) => el.addEventListener('click', loadInitialData));
}

function waitForElement(selector, callback) {
    const el = document.querySelector(selector);
    if (el) {
        callback(el);
        return;
    }
    const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
            observer.disconnect();
            callback(el);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

async function loadInitialData() {
    try {
        showLoading();
        const params = new URLSearchParams({ ...currentFilters, page: currentPage, limit: 12 });
        const response = await fetchWithAuth(`/api/clientes?${params}`);
        clientesData = response.clientes || response || [];
        updateStatistics(response.statistics);
        renderClientesTable();
        hideLoading();
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showAlert('Erro ao carregar clientes. Tente novamente.', 'danger');
        hideLoading();
    }
}

function updateStatistics(stats) {
    document.getElementById('totalClientes').textContent = stats?.total || 0;
}

function renderClientesTable() {
    const tbody = document.getElementById('clientesTableBody');
    tbody.innerHTML = '';
    if (!clientesData.length) {
        tbody.innerHTML = `<tr><td colspan=\"6\" class=\"text-center text-muted py-4\"><i class=\"bi bi-people display-6\"></i><p class=\"mt-2\">Nenhum cliente encontrado.</p></td></tr>`;
        return;
    }
    clientesData.forEach(cliente => {
        tbody.innerHTML += `
            <tr>
                <td>${cliente.id}</td>
                <td>${cliente.nome}</td>
                <td>${cliente.telefone || '-'}</td>
                <td${isAdmin ? '' : ' style="display:none"'}>${cliente.email || '-'}</td>
                <td${isAdmin ? '' : ' style="display:none"'}>${cliente.cpf || '-'}</td>
                <td>
                    <button class=\"btn btn-sm btn-primary me-1\" onclick=\"editCliente(${cliente.id})\"><i class=\"bi bi-pencil\"></i></button>
                    ${isAdmin ? `<button class=\"btn btn-sm btn-danger\" onclick=\"deleteCliente(${cliente.id})\"><i class=\"bi bi-trash\"></i></button>` : ''}
                </td>
            </tr>
        `;
    });
    document.getElementById('thEmail').style.display = isAdmin ? '' : 'none';
    document.getElementById('thCPF').style.display = isAdmin ? '' : 'none';
}

function applyFilters() {
    currentFilters = {
        nome: document.getElementById('filterNome').value,
        cpf: document.getElementById('filterCPF').value,
        email: document.getElementById('filterEmail').value
    };
    loadInitialData();
}

function clearFilters() {
    document.getElementById('filterNome').value = '';
    document.getElementById('filterCPF').value = '';
    document.getElementById('filterEmail').value = '';
    currentFilters = {};
    loadInitialData();
}

// Carregar modal de clientes ao iniciar
async function loadClienteModal() {
    if (!document.getElementById('clienteModal')) {
        const resp = await fetch('../partials/modals-clientes.html');
        const html = await resp.text();
        document.body.insertAdjacentHTML('beforeend', html);
    }
}

async function showAddClienteModal() {
    await loadClienteModal();
    document.getElementById('clienteModalTitle').textContent = 'Novo Cliente';
    document.getElementById('clienteForm').reset();
    document.getElementById('clienteId').value = '';
    const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
    document.getElementById('saveClienteBtn').onclick = saveCliente;
    modal.show();
}

async function editCliente(id) {
    await loadClienteModal();
    const cliente = clientesData.find(c => c.id === id);
    if (!cliente) {
        showAlert('Cliente não encontrado', 'danger');
        return;
    }
    document.getElementById('clienteModalTitle').textContent = `Editar Cliente #${cliente.id}`;
    document.getElementById('clienteId').value = cliente.id;
    document.getElementById('clienteNome').value = cliente.nome || '';
    document.getElementById('clienteEmail').value = cliente.email || '';
    document.getElementById('clienteTelefone').value = cliente.telefone || '';
    document.getElementById('clienteCPF').value = cliente.cpf || '';
    document.getElementById('clienteNascimento').value = cliente.data_nascimento ? cliente.data_nascimento.split('T')[0] : '';
    document.getElementById('clienteObs').value = cliente.observacoes || '';
    const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
    document.getElementById('saveClienteBtn').onclick = saveCliente;
    modal.show();
}

async function saveCliente() {
    const id = document.getElementById('clienteId').value;
    const nome = document.getElementById('clienteNome').value.trim();
    const email = document.getElementById('clienteEmail').value.trim();
    const telefone = document.getElementById('clienteTelefone').value.trim();
    const cpf = document.getElementById('clienteCPF').value.trim();
    const data_nascimento = document.getElementById('clienteNascimento').value;
    const observacoes = document.getElementById('clienteObs').value.trim();
    if (!nome || !email || !telefone || !cpf) {
        showAlert('Preencha todos os campos obrigatórios.', 'warning');
        return;
    }
    const payload = { nome, email, telefone, cpf, data_nascimento, observacoes };
    try {
        let response;
        if (id) {
            response = await fetchWithAuth(`/api/clientes/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            response = await fetchWithAuth('/api/clientes', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
        showAlert(id ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('clienteModal')).hide();
        await loadInitialData();
    } catch (error) {
        showAlert('Erro ao salvar cliente. Tente novamente.', 'danger');
    }
}

async function deleteCliente(id) {
    if (!isAdmin) return;
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
        await fetchWithAuth(`/api/clientes/${id}`, { method: 'DELETE' });
        showAlert('Cliente excluído com sucesso!', 'success');
        await loadInitialData();
    } catch (error) {
        showAlert('Erro ao excluir cliente. Tente novamente.', 'danger');
    }
}

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

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = `<div class=\"alert alert-${type} alert-dismissible fade show\" role=\"alert\">${message}<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button></div>`;
    setTimeout(() => { alertContainer.innerHTML = ''; }, 4000);
}

function showLoading() {
    // Implementar loading se necessário
}

function hideLoading() {
    // Implementar hide loading se necessário
} 