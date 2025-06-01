// JavaScript para Landing Page - Hotel Paradise
// Sistema de Gestão Hoteleira - Rio Negro, Paraná

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏨 Hotel Paradise - Sistema Inicializado');
    
    // Inicializar componentes
    initializeComponents();
    loadQuartos();
    setupEventListeners();
    setupFormValidation();
});

// Inicialização de componentes
function initializeComponents() {
    // Configurar datas mínimas para reserva
    const today = new Date().toISOString().split('T')[0];
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    
    if (checkinInput) {
        checkinInput.min = today;
        checkinInput.addEventListener('change', function() {
            const checkinDate = new Date(this.value);
            const minCheckout = new Date(checkinDate);
            minCheckout.setDate(minCheckout.getDate() + 1);
            checkoutInput.min = minCheckout.toISOString().split('T')[0];
        });
    }
    
    // Animações de entrada
    observeElements();
}

// Carregar quartos disponíveis
async function loadQuartos() {
    const container = document.getElementById('quartosContainer');
    if (!container) return;
    
    // Dados de exemplo dos quartos (posteriormente virá da API)
    const quartos = [
        {
            id: 1,
            numero: '101',
            tipo: 'Casal',
            capacidade: 2,
            preco: 150.00,
            caracteristicas: ['Frigobar', 'Vista Jardim', 'Wi-Fi'],
            imagem: 'images/quarto-casal.jpg',
            descricao: 'Quarto aconchegante com vista para o jardim'
        },
        {
            id: 2,
            numero: '102',
            tipo: 'Casal',
            capacidade: 2,
            preco: 150.00,
            caracteristicas: ['Sacada', 'Frigobar', 'Vista Cidade'],
            imagem: 'images/quarto-sacada.jpg',
            descricao: 'Quarto com sacada e vista da cidade histórica'
        },
        {
            id: 3,
            numero: '201',
            tipo: 'Suíte',
            capacidade: 4,
            preco: 250.00,
            caracteristicas: ['Sacada', 'Frigobar', 'Vista Montanha', 'Banheira'],
            imagem: 'images/suite-luxo.jpg',
            descricao: 'Suíte luxuosa com vista das montanhas'
        },
        {
            id: 4,
            numero: '202',
            tipo: 'Casal + Solteiro',
            capacidade: 3,
            preco: 180.00,
            caracteristicas: ['Sacada', 'Frigobar', 'Vista Jardim'],
            imagem: 'images/quarto-familia.jpg',
            descricao: 'Quarto família com cama de casal e solteiro'
        }
    ];
    
    container.innerHTML = quartos.map(quarto => `
        <div class="col-lg-6 col-xl-3">
            <div class="card h-100 shadow-sm">
                <div class="position-relative">
                    <img src="${quarto.imagem}" class="card-img-top" alt="Quarto ${quarto.numero}" 
                         onerror="this.src='images/placeholder-quarto.jpg'">
                    <div class="position-absolute top-0 end-0 m-2">
                        <span class="badge bg-primary">Quarto ${quarto.numero}</span>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${quarto.tipo}</h5>
                    <p class="card-text text-muted small">${quarto.descricao}</p>
                    <div class="mb-2">
                        <small class="text-muted">
                            <i class="bi bi-people"></i> Até ${quarto.capacidade} pessoas
                        </small>
                    </div>
                    <div class="mb-3">
                        ${quarto.caracteristicas.map(carac => 
                            `<span class="badge bg-light text-dark me-1 mb-1">${carac}</span>`
                        ).join('')}
                    </div>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="h5 text-primary mb-0">R$ ${quarto.preco.toFixed(2)}</span>
                                <small class="text-muted d-block">por noite</small>
                            </div>
                            <button class="btn btn-outline-primary btn-sm" 
                                    onclick="selecionarQuarto(${quarto.id}, '${quarto.tipo}')">
                                Selecionar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Configurar event listeners
function setupEventListeners() {
    // Formulário de reserva
    const reservaForm = document.getElementById('reservaForm');
    if (reservaForm) {
        reservaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            verificarDisponibilidade();
        });
    }
    
    // Formulário de contato
    const contatoForm = document.getElementById('contatoForm');
    if (contatoForm) {
        contatoForm.addEventListener('submit', handleContatoSubmit);
    }
    
    // Formulários de login
    const loginHospedeForm = document.getElementById('loginHospedeForm');
    if (loginHospedeForm) {
        loginHospedeForm.addEventListener('submit', handleLoginHospede);
    }
    
    const loginFuncionarioForm = document.getElementById('loginFuncionarioForm');
    if (loginFuncionarioForm) {
        loginFuncionarioForm.addEventListener('submit', handleLoginFuncionario);
    }
}

// Verificar disponibilidade de quartos
async function verificarDisponibilidade() {
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const hospedes = document.getElementById('hospedes').value;
    const tipoQuarto = document.getElementById('tipoQuarto').value;
    const resultadoDiv = document.getElementById('resultadoDisponibilidade');
    
    // Validações
    if (!checkin || !checkout || !hospedes || !tipoQuarto) {
        showAlert('Por favor, preencha todos os campos.', 'warning');
        return;
    }
    
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    
    if (checkoutDate <= checkinDate) {
        showAlert('A data de checkout deve ser posterior à data de check-in.', 'warning');
        return;
    }
    
    // Mostrar loading
    resultadoDiv.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Verificando disponibilidade...</span>
            </div>
            <p class="mt-2">Verificando disponibilidade...</p>
        </div>
    `;
    
    // Simular chamada à API
    setTimeout(() => {
        const diasEstadia = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
        const precoBase = getPrecoByTipo(tipoQuarto);
        const valorTotal = precoBase * diasEstadia;
        
        resultadoDiv.innerHTML = `
            <div class="alert alert-success">
                <h6><i class="bi bi-check-circle"></i> Quartos Disponíveis!</h6>
                <div class="row mt-3">
                    <div class="col-md-6">
                        <strong>Detalhes da Reserva:</strong><br>
                        <small>
                            Check-in: ${formatDate(checkin)}<br>
                            Check-out: ${formatDate(checkout)}<br>
                            Hóspedes: ${hospedes}<br>
                            Tipo: ${tipoQuarto}<br>
                            Diárias: ${diasEstadia}
                        </small>
                    </div>
                    <div class="col-md-6">
                        <strong>Valor Total:</strong><br>
                        <span class="h5 text-success">R$ ${valorTotal.toFixed(2)}</span><br>
                        <small class="text-muted">R$ ${precoBase.toFixed(2)} por noite</small>
                    </div>
                </div>
                <button class="btn btn-success mt-3" onclick="iniciarReserva()">
                    <i class="bi bi-calendar-plus"></i> Fazer Reserva
                </button>
            </div>
        `;
    }, 1500);
}

// Obter preço por tipo de quarto
function getPrecoByTipo(tipo) {
    const precos = {
        'casal': 150.00,
        'suite': 250.00,
        'casal_solteiro': 180.00,
        'familia': 200.00
    };
    return precos[tipo] || 150.00;
}

// Selecionar quarto específico
function selecionarQuarto(quartoId, tipoQuarto) {
    document.getElementById('tipoQuarto').value = tipoQuarto.toLowerCase().replace(' + ', '_').replace(' ', '_');
    scrollToSection('reservas');
    showAlert(`Quarto ${tipoQuarto} selecionado! Complete os dados para verificar disponibilidade.`, 'info');
}

// Iniciar processo de reserva
function iniciarReserva() {
    showAlert('Funcionalidade em desenvolvimento. Em breve você poderá finalizar sua reserva online!', 'info');
    // Aqui será implementado o fluxo completo de reserva
}

// Handlers dos formulários
async function handleContatoSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Simular envio
    showAlert('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
    e.target.reset();
}

async function handleLoginHospede(e) {
    e.preventDefault();
    const email = document.getElementById('emailHospede').value;
    const senha = document.getElementById('senhaHospede').value;
    
    // Simular login
    showAlert('Funcionalidade em desenvolvimento. Área do cliente será implementada em breve!', 'info');
}

async function handleLoginFuncionario(e) {
    e.preventDefault();
    const email = document.getElementById('emailFuncionario').value;
    const senha = document.getElementById('senhaFuncionario').value;
    
    // Simular login
    showAlert('Funcionalidade em desenvolvimento. Sistema de funcionários será implementado em breve!', 'info');
}

// Configurar validação de formulários
function setupFormValidation() {
    // Adicionar validação em tempo real
    const inputs = document.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        });
    });
}

// Funções utilitárias
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function showAlert(message, type = 'info') {
    // Criar alert temporário
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; max-width: 400px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Observador para animações
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    });
    
    // Observar cards e seções
    const elementsToObserve = document.querySelectorAll('.card, .feature-card, section');
    elementsToObserve.forEach(el => observer.observe(el));
}

// Mostrar formulário de cadastro de hóspede
function mostrarCadastroHospede() {
    showAlert('Funcionalidade de cadastro será implementada em breve!', 'info');
}

// Função para debug
window.hotelParadise = {
    version: '1.0.0',
    debug: true,
    log: (message) => {
        if (window.hotelParadise.debug) {
            console.log(`🏨 Hotel Paradise: ${message}`);
        }
    }
};

console.log('🏨 Hotel Paradise - Landing Page carregada com sucesso!');
