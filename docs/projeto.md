# Sistema de Hotelaria para Cidades Históricas - Hotel Paradise

## 📋 Visão Geral do Projeto

Sistema completo de gestão hoteleira desenvolvido para o Hotel Paradise localizado em Rio Negro, Paraná - uma charmosa cidade histórica. O sistema foca em simplicidade, completude e interface agradável para atender às necessidades específicas de hotéis em cidades históricas.

## 🎯 Objetivos

- Criar um sistema simples mas completo para gestão hoteleira
- Interface visual agradável (cores, disposição, fontes, navegação clara)
- Suporte para hotel individual ou rede de hotéis
- Conformidade com LGPD (Lei Geral de Proteção de Dados)

## 🛠️ Stack Tecnológica

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3 + Bootstrap 5** - Estilização responsiva e componentes
- **JavaScript (ES6+)** - Interatividade e consumo de API

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **RESTful API** - Arquitetura de comunicação
- **SQLite** - Banco de dados relacional

### Autenticação
- **JWT (JSON Web Tokens)** - Sistema de autenticação
- **Níveis de Acesso:** Hóspede, Recepcionista, Administrador

## 📁 Estrutura do Projeto

```
hotel_paradise/
├── server.js                    # Servidor principal
├── package.json
├── .env
├── public/
│   ├── index.html              # Landing page
│   ├── pages/
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── clientes.html
│   │   ├── quartos.html
│   │   ├── reservas.html
│   │   ├── funcionarios.html
│   │   ├── estoque.html
│   │   └── financeiro.html
│   ├── css/
│   │   ├── index.css               # Landing page
│   │   ├── login.css               # Página de login
│   │   ├── dashboard.css           # Dashboard principal
│   │   ├── clientes.css            # Gestão de clientes
│   │   ├── quartos.css             # Gestão de quartos
│   │   ├── reservas.css            # Sistema de reservas
│   │   ├── funcionarios.css        # Gestão de funcionários
│   │   ├── estoque.css             # Controle de estoque
│   │   └── financeiro.css          # Controle financeiro
│   ├── js/
│   │   ├── api.js                  # Comunicação com API
│   │   ├── auth.js                 # Autenticação
│   │   ├── index.js                # Landing page
│   │   ├── login.js                # Página de login
│   │   ├── dashboard.js            # Dashboard principal
│   │   ├── clientes.js             # Gestão de clientes
│   │   ├── quartos.js              # Gestão de quartos
│   │   ├── reservas.js             # Sistema de reservas
│   │   ├── funcionarios.js         # Gestão de funcionários
│   │   ├── estoque.js              # Controle de estoque
│   │   ├── financeiro.js           # Controle financeiro
│   │   └── utils/
│   │       ├── validation.js       # Validações
│   │       ├── formatting.js       # Formatação de dados
│   │       └── helpers.js          # Funções auxiliares
│   └── images/                 
├── controllers/
│   ├── authController.js
│   ├── reservasController.js
│   ├── quartosController.js
│   └── clientesController.js
├── models/
│   ├── User.js
│   ├── Reserva.js
│   ├── Quarto.js
│   └── Cliente.js
├── routes/
│   ├── auth.js
│   ├── reservas.js
│   └── api.js
├── middleware/
│   └── auth.js
├── database/
│   └── hotel.sqlite
└── docs/
    └── projeto.md
    └── api_documentation.md
    └── memoria.md
```

## 🏨 Módulos do Sistema

### 1. Landing Page / Página Inicial (index.html)
- **Apresentação do Hotel Paradise**
  - Nome e slogan do hotel
  - Localização: Rio Negro, Paraná
  - História da cidade e do hotel
  - Galeria de fotos dos quartos e instalações
  - Informações de contato completas
  - Serviços oferecidos
- **Informações Turísticas de Rio Negro**
  - **Centro Histórico:** Construções preservadas e arquitetura colonial
  - **Menor Cemitério do Mundo:** Recorde no Guinness (capela de 1929)
  - **Estação Ferroviária:** História da ferrovia e Trem dos Tropeiros
  - **Turismo Religioso:** Igrejas históricas e templos
  - **Turismo Rural:** Belezas naturais e propriedades rurais
  - **Proximidade com Curitiba:** 150km da capital (fácil acesso)
  - **Circuito das Cidades Históricas do Paraná**
- **Recursos Interativos**
  - Chat online para suporte em tempo real
  - Política de cancelamento clara
  - Termos e condições de hospedagem
  - Avaliações e depoimentos de hóspedes
  - FAQ (Perguntas Frequentes)
- **Área de Login Dupla**
  - Login para hóspedes (área do cliente)
  - Login para funcionários (acesso discreto ao sistema)
- **Design responsivo** com Bootstrap 5

### 2. Sistema de Reservas Online
- **Funcionalidades Públicas (Landing Page):**
  - Consulta de disponibilidade em tempo real
  - Visualização de quartos com galeria de fotos
  - Cálculo automático de preços e taxas
  - Formulário de reserva simplificado
  - Confirmação por email automática
  - Informações sobre políticas do hotel
- **Área do Cliente (com cadastro/login):**
  - Histórico completo de reservas
  - Modificação de reservas (conforme política)
  - Cancelamento online
  - Avaliação de serviços pós-hospedagem
  - Programa de fidelidade/descontos
  - Notificações por email/SMS

### 3. Controle de Clientes
- **Dados Pessoais:**
  - Nome completo
  - CPF (obrigatório)
  - RG
  - Data de nascimento
  - Nacionalidade
  - Estado civil
- **Contato e Endereço:**
  - Endereço completo (puxado pelo CEP)
  - Telefone(s)
  - E-mail
  - Redes sociais
- **Informações de Viagem:**
  - Origem (cidade e estado)
  - Motivo da visita (turismo, trabalho, outros)
  - Profissão
- **Histórico:**
  - Histórico de hospedagens
  - Observações especiais
  - Preferências do cliente

### 4. Controle de Quartos
- **Gestão Administrativa (via página de admin):**
  - Cadastro de novos quartos
  - Configuração flexível por estabelecimento
  - Edição de características e preços
- **Informações dos Quartos:**
  - Tipos: casal, suíte, casal + solteiro
  - Características: sacada, frigobar, vista
  - Status: ocupado, disponível, manutenção
  - Localização no hotel (andar, número)
  - Preços por categoria
  - Capacidade máxima
  - Fotos dos quartos

### 5. Controle de Ocupação
- Visualização em tempo real
- Mapa visual dos quartos
- Check-in / Check-out
- Reservas futuras
- Histórico de ocupação

### 6. Controle Financeiro dos Hóspedes
- Consumo de frigobar
- Serviços extras (lavanderia, spa, passeios)
- Conta corrente do hóspede
- Formas de pagamento
- Relatórios de consumo

### 7. Controle de Funcionários
- Dados pessoais
- Função exercida
- Salário
- Experiência profissional
- Avaliações dos hóspedes
- Controle de ponto

### 8. Controle de Estoque
- Produtos para café da manhã
- Itens de limpeza
- Chá da tarde
- Frigobar
- Controle de entrada/saída
- Alertas de estoque baixo

### 9. Controle Financeiro do Hotel
- **Receitas:**
  - Hospedagens
  - Serviços extras
  - Consumo de produtos
- **Despesas:**
  - Salários dos funcionários
  - Compra de produtos
  - Manutenção
- Relatórios financeiros
- Dashboard com gráficos

## 🔐 Níveis de Acesso

### Hóspede (Público)
- **Acesso via Landing Page:**
  - Visualizar quartos disponíveis com galeria de fotos
  - Sistema de reservas online
  - Consultar disponibilidade e preços
  - Ver promoções e pacotes especiais
  - Formulário de cadastro simplificado
  - Informações sobre atrações de Rio Negro, PR
  - Chat online para dúvidas e suporte
  - Política de cancelamento e termos
- **Área do Cliente (com login):**
  - Cancelar/modificar reservas
  - Histórico de hospedagens
  - Avaliar serviços após hospedagem
  - Acompanhar status da reserva

### Recepcionista
- Gestão completa de clientes e reservas
- Check-in/Check-out
- Controle de ocupação em tempo real
- Gerenciamento de serviços aos hóspedes
- Controle de quartos (status, limpeza, manutenção)
- Controle de estoque básico
- Relatórios de ocupação
- Suporte ao sistema de reservas online

### Administrador
- Acesso total ao sistema
- Gestão de funcionários e permissões
- Relatórios financeiros completos
- Configurações do sistema
- Gestão de promoções e preços
- Análise de avaliações dos hóspedes

## 🎨 Design e UX

### Paleta de Cores
- **Primária:** Tons de azul elegante (#2C3E50, #3498DB)
- **Secundária:** Dourado/Amarelo (#F39C12, #F1C40F)
- **Neutras:** Cinza claro (#ECF0F1, #BDC3C7)
- **Sucesso:** Verde (#27AE60)
- **Alerta:** Vermelho (#E74C3C)

### Tipografia
- **Títulos:** Playfair Display ou similar (elegante)
- **Corpo:** Open Sans ou Roboto (legibilidade)

### Componentes Bootstrap
- Navbar responsiva
- Cards para informações
- Modals para formulários
- Tables para listagens
- Forms com validação
- Alerts para feedback

## 🚀 Fases de Desenvolvimento

### Fase 1: Estrutura Base
1. Criação da página inicial (index.html)
2. Configuração do servidor Express
3. Estrutura do banco SQLite
4. Sistema de autenticação JWT

### Fase 2: Módulos Core
1. Gestão de quartos
2. Gestão de clientes
3. Sistema de reservas
4. Controle de ocupação

### Fase 3: Módulos Avançados
1. Controle financeiro
2. Gestão de funcionários
3. Controle de estoque
4. Relatórios e dashboard

### Fase 4: Refinamentos
1. Otimização de performance
2. Testes e validações
3. Documentação completa
4. Deploy e configuração

## 📝 Próximos Passos

### Fase 1: Landing Page e Estrutura Base
1. **Criar Landing Page (index.html)** conforme especificado no Módulo 1
2. **Configurar estrutura de pastas** do projeto
3. **Implementar servidor Express básico**
4. **Criar banco de dados SQLite** com esquema inicial

### Fase 2: Sistema de Reservas
1. **Desenvolver sistema de reservas online** (Módulo 2)
2. **Implementar autenticação JWT** para múltiplos níveis
3. **Criar área do cliente** para gestão de reservas

## 📚 Recursos e Referências

- Bootstrap 5 Documentation
- Express.js Guide
- SQLite Documentation
- JWT Authentication Best Practices
- LGPD Compliance Guidelines

---

**Desenvolvido para atender às necessidades de hotéis e pousadas em cidades históricas, priorizando simplicidade, funcionalidade e experiência do usuário.**
