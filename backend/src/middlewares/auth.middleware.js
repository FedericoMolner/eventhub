// backend/src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token non fornito' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Utente non trovato' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account bloccato' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token non valido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token scaduto' });
    }
    res.status(401).json({ error: 'Autenticazione fallita' });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non autenticato' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accesso non autorizzato' });
    }

    next();
  };
};

module.exports = { auth, checkRole };