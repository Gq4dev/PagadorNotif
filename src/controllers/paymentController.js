const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');

// URL del servicio de notificaciones AWS Lambda
const NOTIFICATION_SERVICE_URL = 'https://zkslv9jlz3.execute-api.us-east-1.amazonaws.com/notifications';

// Función para enviar notificación al servicio AWS Lambda
const sendNotification = async (payment) => {
  try {
    const payload = {
      message: `Nuevo pago: ${payment._id.toString()}`,
      payment_id: payment._id.toString(),
      status: payment.status
    };

    console.log(`Enviando notificación para pago ${payment.transactionId}...`);

    const response = await fetch(NOTIFICATION_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      // Marcar como notificado en la base de datos
      await Payment.findByIdAndUpdate(payment._id, {
        notificationSent: true,
        notificationSentAt: new Date()
      });
      console.log(`Notificación enviada exitosamente para pago ${payment.transactionId}`);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error(`Error al enviar notificación: ${response.status} - ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error(`Error al enviar notificación para pago ${payment.transactionId}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Simular procesamiento de pago (genera resultado aleatorio o basado en reglas)
const simulatePaymentProcessing = (amount, paymentMethod) => {
  // Reglas de simulación:
  // - Montos terminados en 00: siempre aprobado
  // - Montos terminados en 99: siempre rechazado
  // - Resto: 85% aprobado, 15% rechazado
  
  const amountStr = amount.toString();
  
  if (amountStr.endsWith('00')) {
    return {
      status: 'approved',
      responseCode: '00',
      responseMessage: 'Transacción aprobada'
    };
  }
  
  if (amountStr.endsWith('99')) {
    return {
      status: 'rejected',
      responseCode: '51',
      responseMessage: 'Fondos insuficientes'
    };
  }
  
  // Simulación aleatoria para el resto
  const isApproved = Math.random() < 0.85;
  
  if (isApproved) {
    return {
      status: 'approved',
      responseCode: '00',
      responseMessage: 'Transacción aprobada'
    };
  }
  
  // Diferentes razones de rechazo
  const rejectionReasons = [
    { code: '51', message: 'Fondos insuficientes' },
    { code: '54', message: 'Tarjeta expirada' },
    { code: '57', message: 'Transacción no permitida' },
    { code: '91', message: 'Banco emisor no disponible' }
  ];
  
  const rejection = rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)];
  
  return {
    status: 'rejected',
    responseCode: rejection.code,
    responseMessage: rejection.message
  };
};

// Crear un nuevo pago
exports.createPayment = async (req, res) => {
  try {
    const {
      merchant,
      amount,
      currency,
      payer,
      paymentMethod,
      externalReference,
      description,
      metadata
    } = req.body;
    
    // Validaciones básicas
    if (!merchant || !merchant.id || !merchant.name || !merchant.email) {
      return res.status(400).json({
        success: false,
        error: 'Datos del comercio incompletos (id, name, email requeridos)'
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El monto debe ser mayor a 0'
      });
    }
    
    if (!payer || !payer.name || !payer.email || !payer.documentNumber) {
      return res.status(400).json({
        success: false,
        error: 'Datos del pagador incompletos (name, email, documentNumber requeridos)'
      });
    }
    
    if (!paymentMethod || !paymentMethod.type) {
      return res.status(400).json({
        success: false,
        error: 'Método de pago requerido'
      });
    }
    
    // Generar ID de transacción único
    const transactionId = `TXN-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Simular procesamiento del pago
    const processingResult = simulatePaymentProcessing(amount, paymentMethod);
    
    // Crear el registro del pago
    const payment = new Payment({
      transactionId,
      merchant,
      amount,
      currency: currency || 'ARS',
      payer,
      paymentMethod,
      status: processingResult.status,
      responseCode: processingResult.responseCode,
      responseMessage: processingResult.responseMessage,
      externalReference,
      description,
      metadata
    });
    
    // Guardar en MongoDB
    await payment.save();
    
    console.log(`Pago procesado: ${transactionId} - Estado: ${processingResult.status}`);
    
    // Si el pago fue aprobado, enviar notificación al servicio AWS Lambda
    let notificationResult = null;
    if (payment.status === 'approved') {
      notificationResult = await sendNotification(payment);
    }
    
    res.status(201).json({
      success: true,
      data: {
        transactionId: payment.transactionId,
        status: payment.status,
        responseCode: payment.responseCode,
        responseMessage: payment.responseMessage,
        amount: payment.amount,
        currency: payment.currency,
        merchant: {
          id: payment.merchant.id,
          name: payment.merchant.name
        },
        createdAt: payment.createdAt,
        notificationSent: notificationResult?.success || false
      }
    });
    
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
};

// Obtener un pago por transactionId
exports.getPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const payment = await Payment.findOne({ transactionId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Pago no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: payment
    });
    
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Listar pagos con filtros (útil para el Lambda/SQS)
exports.listPayments = async (req, res) => {
  try {
    const {
      merchantId,
      status,
      notificationSent,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;
    
    // Construir filtro
    const filter = {};
    
    if (merchantId) {
      filter['merchant.id'] = merchantId;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (notificationSent !== undefined) {
      filter.notificationSent = notificationSent === 'true';
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error al listar pagos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener pagos pendientes de notificación (endpoint para Lambda/SQS)
exports.getPendingNotifications = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const payments = await Payment.find({
      notificationSent: false,
      status: { $in: ['approved', 'rejected'] }
    })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .select('transactionId merchant amount currency status responseCode responseMessage payer externalReference createdAt');
    
    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
    
  } catch (error) {
    console.error('Error al obtener notificaciones pendientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Marcar pago como notificado (para ser llamado por Lambda después de enviar)
exports.markAsNotified = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const payment = await Payment.findOneAndUpdate(
      { transactionId },
      {
        notificationSent: true,
        notificationSentAt: new Date()
      },
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Pago no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Pago marcado como notificado',
      data: {
        transactionId: payment.transactionId,
        notificationSent: payment.notificationSent,
        notificationSentAt: payment.notificationSentAt
      }
    });
    
  } catch (error) {
    console.error('Error al marcar como notificado:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Marcar múltiples pagos como notificados (bulk update)
exports.markMultipleAsNotified = async (req, res) => {
  try {
    const { transactionIds } = req.body;
    
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de transactionIds'
      });
    }
    
    const result = await Payment.updateMany(
      { transactionId: { $in: transactionIds } },
      {
        notificationSent: true,
        notificationSentAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} pagos marcados como notificados`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
    
  } catch (error) {
    console.error('Error al marcar múltiples como notificados:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Refund (reembolso) - cambiar estado
exports.refundPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const payment = await Payment.findOne({ transactionId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Pago no encontrado'
      });
    }
    
    if (payment.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden reembolsar pagos aprobados'
      });
    }
    
    payment.status = 'refunded';
    payment.notificationSent = false; // Reset para que se notifique el reembolso
    await payment.save();
    
    res.json({
      success: true,
      message: 'Pago reembolsado exitosamente',
      data: {
        transactionId: payment.transactionId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency
      }
    });
    
  } catch (error) {
    console.error('Error al reembolsar pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};
