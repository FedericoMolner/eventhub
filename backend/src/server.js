// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rate-limit.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware di sicurezza
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging (solo in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', apiLimiter);

// Swagger Documentation
const swagger = require('./config/swagger');
app.use('/api-docs', swagger.serve, swagger.setup);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// Error handler
app.use(errorHandler);

// Test database connection e avvio server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connessione al database stabilita con successo.');
    
    // Sync models (solo in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Modelli sincronizzati con il database.');
    }
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server in esecuzione sulla porta ${PORT} in modalità ${process.env.NODE_ENV}`);
      console.log(`📍 API disponibile su http://localhost:${PORT}/api`);
    });

    // Inizializza Socket.IO
    const initializeSocket = require('./sockets');
    const io = initializeSocket(server);
    app.set('io', io); // Rende io disponibile in tutta l'applicazione
  } catch (error) {
    console.error('❌ Errore durante l\'avvio del server:', error);
    process.exit(1);
  }
}

startServer();

// Gestione graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM ricevuto. Chiusura server...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT ricevuto. Chiusura server...');
  await sequelize.close();
  process.exit(0);
});

module.exports = app;