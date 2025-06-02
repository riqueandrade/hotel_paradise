// Model de Reservas - Hotel Paradise
const BaseModel = require('./BaseModel');

class Reserva extends BaseModel {
    constructor() {
        super('reservas');
    }

    // Criar reserva com validações
    async create(reservaData) {
        try {
            // Validar dados obrigatórios
            if (!reservaData.cliente_id || !reservaData.quarto_id || 
                !reservaData.data_checkin || !reservaData.data_checkout) {
                throw new Error('Cliente, quarto, data de check-in e check-out são obrigatórios');
            }

            // Validar datas
            const checkin = new Date(reservaData.data_checkin);
            const checkout = new Date(reservaData.data_checkout);
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            if (checkin < hoje) {
                throw new Error('Data de check-in não pode ser anterior a hoje');
            }

            if (checkout <= checkin) {
                throw new Error('Data de check-out deve ser posterior ao check-in');
            }

            // Calcular número de diárias
            const numeroDiarias = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));

            // Verificar disponibilidade do quarto
            const disponivel = await this.checkRoomAvailability(
                reservaData.quarto_id, 
                reservaData.data_checkin, 
                reservaData.data_checkout
            );

            if (!disponivel) {
                throw new Error('Quarto não disponível para as datas selecionadas');
            }

            // Calcular valores
            const valorDiaria = parseFloat(reservaData.valor_diaria);
            const valorTotal = valorDiaria * numeroDiarias;

            // Preparar dados para inserção
            const reservaToCreate = {
                cliente_id: reservaData.cliente_id,
                quarto_id: reservaData.quarto_id,
                data_checkin: reservaData.data_checkin,
                data_checkout: reservaData.data_checkout,
                data_reserva: new Date().toISOString(),
                valor_diaria: valorDiaria,
                numero_diarias: numeroDiarias,
                valor_total: valorTotal,
                valor_pago: reservaData.valor_pago || 0,
                status: reservaData.status || 'pendente',
                numero_hospedes: reservaData.numero_hospedes || 1,
                observacoes: reservaData.observacoes || null,
                forma_pagamento: reservaData.forma_pagamento || null,
                data_criacao: new Date().toISOString(),
                data_atualizacao: new Date().toISOString()
            };

            return await super.create(reservaToCreate);
        } catch (error) {
            console.error('Erro ao criar reserva:', error);
            throw error;
        }
    }

    // Verificar disponibilidade do quarto
    async checkRoomAvailability(quartoId, dataCheckin, dataCheckout) {
        try {
            const query = `
                SELECT COUNT(*) as conflitos
                FROM reservas r
                WHERE r.quarto_id = ? 
                AND r.status IN ('confirmada', 'checkin')
                AND (
                    (r.data_checkin <= ? AND r.data_checkout > ?) OR
                    (r.data_checkin < ? AND r.data_checkout >= ?) OR
                    (r.data_checkin >= ? AND r.data_checkout <= ?)
                )
            `;

            const result = await this.query(query, [
                quartoId, dataCheckin, dataCheckin, 
                dataCheckout, dataCheckout, 
                dataCheckin, dataCheckout
            ]);

            return result[0].conflitos === 0;
        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            throw error;
        }
    }

    // Buscar reservas com detalhes completos
    async findWithDetails(conditions = {}, limit = null, offset = null) {
        try {
            let query = `
                SELECT 
                    r.*,
                    c.nome_completo as cliente_nome,
                    c.cpf as cliente_cpf,
                    c.telefone as cliente_telefone,
                    c.email as cliente_email,
                    q.numero as quarto_numero,
                    q.tipo as quarto_tipo,
                    q.andar as quarto_andar,
                    uf.nome as funcionario_checkin_nome,
                    uc.nome as funcionario_checkout_nome
                FROM reservas r
                INNER JOIN clientes c ON r.cliente_id = c.id
                INNER JOIN quartos q ON r.quarto_id = q.id
                LEFT JOIN usuarios uf ON r.funcionario_checkin = uf.id
                LEFT JOIN usuarios uc ON r.funcionario_checkout = uc.id
                WHERE 1=1
            `;
            const params = [];

            // Adicionar condições WHERE
            if (Object.keys(conditions).length > 0) {
                Object.keys(conditions).forEach(key => {
                    query += ` AND r.${key} = ?`;
                    params.push(conditions[key]);
                });
            }

            query += ` ORDER BY r.data_checkin DESC`;

            // Adicionar LIMIT e OFFSET
            if (limit) {
                query += ` LIMIT ?`;
                params.push(limit);
                
                if (offset) {
                    query += ` OFFSET ?`;
                    params.push(offset);
                }
            }

            return await this.query(query, params);
        } catch (error) {
            console.error('Erro ao buscar reservas com detalhes:', error);
            throw error;
        }
    }

    // Buscar reservas por status
    async findByStatus(status) {
        try {
            return await this.findWithDetails({ status: status });
        } catch (error) {
            console.error('Erro ao buscar reservas por status:', error);
            throw error;
        }
    }

    // Buscar reservas por cliente
    async findByClient(clienteId) {
        try {
            return await this.findWithDetails({ cliente_id: clienteId });
        } catch (error) {
            console.error('Erro ao buscar reservas por cliente:', error);
            throw error;
        }
    }

    // Buscar reservas por período
    async findByPeriod(dataInicio, dataFim) {
        try {
            const query = `
                SELECT 
                    r.*,
                    c.nome_completo as cliente_nome,
                    q.numero as quarto_numero
                FROM reservas r
                INNER JOIN clientes c ON r.cliente_id = c.id
                INNER JOIN quartos q ON r.quarto_id = q.id
                WHERE r.data_checkin >= ? AND r.data_checkout <= ?
                ORDER BY r.data_checkin ASC
            `;
            return await this.query(query, [dataInicio, dataFim]);
        } catch (error) {
            console.error('Erro ao buscar reservas por período:', error);
            throw error;
        }
    }

    // Realizar check-in
    async checkIn(reservaId, funcionarioId) {
        try {
            const reserva = await this.findById(reservaId);
            if (!reserva) {
                throw new Error('Reserva não encontrada');
            }

            if (reserva.status !== 'confirmada') {
                throw new Error('Reserva deve estar confirmada para realizar check-in');
            }

            const hoje = new Date().toISOString().split('T')[0];
            const dataCheckin = reserva.data_checkin;

            if (dataCheckin > hoje) {
                throw new Error('Check-in só pode ser realizado na data prevista ou após');
            }

            return await this.update(reservaId, {
                status: 'checkin',
                checkin_realizado: new Date().toISOString(),
                funcionario_checkin: funcionarioId
            });
        } catch (error) {
            console.error('Erro ao realizar check-in:', error);
            throw error;
        }
    }

    // Realizar check-out
    async checkOut(reservaId, funcionarioId) {
        try {
            const reserva = await this.findById(reservaId);
            if (!reserva) {
                throw new Error('Reserva não encontrada');
            }

            if (reserva.status !== 'checkin') {
                throw new Error('Check-in deve ter sido realizado antes do check-out');
            }

            return await this.update(reservaId, {
                status: 'checkout',
                checkout_realizado: new Date().toISOString(),
                funcionario_checkout: funcionarioId
            });
        } catch (error) {
            console.error('Erro ao realizar check-out:', error);
            throw error;
        }
    }

    // Cancelar reserva
    async cancel(reservaId, motivo = null) {
        try {
            const reserva = await this.findById(reservaId);
            if (!reserva) {
                throw new Error('Reserva não encontrada');
            }

            if (['checkout', 'cancelada'].includes(reserva.status)) {
                throw new Error('Reserva não pode ser cancelada');
            }

            const updateData = {
                status: 'cancelada'
            };

            if (motivo) {
                updateData.observacoes = (reserva.observacoes || '') + 
                    `\nCancelamento: ${motivo} (${new Date().toLocaleString('pt-BR')})`;
            }

            return await this.update(reservaId, updateData);
        } catch (error) {
            console.error('Erro ao cancelar reserva:', error);
            throw error;
        }
    }

    // Confirmar reserva
    async confirm(reservaId) {
        try {
            const reserva = await this.findById(reservaId);
            if (!reserva) {
                throw new Error('Reserva não encontrada');
            }

            if (reserva.status !== 'pendente') {
                throw new Error('Apenas reservas pendentes podem ser confirmadas');
            }

            return await this.update(reservaId, { status: 'confirmada' });
        } catch (error) {
            console.error('Erro ao confirmar reserva:', error);
            throw error;
        }
    }

    // Obter estatísticas das reservas
    async getStatistics() {
        try {
            const stats = await this.query(`
                SELECT 
                    COUNT(*) as total_reservas,
                    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
                    COUNT(CASE WHEN status = 'confirmada' THEN 1 END) as confirmadas,
                    COUNT(CASE WHEN status = 'checkin' THEN 1 END) as checkins,
                    COUNT(CASE WHEN status = 'checkout' THEN 1 END) as checkouts,
                    COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as canceladas,
                    SUM(valor_total) as receita_total,
                    AVG(valor_total) as ticket_medio,
                    AVG(numero_diarias) as media_diarias
                FROM reservas
            `);

            return stats[0];
        } catch (error) {
            console.error('Erro ao obter estatísticas das reservas:', error);
            throw error;
        }
    }

    // Buscar reservas do dia
    async findToday() {
        try {
            const hoje = new Date().toISOString().split('T')[0];
            const query = `
                SELECT 
                    r.*,
                    c.nome_completo as cliente_nome,
                    q.numero as quarto_numero
                FROM reservas r
                INNER JOIN clientes c ON r.cliente_id = c.id
                INNER JOIN quartos q ON r.quarto_id = q.id
                WHERE r.data_checkin = ? OR r.data_checkout = ?
                ORDER BY r.data_checkin ASC
            `;
            return await this.query(query, [hoje, hoje]);
        } catch (error) {
            console.error('Erro ao buscar reservas do dia:', error);
            throw error;
        }
    }
}

module.exports = new Reserva();
