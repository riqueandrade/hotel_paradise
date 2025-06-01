// Rotas de Autenticação - Hotel Paradise
const express = require('express');
const router = express.Router();

// Rota temporária para login de hóspedes
router.post('/login/hospede', (req, res) => {
    res.json({
        message: 'Funcionalidade em desenvolvimento',
        status: 'info'
    });
});

// Rota temporária para login de funcionários
router.post('/login/funcionario', (req, res) => {
    res.json({
        message: 'Funcionalidade em desenvolvimento',
        status: 'info'
    });
});

// Rota temporária para cadastro de hóspedes
router.post('/register/hospede', (req, res) => {
    res.json({
        message: 'Funcionalidade em desenvolvimento',
        status: 'info'
    });
});

module.exports = router;
