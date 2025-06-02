// Rotas de Autenticação - Hotel Paradise
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');

// Login de hóspedes
router.post('/login/hospede', AuthController.loginHospede);

// Login de funcionários
router.post('/login/funcionario', AuthController.loginFuncionario);

// Cadastro de hóspedes
router.post('/register/hospede', AuthController.registerHospede);

// Verificar token
router.get('/verify', AuthController.verifyToken);

// Logout
router.post('/logout', authenticateToken, AuthController.logout);

// Rota de teste para verificar autenticação
router.get('/me', authenticateToken, (req, res) => {
    res.json({
        message: 'Usuário autenticado',
        user: {
            id: req.user.id,
            nome: req.user.nome,
            email: req.user.email,
            tipo_usuario: req.user.tipo_usuario
        }
    });
});

module.exports = router;
