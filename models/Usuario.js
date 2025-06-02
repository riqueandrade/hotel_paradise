// Model de Usuários - Hotel Paradise
const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class Usuario extends BaseModel {
    constructor() {
        super('usuarios');
    }

    // Criar usuário com hash da senha
    async create(userData) {
        try {
            // Validar dados obrigatórios
            if (!userData.nome || !userData.email || !userData.senha_hash) {
                throw new Error('Nome, email e senha são obrigatórios');
            }

            // Verificar se email já existe
            const existingUser = await this.findByEmail(userData.email);
            if (existingUser) {
                throw new Error('Email já está em uso');
            }

            // Hash da senha
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.senha_hash, saltRounds);

            // Preparar dados para inserção
            const userToCreate = {
                nome: userData.nome,
                email: userData.email.toLowerCase(),
                senha_hash: hashedPassword,
                tipo_usuario: userData.tipo_usuario || 'hospede',
                ativo: userData.ativo !== undefined ? userData.ativo : 1,
                data_criacao: new Date().toISOString(),
                data_atualizacao: new Date().toISOString()
            };

            const user = await super.create(userToCreate);
            
            // Remover senha do retorno
            delete user.senha_hash;
            return user;
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            throw error;
        }
    }

    // Buscar usuário por email
    async findByEmail(email) {
        try {
            return await this.findOne({ email: email.toLowerCase() });
        } catch (error) {
            console.error('Erro ao buscar usuário por email:', error);
            throw error;
        }
    }

    // Autenticar usuário
    async authenticate(email, senha) {
        try {
            const user = await this.findByEmail(email);
            
            if (!user) {
                throw new Error('Usuário não encontrado');
            }

            if (!user.ativo) {
                throw new Error('Usuário inativo');
            }

            // Verificar senha
            const isValidPassword = await bcrypt.compare(senha, user.senha_hash);
            
            if (!isValidPassword) {
                throw new Error('Senha incorreta');
            }

            // Remover senha do retorno
            delete user.senha_hash;
            return user;
        } catch (error) {
            console.error('Erro na autenticação:', error);
            throw error;
        }
    }

    // Gerar token JWT
    generateToken(user) {
        try {
            const payload = {
                id: user.id,
                email: user.email,
                tipo_usuario: user.tipo_usuario,
                nome: user.nome
            };

            const options = {
                expiresIn: process.env.JWT_EXPIRES_IN || '24h'
            };

            return jwt.sign(payload, process.env.JWT_SECRET, options);
        } catch (error) {
            console.error('Erro ao gerar token:', error);
            throw error;
        }
    }

    // Verificar token JWT
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            throw error;
        }
    }

    // Atualizar senha
    async updatePassword(userId, novaSenha) {
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(novaSenha, saltRounds);
            
            return await this.update(userId, {
                senha_hash: hashedPassword,
                data_atualizacao: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erro ao atualizar senha:', error);
            throw error;
        }
    }

    // Buscar usuários por tipo
    async findByType(tipoUsuario) {
        try {
            const users = await this.findAll({ tipo_usuario: tipoUsuario, ativo: 1 });
            
            // Remover senhas do retorno
            return users.map(user => {
                delete user.senha_hash;
                return user;
            });
        } catch (error) {
            console.error('Erro ao buscar usuários por tipo:', error);
            throw error;
        }
    }

    // Ativar/Desativar usuário
    async toggleActive(userId) {
        try {
            const user = await this.findById(userId);
            if (!user) {
                throw new Error('Usuário não encontrado');
            }

            const newStatus = user.ativo ? 0 : 1;
            return await this.update(userId, { ativo: newStatus });
        } catch (error) {
            console.error('Erro ao alterar status do usuário:', error);
            throw error;
        }
    }

    // Buscar por ID sem senha
    async findById(id) {
        try {
            const user = await super.findById(id);
            if (user) {
                delete user.senha_hash;
            }
            return user;
        } catch (error) {
            console.error('Erro ao buscar usuário por ID:', error);
            throw error;
        }
    }

    // Listar usuários sem senhas
    async findAll(conditions = {}, limit = null, offset = null) {
        try {
            const users = await super.findAll(conditions, limit, offset);
            
            // Remover senhas do retorno
            return users.map(user => {
                delete user.senha_hash;
                return user;
            });
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            throw error;
        }
    }

    // Validar permissões
    hasPermission(user, requiredType) {
        const hierarchy = {
            'hospede': 1,
            'recepcionista': 2,
            'administrador': 3
        };

        const userLevel = hierarchy[user.tipo_usuario] || 0;
        const requiredLevel = hierarchy[requiredType] || 0;

        return userLevel >= requiredLevel;
    }
}

module.exports = new Usuario();
