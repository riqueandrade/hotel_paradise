// Configuração e Conexão com SQLite - Hotel Paradise
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

class Database {
    constructor() {
        this.db = null;
        this.dbPath = process.env.DB_PATH || './database/hotel.sqlite';
        this.schemaPath = path.join(__dirname, 'schema_sqlite.sql');
    }

    // Conectar ao banco de dados
    async connect() {
        return new Promise((resolve, reject) => {
            // Verificar se o diretório existe
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Conectar ao banco
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Erro ao conectar com o banco de dados:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Conectado ao banco SQLite:', this.dbPath);
                    resolve();
                }
            });

            // Configurar WAL mode para melhor performance
            this.db.run('PRAGMA journal_mode = WAL;');
            this.db.run('PRAGMA foreign_keys = ON;');
        });
    }

    // Inicializar o banco com o schema
    async initialize() {
        try {
            await this.connect();
            
            // Verificar se o schema já foi aplicado
            const tableExists = await this.checkIfTablesExist();
            
            if (!tableExists) {
                console.log('🔧 Aplicando schema do banco de dados...');
                await this.executeSchema();
                console.log('✅ Schema aplicado com sucesso!');
            } else {
                console.log('✅ Banco de dados já inicializado');
            }
            
            return this.db;
        } catch (error) {
            console.error('❌ Erro ao inicializar banco de dados:', error);
            throw error;
        }
    }

    // Verificar se as tabelas existem
    async checkIfTablesExist() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='usuarios';
            `;
            
            this.db.get(query, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(!!row);
                }
            });
        });
    }

    // Executar o schema SQL
    async executeSchema() {
        return new Promise((resolve, reject) => {
            // Ler o arquivo schema.sql
            fs.readFile(this.schemaPath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Executar o schema
                this.db.exec(data, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }

    // Executar query com parâmetros
    async run(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    // Buscar um registro
    async get(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Buscar múltiplos registros
    async all(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Fechar conexão
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('🔒 Conexão com banco de dados fechada');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Executar transação
    async transaction(callback) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.run('BEGIN TRANSACTION');
                const result = await callback(this);
                await this.run('COMMIT');
                resolve(result);
            } catch (error) {
                await this.run('ROLLBACK');
                reject(error);
            }
        });
    }
}

// Instância singleton
const database = new Database();

module.exports = database;
