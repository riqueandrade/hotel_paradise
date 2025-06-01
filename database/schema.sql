-- Schema do Banco de Dados - Hotel Paradise
-- Sistema de Gestão Hoteleira para Rio Negro, Paraná

-- Tabela de Usuários (Funcionários e Hóspedes)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('hospede', 'recepcionista', 'administrador') NOT NULL DEFAULT 'hospede',
    ativo BOOLEAN DEFAULT 1,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes/Hóspedes
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    nome_completo VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg VARCHAR(20),
    data_nascimento DATE,
    nacionalidade VARCHAR(50) DEFAULT 'Brasileira',
    estado_civil ENUM('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel'),
    profissao VARCHAR(100),
    
    -- Contato
    telefone VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(100),
    
    -- Endereço
    cep VARCHAR(10),
    endereco VARCHAR(200),
    numero VARCHAR(10),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    
    -- Informações de viagem
    cidade_origem VARCHAR(100),
    estado_origem VARCHAR(2),
    motivo_visita ENUM('turismo', 'trabalho', 'evento', 'familia', 'outros') DEFAULT 'turismo',
    
    -- Observações e preferências
    observacoes TEXT,
    preferencias TEXT,
    
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de Quartos
CREATE TABLE IF NOT EXISTS quartos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero VARCHAR(10) UNIQUE NOT NULL,
    andar INTEGER,
    tipo ENUM('casal', 'suite', 'casal_solteiro', 'familia') NOT NULL,
    capacidade_maxima INTEGER NOT NULL,
    preco_diaria DECIMAL(10,2) NOT NULL,
    
    -- Características
    tem_sacada BOOLEAN DEFAULT 0,
    tem_frigobar BOOLEAN DEFAULT 0,
    tem_ar_condicionado BOOLEAN DEFAULT 1,
    tem_tv BOOLEAN DEFAULT 1,
    tem_wifi BOOLEAN DEFAULT 1,
    vista ENUM('cidade', 'jardim', 'montanha', 'interna') DEFAULT 'interna',
    
    -- Status
    status ENUM('disponivel', 'ocupado', 'manutencao', 'limpeza') DEFAULT 'disponivel',
    
    -- Descrição e fotos
    descricao TEXT,
    fotos TEXT, -- JSON array com URLs das fotos
    
    ativo BOOLEAN DEFAULT 1,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Reservas
CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    quarto_id INTEGER NOT NULL,
    
    -- Datas
    data_checkin DATE NOT NULL,
    data_checkout DATE NOT NULL,
    data_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Valores
    valor_diaria DECIMAL(10,2) NOT NULL,
    numero_diarias INTEGER NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    valor_pago DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    status ENUM('pendente', 'confirmada', 'checkin', 'checkout', 'cancelada') DEFAULT 'pendente',
    
    -- Informações adicionais
    numero_hospedes INTEGER DEFAULT 1,
    observacoes TEXT,
    forma_pagamento ENUM('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia'),
    
    -- Controle
    checkin_realizado DATETIME,
    checkout_realizado DATETIME,
    funcionario_checkin INTEGER,
    funcionario_checkout INTEGER,
    
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (quarto_id) REFERENCES quartos(id),
    FOREIGN KEY (funcionario_checkin) REFERENCES usuarios(id),
    FOREIGN KEY (funcionario_checkout) REFERENCES usuarios(id)
);

-- Tabela de Funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nome_completo VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg VARCHAR(20),
    data_nascimento DATE,
    
    -- Contato
    telefone VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(100),
    
    -- Endereço
    endereco VARCHAR(200),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    
    -- Informações profissionais
    cargo ENUM('recepcionista', 'camareira', 'manutencao', 'administrador', 'gerente') NOT NULL,
    salario DECIMAL(10,2),
    data_admissao DATE,
    data_demissao DATE,
    
    -- Experiência e avaliações
    experiencia_anterior TEXT,
    avaliacoes TEXT, -- JSON com avaliações dos hóspedes
    
    ativo BOOLEAN DEFAULT 1,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de Estoque
CREATE TABLE IF NOT EXISTS estoque (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_produto VARCHAR(100) NOT NULL,
    categoria ENUM('cafe_manha', 'limpeza', 'cha_tarde', 'frigobar', 'manutencao', 'outros') NOT NULL,
    unidade_medida ENUM('unidade', 'kg', 'litro', 'pacote', 'caixa') DEFAULT 'unidade',
    quantidade_atual INTEGER DEFAULT 0,
    quantidade_minima INTEGER DEFAULT 5,
    preco_unitario DECIMAL(10,2),
    fornecedor VARCHAR(100),
    
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Movimentação de Estoque
CREATE TABLE IF NOT EXISTS movimentacao_estoque (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL,
    tipo_movimentacao ENUM('entrada', 'saida') NOT NULL,
    quantidade INTEGER NOT NULL,
    motivo VARCHAR(200),
    funcionario_id INTEGER,
    
    data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (produto_id) REFERENCES estoque(id),
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
);

-- Tabela de Consumo dos Hóspedes
CREATE TABLE IF NOT EXISTS consumo_hospedes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reserva_id INTEGER NOT NULL,
    produto_id INTEGER,
    descricao_servico VARCHAR(200),
    quantidade INTEGER DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    
    data_consumo DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reserva_id) REFERENCES reservas(id),
    FOREIGN KEY (produto_id) REFERENCES estoque(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_reservas_datas ON reservas(data_checkin, data_checkout);
CREATE INDEX IF NOT EXISTS idx_reservas_status ON reservas(status);
CREATE INDEX IF NOT EXISTS idx_quartos_status ON quartos(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Inserção de dados iniciais
INSERT OR IGNORE INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES 
('Administrador', 'admin@hotelparadise.com.br', '$2a$10$example_hash', 'administrador'),
('Recepcionista', 'recepcao@hotelparadise.com.br', '$2a$10$example_hash', 'recepcionista');

-- Quartos exemplo
INSERT OR IGNORE INTO quartos (numero, andar, tipo, capacidade_maxima, preco_diaria, tem_sacada, tem_frigobar, vista, descricao) VALUES 
('101', 1, 'casal', 2, 150.00, 0, 1, 'jardim', 'Quarto aconchegante com vista para o jardim'),
('102', 1, 'casal', 2, 150.00, 1, 1, 'cidade', 'Quarto com sacada e vista da cidade histórica'),
('201', 2, 'suite', 4, 250.00, 1, 1, 'montanha', 'Suíte luxuosa com vista das montanhas'),
('202', 2, 'casal_solteiro', 3, 180.00, 1, 1, 'jardim', 'Quarto família com cama de casal e solteiro');
