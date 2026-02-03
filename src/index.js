require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Conectar a MongoDB Atlas
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Rutas
app.use('/api/payments', paymentRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Pagador Simulator'
  });
});

// Ruta de API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Pagador Simulator API',
    version: '1.0.0',
    description: 'Simulador de plataforma de pago',
    endpoints: {
      'POST /api/payments': 'Crear un nuevo pago',
      'GET /api/payments': 'Listar pagos con filtros',
      'GET /api/payments/pending-notifications': 'Obtener pagos pendientes de notificación',
      'GET /api/payments/:transactionId': 'Obtener un pago específico',
      'PATCH /api/payments/:transactionId/notified': 'Marcar pago como notificado',
      'PATCH /api/payments/bulk/notified': 'Marcar múltiples pagos como notificados',
      'POST /api/payments/:transactionId/refund': 'Reembolsar un pago'
    }
  });
});

// Servir frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Cualquier ruta que no sea /api, servir el frontend
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    }
  });
}

// Manejo de rutas no encontradas (solo para /api)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏦  PAGADOR SIMULATOR                                   ║
║                                                           ║
║   Servidor iniciado en: http://localhost:${PORT}            ║
║   Ambiente: ${process.env.NODE_ENV || 'development'}                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
