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

// Log de la URL configurada al iniciar
if (QUEUE_URL) {
  console.log(`[Configuración] AWS_SQS_QUEUE_URL configurada: ${QUEUE_URL}`);
} else {
  console.warn('[Configuración] AWS_SQS_QUEUE_URL NO está configurada');
}

// Extraer región de la URL de SQS si está disponible, sino usar us-east-1 por defecto
const getRegionFromUrl = (url) => {
  if (!url) return 'us-east-1';
  const match = url.match(/sqs\.([^.]+)\.amazonaws\.com/);
  return match ? match[1] : 'us-east-1';
};

// Configuración de AWS SQS
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
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error(`Error al enviar mensaje a SQS para pago ${paymentId}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Función para enviar notificación al servicio AWS Lambda
const sendNotification = async (payment) => {
  const paymentId = payment._id.toString();
  
  try {
    if (!QUEUE_URL) {
      console.warn('AWS_SQS_QUEUE_URL no configurada, omitiendo envío a Lambda');
      return { success: false, error: 'AWS_SQS_QUEUE_URL no configurada' };
    }

    const sqsAttributes = payment.sqsAttributes || {
      allow_commerce_pan_token: 'true',
      from_batch: 'false',
      is_force: 'false'
    };

    // Obtener paymentMethod del primer método de pago (nueva estructura)
    const firstPaymentMethod = payment.payment_methods && payment.payment_methods[0] ? payment.payment_methods[0] : {};
    
    const paymentMethodPayload = {
      type: firstPaymentMethod.media_payment_detail || 'credit_card',
      brand: firstPaymentMethod.media_payment_detail || null,
      lastFourDigits: firstPaymentMethod.last_four_digits || null,
      token: firstPaymentMethod.token || null,
      tokenId: firstPaymentMethod.tokenId || null,
      panToken: firstPaymentMethod.panToken || null,
      commerceToken: firstPaymentMethod.commerceToken || null
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

    console.log(`Enviando notificación para pago ${payment.external_transaction_id}...`);
    console.log(`URL destino: ${QUEUE_URL}`);
    console.log(`Payload:`, JSON.stringify(payload, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const lambdaResponse = await fetch(QUEUE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (lambdaResponse.ok) {
        await Payment.findByIdAndUpdate(payment._id, {
          notificationSent: true,
          notificationSentAt: new Date()
        });
        console.log(`Notificación enviada exitosamente para pago ${payment.external_transaction_id}`);
        return { success: true };
      } else {
        const errorText = await lambdaResponse.text();
        console.error(`Error al enviar notificación a Lambda: ${lambdaResponse.status} - ${errorText}`);
        return { success: false, error: errorText, status: lambdaResponse.status };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    let errorMessage = error.message;
    let errorDetails = {};

    if (error.name === 'AbortError') {
      errorMessage = 'Timeout: La solicitud tardó más de 30 segundos';
      errorDetails = { type: 'timeout', url: QUEUE_URL };
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = `Error de conexión: No se pudo conectar a ${QUEUE_URL}. Verifica que la URL sea correcta y accesible.`;
      errorDetails = { type: 'connection', code: error.code, url: QUEUE_URL };
    } else if (error.code === 'ECONNRESET') {
      errorMessage = 'Error: La conexión fue cerrada por el servidor';
      errorDetails = { type: 'connection_reset', code: error.code };
    } else if (error.message.includes('fetch failed')) {
      errorMessage = `Error de red: ${error.message}. URL: ${QUEUE_URL}`;
      errorDetails = { type: 'network', message: error.message, url: QUEUE_URL };
    }

    console.error(`Error al enviar notificación para pago ${payment.external_transaction_id}:`, errorMessage);
    console.error(`Detalles del error:`, { ...errorDetails, originalError: error.message, stack: error.stack });
    
    return { 
      success: false, 
      error: errorMessage,
      details: errorDetails
    };
  }
};

// Función auxiliar para enviar notificación con atributos personalizados
const sendNotificationWithCustomAttributes = async (payment, customAttributes) => {
  const paymentId = payment._id.toString();
  
  try {
    if (!QUEUE_URL) {
      console.warn('AWS_SQS_QUEUE_URL no configurada, omitiendo envío a Lambda');
      return { success: false, error: 'AWS_SQS_QUEUE_URL no configurada' };
    }

    const sqsAttributes = {
      allow_commerce_pan_token: customAttributes?.allow_commerce_pan_token || payment.sqsAttributes?.allow_commerce_pan_token || 'true',
      from_batch: customAttributes?.from_batch || payment.sqsAttributes?.from_batch || 'false',
      is_force: customAttributes?.is_force || payment.sqsAttributes?.is_force || 'false'
    };

    const firstPaymentMethod = payment.payment_methods && payment.payment_methods[0] ? payment.payment_methods[0] : {};
    
    const paymentMethodPayload = {
      type: firstPaymentMethod.media_payment_detail || 'credit_card',
      brand: firstPaymentMethod.media_payment_detail || null,
      lastFourDigits: firstPaymentMethod.last_four_digits || null,
      token: firstPaymentMethod.token || null,
      tokenId: firstPaymentMethod.tokenId || null,
      panToken: firstPaymentMethod.panToken || null,
      commerceToken: firstPaymentMethod.commerceToken || null
    };

    const payload = {
      QueueUrl: QUEUE_URL,
      MessageBody: paymentId,
      paymentMethod: paymentMethodPayload,
      MessageAttributes: {
        allow_commerce_pan_token: {
          DataType: 'String',
          StringValue: sqsAttributes.allow_commerce_pan_token
        },
        from_batch: {
          DataType: 'String',
          StringValue: sqsAttributes.from_batch
        },
        is_force: {
          DataType: 'String',
          StringValue: sqsAttributes.is_force
        }
      }
    };

    console.log(`Enviando notificación con atributos personalizados para pago ${payment.external_transaction_id}...`);
    console.log(`URL destino: ${QUEUE_URL}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const lambdaResponse = await fetch(QUEUE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (lambdaResponse.ok) {
        console.log(`Notificación con atributos personalizados enviada exitosamente para pago ${payment.external_transaction_id}`);
        return { success: true };
      } else {
        const errorText = await lambdaResponse.text();
        console.error(`Error al enviar notificación: ${lambdaResponse.status} - ${errorText}`);
        return { success: false, error: errorText, status: lambdaResponse.status };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    let errorMessage = error.message;
    let errorDetails = {};

    if (error.name === 'AbortError') {
      errorMessage = 'Timeout: La solicitud tardó más de 30 segundos';
      errorDetails = { type: 'timeout', url: QUEUE_URL };
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = `Error de conexión: No se pudo conectar a ${QUEUE_URL}. Verifica que la URL sea correcta y accesible.`;
      errorDetails = { type: 'connection', code: error.code, url: QUEUE_URL };
    } else if (error.code === 'ECONNRESET') {
      errorMessage = 'Error: La conexión fue cerrada por el servidor';
      errorDetails = { type: 'connection_reset', code: error.code };
    } else if (error.message.includes('fetch failed')) {
      errorMessage = `Error de red: ${error.message}. URL: ${QUEUE_URL}`;
      errorDetails = { type: 'network', message: error.message, url: QUEUE_URL };
    }

    console.error(`Error al enviar notificación para pago ${payment.external_transaction_id}:`, errorMessage);
    console.error(`Detalles del error:`, { ...errorDetails, originalError: error.message, stack: error.stack });
    
    return { 
      success: false, 
      error: errorMessage,
      details: errorDetails
    };
  }
};

// Simular procesamiento de pago (genera resultado aleatorio o basado en reglas)
const simulatePaymentProcessing = (amount, paymentMethod) => {
  const amountStr = amount.toString();
  
  if (amountStr.endsWith('00')) {
    return {
      status: 'approved',
      status_detail: 'APROBADA - Autorizada - MOP GPAY: -1 - Aprobada'
    };
  }
  
  if (amountStr.endsWith('99')) {
    return {
      status: 'rejected',
      status_detail: 'RECHAZADA - Fondos insuficientes'
    };
  }
  
  if (amountStr.endsWith('50')) {
    return {
      status: 'pending',
      status_detail: 'PENDIENTE - En proceso de validación'
    };
  }
  
  // Resto: 80% aprobado, 15% rechazado, 5% pending
  const random = Math.random();
  if (random < 0.80) {
    return {
      status: 'approved',
      status_detail: 'APROBADA - Autorizada - MOP GPAY: -1 - Aprobada'
    };
  } else if (random < 0.95) {
    return {
      status: 'rejected',
      status_detail: 'RECHAZADA - Transacción rechazada'
    };
  } else {
    return {
      status: 'pending',
      status_detail: 'PENDIENTE - En proceso de validación'
    };
  }
};

// Crear un nuevo pago
exports.createPayment = async (req, res) => {
  try {
    const {
      type = 'debit',
      validation = false,
      review = false,
      collector_id = '999',
      collector_detail = { name: 'PRUEBA' },
      notification_url,
      form_url,
      details,
      currency_id = 'ARS',
      payment_methods,
      final_amount,
      metadata = {},
      source,
      sqsAttributes
    } = req.body;

    // Validar que haya detalles
    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere al menos un detalle (details)'
      });
    }

    // Validar que haya métodos de pago
    if (!payment_methods || !Array.isArray(payment_methods) || payment_methods.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere al menos un método de pago (payment_methods)'
      });
    }

    // Calcular monto final si no se proporciona
    const calculatedFinalAmount = final_amount || details.reduce((sum, detail) => sum + (detail.amount || 0), 0);

    // Simular procesamiento basado en el monto
    const simulation = simulatePaymentProcessing(calculatedFinalAmount, payment_methods[0]);

    // Generar tokens ficticios para el primer método de pago si no existen
    const firstPaymentMethod = { ...payment_methods[0] };
    if (!firstPaymentMethod.token) {
      firstPaymentMethod.token = generateFictitiousToken();
    }
    if (!firstPaymentMethod.tokenId) {
      firstPaymentMethod.tokenId = generateFictitiousTokenId();
    }
    if (!firstPaymentMethod.panToken) {
      firstPaymentMethod.panToken = generateFictitiousPanToken(firstPaymentMethod.media_payment_detail || 'card');
    }
    if (!firstPaymentMethod.commerceToken) {
      firstPaymentMethod.commerceToken = generateFictitiousCommerceToken();
    }

    // Generar códigos de autorización y gateway si no existen
    if (!firstPaymentMethod.authorization_code) {
      firstPaymentMethod.authorization_code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    }
    if (!firstPaymentMethod.gateway) {
      firstPaymentMethod.gateway = {
        establishment_number: 'PRUEBA',
        transaction_id: Math.floor(Math.random() * 10000000).toString(),
        batch_number: '1',
        ticket_number: Math.floor(Math.random() * 10000).toString(),
        ppt_owner: false
      };
    }

    // Generar dígitos de tarjeta si no existen
    if (!firstPaymentMethod.last_four_digits) {
      firstPaymentMethod.last_four_digits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    }
    if (!firstPaymentMethod.first_six_digits) {
      firstPaymentMethod.first_six_digits = '450799';
    }

    const updatedPaymentMethods = [firstPaymentMethod, ...payment_methods.slice(1)];

    // Crear el pago
    const paymentData = {
      type,
      validation,
      review,
      collector_id,
      collector_detail,
      notification_url: notification_url || null,
      form_url: form_url || null,
      details,
      currency_id,
      payment_methods: updatedPaymentMethods,
      final_amount: calculatedFinalAmount,
      status: simulation.status,
      status_detail: simulation.status_detail,
      metadata,
      source: source || {
        id: uuidv4(),
        name: 'system-test',
        type: 'system'
      },
      sqsAttributes: sqsAttributes || {
        allow_commerce_pan_token: 'true',
        from_batch: 'false',
        is_force: 'false'
      },
      process_date: simulation.status === 'approved' ? new Date() : null,
      paid_date: simulation.status === 'approved' ? new Date() : null,
      accreditation_date: simulation.status === 'approved' ? new Date() : null,
      last_update_date: new Date()
    };

    const payment = new Payment(paymentData);
    await payment.save();

    // Enviar notificación a AWS para todos los estados
    const notificationResult = await sendNotification(payment);
    
    if (!notificationResult.success) {
      console.warn(`No se pudo enviar notificación para pago ${payment.external_transaction_id}:`, notificationResult.error);
    }

    res.status(201).json({
      success: true,
      data: payment.toPaymentJSON()
    });
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el pago',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Listar pagos con filtros
exports.listPayments = async (req, res) => {
  try {
    const {
      collector_id,
      status,
      limit = 50,
      skip = 0,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    if (collector_id) query.collector_id = collector_id;
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort(sort)
      .lean();

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments.map(p => {
        const payment = { ...p };
        // Convertir fechas a ISO string
        if (payment.request_date) payment.request_date = payment.request_date.toISOString();
        if (payment.due_date) payment.due_date = payment.due_date.toISOString();
        if (payment.last_due_date) payment.last_due_date = payment.last_due_date.toISOString();
        if (payment.process_date) payment.process_date = payment.process_date.toISOString();
        if (payment.paid_date) payment.paid_date = payment.paid_date.toISOString();
        if (payment.accreditation_date) payment.accreditation_date = payment.accreditation_date.toISOString();
        if (payment.last_update_date) payment.last_update_date = payment.last_update_date.toISOString();
        return payment;
      }),
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al listar pagos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar los pagos'
    });
  }
};

// Obtener un pago específico
exports.getPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const payment = await Payment.findOne({
      $or: [
        { external_transaction_id: transactionId },
        { id: transactionId },
        { transactionId: transactionId }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Pago no encontrado'
      });
    }

    res.json({
      success: true,
      data: payment.toPaymentJSON()
    });
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el pago'
    });
  }
};

// Obtener pagos pendientes de notificación
exports.getPendingNotifications = async (req, res) => {
  try {
    const payments = await Payment.find({
      notificationSent: false,
      status: { $in: ['approved', 'rejected', 'pending'] }
    }).limit(100);

    res.json({
      success: true,
      data: payments.map(p => p.toPaymentJSON()),
      count: payments.length
    });
  } catch (error) {
    console.error('Error al obtener pagos pendientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pagos pendientes'
    });
  }
};

// Marcar un pago como notificado
exports.markAsNotified = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const payment = await Payment.findOneAndUpdate(
      {
        $or: [
          { external_transaction_id: transactionId },
          { id: transactionId },
          { transactionId: transactionId }
        ]
      },
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
      data: payment.toPaymentJSON()
    });
  } catch (error) {
    console.error('Error al marcar como notificado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar como notificado'
    });
  }
};

// Marcar múltiples pagos como notificados
exports.markMultipleAsNotified = async (req, res) => {
  try {
    const { paymentIds } = req.body;
    
    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de IDs de pagos'
      });
    }

    const result = await Payment.updateMany(
      {
        $or: [
          { external_transaction_id: { $in: paymentIds } },
          { id: { $in: paymentIds } },
          { transactionId: { $in: paymentIds } }
        ]
      },
      {
        notificationSent: true,
        notificationSentAt: new Date()
      }
    );

    res.json({
      success: true,
      updated: result.modifiedCount
    });
  } catch (error) {
    console.error('Error al marcar múltiples como notificados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar múltiples como notificados'
    });
  }
};

// Reenviar notificación a SQS/Lambda (fuerza el reenvío)
exports.resendNotification = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { notification_url, is_force = true } = req.body;

    const payment = await Payment.findOne({
      $or: [
        { external_transaction_id: transactionId },
        { id: transactionId },
        { transactionId: transactionId }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Pago no encontrado'
      });
    }

    // Si se pasa una URL personalizada, actualizarla en el documento para que Lambda la lea
    if (notification_url !== undefined) {
      payment.notification_url = notification_url || null;
      payment.last_update_date = new Date();
      await payment.save();
    }

    const customAttributes = {
      allow_commerce_pan_token: payment.sqsAttributes?.allow_commerce_pan_token || 'true',
      from_batch: 'false',
      is_force: is_force ? 'true' : 'false'
    };

    const result = await sendNotificationWithCustomAttributes(payment, customAttributes);

    if (!result.success) {
      return res.status(502).json({
        success: false,
        error: result.error || 'Error al reenviar la notificación',
        details: result.details
      });
    }

    res.json({
      success: true,
      message: 'Notificación reenviada a SQS',
      is_force,
      notification_url: payment.notification_url
    });
  } catch (error) {
    console.error('Error al reenviar notificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reenviar la notificación'
    });
  }
};

// Reembolsar un pago
exports.refundPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const payment = await Payment.findOne({
      $or: [
        { external_transaction_id: transactionId },
        { id: transactionId },
        { transactionId: transactionId }
      ]
    });

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
    payment.status_detail = 'REEMBOLSADO - Pago reembolsado';
    payment.last_update_date = new Date();
    await payment.save();

    res.json({
      success: true,
      data: payment.toPaymentJSON()
    });
  } catch (error) {
    console.error('Error al reembolsar pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reembolsar el pago'
    });
  }
};

// Crear pagos de prueba en bulk
exports.createBulkTestPayments = async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 1000;
    const allApproved = req.query.allApproved === 'true';
    const withoutPanToken = req.query.withoutPanToken === 'true';

    if (count > 10000) {
      return res.status(400).json({
        success: false,
        error: 'El máximo de pagos permitidos es 10000'
      });
    }

    const payments = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const amount = Math.floor(Math.random() * 10000) + 100;
      const finalAmount = allApproved ? parseFloat(`${amount}.00`) : amount + Math.random();

      const simulation = allApproved 
        ? { status: 'approved', status_detail: 'APROBADA - Autorizada - MOP GPAY: -1 - Aprobada' }
        : simulatePaymentProcessing(finalAmount, null);

      const paymentMethod = {
        amount: finalAmount,
        media_payment_id: 9,
        media_payment_detail: 'VISA CREDIT',
        last_four_digits: Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        first_six_digits: '450799',
        installments: 1,
        authorization_code: Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        gateway: {
          establishment_number: 'PRUEBA',
          transaction_id: Math.floor(Math.random() * 10000000).toString(),
          batch_number: '1',
          ticket_number: Math.floor(Math.random() * 10000).toString(),
          ppt_owner: false
        },
        payment_method_id: 0,
        token: generateFictitiousToken(),
        tokenId: generateFictitiousTokenId(),
        commerceToken: generateFictitiousCommerceToken()
      };

      if (!withoutPanToken) {
        paymentMethod.panToken = generateFictitiousPanToken();
      }

      const paymentData = {
        type: 'debit',
        validation: false,
        review: false,
        collector_id: '999',
        collector_detail: { name: 'PRUEBA' },
        notification_url: 'https://comerciowebhook.onrender.com/webhook',
        form_url: null,
        details: [{
          amount: finalAmount,
          external_reference: `TEST-${i + 1}`,
          concept_id: 'prueba',
          concept_description: `Concepto de prueba ${i + 1}`
        }],
        currency_id: 'ARS',
        payment_methods: [paymentMethod],
        final_amount: finalAmount,
        status: simulation.status,
        status_detail: simulation.status_detail,
        metadata: {},
        source: {
          id: uuidv4(),
          name: 'system-test',
          type: 'system'
        },
        sqsAttributes: {
          allow_commerce_pan_token: 'true',
          from_batch: 'true',
          is_force: 'false'
        },
        process_date: simulation.status === 'approved' ? now : null,
        paid_date: simulation.status === 'approved' ? now : null,
        accreditation_date: simulation.status === 'approved' ? now : null,
        last_update_date: now
      };

      payments.push(paymentData);
    }

    const createdPayments = await Payment.insertMany(payments);

    // Enviar notificaciones a AWS
    let notificationsSent = 0;
    for (const payment of createdPayments) {
      const result = await sendNotification(payment);
      if (result.success) notificationsSent++;
    }

    res.json({
      success: true,
      created: createdPayments.length,
      notificationsSent,
      data: createdPayments.map(p => p.toPaymentJSON ? p.toPaymentJSON() : p)
    });
  } catch (error) {
    console.error('Error al crear pagos bulk:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear pagos bulk',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear pagos aprobados con mix de panToken
exports.createBulkTestPaymentsApproved = async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 50;

    if (count > 10000) {
      return res.status(400).json({
        success: false,
        error: 'El máximo de pagos permitidos es 10000'
      });
    }

    const payments = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const amount = parseFloat(`${Math.floor(Math.random() * 10000) + 100}.00`);
      const hasPanToken = i % 2 === 0; // Mitad con, mitad sin

      const paymentMethod = {
        amount,
        media_payment_id: 9,
        media_payment_detail: 'VISA CREDIT',
        last_four_digits: Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        first_six_digits: '450799',
        installments: 1,
        authorization_code: Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        gateway: {
          establishment_number: 'PRUEBA',
          transaction_id: Math.floor(Math.random() * 10000000).toString(),
          batch_number: '1',
          ticket_number: Math.floor(Math.random() * 10000).toString(),
          ppt_owner: false
        },
        payment_method_id: 0,
        token: generateFictitiousToken(),
        tokenId: generateFictitiousTokenId(),
        commerceToken: generateFictitiousCommerceToken()
      };

      if (hasPanToken) {
        paymentMethod.panToken = generateFictitiousPanToken();
      }

      const paymentData = {
        type: 'debit',
        validation: false,
        review: false,
        collector_id: '999',
        collector_detail: { name: 'PRUEBA' },
        notification_url: 'https://comerciowebhook.onrender.com/webhook',
        form_url: null,
        details: [{
          amount,
          external_reference: `TEST-APPROVED-${i + 1}`,
          concept_id: 'prueba',
          concept_description: `Concepto de prueba aprobado ${i + 1}`
        }],
        currency_id: 'ARS',
        payment_methods: [paymentMethod],
        final_amount: amount,
        status: 'approved',
        status_detail: 'APROBADA - Autorizada - MOP GPAY: -1 - Aprobada',
        metadata: {},
        source: {
          id: uuidv4(),
          name: 'system-test',
          type: 'system'
        },
        sqsAttributes: {
          allow_commerce_pan_token: 'true',
          from_batch: 'true',
          is_force: 'false'
        },
        process_date: now,
        paid_date: now,
        accreditation_date: now,
        last_update_date: now
      };

      payments.push(paymentData);
    }

    const createdPayments = await Payment.insertMany(payments);

    // Enviar notificaciones a AWS
    let notificationsSent = 0;
    for (const payment of createdPayments) {
      const result = await sendNotification(payment);
      if (result.success) notificationsSent++;
    }

    res.json({
      success: true,
      created: createdPayments.length,
      notificationsSent,
      data: createdPayments.map(p => p.toPaymentJSON ? p.toPaymentJSON() : p)
    });
  } catch (error) {
    console.error('Error al crear pagos aprobados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear pagos aprobados',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar el estado de un pago (para testing)
exports.updatePaymentStatus = async (req, res) => {
  const VALID_STATUSES = ['pending', 'approved', 'rejected', 'refunded', 'cancelled'];

  try {
    const { transactionId } = req.params;
    const { status, status_detail } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el campo status',
        valid_statuses: VALID_STATUSES
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Estado inválido: "${status}"`,
        valid_statuses: VALID_STATUSES
      });
    }

    const payment = await Payment.findOne({
      $or: [
        { external_transaction_id: transactionId },
        { id: transactionId },
        { transactionId: transactionId }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Pago no encontrado'
      });
    }

    const previousStatus = payment.status;

    const STATUS_DETAILS = {
      approved: 'APROBADA - Autorizada - MOP GPAY: -1 - Aprobada',
      rejected: 'RECHAZADA - Transacción rechazada',
      pending: 'PENDIENTE - En proceso de validación',
      refunded: 'REEMBOLSADO - Pago reembolsado',
      cancelled: 'CANCELADO - Pago cancelado'
    };

    payment.status = status;
    payment.status_detail = status_detail || STATUS_DETAILS[status];
    payment.last_update_date = new Date();

    if (status === 'approved') {
      payment.process_date = payment.process_date || new Date();
      payment.paid_date = payment.paid_date || new Date();
      payment.accreditation_date = payment.accreditation_date || new Date();
    } else if (status === 'rejected' || status === 'cancelled') {
      payment.process_date = null;
      payment.paid_date = null;
      payment.accreditation_date = null;
    }

    await payment.save();

    const notificationResult = await sendNotification(payment);
    if (!notificationResult.success) {
      console.warn(`No se pudo enviar notificación tras cambio de estado para pago ${payment.external_transaction_id}:`, notificationResult.error);
    }

    res.json({
      success: true,
      previous_status: previousStatus,
      data: payment.toPaymentJSON(),
      notification: notificationResult
    });
  } catch (error) {
    console.error('Error al actualizar estado del pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado del pago'
    });
  }
};

// Crear pagos con duplicados para testing
exports.createBulkTestWithDuplicates = async (req, res) => {
  try {
    const payments = [];
    const now = new Date();

    // Crear 10 pagos únicos
    for (let i = 0; i < 10; i++) {
      const amount = parseFloat(`${Math.floor(Math.random() * 1000) + 100}.00`);

      const paymentMethod = {
        amount,
        media_payment_id: 9,
        media_payment_detail: 'VISA CREDIT',
        last_four_digits: Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        first_six_digits: '450799',
        installments: 1,
        authorization_code: Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        gateway: {
          establishment_number: 'PRUEBA',
          transaction_id: Math.floor(Math.random() * 10000000).toString(),
          batch_number: '1',
          ticket_number: Math.floor(Math.random() * 10000).toString(),
          ppt_owner: false
        },
        payment_method_id: 0,
        token: generateFictitiousToken(),
        tokenId: generateFictitiousTokenId(),
        panToken: generateFictitiousPanToken(),
        commerceToken: generateFictitiousCommerceToken()
      };

      const paymentData = {
        type: 'debit',
        validation: false,
        review: false,
        collector_id: '999',
        collector_detail: { name: 'PRUEBA' },
        notification_url: 'https://comerciowebhook.onrender.com/webhook',
        form_url: null,
        details: [{
          amount,
          external_reference: `TEST-DUP-${i + 1}`,
          concept_id: 'prueba',
          concept_description: `Concepto de prueba duplicado ${i + 1}`
        }],
        currency_id: 'ARS',
        payment_methods: [paymentMethod],
        final_amount: amount,
        status: 'approved',
        status_detail: 'APROBADA - Autorizada - MOP GPAY: -1 - Aprobada',
        metadata: {},
        source: {
          id: uuidv4(),
          name: 'system-test',
          type: 'system'
        },
        sqsAttributes: {
          allow_commerce_pan_token: 'true',
          from_batch: 'false',
          is_force: 'false'
        },
        process_date: now,
        paid_date: now,
        accreditation_date: now,
        last_update_date: now
      };

      payments.push(paymentData);
    }

    const createdPayments = await Payment.insertMany(payments);

    // Enviar notificaciones normales para todos
    let notificationsSent = 0;
    for (const payment of createdPayments) {
      const result = await sendNotification(payment);
      if (result.success) notificationsSent++;
    }

    // Para el 5to pago (índice 4), enviar una segunda notificación con is_force: true
    if (createdPayments[4]) {
      const duplicateResult = await sendNotificationWithCustomAttributes(createdPayments[4], {
        allow_commerce_pan_token: 'true',
        from_batch: 'false',
        is_force: 'true'
      });
      if (duplicateResult.success) notificationsSent++;
    }

    res.json({
      success: true,
      created: createdPayments.length,
      notificationsSent,
      duplicatePaymentId: createdPayments[4]?.id || null,
      data: createdPayments.map(p => p.toPaymentJSON ? p.toPaymentJSON() : p)
    });
  } catch (error) {
    console.error('Error al crear pagos con duplicados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear pagos con duplicados',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
