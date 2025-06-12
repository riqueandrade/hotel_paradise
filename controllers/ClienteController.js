// Controller de Clientes - Hotel Paradise
const Cliente = require('../models/Cliente');
const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');

class ClienteController {
    // Listar todos os clientes
    async index(req, res) {
        try {
            const { page = 1, limit = 10, nome, cidade, estado, motivo_visita } = req.query;
            const offset = (page - 1) * limit;

            // Construir filtros
            const filters = {};
            if (nome) filters.nome = nome;
            if (cidade) filters.cidade = cidade;
            if (estado) filters.estado = estado;
            if (motivo_visita) filters.motivo_visita = motivo_visita;

            let clientes;
            if (Object.keys(filters).length > 0) {
                clientes = await Cliente.findWithFilters(filters);
            } else {
                clientes = await Cliente.findAll({}, parseInt(limit), offset);
            }

            const total = await Cliente.count();

            res.json({
                clientes: clientes,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Erro ao listar clientes:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar cliente por ID
    async show(req, res) {
        try {
            const { id } = req.params;
            const cliente = await Cliente.findById(id);

            if (!cliente) {
                return res.status(404).json({
                    error: 'Cliente não encontrado',
                    code: 'CLIENT_NOT_FOUND'
                });
            }

            res.json({ cliente });
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Criar novo cliente
    async create(req, res) {
        // Validação express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        try {
            const clienteData = req.body;
            const cliente = await Cliente.create(clienteData);

            res.status(201).json({
                message: 'Cliente criado com sucesso',
                cliente: cliente
            });
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            
            if (error.message.includes('já está cadastrado')) {
                return res.status(409).json({
                    error: 'CPF já está cadastrado',
                    code: 'CPF_ALREADY_EXISTS'
                });
            }

            if (error.message.includes('inválido')) {
                return res.status(400).json({
                    error: 'CPF inválido',
                    code: 'INVALID_CPF'
                });
            }

            if (error.message.includes('obrigatórios')) {
                return res.status(400).json({
                    error: error.message,
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }

            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Atualizar cliente
    async update(req, res) {
        // Validação express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        try {
            const { id } = req.params;
            const updateData = req.body;

            const cliente = await Cliente.findById(id);
            if (!cliente) {
                return res.status(404).json({
                    error: 'Cliente não encontrado',
                    code: 'CLIENT_NOT_FOUND'
                });
            }

            // Se está alterando CPF, verificar se não existe outro cliente com o mesmo CPF
            if (updateData.cpf && updateData.cpf !== cliente.cpf) {
                const existingClient = await Cliente.findByCPF(updateData.cpf);
                if (existingClient && existingClient.id !== parseInt(id)) {
                    return res.status(409).json({
                        error: 'CPF já está cadastrado para outro cliente',
                        code: 'CPF_ALREADY_EXISTS'
                    });
                }
            }

            const clienteAtualizado = await Cliente.update(id, updateData);

            res.json({
                message: 'Cliente atualizado com sucesso',
                cliente: clienteAtualizado
            });
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            
            if (error.message.includes('inválido')) {
                return res.status(400).json({
                    error: 'CPF inválido',
                    code: 'INVALID_CPF'
                });
            }

            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Deletar cliente
    async delete(req, res) {
        try {
            const { id } = req.params;

            const cliente = await Cliente.findById(id);
            if (!cliente) {
                return res.status(404).json({
                    error: 'Cliente não encontrado',
                    code: 'CLIENT_NOT_FOUND'
                });
            }

            // Verificar se há reservas ativas
            const hasActiveReservations = await Cliente.query(`
                SELECT COUNT(*) as count FROM reservas 
                WHERE cliente_id = ? AND status IN ('confirmada', 'checkin')
            `, [id]);

            if (hasActiveReservations[0].count > 0) {
                return res.status(400).json({
                    error: 'Não é possível deletar cliente com reservas ativas',
                    code: 'CLIENT_HAS_ACTIVE_RESERVATIONS'
                });
            }

            await Cliente.delete(id);

            res.json({
                message: 'Cliente deletado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar cliente:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar cliente por CPF
    async findByCPF(req, res) {
        try {
            const { cpf } = req.params;
            const cliente = await Cliente.findByCPF(cpf);

            if (!cliente) {
                return res.status(404).json({
                    error: 'Cliente não encontrado',
                    code: 'CLIENT_NOT_FOUND'
                });
            }

            res.json({ cliente });
        } catch (error) {
            console.error('Erro ao buscar cliente por CPF:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar cliente por email
    async findByEmail(req, res) {
        try {
            const { email } = req.params;
            const cliente = await Cliente.findByEmail(email);

            if (!cliente) {
                return res.status(404).json({
                    error: 'Cliente não encontrado',
                    code: 'CLIENT_NOT_FOUND'
                });
            }

            res.json({ cliente });
        } catch (error) {
            console.error('Erro ao buscar cliente por email:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar clientes por cidade de origem
    async findByOrigin(req, res) {
        try {
            const { cidade, estado } = req.query;

            if (!cidade) {
                return res.status(400).json({
                    error: 'Cidade é obrigatória',
                    code: 'MISSING_CITY'
                });
            }

            const clientes = await Cliente.findByOrigin(cidade, estado);

            res.json({
                clientes: clientes,
                total: clientes.length
            });
        } catch (error) {
            console.error('Erro ao buscar clientes por origem:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar clientes por motivo da visita
    async findByVisitReason(req, res) {
        try {
            const { motivo } = req.params;
            const clientes = await Cliente.findByVisitReason(motivo);

            res.json({
                clientes: clientes,
                total: clientes.length
            });
        } catch (error) {
            console.error('Erro ao buscar clientes por motivo:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar clientes com reservas ativas
    async withActiveReservations(req, res) {
        try {
            const clientes = await Cliente.findWithActiveReservations();

            res.json({
                clientes: clientes,
                total: clientes.length
            });
        } catch (error) {
            console.error('Erro ao buscar clientes com reservas ativas:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar histórico de reservas do cliente
    async reservationHistory(req, res) {
        try {
            const { id } = req.params;

            const cliente = await Cliente.findById(id);
            if (!cliente) {
                return res.status(404).json({
                    error: 'Cliente não encontrado',
                    code: 'CLIENT_NOT_FOUND'
                });
            }

            const historico = await Cliente.getReservationHistory(id);

            res.json({
                cliente: {
                    id: cliente.id,
                    nome_completo: cliente.nome_completo,
                    cpf: cliente.cpf
                },
                historico: historico,
                total_reservas: historico.length
            });
        } catch (error) {
            console.error('Erro ao buscar histórico de reservas:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Obter estatísticas dos clientes
    async statistics(req, res) {
        try {
            const stats = await Cliente.getStatistics();

            res.json({
                statistics: stats
            });
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar clientes com filtros avançados
    async search(req, res) {
        try {
            const filters = req.query;
            const clientes = await Cliente.findWithFilters(filters);

            res.json({
                clientes: clientes,
                total: clientes.length,
                filters: filters
            });
        } catch (error) {
            console.error('Erro na busca de clientes:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }
}

module.exports = new ClienteController();
