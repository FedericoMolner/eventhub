const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error('Token non fornito');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verifica scadenza token
        if (decoded.exp < Date.now() / 1000) {
            throw new Error('Token scaduto');
        }

        const user = await User.findByPk(decoded.userId);
        if (!user) {
            throw new Error('Utente non trovato');
        }

        // Aggiungi informazioni utente alla richiesta
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
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accesso non autorizzato' });
        }
        next();
    };
};

const isOwner = (model, paramId = 'id') => {
    return async (req, res, next) => {
        try {
            const resource = await model.findByPk(req.params[paramId]);
            
            if (!resource) {
                return res.status(404).json({ error: 'Risorsa non trovata' });
            }

            if (resource.userId !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Non autorizzato' });
            }

            req.resource = resource;
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = { auth, checkRole, isOwner };