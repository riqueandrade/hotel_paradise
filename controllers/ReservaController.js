// Controller de Reservas - Hotel Paradise
const Reserva = require('../models/Reserva');
const Cliente = require('../models/Cliente');
const Quarto = require('../models/Quarto');

class ReservaController {
    // Listar todas as reservas
    async index(req, res) {
        try {
            const { page = 1, limit = 10, status, cliente_id, data_inicio, data_fim } = req.query;
            const offset = (page - 1) * limit;

            // Construir condições de filtro
            const conditions = {};
            if (status) conditions.status = status;
            if (cliente_id) conditions.cliente_id = cliente_id;

            let reservas;
            if (data_inicio && data_fim) {
                // Buscar por período
                reservas = await Reserva.findByPeriod(data_inicio, data_fim);
            } else {
                // Buscar com detalhes completos
                reservas = await Reserva.findWithDetails(conditions, parseInt(limit), offset);
            }

            const total = await Reserva.count(conditions);

            res.json({
                reservas: reservas,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Erro ao listar reservas:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar reserva por ID
    async show(req, res) {
        try {
            const { id } = req.params;
            
            // Buscar reserva com detalhes
            const reserva = await Reserva.findById(id);

            if (!reserva) {
                return res.status(404).json({
                    error: 'Reserva não encontrada',
                    code: 'RESERVATION_NOT_FOUND'
                });
            }

            res.json({ reserva });
        } catch (error) {
            console.error('Erro ao buscar reserva:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Criar nova reserva
    async create(req, res) {
        try {
            const reservaData = req.body;

            // Validar se cliente existe
            const cliente = await Cliente.findById(reservaData.cliente_id);
            if (!cliente) {
                return res.status(404).json({
                    error: 'Cliente não encontrado',
                    code: 'CLIENT_NOT_FOUND'
                });
            }

            // Validar se quarto existe
            const quarto = await Quarto.findById(reservaData.quarto_id);
            if (!quarto) {
                return res.status(404).json({
                    error: 'Quarto não encontrado',
                    code: 'ROOM_NOT_FOUND'
                });
            }

            // Adicionar valor da diária do quarto
            reservaData.valor_diaria = quarto.preco_diaria;

            const reserva = await Reserva.create(reservaData);

            res.status(201).json({
                message: 'Reserva criada com sucesso',
                reserva: reserva
            });
        } catch (error) {
            console.error('Erro ao criar reserva:', error);
            
            if (error.message.includes('não disponível')) {
                return res.status(409).json({
                    error: 'Quarto não disponível para as datas selecionadas',
                    code: 'ROOM_NOT_AVAILABLE'
                });
            }

            if (error.message.includes('obrigatórios') || error.message.includes('anterior')) {
                return res.status(400).json({
                    error: error.message,
                    code: 'INVALID_DATA'
                });
            }

            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Atualizar reserva
    async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const reserva = await Reserva.findById(id);
            if (!reserva) {
                return res.status(404).json({
                    error: 'Reserva não encontrada',
                    code: 'RESERVATION_NOT_FOUND'
                });
            }

            // Não permitir alterar reservas já finalizadas
            if (['checkout', 'cancelada'].includes(reserva.status)) {
                return res.status(400).json({
                    error: 'Não é possível alterar reservas finalizadas',
                    code: 'RESERVATION_FINALIZED'
                });
            }

            const reservaAtualizada = await Reserva.update(id, updateData);

            res.json({
                message: 'Reserva atualizada com sucesso',
                reserva: reservaAtualizada
            });
        } catch (error) {
            console.error('Erro ao atualizar reserva:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Deletar reserva
    async delete(req, res) {
        try {
            const { id } = req.params;

            const reserva = await Reserva.findById(id);
            if (!reserva) {
                return res.status(404).json({
                    error: 'Reserva não encontrada',
                    code: 'RESERVATION_NOT_FOUND'
                });
            }

            // Só permitir deletar reservas pendentes
            if (reserva.status !== 'pendente') {
                return res.status(400).json({
                    error: 'Apenas reservas pendentes podem ser deletadas',
                    code: 'CANNOT_DELETE_RESERVATION'
                });
            }

            await Reserva.delete(id);

            res.json({
                message: 'Reserva deletada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar reserva:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Confirmar reserva
    async confirm(req, res) {
        try {
            const { id } = req.params;

            const reserva = await Reserva.confirm(id);

            res.json({
                message: 'Reserva confirmada com sucesso',
                reserva: reserva
            });
        } catch (error) {
            console.error('Erro ao confirmar reserva:', error);
            
            if (error.message.includes('não encontrada')) {
                return res.status(404).json({
                    error: 'Reserva não encontrada',
                    code: 'RESERVATION_NOT_FOUND'
                });
            }

            if (error.message.includes('pendentes')) {
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

    // Cancelar reserva
    async cancel(req, res) {
        try {
            const { id } = req.params;
            const { motivo } = req.body;

            const reserva = await Reserva.cancel(id, motivo);

            res.json({
                message: 'Reserva cancelada com sucesso',
                reserva: reserva
            });
        } catch (error) {
            console.error('Erro ao cancelar reserva:', error);
            
            if (error.message.includes('não encontrada')) {
                return res.status(404).json({
                    error: 'Reserva não encontrada',
                    code: 'RESERVATION_NOT_FOUND'
                });
            }

            if (error.message.includes('não pode ser cancelada')) {
                return res.status(400).json({
                    error: error.message,
                    code: 'CANNOT_CANCEL'
                });
            }

            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Realizar check-in
    async checkIn(req, res) {
        try {
            const { id } = req.params;
            const funcionarioId = req.user.id;

            const reserva = await Reserva.checkIn(id, funcionarioId);

            res.json({
                message: 'Check-in realizado com sucesso',
                reserva: reserva
            });
        } catch (error) {
            console.error('Erro ao realizar check-in:', error);
            
            if (error.message.includes('não encontrada')) {
                return res.status(404).json({
                    error: 'Reserva não encontrada',
                    code: 'RESERVATION_NOT_FOUND'
                });
            }

            if (error.message.includes('confirmada') || error.message.includes('data')) {
                return res.status(400).json({
                    error: error.message,
                    code: 'INVALID_CHECKIN'
                });
            }

            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Realizar check-out
    async checkOut(req, res) {
        try {
            const { id } = req.params;
            const funcionarioId = req.user.id;

            const reserva = await Reserva.checkOut(id, funcionarioId);

            res.json({
                message: 'Check-out realizado com sucesso',
                reserva: reserva
            });
        } catch (error) {
            console.error('Erro ao realizar check-out:', error);
            
            if (error.message.includes('não encontrada')) {
                return res.status(404).json({
                    error: 'Reserva não encontrada',
                    code: 'RESERVATION_NOT_FOUND'
                });
            }

            if (error.message.includes('check-in')) {
                return res.status(400).json({
                    error: error.message,
                    code: 'INVALID_CHECKOUT'
                });
            }

            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar reservas por status
    async byStatus(req, res) {
        try {
            const { status } = req.params;
            const reservas = await Reserva.findByStatus(status);

            res.json({
                reservas: reservas,
                total: reservas.length
            });
        } catch (error) {
            console.error('Erro ao buscar reservas por status:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Buscar reservas do dia
    async today(req, res) {
        try {
            const reservas = await Reserva.findToday();

            res.json({
                reservas: reservas,
                total: reservas.length
            });
        } catch (error) {
            console.error('Erro ao buscar reservas do dia:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Obter estatísticas das reservas
    async statistics(req, res) {
        try {
            const stats = await Reserva.getStatistics();

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
}

module.exports = new ReservaController();
