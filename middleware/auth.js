// Middleware de Autenticação - Hotel Paradise
const Usuario = require('../models/Usuario');

// Middleware para verificar autenticação
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Token de acesso requerido',
                code: 'NO_TOKEN'
            });
        }

        // Verificar e decodificar token
        const decoded = Usuario.verifyToken(token);
        
        // Buscar usuário no banco
        const user = await Usuario.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!user.ativo) {
            return res.status(403).json({
                error: 'Conta inativa',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        // Adicionar usuário ao request
        req.user = user;
        next();

    } catch (error) {
        console.error('Erro na autenticação:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido',
                code: 'INVALID_TOKEN'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado',
                code: 'TOKEN_EXPIRED'
            });
        }

        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
};

// Middleware para verificar tipo de usuário
const requireUserType = (allowedTypes) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Usuário não autenticado',
                    code: 'NOT_AUTHENTICATED'
                });
            }

            // Converter para array se for string
            const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];

            if (!types.includes(req.user.tipo_usuario)) {
                return res.status(403).json({
                    error: 'Acesso negado. Permissões insuficientes.',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    required: types,
                    current: req.user.tipo_usuario
                });
            }

            next();
        } catch (error) {
            console.error('Erro na verificação de permissões:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    };
};

// Middleware para verificar se é hóspede
const requireHospede = requireUserType('hospede');

// Middleware para verificar se é recepcionista ou admin
const requireStaff = requireUserType(['recepcionista', 'administrador']);

// Middleware para verificar se é administrador
const requireAdmin = requireUserType('administrador');

// Middleware para verificar permissões hierárquicas
const requireMinimumLevel = (minimumLevel) => {
    const hierarchy = {
        'hospede': 1,
        'recepcionista': 2,
        'administrador': 3
    };

    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Usuário não autenticado',
                    code: 'NOT_AUTHENTICATED'
                });
            }

            const userLevel = hierarchy[req.user.tipo_usuario] || 0;
            const requiredLevel = hierarchy[minimumLevel] || 0;

            if (userLevel < requiredLevel) {
                return res.status(403).json({
                    error: 'Acesso negado. Nível de permissão insuficiente.',
                    code: 'INSUFFICIENT_LEVEL',
                    required: minimumLevel,
                    current: req.user.tipo_usuario
                });
            }

            next();
        } catch (error) {
            console.error('Erro na verificação de nível:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    };
};

// Middleware opcional de autenticação (não falha se não houver token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            try {
                const decoded = Usuario.verifyToken(token);
                const user = await Usuario.findById(decoded.id);
                
                if (user && user.ativo) {
                    req.user = user;
                }
            } catch (error) {
                // Ignora erros de token em auth opcional
                console.log('Token opcional inválido:', error.message);
            }
        }

        next();
    } catch (error) {
        console.error('Erro na autenticação opcional:', error);
        next(); // Continua mesmo com erro
    }
};

// Middleware para verificar se o usuário pode acessar recurso próprio
const requireOwnershipOrStaff = (resourceUserIdField = 'usuario_id') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Usuário não autenticado',
                    code: 'NOT_AUTHENTICATED'
                });
            }

            // Administradores e recepcionistas têm acesso total
            if (['administrador', 'recepcionista'].includes(req.user.tipo_usuario)) {
                return next();
            }

            // Para hóspedes, verificar se é o próprio recurso
            const resourceUserId = req.params.userId || req.body[resourceUserIdField] || req.query.userId;
            
            if (req.user.id.toString() !== resourceUserId?.toString()) {
                return res.status(403).json({
                    error: 'Acesso negado. Você só pode acessar seus próprios dados.',
                    code: 'ACCESS_DENIED_OWNERSHIP'
                });
            }

            next();
        } catch (error) {
            console.error('Erro na verificação de propriedade:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                code: 'INTERNAL_ERROR'
            });
        }
    };
};

module.exports = {
    authenticateToken,
    requireUserType,
    requireHospede,
    requireStaff,
    requireAdmin,
    requireMinimumLevel,
    optionalAuth,
    requireOwnershipOrStaff
};
