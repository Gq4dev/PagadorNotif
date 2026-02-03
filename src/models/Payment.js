const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Identificador único de la transacción
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Información del comercio
  merchant: {
    id: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    notificationUrl: {
      type: String,
      default: null
    }
  },
  
  // Información del pago
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'ARS',
    enum: ['ARS', 'USD', 'EUR', 'BRL']
  },
  
  // Información del pagador
  payer: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    documentType: {
      type: String,
      default: 'DNI'
    },
    documentNumber: {
      type: String,
      required: true
    }
  },
  
  // Método de pago simulado
  paymentMethod: {
    type: {
      type: String,
      required: true,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'cash']
    },
    brand: {
      type: String,
      default: null
    },
    lastFourDigits: {
      type: String,
      default: null
    }
  },
  
  // Estado del pago
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Código de respuesta (para simulación)
  responseCode: {
    type: String,
    default: null
  },
  responseMessage: {
    type: String,
    default: null
  },
  
  // Referencia externa del comercio
  externalReference: {
    type: String,
    default: null
  },
  
  // Descripción del pago
  description: {
    type: String,
    default: null
  },
  
  // Flag para indicar si la notificación fue procesada
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationSentAt: {
    type: Date,
    default: null
  },
  
  // Metadata adicional
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índice compuesto para consultas frecuentes
paymentSchema.index({ 'merchant.id': 1, status: 1, createdAt: -1 });
paymentSchema.index({ notificationSent: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
