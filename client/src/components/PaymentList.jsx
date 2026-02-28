import { useState, useEffect } from 'react'
import { getPayments, resendNotification, updatePaymentStatus } from '../services/api'

function ResendModal({ payment, onClose, onSuccess }) {
  const [notifUrl, setNotifUrl] = useState(payment.notification_url || '')
  const [isForce, setIsForce] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await resendNotification(
        payment.external_transaction_id || payment.id,
        { notification_url: notifUrl, is_force: isForce }
      )
      setResult({ success: true, message: res.message || 'Notificación reenviada' })
      onSuccess()
    } catch (err) {
      setResult({ success: false, message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="result-overlay" onClick={onClose}>
      <div className="resend-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="resend-modal-title">Reenviar Notificación</h3>
        <p className="resend-modal-id">
          <code>{payment.external_transaction_id || payment.id}</code>
        </p>

        {result ? (
          <div className={`resend-result ${result.success ? 'resend-result-ok' : 'resend-result-err'}`}>
            <span>{result.success ? '✅' : '❌'} {result.message}</span>
            <button className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }} onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>URL de notificación</label>
              <input
                type="url"
                value={notifUrl}
                onChange={(e) => setNotifUrl(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%' }}
              />
              <small style={{ color: 'var(--gray-500)' }}>
                Dejá vacío para usar la URL original del pago
              </small>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="checkbox"
                id="isForce"
                checked={isForce}
                onChange={(e) => setIsForce(e.target.checked)}
              />
              <label htmlFor="isForce" style={{ fontSize: '0.875rem', color: 'var(--gray-700)', margin: 0 }}>
                <strong>is_force = true</strong> (forzar reenvío ignorando deduplicación)
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Enviando...' : '🚀 Reenviar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

const STATUSES = [
  { value: 'approved', label: '✅ Aprobado' },
  { value: 'rejected', label: '❌ Rechazado' },
  { value: 'pending',  label: '⏳ En proceso' },
  { value: 'refunded', label: '↩️ Reembolsado' },
  { value: 'cancelled',label: '🚫 Cancelado' },
]

function ChangeStatusModal({ payment, onClose, onSuccess }) {
  const [status, setStatus] = useState(payment.status)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await updatePaymentStatus(payment.external_transaction_id || payment.id, status)
      setResult({ success: true, previous: res.previous_status, current: res.data.status })
      onSuccess()
    } catch (err) {
      setResult({ success: false, message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="result-overlay" onClick={onClose}>
      <div className="resend-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="resend-modal-title">Cambiar Estado</h3>
        <p className="resend-modal-id">
          <code>{payment.external_transaction_id || payment.id}</code>
        </p>

        {result ? (
          <div className={`resend-result ${result.success ? 'resend-result-ok' : 'resend-result-err'}`}>
            {result.success
              ? <span>✅ Estado cambiado: <strong>{result.previous}</strong> → <strong>{result.current}</strong></span>
              : <span>❌ {result.message}</span>
            }
            <button className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }} onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Nuevo estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%' }}
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading || status === payment.status}>
                {loading ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function PaymentList() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({
    status: '',
    collectorId: '',
    page: 1
  })
  const [resendTarget, setResendTarget] = useState(null)
  const [changeStatusTarget, setChangeStatusTarget] = useState(null)

  useEffect(() => {
    fetchPayments()
  }, [filters])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = {
        skip: (filters.page - 1) * 10,
        limit: 10
      }
      if (filters.status) params.status = filters.status
      if (filters.collectorId) params.collector_id = filters.collectorId

      const response = await getPayments(params)
      setPayments(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1
    }))
  }

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { class: 'status-approved', icon: '✅', label: 'Aprobado' },
      rejected: { class: 'status-rejected', icon: '❌', label: 'Rechazado' },
      pending: { class: 'status-pending', icon: '⏳', label: 'En proceso' },
      refunded: { class: 'status-refunded', icon: '↩️', label: 'Reembolsado' },
      cancelled: { class: 'status-refunded', icon: '🚫', label: 'Cancelado' }
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.label}
      </span>
    )
  }

  return (
    <div className="card">
      <h2 className="card-title">
        <span>📋</span> Transacciones
      </h2>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
          <option value="pending">En proceso</option>
          <option value="refunded">Reembolsados</option>
        </select>
        <input
          type="text"
          placeholder="ID Colector..."
          value={filters.collectorId}
          onChange={(e) => handleFilterChange('collectorId', e.target.value)}
        />
        <button className="btn btn-secondary" onClick={fetchPayments}>
          🔄 Actualizar
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>No hay transacciones para mostrar</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID Transacción</th>
                  <th>Fecha</th>
                  <th>Colector</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Notificado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id || payment.external_transaction_id}>
                    <td>
                      <code style={{ fontSize: '0.75rem' }}>{payment.external_transaction_id || payment.id}</code>
                    </td>
                    <td>{formatDate(payment.request_date || payment.createdAt)}</td>
                    <td>
                      <strong>{payment.collector_detail?.name || 'N/A'}</strong>
                      <br />
                      <small style={{ color: 'var(--gray-500)' }}>{payment.collector_id}</small>
                    </td>
                    <td>
                      <strong>{formatCurrency(payment.final_amount, payment.currency_id)}</strong>
                    </td>
                    <td>{getStatusBadge(payment.status)}</td>
                    <td>
                      {payment.notificationSent ? (
                        <span style={{ color: 'var(--success)' }}>✅ Sí</span>
                      ) : (
                        <span style={{ color: 'var(--warning)' }}>⏳ No</span>
                      )}
                    </td>
                    <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn-resend"
                        onClick={() => setResendTarget(payment)}
                        title="Reenviar notificación"
                      >
                        🔁 Reenviar
                      </button>
                      <button
                        className="btn-resend"
                        onClick={() => setChangeStatusTarget(payment)}
                        title="Cambiar estado"
                      >
                        ✏️ Estado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              ← Anterior
            </button>
            <span>
              Página {filters.page} de {pagination.pages} ({pagination.total} registros)
            </span>
            <button
              disabled={filters.page >= pagination.pages}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}

      {resendTarget && (
        <ResendModal
          payment={resendTarget}
          onClose={() => setResendTarget(null)}
          onSuccess={() => {
            fetchPayments()
          }}
        />
      )}

      {changeStatusTarget && (
        <ChangeStatusModal
          payment={changeStatusTarget}
          onClose={() => setChangeStatusTarget(null)}
          onSuccess={() => {
            setChangeStatusTarget(null)
            fetchPayments()
          }}
        />
      )}
    </div>
  )
}

export default PaymentList
