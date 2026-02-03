const API_URL = import.meta.env.VITE_API_URL || '/api'

export const createPayment = async (paymentData) => {
  const response = await fetch(`${API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al crear el pago')
  }
  
  return response.json()
}

export const getPayments = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString()
  const response = await fetch(`${API_URL}/payments?${queryString}`)
  
  if (!response.ok) {
    throw new Error('Error al obtener los pagos')
  }
  
  return response.json()
}

export const getPayment = async (transactionId) => {
  const response = await fetch(`${API_URL}/payments/${transactionId}`)
  
  if (!response.ok) {
    throw new Error('Error al obtener el pago')
  }
  
  return response.json()
}

export const getPendingNotifications = async (limit = 100) => {
  const response = await fetch(`${API_URL}/payments/pending-notifications?limit=${limit}`)
  
  if (!response.ok) {
    throw new Error('Error al obtener notificaciones pendientes')
  }
  
  return response.json()
}

export const markAsNotified = async (transactionId) => {
  const response = await fetch(`${API_URL}/payments/${transactionId}/notified`, {
    method: 'PATCH'
  })
  
  if (!response.ok) {
    throw new Error('Error al marcar como notificado')
  }
  
  return response.json()
}

export const refundPayment = async (transactionId) => {
  const response = await fetch(`${API_URL}/payments/${transactionId}/refund`, {
    method: 'POST'
  })
  
  if (!response.ok) {
    throw new Error('Error al reembolsar el pago')
  }
  
  return response.json()
}
