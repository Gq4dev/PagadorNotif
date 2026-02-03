import { useState, useEffect } from 'react'
import { getPayments, createBulkTestPayments } from '../services/api'

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    totalAmount: 0,
    pendingNotifications: 0
  })
  const [recentPayments, setRecentPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  const [bulkError, setBulkError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch all payments for stats
      const [allPayments, approvedPayments, rejectedPayments, pendingPayments] = await Promise.all([
        getPayments({ limit: 1000 }),
        getPayments({ status: 'approved', limit: 1000 }),
        getPayments({ status: 'rejected', limit: 1000 }),
        getPayments({ notificationSent: 'false', limit: 1000 })
      ])

      const totalAmount = approvedPayments.data.reduce((sum, p) => sum + p.amount, 0)

      setStats({
        total: allPayments.pagination.total,
        approved: approvedPayments.pagination.total,
        rejected: rejectedPayments.pagination.total,
        pending: pendingPayments.data.filter(p => p.status === 'pending').length,
        totalAmount,
        pendingNotifications: pendingPayments.pagination.total
      })

      setRecentPayments(allPayments.data.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const runBulkTest = async () => {
    setBulkLoading(true)
    setBulkError(null)
    setBulkResult(null)
    try {
      const res = await createBulkTestPayments(25)
      setBulkResult(res.data)
      fetchDashboardData()
    } catch (err) {
      setBulkError(err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { class: 'status-approved', icon: '✅', label: 'Aprobado' },
      rejected: { class: 'status-rejected', icon: '❌', label: 'Rechazado' },
      pending: { class: 'status-pending', icon: '⏳', label: 'Pendiente' },
      refunded: { class: 'status-refunded', icon: '↩️', label: 'Reembolsado' }
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Transacciones</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.approved}</div>
          <div className="stat-label">Aprobadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.rejected}</div>
          <div className="stat-label">Rechazadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pendingNotifications}</div>
          <div className="stat-label">Pendientes Notificar</div>
        </div>
      </div>

      {/* Total Amount */}
      <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          TOTAL RECAUDADO (APROBADOS)
        </h3>
        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success)' }}>
          {formatCurrency(stats.totalAmount)}
        </div>
      </div>

      {/* Success Rate */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">
          <span>📈</span> Tasa de Aprobación
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, background: 'var(--gray-200)', borderRadius: '9999px', height: '12px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${stats.total > 0 ? (stats.approved / stats.total * 100) : 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--success) 0%, #34d399 100%)',
                transition: 'width 0.5s ease'
              }}
            />
          </div>
          <span style={{ fontWeight: '600', fontSize: '1.25rem' }}>
            {stats.total > 0 ? (stats.approved / stats.total * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>

      {/* Tarea: Enviar 25 pagos de prueba a AWS */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">
          <span>🧪</span> Probar servicio AWS
        </h3>
        <p style={{ color: 'var(--gray-600)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Crea 25 pagos de prueba de una vez. Los aprobados envían notificación a AWS (Lambda/SQS).
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={runBulkTest}
          disabled={bulkLoading}
        >
          {bulkLoading ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
              Creando 25 pagos...
            </>
          ) : (
            <>📤 Enviar 25 pagos de prueba a AWS</>
          )}
        </button>
        {bulkError && (
          <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>❌ {bulkError}</p>
        )}
        {bulkResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '8px', fontSize: '0.9rem' }}>
            <strong>✅ Resultado:</strong> {bulkResult.total} pagos creados · {bulkResult.approved} aprobados · {bulkResult.rejected} rechazados · <strong>{bulkResult.notificationsSent} notificaciones enviadas a AWS</strong>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 className="card-title">
          <span>🕐</span> Últimas Transacciones
        </h3>
        {recentPayments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>No hay transacciones aún</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Comercio</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => (
                  <tr key={payment.transactionId}>
                    <td>
                      <code style={{ fontSize: '0.7rem' }}>
                        {payment.transactionId.substring(0, 20)}...
                      </code>
                    </td>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>{payment.merchant.name}</td>
                    <td><strong>{formatCurrency(payment.amount)}</strong></td>
                    <td>{getStatusBadge(payment.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
