// Model Base - Hotel Paradise
const database = require('../database/database');

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
        this.db = database;
    }

    // Criar um novo registro
    async create(data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = fields.map(() => '?').join(', ');
            
            const query = `
                INSERT INTO ${this.tableName} (${fields.join(', ')})
                VALUES (${placeholders})
            `;
            
            const result = await this.db.run(query, values);
            
            // Buscar o registro criado
            return await this.findById(result.id);
        } catch (error) {
            console.error(`Erro ao criar registro em ${this.tableName}:`, error);
            throw error;
        }
    }

    // Buscar por ID
    async findById(id) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
            return await this.db.get(query, [id]);
        } catch (error) {
            console.error(`Erro ao buscar por ID em ${this.tableName}:`, error);
            throw error;
        }
    }

    // Buscar todos os registros
    async findAll(conditions = {}, limit = null, offset = null) {
        try {
            let query = `SELECT * FROM ${this.tableName}`;
            const params = [];

            // Adicionar condições WHERE
            if (Object.keys(conditions).length > 0) {
                const whereClause = Object.keys(conditions)
                    .map(key => `${key} = ?`)
                    .join(' AND ');
                query += ` WHERE ${whereClause}`;
                params.push(...Object.values(conditions));
            }

            // Adicionar ORDER BY padrão
            query += ` ORDER BY id DESC`;

            // Adicionar LIMIT e OFFSET
            if (limit) {
                query += ` LIMIT ?`;
                params.push(limit);
                
                if (offset) {
                    query += ` OFFSET ?`;
                    params.push(offset);
                }
            }

            return await this.db.all(query, params);
        } catch (error) {
            console.error(`Erro ao buscar registros em ${this.tableName}:`, error);
            throw error;
        }
    }

    // Buscar um registro por condições
    async findOne(conditions) {
        try {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            
            const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
            const params = Object.values(conditions);
            
            return await this.db.get(query, params);
        } catch (error) {
            console.error(`Erro ao buscar registro em ${this.tableName}:`, error);
            throw error;
        }
    }

    // Atualizar registro
    async update(id, data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            
            // Adicionar data de atualização se a coluna existir
            if (fields.includes('data_atualizacao') === false) {
                data.data_atualizacao = new Date().toISOString();
                values.push(data.data_atualizacao);
                setClause += ', data_atualizacao = ?';
            }
            
            const query = `
                UPDATE ${this.tableName} 
                SET ${setClause}
                WHERE id = ?
            `;
            
            values.push(id);
            await this.db.run(query, values);
            
            // Retornar o registro atualizado
            return await this.findById(id);
        } catch (error) {
            console.error(`Erro ao atualizar registro em ${this.tableName}:`, error);
            throw error;
        }
    }

    // Deletar registro
    async delete(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const result = await this.db.run(query, [id]);
            
            return result.changes > 0;
        } catch (error) {
            console.error(`Erro ao deletar registro em ${this.tableName}:`, error);
            throw error;
        }
    }

    // Contar registros
    async count(conditions = {}) {
        try {
            let query = `SELECT COUNT(*) as total FROM ${this.tableName}`;
            const params = [];

            if (Object.keys(conditions).length > 0) {
                const whereClause = Object.keys(conditions)
                    .map(key => `${key} = ?`)
                    .join(' AND ');
                query += ` WHERE ${whereClause}`;
                params.push(...Object.values(conditions));
            }

            const result = await this.db.get(query, params);
            return result.total;
        } catch (error) {
            console.error(`Erro ao contar registros em ${this.tableName}:`, error);
            throw error;
        }
    }

    // Executar query customizada
    async query(sql, params = []) {
        try {
            return await this.db.all(sql, params);
        } catch (error) {
            console.error(`Erro ao executar query customizada:`, error);
            throw error;
        }
    }

    // Verificar se registro existe
    async exists(conditions) {
        try {
            const count = await this.count(conditions);
            return count > 0;
        } catch (error) {
            console.error(`Erro ao verificar existência em ${this.tableName}:`, error);
            throw error;
        }
    }
}

module.exports = BaseModel;
