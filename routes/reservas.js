// Rotas de Reservas - Hotel Paradise
const express = require('express');
const router = express.Router();
const ReservaController = require('../controllers/ReservaController');
const { authenticateToken, requireStaff, requireAdmin, optionalAuth } = require('../middleware/auth');

// Rotas públicas (com autenticação opcional)
router.get('/today', optionalAuth, ReservaController.today);

// Rotas que requerem autenticação
router.get('/', authenticateToken, ReservaController.index);
router.get('/statistics', authenticateToken, requireStaff, ReservaController.statistics);
router.get('/status/:status', authenticateToken, ReservaController.byStatus);
router.get('/:id', authenticateToken, ReservaController.show);

// Rotas de criação e atualização
router.post('/', authenticateToken, ReservaController.create);
router.put('/:id', authenticateToken, requireStaff, ReservaController.update);

// Rotas de ações específicas
router.patch('/:id/confirm', authenticateToken, requireStaff, ReservaController.confirm);
router.patch('/:id/cancel', authenticateToken, ReservaController.cancel);
router.patch('/:id/checkin', authenticateToken, requireStaff, ReservaController.checkIn);
router.patch('/:id/checkout', authenticateToken, requireStaff, ReservaController.checkOut);

// Rotas administrativas
router.delete('/:id', authenticateToken, requireAdmin, ReservaController.delete);

// Rotas de compatibilidade (manter as antigas temporariamente)
router.post('/verificar-disponibilidade', (req, res) => {
    res.redirect(307, '/api/quartos/available');
});

router.post('/criar', authenticateToken, ReservaController.create);
router.get('/listar', authenticateToken, ReservaController.index);

module.exports = router;
