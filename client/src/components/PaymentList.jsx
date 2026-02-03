import { useState, useEffect } from 'react'
import { getPayments } from '../services/api'

function PaymentList() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({
    status: '',
    merchantId: '',
    page: 1
  })

  useEffect(() => {
    fetchPayments()
  }, [filters])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = {
        page: filters.page,
        limit: 10
      }
      if (filters.status) params.status = filters.status
      if (filters.merchantId) params.merchantId = filters.merchantId

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
      pending: { class: 'status-pending', icon: '⏳', label: 'Pendiente' },
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
          <option value="pending">Pendientes</option>
          <option value="refunded">Reembolsados</option>
        </select>
        <input
          type="text"
          placeholder="ID Comercio..."
          value={filters.merchantId}
          onChange={(e) => handleFilterChange('merchantId', e.target.value)}
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
                  <th>Comercio</th>
                  <th>Pagador</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Notificado</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.transactionId}>
                    <td>
                      <code style={{ fontSize: '0.75rem' }}>{payment.transactionId}</code>
                    </td>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>
                      <strong>{payment.merchant.name}</strong>
                      <br />
                      <small style={{ color: 'var(--gray-500)' }}>{payment.merchant.id}</small>
                    </td>
                    <td>
                      {payment.payer.name}
                      <br />
                      <small style={{ color: 'var(--gray-500)' }}>{payment.payer.email}</small>
                    </td>
                    <td>
                      <strong>{formatCurrency(payment.amount, payment.currency)}</strong>
                    </td>
                    <td>{getStatusBadge(payment.status)}</td>
                    <td>
                      {payment.notificationSent ? (
                        <span style={{ color: 'var(--success)' }}>✅ Sí</span>
                      ) : (
                        <span style={{ color: 'var(--warning)' }}>⏳ No</span>
                      )}
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
              Página {pagination.page} de {pagination.pages} ({pagination.total} registros)
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
    </div>
  )
}

export default PaymentList
