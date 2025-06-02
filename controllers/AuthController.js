// Controller de Autenticação - Hotel Paradise
const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');

// Função auxiliar para obter permissões
function getPermissions(tipoUsuario) {
    const permissions = {
        hospede: ['view_own_reservations', 'create_reservation', 'view_rooms'],
        recepcionista: ['view_reservations', 'manage_reservations', 'view_clients', 'manage_clients', 'view_rooms'],
        administrador: ['full_access']
    };

    return permissions[tipoUsuario] || [];
}

class AuthController {
    // Login de hóspedes
    async loginHospede(req, res) {
        try {
            const { email, senha } = req.body;

            // Validar dados
            if (!email || !senha) {
                return res.status(400).json({
                    error: 'Email e senha são obrigatórios',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            // Autenticar usuário
            const user = await Usuario.authenticate(email, senha);

            // Verificar se é hóspede
            if (user.tipo_usuario !== 'hospede') {
                return res.status(403).json({
                    error: 'Acesso negado. Esta área é exclusiva para hóspedes.',
                    code: 'ACCESS_DENIED'
                });
            }

            // Gerar token
            const token = Usuario.generateToken(user);

            // Buscar dados do cliente se existir
            let cliente = null;
            try {
                cliente = await Cliente.findOne({ usuario_id: user.id });
            } catch (error) {
                // Cliente pode não existir ainda
            }

            res.json({
                message: 'Login realizado com sucesso',
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    tipo_usuario: user.tipo_usuario
                },
                cliente: cliente,
                token: token
            });

        } catch (error) {
            console.error('Erro no login de hóspede:', error);
            
            if (error.message.includes('não encontrado') || error.message.includes('incorreta')) {
                return res.status(401).json({
                    error: 'Email ou senha incorretos',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            if (error.message.includes('inativo')) {
                return res.status(403).json({
                    error: 'Conta inativa. Entre em contato com o hotel.',
                    code: 'ACCOUNT_INACTIVE'
                });
            }

            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Login de funcionários
    async loginFuncionario(req, res) {
        try {
            const { email, senha } = req.body;

            // Validar dados
            if (!email || !senha) {
                return res.status(400).json({
                    error: 'Email e senha são obrigatórios',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            // Autenticar usuário
            const user = await Usuario.authenticate(email, senha);

            // Verificar se é funcionário
            if (!['recepcionista', 'administrador'].includes(user.tipo_usuario)) {
                return res.status(403).json({
                    error: 'Acesso negado. Esta área é exclusiva para funcionários.',
                    code: 'ACCESS_DENIED'
                });
            }

            // Gerar token
            const token = Usuario.generateToken(user);

            res.json({
                message: 'Login realizado com sucesso',
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    tipo_usuario: user.tipo_usuario
                },
                token: token,
                permissions: getPermissions(user.tipo_usuario)
            });

        } catch (error) {
            console.error('Erro no login de funcionário:', error);
            
            if (error.message.includes('não encontrado') || error.message.includes('incorreta')) {
                return res.status(401).json({
                    error: 'Email ou senha incorretos',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            if (error.message.includes('inativo')) {
                return res.status(403).json({
                    error: 'Conta inativa. Entre em contato com o administrador.',
                    code: 'ACCOUNT_INACTIVE'
                });
            }

            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Cadastro de hóspedes
    async registerHospede(req, res) {
        try {
            const { nome, email, senha, dadosCliente } = req.body;

            // Validar dados obrigatórios
            if (!nome || !email || !senha) {
                return res.status(400).json({
                    error: 'Nome, email e senha são obrigatórios',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }

            // Validar força da senha
            if (senha.length < 6) {
                return res.status(400).json({
                    error: 'Senha deve ter pelo menos 6 caracteres',
                    code: 'WEAK_PASSWORD'
                });
            }

            // Criar usuário
            const userData = {
                nome: nome,
                email: email,
                senha_hash: senha,
                tipo_usuario: 'hospede'
            };

            const user = await Usuario.create(userData);

            // Criar cliente se dados foram fornecidos
            let cliente = null;
            if (dadosCliente && dadosCliente.nome_completo && dadosCliente.cpf) {
                try {
                    const clienteData = {
                        usuario_id: user.id,
                        nome_completo: dadosCliente.nome_completo,
                        cpf: dadosCliente.cpf,
                        telefone: dadosCliente.telefone,
                        email: email
                    };

                    cliente = await Cliente.create(clienteData);
                } catch (clienteError) {
                    console.error('Erro ao criar cliente:', clienteError);
                    // Continua mesmo se falhar ao criar cliente
                }
            }

            // Gerar token
            const token = Usuario.generateToken(user);

            res.status(201).json({
                message: 'Cadastro realizado com sucesso',
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    tipo_usuario: user.tipo_usuario
                },
                cliente: cliente,
                token: token
            });

        } catch (error) {
            console.error('Erro no cadastro de hóspede:', error);
            
            if (error.message.includes('já está em uso')) {
                return res.status(409).json({
                    error: 'Email já está cadastrado',
                    code: 'EMAIL_ALREADY_EXISTS'
                });
            }

            if (error.message.includes('CPF já está cadastrado')) {
                return res.status(409).json({
                    error: 'CPF já está cadastrado',
                    code: 'CPF_ALREADY_EXISTS'
                });
            }

            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    // Verificar token
    async verifyToken(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({
                    error: 'Token não fornecido',
                    code: 'NO_TOKEN'
                });
            }

            const decoded = Usuario.verifyToken(token);
            const user = await Usuario.findById(decoded.id);

            if (!user) {
                return res.status(401).json({
                    error: 'Usuário não encontrado',
                    code: 'USER_NOT_FOUND'
                });
            }

            res.json({
                valid: true,
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    tipo_usuario: user.tipo_usuario
                }
            });

        } catch (error) {
            console.error('Erro na verificação do token:', error);
            res.status(401).json({
                error: 'Token inválido',
                code: 'INVALID_TOKEN'
            });
        }
    }



    // Logout (invalidar token - implementação futura com blacklist)
    async logout(req, res) {
        try {
            // Por enquanto apenas retorna sucesso
            // Em implementação futura, adicionar token à blacklist
            res.json({
                message: 'Logout realizado com sucesso'
            });
        } catch (error) {
            console.error('Erro no logout:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    }
}

module.exports = new AuthController();
