// ===== CONFIGURAÇÕES E CONSTANTES =====
const API_BASE_URL = '/api';
const STORAGE_KEYS = {
    TOKEN: 'hotel_paradise_token',
    USER_TYPE: 'hotel_paradise_user_type',
    USER_DATA: 'hotel_paradise_user_data'
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeLoginPage();
});

function initializeLoginPage() {
    // Verificar se já está logado
    checkExistingLogin();
    
    // Configurar formulários
    setupForms();
    
    // Configurar validação
    setupValidation();
    
    // Configurar eventos
    setupEvents();
    
    // Verificar parâmetros da URL
    checkUrlParams();
}

// ===== VERIFICAÇÃO DE LOGIN EXISTENTE =====
function checkExistingLogin() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const userType = localStorage.getItem(STORAGE_KEYS.USER_TYPE);
    
    if (token && userType) {
        // Verificar se o token ainda é válido
        verifyToken(token).then(isValid => {
            if (isValid) {
                redirectToDashboard(userType);
            } else {
                clearStoredData();
            }
        });
    }
}

// ===== CONFIGURAÇÃO DOS FORMULÁRIOS =====
function setupForms() {
    const hospedeForm = document.getElementById('loginHospedeForm');
    const funcionarioForm = document.getElementById('loginFuncionarioForm');
    
    if (hospedeForm) {
        hospedeForm.addEventListener('submit', handleHospedeLogin);
    }
    
    if (funcionarioForm) {
        funcionarioForm.addEventListener('submit', handleFuncionarioLogin);
    }
}

// ===== MANIPULADORES DE LOGIN =====
async function handleHospedeLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('emailHospede').value;
    const senha = document.getElementById('senhaHospede').value;
    const lembrar = document.getElementById('lembrarHospede').checked;
    
    await performLogin('hospede', email, senha, lembrar);
}

async function handleFuncionarioLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('emailFuncionario').value;
    const senha = document.getElementById('senhaFuncionario').value;
    const lembrar = document.getElementById('lembrarFuncionario').checked;
    
    await performLogin('funcionario', email, senha, lembrar);
}

// ===== FUNÇÃO PRINCIPAL DE LOGIN =====
async function performLogin(userType, email, senha, lembrar) {
    const submitBtn = document.querySelector(`#login${userType.charAt(0).toUpperCase() + userType.slice(1)}Form button[type="submit"]`);
    
    try {
        // Mostrar loading
        setButtonLoading(submitBtn, true);
        
        // Fazer requisição para API
        const response = await fetch(`${API_BASE_URL}/auth/login/${userType}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Login bem-sucedido
            handleLoginSuccess(data, userType, lembrar);
        } else {
            // Erro no login
            showAlert(data.message || 'Erro ao fazer login. Verifique suas credenciais.', 'danger');
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        showAlert('Erro de conexão. Tente novamente.', 'danger');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// ===== SUCESSO NO LOGIN =====
function handleLoginSuccess(data, userType, lembrar) {
    // Armazenar dados
    if (lembrar) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER_TYPE, userType);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
    } else {
        sessionStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        sessionStorage.setItem(STORAGE_KEYS.USER_TYPE, userType);
        sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
    }
    
    // Mostrar sucesso
    showAlert(`Bem-vindo(a), ${data.user.nome}!`, 'success');
    
    // Redirecionar após 1 segundo
    setTimeout(() => {
        redirectToDashboard(userType);
    }, 1000);
}

// ===== REDIRECIONAMENTO =====
function redirectToDashboard(userType) {
    if (userType === 'funcionario') {
        window.location.href = 'dashboard.html';
    } else {
        // Para hóspedes, redirecionar para área do cliente (quando implementada)
        window.location.href = '../index.html';
    }
}

// ===== VERIFICAÇÃO DE TOKEN =====
async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.ok;
    } catch (error) {
        return false;
    }
}

// ===== UTILITÁRIOS =====
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(`${inputId}-icon`);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'bi bi-eye';
    }
}

function setButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.classList.add('loading');
        button.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Entrando...';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        
        // Restaurar texto original baseado no tipo
        if (button.closest('#hospede')) {
            button.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Entrar';
        } else {
            button.innerHTML = '<i class="bi bi-shield-lock me-2"></i>Entrar no Sistema';
        }
    }
}

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
    
    // Inserir antes do primeiro formulário
    const loginCard = document.querySelector('.login-card');
    const tabContent = loginCard.querySelector('.tab-content');
    loginCard.insertBefore(alertDiv, tabContent);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function clearStoredData() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_TYPE);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER_TYPE);
    sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
}

// ===== VALIDAÇÃO =====
function setupValidation() {
    const forms = document.querySelectorAll('.login-form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', validateInput);
            input.addEventListener('input', clearValidation);
        });
    });
}

function validateInput(e) {
    const input = e.target;
    const value = input.value.trim();
    
    // Remover validação anterior
    clearValidation(e);
    
    if (!value) {
        showInputError(input, 'Este campo é obrigatório');
        return false;
    }
    
    if (input.type === 'email' && !isValidEmail(value)) {
        showInputError(input, 'Digite um e-mail válido');
        return false;
    }
    
    if (input.type === 'password' && value.length < 6) {
        showInputError(input, 'A senha deve ter pelo menos 6 caracteres');
        return false;
    }
    
    return true;
}

function clearValidation(e) {
    const input = e.target;
    input.classList.remove('is-invalid');
    
    const feedback = input.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.remove();
    }
}

function showInputError(input, message) {
    input.classList.add('is-invalid');
    
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    
    input.parentNode.appendChild(feedback);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ===== EVENTOS ADICIONAIS =====
function setupEvents() {
    // Detectar mudança de tab
    const tabs = document.querySelectorAll('[data-bs-toggle="pill"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function() {
            // Limpar formulários ao trocar de tab
            const forms = document.querySelectorAll('.login-form');
            forms.forEach(form => form.reset());

            // Limpar validações
            const invalidInputs = document.querySelectorAll('.is-invalid');
            invalidInputs.forEach(input => {
                input.classList.remove('is-invalid');
            });

            const feedbacks = document.querySelectorAll('.invalid-feedback');
            feedbacks.forEach(feedback => feedback.remove());
        });
    });

    // Configurar botões de toggle de senha
    const toggleButtons = document.querySelectorAll('[data-toggle-password]');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const inputId = this.getAttribute('data-toggle-password');
            togglePassword(inputId);
        });
    });

    // Configurar links
    const registerLink = document.getElementById('showRegisterLink');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            showRegisterModal();
        });
    }

    const forgotPasswordLink = document.getElementById('showForgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            showForgotPassword();
        });
    }
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const userType = urlParams.get('type');
    
    if (userType === 'funcionario') {
        // Ativar tab de funcionário
        const funcionarioTab = document.getElementById('funcionario-tab');
        if (funcionarioTab) {
            funcionarioTab.click();
        }
    }
}

// ===== FUNÇÕES PARA MODAIS (FUTURAS) =====
function showRegisterModal() {
    showAlert('Funcionalidade de cadastro será implementada em breve!', 'info');
}

function showForgotPassword() {
    showAlert('Funcionalidade de recuperação de senha será implementada em breve!', 'info');
}
