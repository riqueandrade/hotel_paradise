// Rotas de Quartos - Hotel Paradise
const express = require('express');
const router = express.Router();
const QuartoController = require('../controllers/QuartoController');
const { authenticateToken, requireStaff, requireAdmin, optionalAuth } = require('../middleware/auth');

// Rotas públicas (sem autenticação necessária)
router.get('/available', QuartoController.available);
router.get('/types', QuartoController.types);
router.get('/search', QuartoController.search);

// Rotas que podem ser acessadas por qualquer usuário autenticado
router.get('/', optionalAuth, QuartoController.index);
router.get('/:id', optionalAuth, QuartoController.show);
router.get('/:id/availability', QuartoController.checkAvailability);

// Rotas que requerem autenticação de staff (recepcionista ou admin)
router.get('/admin/statistics', authenticateToken, requireStaff, QuartoController.statistics);
router.patch('/:id/status', authenticateToken, requireStaff, QuartoController.updateStatus);

// Rotas que requerem autenticação de administrador
router.post('/', authenticateToken, requireAdmin, QuartoController.create);
router.put('/:id', authenticateToken, requireAdmin, QuartoController.update);
router.delete('/:id', authenticateToken, requireAdmin, QuartoController.delete);

module.exports = router;
