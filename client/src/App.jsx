import { useState } from 'react'
import PaymentForm from './components/PaymentForm'
import PaymentList from './components/PaymentList'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('payment')
  const [refreshKey, setRefreshKey] = useState(0)

  const handlePaymentSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">💳</span>
            <h1>Pagador Simulator</h1>
          </div>
          <p className="subtitle">Plataforma de simulación de pagos</p>
        </div>
      </header>

      <nav className="nav">
        <button 
          className={`nav-btn ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveTab('payment')}
        >
          <span>💰</span> Nuevo Pago
        </button>
        <button 
          className={`nav-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <span>📋</span> Transacciones
        </button>
        <button 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span>📊</span> Dashboard
        </button>
      </nav>

      <main className="main">
        {activeTab === 'payment' && (
          <PaymentForm onSuccess={handlePaymentSuccess} />
        )}
        {activeTab === 'transactions' && (
          <PaymentList key={refreshKey} />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard key={refreshKey} />
        )}
      </main>

      <footer className="footer">
        <p>Pagador Simulator v1.0 - Simulador de plataforma de pago</p>
      </footer>
    </div>
  )
}

export default App
