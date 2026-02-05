const { v4: uuidv4 } = require('uuid');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const Payment = require('../models/Payment');

// Generar tokens ficticios para el método de pago
const generateFictitiousPanToken = (brand = 'card') => {
  const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `pan_tok_${brand}_${segment()}-${segment()}-${segment()}`;
};

const generateFictitiousToken = () => {
  return `tok_${uuidv4().replace(/-/g, '').substring(0, 24)}`;
};

const generateFictitiousTokenId = () => {
  return uuidv4();
};

const generateFictitiousCommerceToken = () => {
  return `com_${uuidv4().replace(/-/g, '').substring(0, 20)}`;
};

// URL de la cola SQS (se usa para Lambda y SQS)
const QUEUE_URL = process.env.AWS_SQS_QUEUE_URL;

// Extraer región de la URL de SQS si está disponible, sino usar us-east-1 por defecto
const getRegionFromUrl = (url) => {
  if (!url) return 'us-east-1';
  const match = url.match(/sqs\.([^.]+)\.amazonaws\.com/);
  return match ? match[1] : 'us-east-1';
};

// Configuración de AWS SQS
// El SDK de AWS automáticamente detecta credenciales desde:
// - Variables de entorno (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
// - Archivos de credenciales (~/.aws/credentials)
// - Roles IAM (en EC2, Lambda, ECS, etc.)
const sqsClient = QUEUE_URL ? new SQSClient({
  region: getRegionFromUrl(QUEUE_URL)
}) : null;

// Función para enviar mensaje a SQS con atributos
const sendToSQS = async (payment) => {
  if (!QUEUE_URL || !sqsClient) {
    console.warn('AWS_SQS_QUEUE_URL no configurada, omitiendo envío a SQS');
    return { success: false, error: 'Queue URL no configurada' };
  }

  const paymentId = payment._id.toString();
  
  // Usar atributos del pago o valores por defecto
  const sqsAttributes = payment.sqsAttributes || {
    allow_commerce_pan_token: 'true',
    from_batch: 'false',
    is_force: 'false'
  };

  try {
    const command = new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: paymentId,
      MessageAttributes: {
        allow_commerce_pan_token: {
          DataType: 'String',
          StringValue: sqsAttributes.allow_commerce_pan_token || 'true'
        },
        from_batch: {
          DataType: 'String',
          StringValue: sqsAttributes.from_batch || 'false'
        },
        is_force: {
          DataType: 'String',
          StringValue: sqsAttributes.is_force || 'false'
        }
      }
    });

    const response = await sqsClient.send(command);
    console.log(`Mensaje enviado a SQS para pago ${paymentId}. MessageId: ${response.MessageId}`);
    console.log(`Atributos SQS:`, {
      allow_commerce_pan_token: sqsAttributes.allow_commerce_pan_token,
      from_batch: sqsAttributes.from_batch,
      is_force: sqsAttributes.is_force
    });
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error(`Error al enviar mensaje a SQS para pago ${paymentId}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Función para enviar notificación al servicio AWS Lambda y SQS
const sendNotification = async (payment) => {
  const paymentId = payment._id.toString();
  
  try {
    // 1. Enviar a Lambda usando AWS_SQS_QUEUE_URL
    if (!QUEUE_URL) {
      console.warn('AWS_SQS_QUEUE_URL no configurada, omitiendo envío a Lambda');
      return { success: false, error: 'AWS_SQS_QUEUE_URL no configurada' };
    }

    // Atributos SQS del pago (los que el usuario elige en la UI)
    const sqsAttributes = payment.sqsAttributes || {
      allow_commerce_pan_token: 'true',
      from_batch: 'false',
      is_force: 'false'
    };

    // paymentMethod completo para que viaje a AWS
    const paymentMethodPayload = {
      type: payment.paymentMethod?.type || 'credit_card',
      brand: payment.paymentMethod?.brand || null,
      lastFourDigits: payment.paymentMethod?.lastFourDigits || null,
      token: payment.paymentMethod?.token || null,
      tokenId: payment.paymentMethod?.tokenId || null,
      panToken: payment.paymentMethod?.panToken || null,
      commerceToken: payment.paymentMethod?.commerceToken || null
    };

    // Payload exacto para AWS: QueueUrl, MessageBody, MessageAttributes, paymentMethod
    const payload = {
      QueueUrl: QUEUE_URL,
      MessageBody: paymentId,
      paymentMethod: paymentMethodPayload,
      MessageAttributes: {
        allow_commerce_pan_token: {
          DataType: 'String',
          StringValue: sqsAttributes.allow_commerce_pan_token || 'true'
        },
        from_batch: {
          DataType: 'String',
          StringValue: sqsAttributes.from_batch || 'false'
        },
        is_force: {
          DataType: 'String',
          StringValue: sqsAttributes.is_force || 'false'
        }
      }
    };

    console.log(`Enviando notificación para pago ${payment.transactionId}...`, payload);

    const lambdaResponse = await fetch(QUEUE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (lambdaResponse.ok) {
      await Payment.findByIdAndUpdate(payment._id, {
        notificationSent: true,
        notificationSentAt: new Date()
      });
      console.log(`Notificación enviada exitosamente para pago ${payment.transactionId}`);
      return { success: true };
    } else {
      const errorText = await lambdaResponse.text();
      console.error(`Error al enviar notificación a Lambda: ${lambdaResponse.status} - ${errorText}`);
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
  // - Montos terminados en 50: siempre pending
  // - Resto: 80% aprobado, 15% rechazado, 5% pending
  
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
  
  if (amountStr.endsWith('50')) {
    return {
      status: 'pending',
      responseCode: '99',
      responseMessage: 'Transacción en proceso'
    };
  }
  
  // Simulación aleatoria para el resto
  const r = Math.random();
  if (r < 0.80) {
    return {
      status: 'approved',
      responseCode: '00',
      responseMessage: 'Transacción aprobada'
    };
  }
  if (r < 0.95) {
    return {
      status: 'rejected',
      responseCode: '51',
      responseMessage: 'Fondos insuficientes'
    };
  }
  return {
    status: 'pending',
    responseCode: '99',
    responseMessage: 'Transacción en proceso'
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
      metadata,
      sqsAttributes
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
    
    // Generar tokens ficticios y armar paymentMethod completo
    const paymentMethodWithTokens = {
      ...paymentMethod,
      token: generateFictitiousToken(),
      tokenId: generateFictitiousTokenId(),
      panToken: generateFictitiousPanToken(paymentMethod?.brand || 'card'),
      commerceToken: generateFictitiousCommerceToken()
    };
    
    // Simular procesamiento del pago
    const processingResult = simulatePaymentProcessing(amount, paymentMethod);
    
    // Crear el registro del pago
    const payment = new Payment({
      transactionId,
      merchant,
      amount,
      currency: currency || 'ARS',
      payer,
      paymentMethod: paymentMethodWithTokens,
      status: processingResult.status,
      responseCode: processingResult.responseCode,
      responseMessage: processingResult.responseMessage,
      externalReference,
      description,
      metadata,
      sqsAttributes: sqsAttributes || {
        allow_commerce_pan_token: 'true',
        from_batch: 'false',
        is_force: 'false'
      }
    });
    
    // Guardar en MongoDB
    await payment.save();
    
    console.log(`Pago procesado: ${transactionId} - Estado: ${processingResult.status}`);
    
    // Enviar notificación a AWS para pagos aprobados y rechazados (no pending)
    let notificationResult = null;
    if (payment.status === 'approved' || payment.status === 'rejected') {
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
        paymentMethod: payment.paymentMethod,
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

// Datos ficticios para bulk test
const BULK_MERCHANTS = [
  { id: 'MERCHANT-001', name: 'Tienda Online Demo', email: 'pagos@demo.com' },
  { id: 'MERCHANT-002', name: 'Comercio Test', email: 'test@comercio.com' },
  { id: 'MERCHANT-003', name: 'Shop Pagador', email: 'shop@pagador.com' }
];

const BULK_PAYER_NAMES = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Luis Rodríguez', 'Laura Sánchez', 'Pedro Fernández', 'Sofía Díaz'];

const BULK_AMOUNTS_APPROVED = [1000, 2500, 5000, 7500, 15000, 20000, 3500, 8900]; // terminan en 00 o dan alta prob aprobación
const BULK_AMOUNTS_REJECTED = [1999, 3599, 5099]; // terminan en 99
// Montos que siempre se aprueban (terminan en 00)
const BULK_AMOUNTS_ALWAYS_APPROVED = [1000, 2000, 3000, 5000, 7500, 10000, 15000, 25000, 4000, 8000];

// Crear N pagos de prueba y enviar notificaciones a AWS
exports.createBulkTestPayments = async (req, res) => {
  const count = parseInt(req.query.count) || 1000;
  const allApproved = req.query.allApproved === 'true';
  const withoutPanToken = req.query.withoutPanToken === 'true';
  const maxCount = Math.min(Math.max(1, count), 10000);

  try {
    const results = { created: 0, approved: 0, rejected: 0, notificationsSent: 0, errors: [] };
    const createdPayments = [];

    for (let i = 0; i < maxCount; i++) {
      try {
        const merchant = BULK_MERCHANTS[i % BULK_MERCHANTS.length];
        const payerName = BULK_PAYER_NAMES[i % BULK_PAYER_NAMES.length];
        
        // Si allApproved=true, usar montos que siempre aprueban, sino usar lógica normal
        const amount = allApproved
          ? BULK_AMOUNTS_ALWAYS_APPROVED[i % BULK_AMOUNTS_ALWAYS_APPROVED.length]
          : (i % 5 === 4
              ? BULK_AMOUNTS_REJECTED[i % BULK_AMOUNTS_REJECTED.length]
              : BULK_AMOUNTS_APPROVED[i % BULK_AMOUNTS_APPROVED.length]);

        const paymentMethod = {
          type: 'credit_card',
          brand: ['visa', 'mastercard'][i % 2],
          lastFourDigits: String(1000 + (i % 9000))
        };

        // Si withoutPanToken=true, no generar tokens
        const paymentMethodWithTokens = withoutPanToken
          ? {
              ...paymentMethod,
              token: null,
              tokenId: null,
              panToken: null,
              commerceToken: null
            }
          : {
              ...paymentMethod,
              token: generateFictitiousToken(),
              tokenId: generateFictitiousTokenId(),
              panToken: generateFictitiousPanToken(paymentMethod.brand),
              commerceToken: generateFictitiousCommerceToken()
            };

        const transactionId = `TXN-${Date.now()}-${i}-${uuidv4().substring(0, 6).toUpperCase()}`;
        
        // Si allApproved=true, forzar aprobación
        const processingResult = allApproved
          ? { status: 'approved', responseCode: '00', responseMessage: 'Transacción aprobada' }
          : simulatePaymentProcessing(amount, paymentMethod);

        const payment = new Payment({
          transactionId,
          merchant: {
            ...merchant,
            notificationUrl: 'https://comerciowebhook.onrender.com/webhook'
          },
          amount,
          currency: 'ARS',
          payer: {
            name: payerName,
            email: `payer${i + 1}@test.com`,
            documentType: 'DNI',
            documentNumber: String(20000000 + i)
          },
          paymentMethod: paymentMethodWithTokens,
          status: processingResult.status,
          responseCode: processingResult.responseCode,
          responseMessage: processingResult.responseMessage,
          externalReference: `BULK-${Date.now()}-${i + 1}`,
          description: `Pago de prueba bulk #${i + 1}${allApproved ? ' (aprobado)' : ''}${withoutPanToken ? ' (sin panToken)' : ''}`,
          sqsAttributes: {
            allow_commerce_pan_token: withoutPanToken ? 'false' : 'true',
            from_batch: 'true',
            is_force: 'false'
          }
        });

        await payment.save();
        results.created++;
        if (payment.status === 'approved') results.approved++;
        else if (payment.status === 'rejected') results.rejected++;

        // Enviar notificación a AWS para aprobados y rechazados (no pending)
        if (payment.status === 'approved' || payment.status === 'rejected') {
          const notif = await sendNotification(payment);
          if (notif.success) results.notificationsSent++;
        }

        createdPayments.push({
          transactionId: payment.transactionId,
          status: payment.status,
          amount: payment.amount,
          notificationSent: payment.status === 'approved' || payment.status === 'rejected'
        });
      } catch (err) {
        results.errors.push({ index: i + 1, message: err.message });
      }
    }

    console.log(`Bulk test: ${results.created} pagos creados, ${results.approved} aprobados, ${results.notificationsSent} notificaciones enviadas a AWS`);

    res.status(201).json({
      success: true,
      message: `Se crearon ${results.created} pagos de prueba. ${results.notificationsSent} notificaciones enviadas a AWS.`,
      data: {
        total: results.created,
        approved: results.approved,
        rejected: results.rejected,
        notificationsSent: results.notificationsSent,
        payments: createdPayments,
        errors: results.errors.length ? results.errors : undefined
      }
    });
  } catch (error) {
    console.error('Error en bulk test:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear pagos de prueba',
      message: error.message
    });
  }
};

// Crear N pagos todos aprobados, algunos con panToken y otros sin
exports.createBulkTestPaymentsApproved = async (req, res) => {
  const count = parseInt(req.query.count) || 50;
  const maxCount = Math.min(Math.max(1, count), 10000);

  try {
    const results = { created: 0, withPanToken: 0, withoutPanToken: 0, notificationsSent: 0, errors: [] };
    const createdPayments = [];

    for (let i = 0; i < maxCount; i++) {
      try {
        const merchant = BULK_MERCHANTS[i % BULK_MERCHANTS.length];
        const payerName = BULK_PAYER_NAMES[i % BULK_PAYER_NAMES.length];
        const amount = BULK_AMOUNTS_ALWAYS_APPROVED[i % BULK_AMOUNTS_ALWAYS_APPROVED.length];
        const withPanToken = i % 2 === 0; // mitad con panToken, mitad sin

        const paymentMethodBase = {
          type: 'credit_card',
          brand: ['visa', 'mastercard'][i % 2],
          lastFourDigits: String(1000 + (i % 9000))
        };

        const paymentMethodWithTokens = withPanToken
          ? {
              ...paymentMethodBase,
              token: generateFictitiousToken(),
              tokenId: generateFictitiousTokenId(),
              panToken: generateFictitiousPanToken(paymentMethodBase.brand),
              commerceToken: generateFictitiousCommerceToken()
            }
          : {
              ...paymentMethodBase,
              token: null,
              tokenId: null,
              panToken: null,
              commerceToken: null
            };

        const transactionId = `TXN-APP-${Date.now()}-${i}-${uuidv4().substring(0, 6).toUpperCase()}`;

        const payment = new Payment({
          transactionId,
          merchant: {
            ...merchant,
            notificationUrl: 'https://comerciowebhook.onrender.com/webhook'
          },
          amount,
          currency: 'ARS',
          payer: {
            name: payerName,
            email: `approved${i + 1}@test.com`,
            documentType: 'DNI',
            documentNumber: String(30000000 + i)
          },
          paymentMethod: paymentMethodWithTokens,
          status: 'approved',
          responseCode: '00',
          responseMessage: 'Transacción aprobada',
          externalReference: `BULK-APP-${Date.now()}-${i + 1}`,
          description: `Pago aprobado prueba #${i + 1}${withPanToken ? ' (con panToken)' : ' (sin panToken)'}`,
          sqsAttributes: {
            allow_commerce_pan_token: withPanToken ? 'true' : 'false',
            from_batch: 'true',
            is_force: 'false'
          }
        });

        await payment.save();
        results.created++;
        if (withPanToken) results.withPanToken++;
        else results.withoutPanToken++;

        const notif = await sendNotification(payment);
        if (notif.success) results.notificationsSent++;

        createdPayments.push({
          transactionId: payment.transactionId,
          amount: payment.amount,
          withPanToken,
          notificationSent: notif.success
        });
      } catch (err) {
        results.errors.push({ index: i + 1, message: err.message });
      }
    }

    console.log(`Bulk approved: ${results.created} pagos (${results.withPanToken} con panToken, ${results.withoutPanToken} sin), ${results.notificationsSent} notificaciones a AWS`);

    res.status(201).json({
      success: true,
      message: `Se crearon ${results.created} pagos aprobados. ${results.withPanToken} con panToken, ${results.withoutPanToken} sin. ${results.notificationsSent} notificaciones enviadas a AWS.`,
      data: {
        total: results.created,
        withPanToken: results.withPanToken,
        withoutPanToken: results.withoutPanToken,
        notificationsSent: results.notificationsSent,
        payments: createdPayments,
        errors: results.errors.length ? results.errors : undefined
      }
    });
  } catch (error) {
    console.error('Error en bulk test approved:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear pagos de prueba aprobados',
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
      .select('transactionId merchant amount currency status responseCode responseMessage payer externalReference createdAt sqsAttributes');
    
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
