// Rotas da API - Hotel Paradise
const express = require('express');
const router = express.Router();

// Rota de status da API
router.get('/status', (req, res) => {
    res.json({
        status: 'online',
        message: 'API Hotel Paradise funcionando',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Rota para informações do hotel
router.get('/hotel/info', (req, res) => {
    res.json({
        nome: 'Hotel Paradise',
        localizacao: 'Rio Negro, Paraná',
        descricao: 'Hospedagem de qualidade em cidade histórica',
        contato: {
            telefone: '(47) 3644-0000',
            email: 'contato@hotelparadise.com.br'
        }
    });
});

// Rota temporária para quartos
router.get('/quartos', (req, res) => {
    res.json({
        message: 'Funcionalidade em desenvolvimento',
        status: 'info'
    });
});

module.exports = router;
