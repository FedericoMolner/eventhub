const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 5, // limite di 5 tentativi
    message: {
        error: 'Troppi tentativi di accesso. Riprova più tardi.'
    }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Troppe richieste. Riprova più tardi.'
    }
});

module.exports = { authLimiter, apiLimiter };