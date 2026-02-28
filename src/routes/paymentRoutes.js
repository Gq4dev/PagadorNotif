const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Crear un nuevo pago
router.post('/', paymentController.createPayment);

// Listar pagos con filtros
router.get('/', paymentController.listPayments);

// Obtener pagos pendientes de notificación (para Lambda/SQS)
router.get('/pending-notifications', paymentController.getPendingNotifications);

// Crear N pagos de prueba y enviar notificaciones a AWS (default 25)
router.post('/bulk/test', paymentController.createBulkTestPayments);

// Crear N pagos todos aprobados, mitad con panToken mitad sin (default 50)
router.post('/bulk/test-approved', paymentController.createBulkTestPaymentsApproved);

// Crear 10 pagos con 2 notificaciones duplicadas (mismo payment_id)
router.post('/bulk/test-duplicates', paymentController.createBulkTestWithDuplicates);

// Obtener un pago específico
router.get('/:transactionId', paymentController.getPayment);

// Marcar un pago como notificado
router.patch('/:transactionId/notified', paymentController.markAsNotified);

// Marcar múltiples pagos como notificados (bulk)
router.patch('/bulk/notified', paymentController.markMultipleAsNotified);

// Reenviar notificación (con is_force y URL opcional)
router.post('/:transactionId/resend-notification', paymentController.resendNotification);

// Reembolsar un pago
router.post('/:transactionId/refund', paymentController.refundPayment);

module.exports = router;
