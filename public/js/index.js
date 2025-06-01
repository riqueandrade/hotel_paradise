// JavaScript para Landing Page - Hotel Paradise
// Sistema de Gestão Hoteleira - Rio Negro, Paraná

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏨 Hotel Paradise - Sistema Inicializado');
    
    // Inicializar componentes
    initializeComponents();
    loadQuartos();
    loadTourismAttractions();
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
            tipo: 'Standard',
            capacidade: 2,
            preco: 120.00,
            caracteristicas: ['Frigobar', 'Vista Jardim', 'Wi-Fi', 'AC'],
            imagem: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            descricao: 'Quarto confortável e aconchegante com vista para o jardim'
        },
        {
            id: 2,
            numero: '102',
            tipo: 'Superior',
            capacidade: 2,
            preco: 160.00,
            caracteristicas: ['Sacada', 'Frigobar', 'Vista Cidade', 'TV Smart'],
            imagem: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            descricao: 'Quarto superior com sacada e vista da cidade histórica'
        },
        {
            id: 3,
            numero: '201',
            tipo: 'Suíte Master',
            capacidade: 4,
            preco: 280.00,
            caracteristicas: ['Sacada Ampla', 'Frigobar', 'Vista Montanha', 'Banheira', 'Sala de Estar'],
            imagem: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            descricao: 'Suíte luxuosa com sala de estar e vista panorâmica das montanhas'
        },
        {
            id: 4,
            numero: '202',
            tipo: 'Família',
            capacidade: 4,
            preco: 200.00,
            caracteristicas: ['Beliche', 'Frigobar', 'Vista Jardim', 'Espaço Kids'],
            imagem: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            descricao: 'Quarto família com beliche e espaço especial para crianças'
        }
    ];
    
    container.innerHTML = quartos.map(quarto => {
        const categoryBadge = getCategoryBadge(quarto.tipo);
        const categoryClass = getCategoryClass(quarto.tipo);

        return `
        <div class="col-lg-6 col-xl-3 room-card" data-category="${categoryClass}">
            <div class="card room-card-inner h-100 shadow-sm">
                <div class="position-relative room-image-container">
                    <img src="${quarto.imagem}" class="card-img-top room-image" alt="Quarto ${quarto.numero}"
                         onerror="this.src='images/placeholder-quarto.jpg'">
                    <div class="room-badges">
                        <span class="badge room-number-badge">Quarto ${quarto.numero}</span>
                        <span class="badge ${categoryBadge.class}">${categoryBadge.text}</span>
                    </div>
                    <div class="room-overlay">
                        <div class="room-overlay-content">
                            <i class="bi bi-eye fs-4"></i>
                            <span>Ver Detalhes</span>
                        </div>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title room-title">${quarto.tipo}</h5>
                        <div class="room-rating">
                            <i class="bi bi-star-fill text-warning"></i>
                            <span class="small">4.8</span>
                        </div>
                    </div>
                    <p class="card-text text-muted small room-description">${quarto.descricao}</p>

                    <div class="room-info mb-3">
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi bi-people me-2 text-primary"></i>
                            <small>Até ${quarto.capacidade} pessoas</small>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-geo-alt me-2 text-primary"></i>
                            <small>${getViewType(quarto.caracteristicas)}</small>
                        </div>
                    </div>

                    <div class="room-features mb-3">
                        ${quarto.caracteristicas.map(carac =>
                            `<span class="feature-badge">${getFeatureIcon(carac)} ${carac}</span>`
                        ).join('')}
                    </div>

                    <div class="mt-auto">
                        <div class="room-price-section">
                            <div class="price-info mb-3">
                                <span class="room-price">R$ ${quarto.preco.toFixed(2)}</span>
                                <small class="text-muted d-block">por noite</small>
                            </div>
                            <div class="room-actions">
                                <button class="btn btn-outline-primary btn-sm flex-fill me-2 view-details-btn"
                                        data-room-id="${quarto.id}" title="Ver detalhes">
                                    <i class="bi bi-eye me-1"></i>Ver detalhes
                                </button>
                                <button class="btn btn-primary btn-sm flex-fill select-room-btn"
                                        data-room-id="${quarto.id}" data-room-type="${quarto.tipo}">
                                    <i class="bi bi-calendar-check me-1"></i>Reservar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    // Inicializar filtros
    setupRoomFilters();
}

// Carregar atrações turísticas
async function loadTourismAttractions() {
    const container = document.getElementById('tourismContainer');
    if (!container) return;

    // Dados das atrações turísticas de Rio Negro
    const attractions = [
        {
            id: 1,
            name: 'Centro Histórico',
            category: 'historico',
            description: 'Construções preservadas e arquitetura colonial que contam a história de mais de 150 anos da cidade.',
            image: 'images/centro_historico.jpg',
            rating: 4.7,
            duration: '2-3 horas',
            highlights: ['Arquitetura Colonial', 'Casarões Históricos', 'Ruas de Paralelepípedo'],
            modalTarget: 'centroHistoricoModal'
        },
        {
            id: 2,
            name: 'Menor Cemitério do Mundo',
            category: 'historico',
            description: 'Reconhecido pelo Guinness Book, a capela de 1929 é uma das principais atrações turísticas da cidade.',
            image: 'images/menor_cemiterio_do_mundo.jpg',
            rating: 4.9,
            duration: '30 min',
            highlights: ['Guinness Book', 'Capela de 1929', 'Marco Histórico'],
            modalTarget: 'cemiterioModal'
        },
        {
            id: 3,
            name: 'Estação Ferroviária',
            category: 'cultural',
            description: 'História da ferrovia e o famoso Trem dos Tropeiros, importante marco do desenvolvimento regional.',
            image: 'images/patio_estacao.jpg',
            rating: 4.5,
            duration: '1-2 horas',
            highlights: ['Trem dos Tropeiros', 'História Ferroviária', 'Patrimônio Cultural'],
            modalTarget: 'estacaoModal'
        },
        {
            id: 4,
            name: 'Igreja Senhor Bom Jesus da Coluna',
            category: 'religioso',
            description: 'Uma das mais belas igrejas da região, marco arquitetônico e espiritual da comunidade local.',
            image: 'images/Igreja-Senhor-Bom-Jesus-da-Coluna.jpg',
            rating: 4.6,
            duration: '45 min',
            highlights: ['Arquitetura Religiosa', 'Patrimônio Espiritual', 'Arte Sacra'],
            modalTarget: 'igrejaModal'
        },
        {
            id: 5,
            name: 'Turismo Rural',
            category: 'natural',
            description: 'Belezas naturais e propriedades rurais que oferecem contato direto com a natureza e tradições locais.',
            image: 'images/turismo_rural.jpg',
            rating: 4.4,
            duration: 'Dia inteiro',
            highlights: ['Natureza Preservada', 'Trilhas Ecológicas', 'Gastronomia Rural'],
            modalTarget: 'turismoRuralModal'
        },
        {
            id: 6,
            name: 'Parque Municipal',
            category: 'natural',
            description: 'Área verde preservada com trilhas, playground e espaços para piquenique em família.',
            image: 'images/seminario.jpg',
            rating: 4.3,
            duration: '2-4 horas',
            highlights: ['Trilhas Naturais', 'Área de Lazer', 'Fauna Local'],
            modalTarget: 'parqueMunicipalModal'
        }
    ];

    container.innerHTML = attractions.map(attraction => {
        const categoryInfo = getTourismCategoryInfo(attraction.category);

        return `
        <div class="col-lg-4 col-md-6 tourism-card" data-category="${attraction.category}">
            <div class="card tourism-card-inner h-100 shadow-sm">
                <div class="position-relative tourism-image-container">
                    <img src="${attraction.image}" class="card-img-top tourism-image" alt="${attraction.name}"
                         onerror="this.src='images/placeholder-tourism.jpg'">
                    <div class="tourism-badges">
                        <span class="badge ${categoryInfo.class}">${categoryInfo.text}</span>
                        <span class="badge bg-dark tourism-duration">${attraction.duration}</span>
                    </div>

                </div>
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title tourism-title">${attraction.name}</h5>
                        <div class="tourism-rating">
                            <i class="bi bi-star-fill text-warning"></i>
                            <span class="small">${attraction.rating}</span>
                        </div>
                    </div>
                    <p class="card-text text-muted small tourism-description">${attraction.description}</p>

                    <div class="tourism-highlights mb-3">
                        ${attraction.highlights.map(highlight =>
                            `<span class="highlight-badge">${highlight}</span>`
                        ).join('')}
                    </div>

                    <div class="mt-auto">
                        <div class="tourism-actions">
                            ${attraction.modalTarget ?
                                `<button class="btn btn-outline-success btn-sm flex-fill me-2 tourism-view-btn"
                                        data-bs-toggle="modal" data-bs-target="#${attraction.modalTarget}">
                                    <i class="bi bi-images me-1"></i>Ver Fotos
                                </button>` :
                                `<button class="btn btn-outline-success btn-sm flex-fill me-2" disabled>
                                    <i class="bi bi-images me-1"></i>Em Breve
                                </button>`
                            }
                            <button class="btn btn-success btn-sm flex-fill get-directions-btn"
                                    data-attraction="${attraction.name}">
                                <i class="bi bi-geo-alt me-1"></i>Localização
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    // Configurar filtros de turismo
    setupTourismFilters();
}

// Configurar event listeners
function setupEventListeners() {
    // Smooth scroll para links de navegação
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Botões de scroll para seções
    document.querySelectorAll('.scroll-to-reservas').forEach(button => {
        button.addEventListener('click', () => scrollToSection('reservas'));
    });

    document.querySelectorAll('.scroll-to-quartos').forEach(button => {
        button.addEventListener('click', () => scrollToSection('quartos'));
    });

    // Botão verificar disponibilidade
    const verificarBtn = document.querySelector('.verificar-disponibilidade-btn');
    if (verificarBtn) {
        verificarBtn.addEventListener('click', verificarDisponibilidade);
    }

    // Link cadastro de hóspede
    const cadastroLink = document.querySelector('.cadastro-hospede-link');
    if (cadastroLink) {
        cadastroLink.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarCadastroHospede();
        });
    }

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
        'standard': 120.00,
        'superior': 160.00,
        'suíte_master': 280.00,
        'suite_master': 280.00,
        'família': 200.00,
        'familia': 200.00
    };
    return precos[tipo] || 120.00;
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

// Funções auxiliares para quartos
function getCategoryBadge(tipo) {
    const badges = {
        'Standard': { class: 'bg-success', text: 'Econômico' },
        'Superior': { class: 'bg-primary', text: 'Conforto' },
        'Suíte Master': { class: 'bg-warning text-dark', text: 'Premium' },
        'Família': { class: 'bg-info', text: 'Família' }
    };
    return badges[tipo] || { class: 'bg-secondary', text: 'Standard' };
}

function getCategoryClass(tipo) {
    const classes = {
        'Standard': 'standard',
        'Superior': 'superior',
        'Suíte Master': 'suite',
        'Família': 'familia'
    };
    return classes[tipo] || 'standard';
}

function getViewType(caracteristicas) {
    if (caracteristicas.includes('Vista Jardim')) return 'Vista para o Jardim';
    if (caracteristicas.includes('Vista Cidade')) return 'Vista da Cidade Histórica';
    if (caracteristicas.includes('Vista Montanha')) return 'Vista das Montanhas';
    return 'Vista Interna';
}

function getFeatureIcon(feature) {
    const icons = {
        'Frigobar': '<i class="bi bi-snow"></i>',
        'Wi-Fi': '<i class="bi bi-wifi"></i>',
        'AC': '<i class="bi bi-thermometer-snow"></i>',
        'Sacada': '<i class="bi bi-door-open"></i>',
        'TV Smart': '<i class="bi bi-tv"></i>',
        'Banheira': '<i class="bi bi-droplet"></i>',
        'Sala de Estar': '<i class="bi bi-house"></i>',
        'Beliche': '<i class="bi bi-bounding-box"></i>',
        'Espaço Kids': '<i class="bi bi-balloon"></i>',
        'Sacada Ampla': '<i class="bi bi-door-open"></i>'
    };
    return icons[feature] || '<i class="bi bi-check"></i>';
}

// Configurar filtros de quartos e event listeners
function setupRoomFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const roomCards = document.querySelectorAll('.room-card');

    // Configurar filtros
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');

            // Atualizar botões ativos
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filtrar quartos
            roomCards.forEach(card => {
                const category = card.getAttribute('data-category');

                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    card.classList.add('fade-in');
                } else {
                    card.style.display = 'none';
                    card.classList.remove('fade-in');
                }
            });
        });
    });

    // Configurar botões "Ver detalhes"
    const viewDetailsButtons = document.querySelectorAll('.view-details-btn');
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', function() {
            const roomId = this.getAttribute('data-room-id');
            viewRoomDetails(roomId);
        });
    });

    // Configurar botões "Reservar"
    const selectRoomButtons = document.querySelectorAll('.select-room-btn');
    selectRoomButtons.forEach(button => {
        button.addEventListener('click', function() {
            const roomId = this.getAttribute('data-room-id');
            const roomType = this.getAttribute('data-room-type');
            selecionarQuarto(roomId, roomType);
        });
    });
}

// Ver detalhes do quarto
function viewRoomDetails(quartoId) {
    // Buscar dados do quarto
    const quarto = getRoomData(quartoId);
    if (!quarto) {
        showAlert('Quarto não encontrado!', 'error');
        return;
    }

    // Preencher dados do modal
    populateRoomModal(quarto);

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('roomDetailsModal'));
    modal.show();
}

// Obter dados do quarto por ID
function getRoomData(quartoId) {
    const quartos = [
        {
            id: 1,
            numero: '101',
            tipo: 'Standard',
            capacidade: 2,
            preco: 120.00,
            area: '25 m²',
            cama: 'Casal Queen',
            caracteristicas: ['Frigobar', 'Vista Jardim', 'Wi-Fi', 'AC'],
            imagens: [
                'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            descricao: 'Quarto confortável e aconchegante, perfeito para casais que buscam tranquilidade. Localizado no térreo com vista direta para nosso belo jardim. Ambiente climatizado e decoração moderna que proporciona uma estadia relaxante.',
            vista: 'Vista para o Jardim'
        },
        {
            id: 2,
            numero: '102',
            tipo: 'Superior',
            capacidade: 2,
            preco: 160.00,
            area: '30 m²',
            cama: 'Casal King',
            caracteristicas: ['Sacada', 'Frigobar', 'Vista Cidade', 'TV Smart'],
            imagens: [
                'https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            descricao: 'Quarto superior com sacada privativa e vista privilegiada da cidade histórica de Rio Negro. Equipado com TV Smart e amenities premium. Ideal para hóspedes que valorizam conforto e uma vista espetacular.',
            vista: 'Vista da Cidade Histórica'
        },
        {
            id: 3,
            numero: '201',
            tipo: 'Suíte Master',
            capacidade: 4,
            preco: 280.00,
            area: '45 m²',
            cama: 'Casal King + Sofá-cama',
            caracteristicas: ['Sacada Ampla', 'Frigobar', 'Vista Montanha', 'Banheira', 'Sala de Estar'],
            imagens: [
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1591088398332-8a7791972843?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            descricao: 'Nossa suíte mais luxuosa com sala de estar separada e vista panorâmica das montanhas. Banheira de hidromassagem, sacada ampla e acabamentos premium. Perfeita para ocasiões especiais e estadias prolongadas.',
            vista: 'Vista Panorâmica das Montanhas'
        },
        {
            id: 4,
            numero: '202',
            tipo: 'Família',
            capacidade: 4,
            preco: 200.00,
            area: '35 m²',
            cama: 'Casal + Beliche',
            caracteristicas: ['Beliche', 'Frigobar', 'Vista Jardim', 'Espaço Kids'],
            imagens: [
                'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            ],
            descricao: 'Quarto especialmente projetado para famílias com crianças. Beliche seguro e divertido, área de jogos e vista para o jardim onde as crianças podem brincar. Ambiente seguro e acolhedor para toda a família.',
            vista: 'Vista para o Jardim'
        }
    ];

    return quartos.find(q => q.id == quartoId);
}

// Preencher dados do modal
function populateRoomModal(quarto) {
    // Título e informações básicas
    document.getElementById('roomDetailsModalLabel').textContent = `${quarto.tipo} - Quarto ${quarto.numero}`;
    document.getElementById('roomName').textContent = quarto.tipo;
    document.getElementById('roomNumber').textContent = `Quarto ${quarto.numero}`;
    document.getElementById('roomDescriptionFull').textContent = quarto.descricao;

    // Badge da categoria
    const categoryBadge = getCategoryBadge(quarto.tipo);
    const badgeElement = document.getElementById('roomCategoryBadge');
    badgeElement.textContent = categoryBadge.text;
    badgeElement.className = `room-category-badge ${categoryBadge.class}`;

    // Informações básicas
    document.getElementById('roomCapacity').textContent = `${quarto.capacidade} pessoas`;
    document.getElementById('roomView').textContent = quarto.vista;
    document.getElementById('roomArea').textContent = quarto.area;
    document.getElementById('roomBed').textContent = quarto.cama;
    document.getElementById('roomPrice').textContent = `R$ ${quarto.preco.toFixed(2)}`;

    // Galeria de imagens
    setupImageGallery(quarto.imagens);

    // Características detalhadas
    setupDetailedFeatures(quarto.caracteristicas);

    // Configurar botões do modal
    setupModalButtons(quarto);
}

// Configurar galeria de imagens
function setupImageGallery(imagens) {
    const mainImage = document.getElementById('mainRoomImage');
    const thumbnailContainer = document.getElementById('thumbnailContainer');

    // Imagem principal
    mainImage.src = imagens[0];

    // Thumbnails
    thumbnailContainer.innerHTML = imagens.map((img, index) => `
        <div class="col-3">
            <div class="thumbnail-item ${index === 0 ? 'active' : ''}" data-image="${img}">
                <img src="${img}" alt="Foto ${index + 1}" loading="lazy">
            </div>
        </div>
    `).join('');

    // Event listeners para thumbnails
    thumbnailContainer.querySelectorAll('.thumbnail-item').forEach(thumb => {
        thumb.addEventListener('click', function() {
            const newImage = this.getAttribute('data-image');
            mainImage.src = newImage;

            // Atualizar thumbnail ativo
            thumbnailContainer.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Configurar características detalhadas
function setupDetailedFeatures(caracteristicas) {
    const featuresContainer = document.getElementById('roomFeaturesDetailed');

    featuresContainer.innerHTML = caracteristicas.map(feature => `
        <div class="feature-item-detailed">
            ${getFeatureIcon(feature)}
            <span>${feature}</span>
        </div>
    `).join('');
}

// Configurar botões do modal
function setupModalButtons(quarto) {
    const reserveBtn = document.getElementById('reserveFromModal');
    const checkAvailabilityBtn = document.querySelector('.check-availability-btn');

    // Remover event listeners anteriores
    const newReserveBtn = reserveBtn.cloneNode(true);
    const newCheckBtn = checkAvailabilityBtn.cloneNode(true);
    reserveBtn.parentNode.replaceChild(newReserveBtn, reserveBtn);
    checkAvailabilityBtn.parentNode.replaceChild(newCheckBtn, checkAvailabilityBtn);

    // Adicionar novos event listeners
    newReserveBtn.addEventListener('click', function() {
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('roomDetailsModal'));
        modal.hide();

        // Selecionar quarto e ir para reservas
        selecionarQuarto(quarto.id, quarto.tipo);
    });

    newCheckBtn.addEventListener('click', function() {
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('roomDetailsModal'));
        modal.hide();

        // Ir para seção de reservas
        scrollToSection('reservas');
        showAlert('Complete os dados para verificar a disponibilidade deste quarto.', 'info');
    });
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

// Funções auxiliares para turismo
function getTourismCategoryInfo(category) {
    const categories = {
        'historico': { class: 'bg-warning text-dark', text: 'Histórico' },
        'religioso': { class: 'bg-info', text: 'Religioso' },
        'natural': { class: 'bg-success', text: 'Natural' },
        'cultural': { class: 'bg-primary', text: 'Cultural' }
    };
    return categories[category] || { class: 'bg-secondary', text: 'Geral' };
}

// Configurar filtros de turismo
function setupTourismFilters() {
    const filterButtons = document.querySelectorAll('.tourism-filter-btn');
    const tourismCards = document.querySelectorAll('.tourism-card');

    // Configurar filtros
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');

            // Atualizar botões ativos
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filtrar atrações
            tourismCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');

                if (category === 'all' || cardCategory === category) {
                    card.style.display = 'block';
                    card.classList.add('fade-in');
                } else {
                    card.style.display = 'none';
                    card.classList.remove('fade-in');
                }
            });
        });
    });

    // Configurar botões de localização
    const directionButtons = document.querySelectorAll('.get-directions-btn');
    directionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const attraction = this.getAttribute('data-attraction');
            getDirections(attraction);
        });
    });
}

// Obter direções para atração
function getDirections(attractionName) {
    const searchQuery = `${attractionName}, Rio Negro, Paraná, Brasil`;
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
    window.open(mapsUrl, '_blank');
    showAlert(`Abrindo localização de ${attractionName} no Google Maps...`, 'info');
}

console.log('🏨 Hotel Paradise - Landing Page carregada com sucesso!');
