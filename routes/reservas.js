// Rotas de Reservas - Hotel Paradise
const express = require('express');
const router = express.Router();

// Verificar disponibilidade de quartos
router.post('/verificar-disponibilidade', (req, res) => {
    res.json({
        message: 'Funcionalidade em desenvolvimento',
        status: 'info'
    });
});

// Criar nova reserva
router.post('/criar', (req, res) => {
    res.json({
        message: 'Funcionalidade em desenvolvimento',
        status: 'info'
    });
});

// Listar reservas
router.get('/listar', (req, res) => {
    res.json({
        message: 'Funcionalidade em desenvolvimento',
        status: 'info'
    });
});

module.exports = router;
