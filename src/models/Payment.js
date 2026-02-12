const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const paymentSchema = new mongoose.Schema({
  // Tipo de pago (debit, credit, etc.)
  type: {
    type: String,
    required: true,
    enum: ['debit', 'credit', 'cash', 'bank_transfer'],
    default: 'debit'
  },
  
  // Flags de validación y revisión
  validation: {
    type: Boolean,
    default: false
  },
  review: {
    type: Boolean,
    default: false
  },
  
  // ID único del pago (UUID)
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  
  // ID de transacción externa (UUID)
  external_transaction_id: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  
  // ID del colector/comercio
  collector_id: {
    type: String,
    required: true,
    index: true,
    default: '999'
  },
  
  // Detalle del colector
  collector_detail: {
    name: {
      type: String,
      required: true,
      default: 'PRUEBA'
    }
  },
  
  // URL de notificación
  notification_url: {
    type: String,
    default: null
  },
  
  // URL del formulario
  form_url: {
    type: String,
    default: null
  },
  
  // Detalles del pago (array)
  details: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    external_reference: {
      type: String,
      default: null
    },
    concept_id: {
      type: String,
      default: null
    },
    concept_description: {
      type: String,
      default: null
    }
  }],
  
  // Moneda
  currency_id: {
    type: String,
    required: true,
    default: 'ARS',
    enum: ['ARS', 'USD', 'EUR', 'BRL']
  },
  
  // Métodos de pago (array)
  payment_methods: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    media_payment_id: {
      type: Number,
      default: 9
    },
    media_payment_detail: {
      type: String,
      default: 'VISA CREDIT'
    },
    last_four_digits: {
      type: String,
      default: null
    },
    first_six_digits: {
      type: String,
      default: null
    },
    installments: {
      type: Number,
      default: 1
    },
    authorization_code: {
      type: String,
      default: null
    },
    gateway: {
      establishment_number: {
        type: String,
        default: 'PRUEBA'
      },
      transaction_id: {
        type: String,
        default: null
      },
      batch_number: {
        type: String,
        default: null
      },
      ticket_number: {
        type: String,
        default: null
      },
      ppt_owner: {
        type: Boolean,
        default: false
      }
    },
    payment_method_id: {
      type: Number,
      default: 0
    },
    // Tokens adicionales para compatibilidad
    token: {
      type: String,
      default: null
    },
    tokenId: {
      type: String,
      default: null
    },
    panToken: {
      type: String,
      default: null
    },
    commerceToken: {
      type: String,
      default: null
    }
  }],
  
  // Monto final
  final_amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Estado del pago
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Detalle del estado
  status_detail: {
    type: String,
    default: null
  },
  
  // Fechas importantes
  request_date: {
    type: Date,
    default: Date.now
  },
  due_date: {
    type: Date,
    default: Date.now
  },
  last_due_date: {
    type: Date,
    default: Date.now
  },
  process_date: {
    type: Date,
    default: null
  },
  paid_date: {
    type: Date,
    default: null
  },
  accreditation_date: {
    type: Date,
    default: null
  },
  last_update_date: {
    type: Date,
    default: Date.now
  },
  
  // Metadata adicional
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Información de la fuente
  source: {
    id: {
      type: String,
      default: () => uuidv4()
    },
    name: {
      type: String,
      default: 'system-test'
    },
    type: {
      type: String,
      default: 'system'
    }
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
  
  // Atributos SQS para notificaciones
  sqsAttributes: {
    allow_commerce_pan_token: {
      type: String,
      default: 'true'
    },
    from_batch: {
      type: String,
      default: 'false'
    },
    is_force: {
      type: String,
      default: 'false'
    }
  },
  
  // Campos legacy para compatibilidad (mantener por ahora)
  transactionId: {
    type: String,
    default: function() {
      return this.external_transaction_id || uuidv4();
    }
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índices compuestos para consultas frecuentes
paymentSchema.index({ collector_id: 1, status: 1, createdAt: -1 });
paymentSchema.index({ notificationSent: 1, status: 1 });
paymentSchema.index({ id: 1 });
paymentSchema.index({ external_transaction_id: 1 });

// Función auxiliar para formatear fecha con timezone
const formatDateWithTimezone = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
  const minutes = (Math.abs(offset) % 60).toString().padStart(2, '0');
  const timezone = `${sign}${hours}${minutes}`;
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  const second = d.getSeconds().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${timezone}`;
};

// Método para convertir a formato JSON estándar (estructura final)
paymentSchema.methods.toPaymentJSON = function() {
  // Limpiar payment_methods para no incluir campos internos (token, tokenId, panToken, commerceToken)
  // a menos que estén presentes en el modelo final
  const cleanedPaymentMethods = this.payment_methods.map(pm => {
    const cleaned = {
      amount: pm.amount,
      media_payment_id: pm.media_payment_id,
      media_payment_detail: pm.media_payment_detail,
      last_four_digits: pm.last_four_digits,
      first_six_digits: pm.first_six_digits,
      installments: pm.installments,
      authorization_code: pm.authorization_code,
      gateway: pm.gateway,
      payment_method_id: pm.payment_method_id
    };
    // Solo incluir tokens si existen (para compatibilidad con el sistema actual)
    if (pm.token) cleaned.token = pm.token;
    if (pm.tokenId) cleaned.tokenId = pm.tokenId;
    if (pm.panToken) cleaned.panToken = pm.panToken;
    if (pm.commerceToken) cleaned.commerceToken = pm.commerceToken;
    return cleaned;
  });

  return {
    type: this.type,
    validation: this.validation,
    review: this.review,
    id: this.id,
    external_transaction_id: this.external_transaction_id,
    collector_id: this.collector_id,
    collector_detail: this.collector_detail,
    notification_url: this.notification_url,
    form_url: this.form_url,
    details: this.details,
    currency_id: this.currency_id,
    payment_methods: cleanedPaymentMethods,
    final_amount: this.final_amount,
    status: this.status,
    status_detail: this.status_detail,
    request_date: formatDateWithTimezone(this.request_date),
    due_date: formatDateWithTimezone(this.due_date),
    last_due_date: formatDateWithTimezone(this.last_due_date),
    process_date: formatDateWithTimezone(this.process_date),
    paid_date: formatDateWithTimezone(this.paid_date),
    accreditation_date: formatDateWithTimezone(this.accreditation_date),
    last_update_date: formatDateWithTimezone(this.last_update_date),
    metadata: this.metadata,
    source: this.source
  };
};

module.exports = mongoose.model('Payment', paymentSchema);
