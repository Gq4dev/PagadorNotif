import { useState } from 'react'
import { createPayment } from '../services/api'

const initialFormData = {
  type: 'debit',
  validation: false,
  review: false,
  collector_id: '999',
  collector_detail: {
    name: 'PRUEBA'
  },
  notification_url: 'https://comerciowebhook.onrender.com/webhook',
  form_url: null,
  amount: '',
  currency_id: 'ARS',
  external_reference: 'ORDER-12345',
  concept_id: 'prueba',
  concept_description: 'Concepto de prueba',
  media_payment_id: 9,
  media_payment_detail: 'VISA CREDIT',
  last_four_digits: '0010',
  first_six_digits: '450799',
  installments: 1,
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
      const amount = parseFloat(formData.amount)
      
      // Transformar a la nueva estructura
      const payload = {
        type: formData.type,
        validation: formData.validation,
        review: formData.review,
        collector_id: formData.collector_id,
        collector_detail: formData.collector_detail,
        notification_url: formData.notification_url || null,
        form_url: formData.form_url || null,
        details: [{
          amount: amount,
          external_reference: formData.external_reference || null,
          concept_id: formData.concept_id || 'prueba',
          concept_description: formData.concept_description || 'Concepto de prueba'
        }],
        currency_id: formData.currency_id,
        payment_methods: [{
          amount: amount,
          media_payment_id: formData.media_payment_id || 9,
          media_payment_detail: formData.media_payment_detail || 'VISA CREDIT',
          last_four_digits: formData.last_four_digits || null,
          first_six_digits: formData.first_six_digits || '450799',
          installments: formData.installments || 1,
          payment_method_id: 0
        }],
        final_amount: amount,
        sqsAttributes: formData.sqsAttributes
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
          {/* Datos del Colector */}
          <div className="form-section">
            <h3 className="form-section-title">Datos del Colector</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>ID del Colector</label>
                <input
                  type="text"
                  value={formData.collector_id}
                  onChange={(e) => handleChange(null, 'collector_id', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre del Colector</label>
                <input
                  type="text"
                  value={formData.collector_detail.name}
                  onChange={(e) => handleChange('collector_detail', 'name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL de Notificación</label>
                <input
                  type="url"
                  value={formData.notification_url || ''}
                  onChange={(e) => handleChange(null, 'notification_url', e.target.value)}
                  placeholder="https://comerciowebhook.onrender.com/webhook"
                />
              </div>
              <div className="form-group">
                <label>Tipo de Pago</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange(null, 'type', e.target.value)}
                >
                  <option value="debit">Débito</option>
                  <option value="credit">Crédito</option>
                  <option value="cash">Efectivo</option>
                  <option value="bank_transfer">Transferencia Bancaria</option>
                </select>
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
                  value={formData.currency_id}
                  onChange={(e) => handleChange(null, 'currency_id', e.target.value)}
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
                  value={formData.external_reference}
                  onChange={(e) => handleChange(null, 'external_reference', e.target.value)}
                  placeholder="ORDER-12345"
                />
              </div>
              <div className="form-group">
                <label>ID de Concepto</label>
                <input
                  type="text"
                  value={formData.concept_id}
                  onChange={(e) => handleChange(null, 'concept_id', e.target.value)}
                  placeholder="prueba"
                />
              </div>
              <div className="form-group">
                <label>Descripción del Concepto</label>
                <input
                  type="text"
                  value={formData.concept_description}
                  onChange={(e) => handleChange(null, 'concept_description', e.target.value)}
                  placeholder="Concepto de prueba"
                />
              </div>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="form-section">
            <h3 className="form-section-title">Método de Pago</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>ID de Medio de Pago</label>
                <input
                  type="number"
                  value={formData.media_payment_id}
                  onChange={(e) => handleChange(null, 'media_payment_id', parseInt(e.target.value))}
                  placeholder="9"
                />
              </div>
              <div className="form-group">
                <label>Detalle del Medio de Pago</label>
                <input
                  type="text"
                  value={formData.media_payment_detail}
                  onChange={(e) => handleChange(null, 'media_payment_detail', e.target.value)}
                  placeholder="VISA CREDIT"
                />
              </div>
              <div className="form-group">
                <label>Últimos 4 dígitos</label>
                <input
                  type="text"
                  maxLength="4"
                  value={formData.last_four_digits}
                  onChange={(e) => handleChange(null, 'last_four_digits', e.target.value)}
                  placeholder="0010"
                />
              </div>
              <div className="form-group">
                <label>Primeros 6 dígitos</label>
                <input
                  type="text"
                  maxLength="6"
                  value={formData.first_six_digits}
                  onChange={(e) => handleChange(null, 'first_six_digits', e.target.value)}
                  placeholder="450799"
                />
              </div>
              <div className="form-group">
                <label>Cuotas</label>
                <input
                  type="number"
                  min="1"
                  value={formData.installments}
                  onChange={(e) => handleChange(null, 'installments', parseInt(e.target.value))}
                  placeholder="1"
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
                <div className="result-icon" style={result.status === 'pending' ? { filter: 'hue-rotate(0deg) saturate(1.5)' } : {}}>
                  {result.status === 'approved' ? '✅' : result.status === 'pending' ? '⚠️' : '❌'}
                </div>
                <h3 className={`result-title ${
                  result.status === 'approved' ? 'success' :
                  result.status === 'pending' ? 'pending' : 'error'
                }`}>
                  {result.status === 'approved' ? 'Pago Aprobado' : result.status === 'pending' ? 'En proceso' : 'Pago Rechazado'}
                </h3>
                <p className="result-message">{result.responseMessage}</p>
                <div className="result-transaction">
                  {result.external_transaction_id || result.id}
                </div>
                {result.payment_methods?.[0]?.panToken && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                    PAN Token: <code>{result.payment_methods[0].panToken}</code>
                  </p>
                )}
                <div className="result-amount">
                  {formatCurrency(result.final_amount, result.currency_id)}
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                  {result.status_detail || `Estado: ${result.status}`}
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
