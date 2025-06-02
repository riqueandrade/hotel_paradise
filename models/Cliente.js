// Model de Clientes - Hotel Paradise
const BaseModel = require('./BaseModel');

class Cliente extends BaseModel {
    constructor() {
        super('clientes');
    }

    // Criar cliente com validações
    async create(clienteData) {
        try {
            // Validar dados obrigatórios
            if (!clienteData.nome_completo || !clienteData.cpf) {
                throw new Error('Nome completo e CPF são obrigatórios');
            }

            // Validar CPF
            if (!this.validateCPF(clienteData.cpf)) {
                throw new Error('CPF inválido');
            }

            // Verificar se CPF já existe
            const existingClient = await this.findByCPF(clienteData.cpf);
            if (existingClient) {
                throw new Error('CPF já está cadastrado');
            }

            // Preparar dados para inserção
            const clienteToCreate = {
                usuario_id: clienteData.usuario_id || null,
                nome_completo: clienteData.nome_completo,
                cpf: this.formatCPF(clienteData.cpf),
                rg: clienteData.rg || null,
                data_nascimento: clienteData.data_nascimento || null,
                nacionalidade: clienteData.nacionalidade || 'Brasileira',
                estado_civil: clienteData.estado_civil || null,
                profissao: clienteData.profissao || null,
                telefone: clienteData.telefone || null,
                celular: clienteData.celular || null,
                email: clienteData.email ? clienteData.email.toLowerCase() : null,
                cep: clienteData.cep || null,
                endereco: clienteData.endereco || null,
                numero: clienteData.numero || null,
                complemento: clienteData.complemento || null,
                bairro: clienteData.bairro || null,
                cidade: clienteData.cidade || null,
                estado: clienteData.estado || null,
                cidade_origem: clienteData.cidade_origem || null,
                estado_origem: clienteData.estado_origem || null,
                motivo_visita: clienteData.motivo_visita || 'turismo',
                observacoes: clienteData.observacoes || null,
                preferencias: clienteData.preferencias || null,
                data_criacao: new Date().toISOString(),
                data_atualizacao: new Date().toISOString()
            };

            return await super.create(clienteToCreate);
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            throw error;
        }
    }

    // Buscar cliente por CPF
    async findByCPF(cpf) {
        try {
            const formattedCPF = this.formatCPF(cpf);
            return await this.findOne({ cpf: formattedCPF });
        } catch (error) {
            console.error('Erro ao buscar cliente por CPF:', error);
            throw error;
        }
    }

    // Buscar cliente por email
    async findByEmail(email) {
        try {
            return await this.findOne({ email: email.toLowerCase() });
        } catch (error) {
            console.error('Erro ao buscar cliente por email:', error);
            throw error;
        }
    }

    // Buscar clientes por cidade de origem
    async findByOrigin(cidade, estado = null) {
        try {
            const conditions = { cidade_origem: cidade };
            if (estado) {
                conditions.estado_origem = estado;
            }
            return await this.findAll(conditions);
        } catch (error) {
            console.error('Erro ao buscar clientes por origem:', error);
            throw error;
        }
    }

    // Buscar clientes por motivo da visita
    async findByVisitReason(motivo) {
        try {
            return await this.findAll({ motivo_visita: motivo });
        } catch (error) {
            console.error('Erro ao buscar clientes por motivo da visita:', error);
            throw error;
        }
    }

    // Buscar clientes com reservas ativas
    async findWithActiveReservations() {
        try {
            const query = `
                SELECT DISTINCT c.*, r.id as reserva_id, r.status as status_reserva
                FROM clientes c
                INNER JOIN reservas r ON c.id = r.cliente_id
                WHERE r.status IN ('confirmada', 'checkin')
                ORDER BY c.nome_completo
            `;
            return await this.query(query);
        } catch (error) {
            console.error('Erro ao buscar clientes com reservas ativas:', error);
            throw error;
        }
    }

    // Buscar histórico de reservas do cliente
    async getReservationHistory(clienteId) {
        try {
            const query = `
                SELECT r.*, q.numero as numero_quarto, q.tipo as tipo_quarto
                FROM reservas r
                INNER JOIN quartos q ON r.quarto_id = q.id
                WHERE r.cliente_id = ?
                ORDER BY r.data_checkin DESC
            `;
            return await this.query(query, [clienteId]);
        } catch (error) {
            console.error('Erro ao buscar histórico de reservas:', error);
            throw error;
        }
    }

    // Buscar clientes com filtros avançados
    async findWithFilters(filters = {}) {
        try {
            let query = `SELECT * FROM clientes WHERE 1=1`;
            const params = [];

            // Filtro por nome
            if (filters.nome) {
                query += ` AND nome_completo LIKE ?`;
                params.push(`%${filters.nome}%`);
            }

            // Filtro por cidade
            if (filters.cidade) {
                query += ` AND cidade LIKE ?`;
                params.push(`%${filters.cidade}%`);
            }

            // Filtro por estado
            if (filters.estado) {
                query += ` AND estado = ?`;
                params.push(filters.estado);
            }

            // Filtro por motivo da visita
            if (filters.motivo_visita) {
                query += ` AND motivo_visita = ?`;
                params.push(filters.motivo_visita);
            }

            // Filtro por período de cadastro
            if (filters.data_inicio) {
                query += ` AND data_criacao >= ?`;
                params.push(filters.data_inicio);
            }

            if (filters.data_fim) {
                query += ` AND data_criacao <= ?`;
                params.push(filters.data_fim);
            }

            query += ` ORDER BY nome_completo ASC`;

            return await this.query(query, params);
        } catch (error) {
            console.error('Erro ao buscar clientes com filtros:', error);
            throw error;
        }
    }

    // Obter estatísticas dos clientes
    async getStatistics() {
        try {
            const stats = await this.query(`
                SELECT 
                    COUNT(*) as total_clientes,
                    COUNT(CASE WHEN motivo_visita = 'turismo' THEN 1 END) as turismo,
                    COUNT(CASE WHEN motivo_visita = 'trabalho' THEN 1 END) as trabalho,
                    COUNT(CASE WHEN motivo_visita = 'evento' THEN 1 END) as evento,
                    COUNT(CASE WHEN motivo_visita = 'familia' THEN 1 END) as familia,
                    COUNT(CASE WHEN nacionalidade = 'Brasileira' THEN 1 END) as brasileiros,
                    COUNT(CASE WHEN nacionalidade != 'Brasileira' THEN 1 END) as estrangeiros
                FROM clientes
            `);

            return stats[0];
        } catch (error) {
            console.error('Erro ao obter estatísticas dos clientes:', error);
            throw error;
        }
    }

    // Validar CPF
    validateCPF(cpf) {
        // Remove caracteres não numéricos
        cpf = cpf.replace(/[^\d]/g, '');
        
        // Verifica se tem 11 dígitos
        if (cpf.length !== 11) return false;
        
        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Validação do algoritmo do CPF
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    }

    // Formatar CPF
    formatCPF(cpf) {
        // Remove caracteres não numéricos
        cpf = cpf.replace(/[^\d]/g, '');
        
        // Aplica a máscara XXX.XXX.XXX-XX
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // Calcular idade
    calculateAge(dataNascimento) {
        if (!dataNascimento) return null;
        
        const today = new Date();
        const birthDate = new Date(dataNascimento);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    // Override findById para adicionar idade calculada
    async findById(id) {
        try {
            const cliente = await super.findById(id);
            if (cliente && cliente.data_nascimento) {
                cliente.idade = this.calculateAge(cliente.data_nascimento);
            }
            return cliente;
        } catch (error) {
            console.error('Erro ao buscar cliente por ID:', error);
            throw error;
        }
    }
}

module.exports = new Cliente();
