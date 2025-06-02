// Controller de Quartos - Hotel Paradise
const Quarto = require('../models/Quarto');

class QuartoController {
    // Listar todos os quartos
    async index(req, res) {
        try {
            const { page = 1, limit = 10, status, tipo } = req.query;
            const offset = (page - 1) * limit;

            // Construir condições de filtro
            const conditions = {};
            if (status) conditions.status = status;
            if (tipo) conditions.tipo = tipo;

            const quartos = await Quarto.findAll(conditions, parseInt(limit), offset);
            const total = await Quarto.count(conditions);

            res.json({
                quartos: quartos,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Erro ao listar quartos:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar quarto por ID
    async show(req, res) {
        try {
            const { id } = req.params;
            const quarto = await Quarto.findById(id);

            if (!quarto) {
                return res.status(404).json({
                    error: 'Quarto não encontrado',
                    code: 'ROOM_NOT_FOUND'
                });
            }

            res.json({ quarto });
        } catch (error) {
            console.error('Erro ao buscar quarto:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Criar novo quarto (apenas admin)
    async create(req, res) {
        try {
            const quartoData = req.body;
            const quarto = await Quarto.create(quartoData);

            res.status(201).json({
                message: 'Quarto criado com sucesso',
                quarto: quarto
            });
        } catch (error) {
            console.error('Erro ao criar quarto:', error);
            
            if (error.message.includes('já está em uso')) {
                return res.status(409).json({
                    error: 'Número do quarto já está em uso',
                    code: 'ROOM_NUMBER_EXISTS'
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

    // Atualizar quarto (apenas admin)
    async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const quarto = await Quarto.findById(id);
            if (!quarto) {
                return res.status(404).json({
                    error: 'Quarto não encontrado',
                    code: 'ROOM_NOT_FOUND'
                });
            }

            const quartoAtualizado = await Quarto.update(id, updateData);

            res.json({
                message: 'Quarto atualizado com sucesso',
                quarto: quartoAtualizado
            });
        } catch (error) {
            console.error('Erro ao atualizar quarto:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Deletar quarto (apenas admin)
    async delete(req, res) {
        try {
            const { id } = req.params;

            const quarto = await Quarto.findById(id);
            if (!quarto) {
                return res.status(404).json({
                    error: 'Quarto não encontrado',
                    code: 'ROOM_NOT_FOUND'
                });
            }

            // Verificar se há reservas ativas
            const hasActiveReservations = await Quarto.query(`
                SELECT COUNT(*) as count FROM reservas 
                WHERE quarto_id = ? AND status IN ('confirmada', 'checkin')
            `, [id]);

            if (hasActiveReservations[0].count > 0) {
                return res.status(400).json({
                    error: 'Não é possível deletar quarto com reservas ativas',
                    code: 'ROOM_HAS_ACTIVE_RESERVATIONS'
                });
            }

            await Quarto.delete(id);

            res.json({
                message: 'Quarto deletado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar quarto:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar quartos disponíveis
    async available(req, res) {
        try {
            const { checkin, checkout, capacidade, tipo } = req.query;

            let quartos;
            if (checkin && checkout) {
                quartos = await Quarto.findAvailable(checkin, checkout);
            } else {
                quartos = await Quarto.findByStatus('disponivel');
            }

            // Aplicar filtros adicionais
            if (capacidade) {
                quartos = quartos.filter(q => q.capacidade_maxima >= parseInt(capacidade));
            }

            if (tipo) {
                quartos = quartos.filter(q => q.tipo === tipo);
            }

            res.json({
                quartos: quartos,
                total: quartos.length
            });
        } catch (error) {
            console.error('Erro ao buscar quartos disponíveis:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Atualizar status do quarto
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({
                    error: 'Status é obrigatório',
                    code: 'MISSING_STATUS'
                });
            }

            const quarto = await Quarto.updateStatus(id, status);

            if (!quarto) {
                return res.status(404).json({
                    error: 'Quarto não encontrado',
                    code: 'ROOM_NOT_FOUND'
                });
            }

            res.json({
                message: 'Status do quarto atualizado com sucesso',
                quarto: quarto
            });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            
            if (error.message.includes('inválido')) {
                return res.status(400).json({
                    error: error.message,
                    code: 'INVALID_STATUS'
                });
            }

            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar quartos com filtros avançados
    async search(req, res) {
        try {
            const filters = req.query;
            const quartos = await Quarto.findWithFilters(filters);

            res.json({
                quartos: quartos,
                total: quartos.length,
                filters: filters
            });
        } catch (error) {
            console.error('Erro na busca de quartos:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Obter estatísticas dos quartos
    async statistics(req, res) {
        try {
            const stats = await Quarto.getStatistics();

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

    // Verificar disponibilidade de um quarto específico
    async checkAvailability(req, res) {
        try {
            const { id } = req.params;
            const { checkin, checkout } = req.query;

            if (!checkin || !checkout) {
                return res.status(400).json({
                    error: 'Datas de check-in e check-out são obrigatórias',
                    code: 'MISSING_DATES'
                });
            }

            const disponivel = await Quarto.checkAvailability(id, checkin, checkout);

            res.json({
                quarto_id: id,
                checkin: checkin,
                checkout: checkout,
                disponivel: disponivel
            });
        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Listar tipos de quartos disponíveis
    async types(req, res) {
        try {
            const tipos = await Quarto.query(`
                SELECT DISTINCT tipo, COUNT(*) as quantidade, AVG(preco_diaria) as preco_medio
                FROM quartos 
                WHERE ativo = 1 
                GROUP BY tipo 
                ORDER BY preco_medio ASC
            `);

            res.json({
                tipos: tipos
            });
        } catch (error) {
            console.error('Erro ao buscar tipos de quartos:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }
}

module.exports = new QuartoController();
