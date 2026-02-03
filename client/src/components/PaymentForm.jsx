import { useState } from 'react'
import { createPayment } from '../services/api'

const initialFormData = {
  merchant: {
    id: 'MERCHANT-001',
    name: 'Mi Tienda Online',
    email: 'pagos@mitienda.com',
    notificationUrl: 'https://comerciowebhook.onrender.com/webhook'
  },
  amount: '',
  currency: 'ARS',
  payer: {
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    documentType: 'DNI',
    documentNumber: '12345678'
  },
  paymentMethod: {
    type: 'credit_card',
    brand: 'visa',
    lastFourDigits: '4242'
  },
  externalReference: 'ORDER-12345',
  description: 'Compra en Mi Tienda Online',
  sqsAttributes: {
    allow_commerce_pan_token: 'true',
    from_batch: 'false',
    is_force: 'false'
  }
}

function PaymentForm({ onSuccess }) {
  const [formData, setFormData] = useState(initialFormData)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      }
      
      const response = await createPayment(payload)
      setResult(response.data)
      
      if (response.success) {
        onSuccess?.()
      }
    } catch (error) {
      setResult({
        error: true,
        message: error.message || 'Error al procesar el pago'
      })
    } finally {
      setLoading(false)
    }
  }

  const closeResult = () => {
    setResult(null)
    if (result && !result.error && result.status === 'approved') {
      setFormData(initialFormData)
    }
  }

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS'
    }).format(amount)
  }

  return (
    <>
      <div className="card">
        <h2 className="card-title">
          <span>💳</span> Procesar Nuevo Pago
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Datos del Comercio */}
          <div className="form-section">
            <h3 className="form-section-title">Datos del Comercio</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>ID del Comercio</label>
                <input
                  type="text"
                  value={formData.merchant.id}
                  onChange={(e) => handleChange('merchant', 'id', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre del Comercio</label>
                <input
                  type="text"
                  value={formData.merchant.name}
                  onChange={(e) => handleChange('merchant', 'name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email del Comercio</label>
                <input
                  type="email"
                  value={formData.merchant.email}
                  onChange={(e) => handleChange('merchant', 'email', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL de Notificación</label>
                <input
                  type="url"
                  value={formData.merchant.notificationUrl}
                  onChange={(e) => handleChange('merchant', 'notificationUrl', e.target.value)}
                  placeholder="https://comerciowebhook.onrender.com/webhook"
                />
              </div>
            </div>
          </div>

          {/* Datos del Pago */}
          <div className="form-section">
            <h3 className="form-section-title">Datos del Pago</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange(null, 'amount', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Moneda</label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange(null, 'currency', e.target.value)}
                >
                  <option value="ARS">ARS - Peso Argentino</option>
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="BRL">BRL - Real</option>
                </select>
              </div>
              <div className="form-group">
                <label>Referencia Externa</label>
                <input
                  type="text"
                  value={formData.externalReference}
                  onChange={(e) => handleChange(null, 'externalReference', e.target.value)}
                  placeholder="ORDER-12345"
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange(null, 'description', e.target.value)}
                  placeholder="Descripción del pago"
                />
              </div>
            </div>
          </div>

          {/* Datos del Pagador */}
          <div className="form-section">
            <h3 className="form-section-title">Datos del Pagador</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={formData.payer.name}
                  onChange={(e) => handleChange('payer', 'name', e.target.value)}
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.payer.email}
                  onChange={(e) => handleChange('payer', 'email', e.target.value)}
                  placeholder="juan@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo de Documento</label>
                <select
                  value={formData.payer.documentType}
                  onChange={(e) => handleChange('payer', 'documentType', e.target.value)}
                >
                  <option value="DNI">DNI</option>
                  <option value="CUIT">CUIT</option>
                  <option value="CUIL">CUIL</option>
                  <option value="PASSPORT">Pasaporte</option>
                </select>
              </div>
              <div className="form-group">
                <label>Número de Documento</label>
                <input
                  type="text"
                  value={formData.payer.documentNumber}
                  onChange={(e) => handleChange('payer', 'documentNumber', e.target.value)}
                  placeholder="12345678"
                  required
                />
              </div>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="form-section">
            <h3 className="form-section-title">Método de Pago</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formData.paymentMethod.type}
                  onChange={(e) => handleChange('paymentMethod', 'type', e.target.value)}
                >
                  <option value="credit_card">Tarjeta de Crédito</option>
                  <option value="debit_card">Tarjeta de Débito</option>
                  <option value="bank_transfer">Transferencia Bancaria</option>
                  <option value="cash">Efectivo</option>
                </select>
              </div>
              <div className="form-group">
                <label>Marca</label>
                <select
                  value={formData.paymentMethod.brand}
                  onChange={(e) => handleChange('paymentMethod', 'brand', e.target.value)}
                >
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">American Express</option>
                  <option value="cabal">Cabal</option>
                </select>
              </div>
              <div className="form-group">
                <label>Últimos 4 dígitos</label>
                <input
                  type="text"
                  maxLength="4"
                  value={formData.paymentMethod.lastFourDigits}
                  onChange={(e) => handleChange('paymentMethod', 'lastFourDigits', e.target.value)}
                  placeholder="4242"
                />
              </div>
            </div>
          </div>

          {/* Atributos SQS */}
          <div className="form-section">
            <h3 className="form-section-title">⚙️ Atributos SQS (Notificaciones)</h3>
            <div className="form-grid">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.sqsAttributes.allow_commerce_pan_token === 'true'}
                    onChange={(e) => handleChange('sqsAttributes', 'allow_commerce_pan_token', e.target.checked ? 'true' : 'false')}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  <span>Allow Commerce PAN Token</span>
                </label>
                <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginLeft: '1.5rem' }}>
                  Permite el uso de tokens PAN del comercio
                </small>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.sqsAttributes.from_batch === 'true'}
                    onChange={(e) => handleChange('sqsAttributes', 'from_batch', e.target.checked ? 'true' : 'false')}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  <span>From Batch</span>
                </label>
                <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginLeft: '1.5rem' }}>
                  Indica si el pago proviene de un lote
                </small>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.sqsAttributes.is_force === 'true'}
                    onChange={(e) => handleChange('sqsAttributes', 'is_force', e.target.checked ? 'true' : 'false')}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  <span>Is Force</span>
                </label>
                <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginLeft: '1.5rem' }}>
                  Fuerza el procesamiento del pago
                </small>
              </div>
            </div>
          </div>

          <div className="form-section" style={{ marginBottom: 0 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                  Procesando...
                </>
              ) : (
                <>
                  <span>💳</span> Procesar Pago
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Result Modal */}
      {result && (
        <div className="result-overlay" onClick={closeResult}>
          <div className="result-modal" onClick={(e) => e.stopPropagation()}>
            {result.error ? (
              <>
                <div className="result-icon">❌</div>
                <h3 className="result-title error">Error</h3>
                <p className="result-message">{result.message}</p>
              </>
            ) : (
              <>
                <div className="result-icon">
                  {result.status === 'approved' ? '✅' : '❌'}
                </div>
                <h3 className={`result-title ${result.status === 'approved' ? 'success' : 'error'}`}>
                  {result.status === 'approved' ? 'Pago Aprobado' : 'Pago Rechazado'}
                </h3>
                <p className="result-message">{result.responseMessage}</p>
                <div className="result-transaction">
                  {result.transactionId}
                </div>
                {result.panToken && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                    PAN Token: <code>{result.panToken}</code>
                  </p>
                )}
                <div className="result-amount">
                  {formatCurrency(result.amount, result.currency)}
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                  Código: {result.responseCode}
                </p>
                {result.sqsSent && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--success)', marginTop: '0.5rem' }}>
                    ✅ Mensaje enviado a SQS
                  </p>
                )}
              </>
            )}
            <button className="btn btn-secondary" onClick={closeResult} style={{ marginTop: '1.5rem' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default PaymentForm
