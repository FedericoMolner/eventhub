require('dotenv').config();
const express = require('express');
const { Sequelize } = require('sequelize');
const cors = require('cors');
const config = require('./config/server.config');

// Inizializzazione dell'app Express
const app = express();

// Middleware di base
app.use(cors(config.cors.options));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inizializzazione della connessione al database
const sequelize = new Sequelize(
  config.database.connection.database,
  config.database.connection.user,
  config.database.connection.password,
  {
    host: config.database.connection.host,
    port: config.database.connection.port,
    dialect: 'mysql',
    logging: config.logging.logSqlQueries ? console.log : false,
    pool: config.database.pool
  }
);

// Test della connessione al database
async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connessione al database stabilita con successo.');
  } catch (error) {
    console.error('❌ Impossibile connettersi al database:', error);
    process.exit(1);
  }
}

// Rotta di base per verificare che il server funzioni
app.get('/', (req, res) => {
  res.json({ message: 'Benvenuto all\'API di EventHub!' });
});

// Gestione degli errori globale
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Si è verificato un errore interno del server'
  });
});

// Avvio del server
async function startServer() {
  try {
    await testDatabaseConnection();
    app.listen(config.server.port, () => {
      console.log(`🚀 Server in esecuzione sulla porta ${config.server.port} in modalità ${config.server.env}`);
    });
  } catch (error) {
    console.error('❌ Errore durante l\'avvio del server:', error);
    process.exit(1);
  }
}

startServer();