// server.config.js

// Assumendo l'uso di 'dotenv' per caricare le variabili d'ambiente dal file .env
// require('dotenv').config();

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Configurazione completa del server. Le variabili sensibili sono caricate da process.env.
 */
module.exports = {

  // ===================================
  // 1. Configurazioni di base del server
  // ===================================
  server: {
    // Porta su cui il server ascolterà (dal .env o default 3000)
    port: parseInt(process.env.PORT, 10) || 3000,
    // Ambiente di esecuzione (development, production, testing)
    env: process.env.NODE_ENV || 'development',
    // Flag booleano per l'ambiente di sviluppo
    isDev: isDevelopment,
  },

  // ==========================
  // 2. Configurazioni CORS
  // ==========================
  cors: {
    // URL del frontend per gestire le richieste cross-origin.
    // In produzione, questo dovrebbe essere l'URL esatto del frontend.
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173', 
    options: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true, // Permette l'invio di cookie
    }
  },

  // ====================================
  // 3. Configurazioni del database (PostgreSQL)
  // ====================================
  database: {
    client: 'mysql', // Specifico per MySQL

    // Parametri necessari per la connessione MySQL
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      dialect: 'mysql'
    },

    // Configurazioni del pool di connessioni per ottimizzare le prestazioni
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2, // Connessioni minime
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10, // Connessioni massime
      acquireTimeoutMillis: 30000, // Tempo massimo per acquisire una connessione (30s)
      idleTimeoutMillis: 60000, // Rilascio di una connessione inutilizzata dopo 60s
    },
  },

  // ==========================
  // 4. Configurazioni JWT
  // ==========================
  jwt: {
    // Segreti (OBBLIGATORIO cambiarli per la produzione)
    accessSecret: process.env.JWT_ACCESS_SECRET || 'SECRET_PER_ACCESSO_PREDEFINITO_USARE_ENV',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'SECRET_PER_REFRESH_PREDEFINITO_USARE_ENV',

    // Tempi di scadenza (espressi in stringa es: '15m', '7d', '24h')
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m', 
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // ==================================
  // 5. Configurazioni di sicurezza
  // ==================================
  security: {
    // Numero di round per il salt di bcrypt (10 è un buon compromesso tra sicurezza e velocità)
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,

    // Configurazioni per il rate limiting (es. per Express Rate Limit)
    rateLimit: {
      // Finestra temporale (15 minuti)
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, 
      // Numero massimo di richieste consentite per IP in windowMs (100 richieste)
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, 
      message: 'Too many requests from this IP, please try again after 15 minutes',
    },
  },

  // ============================
  // 6. Configurazioni di logging
  // ============================
  logging: {
    // Livello di logging generale (es. 'info', 'debug', 'warn', 'error')
    level: process.env.LOG_LEVEL || 'info',

    // Flag per il logging delle query SQL (attivo solo se l'ambiente è 'development')
    logSqlQueries: isDevelopment,
  },
};