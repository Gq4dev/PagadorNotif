import { useState, useEffect } from 'react'
import { getPayments, createBulkTestPayments, createBulkTestPaymentsApproved, createBulkTestWithDuplicates } from '../services/api'

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
  const [bulk1000Loading, setBulk1000Loading] = useState(false)
  const [bulk1000Result, setBulk1000Result] = useState(null)
  const [bulk1000Error, setBulk1000Error] = useState(null)
  const [bulk5000Loading, setBulk5000Loading] = useState(false)
  const [bulk5000Result, setBulk5000Result] = useState(null)
  const [bulk5000Error, setBulk5000Error] = useState(null)
  const [bulkApprovedLoading, setBulkApprovedLoading] = useState(false)
  const [bulkApprovedResult, setBulkApprovedResult] = useState(null)
  const [bulkApprovedError, setBulkApprovedError] = useState(null)
  const [bulkDuplicatesLoading, setBulkDuplicatesLoading] = useState(false)
  const [bulkDuplicatesResult, setBulkDuplicatesResult] = useState(null)
  const [bulkDuplicatesError, setBulkDuplicatesError] = useState(null)

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

  const runBulkTest1000 = async () => {
    setBulk1000Loading(true)
    setBulk1000Error(null)
    setBulk1000Result(null)
    try {
      const res = await createBulkTestPayments(1000, true, true) // allApproved=true, withoutPanToken=true
      setBulk1000Result(res.data)
      fetchDashboardData()
    } catch (err) {
      setBulk1000Error(err.message)
    } finally {
      setBulk1000Loading(false)
    }
  }

  const runBulkTest5000 = async () => {
    setBulk5000Loading(true)
    setBulk5000Error(null)
    setBulk5000Result(null)
    try {
      const res = await createBulkTestPayments(5000, true, true) // allApproved=true, withoutPanToken=true
      setBulk5000Result(res.data)
      fetchDashboardData()
    } catch (err) {
      setBulk5000Error(err.message)
    } finally {
      setBulk5000Loading(false)
    }
  }

  const runBulkTestApproved = async () => {
    setBulkApprovedLoading(true)
    setBulkApprovedError(null)
    setBulkApprovedResult(null)
    try {
      const res = await createBulkTestPaymentsApproved(50)
      setBulkApprovedResult(res.data)
      fetchDashboardData()
    } catch (err) {
      setBulkApprovedError(err.message)
    } finally {
      setBulkApprovedLoading(false)
    }
  }

  const runBulkTestDuplicates = async () => {
    setBulkDuplicatesLoading(true)
    setBulkDuplicatesError(null)
    setBulkDuplicatesResult(null)
    try {
      const res = await createBulkTestWithDuplicates()
      setBulkDuplicatesResult(res.data)
      fetchDashboardData()
    } catch (err) {
      setBulkDuplicatesError(err.message)
    } finally {
      setBulkDuplicatesLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { class: 'status-approved', icon: '✅', label: 'Aprobado' },
      rejected: { class: 'status-rejected', icon: '❌', label: 'Rechazado' },
      pending: { class: 'status-pending', icon: '⏳', label: 'En proceso' },
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

      {/* Tarea: Enviar 1000 pagos de prueba a AWS */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">
          <span>🧪</span> Probar servicio AWS - 1000 pagos
        </h3>
        <p style={{ color: 'var(--gray-600)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Crea 1000 pagos todos aprobados sin panToken. Todos envían notificación a AWS (Lambda/SQS).
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={runBulkTest1000}
          disabled={bulk1000Loading}
        >
          {bulk1000Loading ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
              Creando 1000 pagos...
            </>
          ) : (
            <>📤 Enviar 1000 pagos de prueba a AWS</>
          )}
        </button>
        {bulk1000Error && (
          <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>❌ {bulk1000Error}</p>
        )}
        {bulk1000Result && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '8px', fontSize: '0.9rem' }}>
            <strong>✅ Resultado:</strong> {bulk1000Result.total} pagos creados · {bulk1000Result.approved} aprobados · {bulk1000Result.rejected} rechazados · <strong>{bulk1000Result.notificationsSent} notificaciones enviadas a AWS</strong>
          </div>
        )}
      </div>

      {/* Tarea: Enviar 5000 pagos de prueba a AWS */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">
          <span>🚀</span> Probar servicio AWS - 5000 pagos
        </h3>
        <p style={{ color: 'var(--gray-600)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Crea 5000 pagos todos aprobados sin panToken. Todos envían notificación a AWS (Lambda/SQS).
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={runBulkTest5000}
          disabled={bulk5000Loading}
        >
          {bulk5000Loading ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
              Creando 5000 pagos...
            </>
          ) : (
            <>📤 Enviar 5000 pagos de prueba a AWS</>
          )}
        </button>
        {bulk5000Error && (
          <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>❌ {bulk5000Error}</p>
        )}
        {bulk5000Result && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '8px', fontSize: '0.9rem' }}>
            <strong>✅ Resultado:</strong> {bulk5000Result.total} pagos creados · {bulk5000Result.approved} aprobados · {bulk5000Result.rejected} rechazados · <strong>{bulk5000Result.notificationsSent} notificaciones enviadas a AWS</strong>
          </div>
        )}
      </div>

      {/* Tarea: 50 pagos todos aprobados, algunos con panToken otros sin */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">
          <span>✅</span> 50 pagos aprobados (con y sin panToken)
        </h3>
        <p style={{ color: 'var(--gray-600)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Crea 50 pagos todos aprobados. La mitad con token/panToken/commerceToken y la mitad sin. Todos envían notificación a AWS.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={runBulkTestApproved}
          disabled={bulkApprovedLoading}
        >
          {bulkApprovedLoading ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
              Creando 50 pagos aprobados...
            </>
          ) : (
            <>📤 Enviar 50 pagos aprobados a AWS</>
          )}
        </button>
        {bulkApprovedError && (
          <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>❌ {bulkApprovedError}</p>
        )}
        {bulkApprovedResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '8px', fontSize: '0.9rem' }}>
            <strong>✅ Resultado:</strong> {bulkApprovedResult.total} pagos creados · <strong>{bulkApprovedResult.withPanToken} con panToken</strong> · {bulkApprovedResult.withoutPanToken} sin panToken · <strong>{bulkApprovedResult.notificationsSent} notificaciones enviadas a AWS</strong>
          </div>
        )}
      </div>

      {/* Tarea: 10 pagos con 2 notificaciones duplicadas */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">
          <span>🔄</span> Prueba de duplicados - 10 pagos
        </h3>
        <p style={{ color: 'var(--gray-600)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Crea 10 pagos aprobados. El 5to pago se envía 2 veces a AWS (mismo payment_id): una normal y otra con <code>is_force: true</code>.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={runBulkTestDuplicates}
          disabled={bulkDuplicatesLoading}
        >
          {bulkDuplicatesLoading ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
              Creando 10 pagos con duplicado...
            </>
          ) : (
            <>🔄 Enviar 10 pagos (2 duplicados) a AWS</>
          )}
        </button>
        {bulkDuplicatesError && (
          <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>❌ {bulkDuplicatesError}</p>
        )}
        {bulkDuplicatesResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '8px', fontSize: '0.9rem' }}>
            <strong>✅ Resultado:</strong> {bulkDuplicatesResult.total} pagos creados · <strong>{bulkDuplicatesResult.notificationsSent} notificaciones enviadas</strong> (incluye {bulkDuplicatesResult.duplicates} duplicados: 1 normal + 1 con is_force=true) · Payment ID duplicado: <code style={{ fontSize: '0.8rem' }}>{bulkDuplicatesResult.duplicatePaymentId}</code>
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
