// Model de Quartos - Hotel Paradise
const BaseModel = require('./BaseModel');

class Quarto extends BaseModel {
    constructor() {
        super('quartos');
    }

    // Criar quarto com validações
    async create(quartoData) {
        try {
            // Validar dados obrigatórios
            if (!quartoData.numero || !quartoData.tipo || !quartoData.capacidade_maxima || !quartoData.preco_diaria) {
                throw new Error('Número, tipo, capacidade e preço são obrigatórios');
            }

            // Verificar se número do quarto já existe
            const existingRoom = await this.findByNumber(quartoData.numero);
            if (existingRoom) {
                throw new Error('Número do quarto já está em uso');
            }

            // Preparar dados para inserção
            const quartoToCreate = {
                numero: quartoData.numero,
                andar: quartoData.andar || null,
                tipo: quartoData.tipo,
                capacidade_maxima: quartoData.capacidade_maxima,
                preco_diaria: parseFloat(quartoData.preco_diaria),
                tem_sacada: quartoData.tem_sacada || 0,
                tem_frigobar: quartoData.tem_frigobar || 0,
                tem_ar_condicionado: quartoData.tem_ar_condicionado || 1,
                tem_tv: quartoData.tem_tv || 1,
                tem_wifi: quartoData.tem_wifi || 1,
                vista: quartoData.vista || 'interna',
                status: quartoData.status || 'disponivel',
                descricao: quartoData.descricao || null,
                fotos: quartoData.fotos ? JSON.stringify(quartoData.fotos) : null,
                ativo: quartoData.ativo !== undefined ? quartoData.ativo : 1,
                data_criacao: new Date().toISOString(),
                data_atualizacao: new Date().toISOString()
            };

            return await super.create(quartoToCreate);
        } catch (error) {
            console.error('Erro ao criar quarto:', error);
            throw error;
        }
    }

    // Buscar quarto por número
    async findByNumber(numero) {
        try {
            return await this.findOne({ numero: numero });
        } catch (error) {
            console.error('Erro ao buscar quarto por número:', error);
            throw error;
        }
    }

    // Buscar quartos disponíveis
    async findAvailable(dataCheckin = null, dataCheckout = null) {
        try {
            let query = `
                SELECT q.* FROM quartos q
                WHERE q.ativo = 1 AND q.status = 'disponivel'
            `;
            const params = [];

            // Se datas foram fornecidas, verificar conflitos com reservas
            if (dataCheckin && dataCheckout) {
                query += `
                    AND q.id NOT IN (
                        SELECT r.quarto_id FROM reservas r
                        WHERE r.status IN ('confirmada', 'checkin')
                        AND (
                            (r.data_checkin <= ? AND r.data_checkout > ?) OR
                            (r.data_checkin < ? AND r.data_checkout >= ?) OR
                            (r.data_checkin >= ? AND r.data_checkout <= ?)
                        )
                    )
                `;
                params.push(dataCheckin, dataCheckin, dataCheckout, dataCheckout, dataCheckin, dataCheckout);
            }

            query += ` ORDER BY q.numero`;

            return await this.query(query, params);
        } catch (error) {
            console.error('Erro ao buscar quartos disponíveis:', error);
            throw error;
        }
    }

    // Buscar quartos por tipo
    async findByType(tipo) {
        try {
            return await this.findAll({ tipo: tipo, ativo: 1 });
        } catch (error) {
            console.error('Erro ao buscar quartos por tipo:', error);
            throw error;
        }
    }

    // Buscar quartos por status
    async findByStatus(status) {
        try {
            return await this.findAll({ status: status, ativo: 1 });
        } catch (error) {
            console.error('Erro ao buscar quartos por status:', error);
            throw error;
        }
    }

    // Atualizar status do quarto
    async updateStatus(quartoId, novoStatus) {
        try {
            const statusValidos = ['disponivel', 'ocupado', 'manutencao', 'limpeza'];
            
            if (!statusValidos.includes(novoStatus)) {
                throw new Error('Status inválido');
            }

            return await this.update(quartoId, { 
                status: novoStatus,
                data_atualizacao: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erro ao atualizar status do quarto:', error);
            throw error;
        }
    }

    // Buscar quartos com filtros avançados
    async findWithFilters(filters = {}) {
        try {
            let query = `SELECT * FROM quartos WHERE ativo = 1`;
            const params = [];

            // Filtro por tipo
            if (filters.tipo) {
                query += ` AND tipo = ?`;
                params.push(filters.tipo);
            }

            // Filtro por capacidade mínima
            if (filters.capacidade_minima) {
                query += ` AND capacidade_maxima >= ?`;
                params.push(filters.capacidade_minima);
            }

            // Filtro por preço máximo
            if (filters.preco_maximo) {
                query += ` AND preco_diaria <= ?`;
                params.push(filters.preco_maximo);
            }

            // Filtro por vista
            if (filters.vista) {
                query += ` AND vista = ?`;
                params.push(filters.vista);
            }

            // Filtro por comodidades
            if (filters.tem_sacada) {
                query += ` AND tem_sacada = 1`;
            }
            if (filters.tem_frigobar) {
                query += ` AND tem_frigobar = 1`;
            }

            // Filtro por status
            if (filters.status) {
                query += ` AND status = ?`;
                params.push(filters.status);
            }

            query += ` ORDER BY preco_diaria ASC`;

            return await this.query(query, params);
        } catch (error) {
            console.error('Erro ao buscar quartos com filtros:', error);
            throw error;
        }
    }

    // Obter estatísticas dos quartos
    async getStatistics() {
        try {
            const stats = await this.query(`
                SELECT 
                    COUNT(*) as total_quartos,
                    COUNT(CASE WHEN status = 'disponivel' THEN 1 END) as disponiveis,
                    COUNT(CASE WHEN status = 'ocupado' THEN 1 END) as ocupados,
                    COUNT(CASE WHEN status = 'manutencao' THEN 1 END) as manutencao,
                    COUNT(CASE WHEN status = 'limpeza' THEN 1 END) as limpeza,
                    AVG(preco_diaria) as preco_medio,
                    MIN(preco_diaria) as preco_minimo,
                    MAX(preco_diaria) as preco_maximo
                FROM quartos 
                WHERE ativo = 1
            `);

            return stats[0];
        } catch (error) {
            console.error('Erro ao obter estatísticas dos quartos:', error);
            throw error;
        }
    }

    // Verificar disponibilidade de um quarto específico
    async checkAvailability(quartoId, dataCheckin, dataCheckout) {
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
            console.error('Erro ao verificar disponibilidade do quarto:', error);
            throw error;
        }
    }

    // Processar fotos (parse JSON)
    processPhotos(quarto) {
        if (quarto && quarto.fotos) {
            try {
                quarto.fotos = JSON.parse(quarto.fotos);
            } catch (error) {
                quarto.fotos = [];
            }
        }
        return quarto;
    }

    // Override findById para processar fotos
    async findById(id) {
        try {
            const quarto = await super.findById(id);
            return this.processPhotos(quarto);
        } catch (error) {
            console.error('Erro ao buscar quarto por ID:', error);
            throw error;
        }
    }

    // Override findAll para processar fotos
    async findAll(conditions = {}, limit = null, offset = null) {
        try {
            const quartos = await super.findAll(conditions, limit, offset);
            return quartos.map(quarto => this.processPhotos(quarto));
        } catch (error) {
            console.error('Erro ao listar quartos:', error);
            throw error;
        }
    }
}

module.exports = new Quarto();
