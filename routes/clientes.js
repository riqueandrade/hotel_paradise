// Rotas de Clientes - Hotel Paradise
const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/ClienteController');
const { authenticateToken, requireStaff, requireAdmin, optionalAuth } = require('../middleware/auth');

// Rotas públicas (com autenticação opcional)
router.get('/search', optionalAuth, ClienteController.search);

// Rotas que requerem autenticação de staff
router.get('/', authenticateToken, requireStaff, ClienteController.index);
router.get('/statistics', authenticateToken, requireStaff, ClienteController.statistics);
router.get('/active-reservations', authenticateToken, requireStaff, ClienteController.withActiveReservations);
router.get('/origin', authenticateToken, requireStaff, ClienteController.findByOrigin);
router.get('/visit-reason/:motivo', authenticateToken, requireStaff, ClienteController.findByVisitReason);

// Rotas de busca específica
router.get('/cpf/:cpf', authenticateToken, requireStaff, ClienteController.findByCPF);
router.get('/email/:email', authenticateToken, requireStaff, ClienteController.findByEmail);
router.get('/:id', authenticateToken, requireStaff, ClienteController.show);
router.get('/:id/reservations', authenticateToken, requireStaff, ClienteController.reservationHistory);

// Rotas de criação e atualização
router.post('/', authenticateToken, requireStaff, ClienteController.create);
router.put('/:id', authenticateToken, requireStaff, ClienteController.update);

// Rotas administrativas
router.delete('/:id', authenticateToken, requireAdmin, ClienteController.delete);

module.exports = router;
