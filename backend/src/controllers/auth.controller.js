const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthController {
    async register(req, res) {
        try {
            const { email, password, name } = req.body;

            // Verifica se l'utente esiste già
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email già registrata' });
            }

            // Crea il nuovo utente
            const user = await User.create({
                email,
                password, // La password viene hashata automaticamente tramite hook
                name,
                role: 'user' // Default role
            });

            // Genera i token
            const accessToken = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            const refreshToken = jwt.sign(
                { userId: user.id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
            );

            res.status(201).json({
                message: 'Registrazione completata con successo',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                tokens: { accessToken, refreshToken }
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Trova l'utente
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({ error: 'Credenziali non valide' });
            }

            // Verifica la password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Credenziali non valide' });
            }

            // Genera i token
            const accessToken = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            const refreshToken = jwt.sign(
                { userId: user.id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
            );

            res.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                tokens: { accessToken, refreshToken }
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getCurrentUser(req, res) {
        try {
            const user = await User.findByPk(req.user.id);
            res.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await User.findByPk(req.user.id);

            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Password attuale non valida' });
            }

            user.password = newPassword;
            await user.save();

            res.json({ message: 'Password aggiornata con successo' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return res.status(401).json({ error: 'Refresh token non fornito' });
            }

            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await User.findByPk(decoded.userId);

            if (!user) {
                return res.status(401).json({ error: 'Utente non trovato' });
            }

            const accessToken = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.json({
                accessToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(401).json({ error: 'Refresh token non valido' });
        }
    }
}

module.exports = new AuthController();