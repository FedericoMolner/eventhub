// backend/src/controllers/auth.controller.js
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const oauthService = require('../services/oauth.service');
const config = require('../config/server.config');

class AuthController {
    async getOAuthUrl(req, res) {
        try {
            const { provider } = req.params;
            const url = oauthService.generateAuthUrl(provider);
            res.json({ url });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async handleGoogleAuth(req, res) {
        try {
            const { token } = req.body;
            const userData = await oauthService.verifyGoogleToken(token);
            
            let user = await User.findOne({
                where: {
                    email: userData.email
                }
            });

            if (!user) {
                // Crea nuovo utente
                user = await User.create({
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    password: Math.random().toString(36).slice(-8), // Password casuale
                    avatar: userData.avatar,
                    isEmailVerified: userData.isEmailVerified,
                    provider: userData.provider,
                    providerId: userData.providerId
                });
            } else {
                // Aggiorna informazioni esistenti
                await user.update({
                    avatar: userData.avatar,
                    isEmailVerified: userData.isEmailVerified,
                    provider: userData.provider,
                    providerId: userData.providerId
                });
            }

            const accessToken = jwt.sign(
                { userId: user.id, role: user.role },
                config.jwt.accessSecret,
                { expiresIn: config.jwt.accessTokenExpiresIn }
            );

            const refreshToken = jwt.sign(
                { userId: user.id },
                config.jwt.refreshSecret,
                { expiresIn: config.jwt.refreshTokenExpiresIn }
            );

            res.json({
                user: user.toSafeJSON(),
                tokens: { accessToken, refreshToken }
            });
        } catch (error) {
            console.error('Google auth error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async handleGithubAuth(req, res) {
        try {
            const { code } = req.body;
            const userData = await oauthService.getGithubUserData(code);
            
            let user = await User.findOne({
                where: {
                    email: userData.email
                }
            });

            if (!user) {
                // Crea nuovo utente
                user = await User.create({
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    password: Math.random().toString(36).slice(-8), // Password casuale
                    avatar: userData.avatar,
                    isEmailVerified: userData.isEmailVerified,
                    provider: userData.provider,
                    providerId: userData.providerId
                });
            } else {
                // Aggiorna informazioni esistenti
                await user.update({
                    avatar: userData.avatar,
                    isEmailVerified: userData.isEmailVerified,
                    provider: userData.provider,
                    providerId: userData.providerId
                });
            }

            const accessToken = jwt.sign(
                { userId: user.id, role: user.role },
                config.jwt.accessSecret,
                { expiresIn: config.jwt.accessTokenExpiresIn }
            );

            const refreshToken = jwt.sign(
                { userId: user.id },
                config.jwt.refreshSecret,
                { expiresIn: config.jwt.refreshTokenExpiresIn }
            );

            res.json({
                user: user.toSafeJSON(),
                tokens: { accessToken, refreshToken }
            });
        } catch (error) {
            console.error('GitHub auth error:', error);
            res.status(400).json({ error: error.message });
        }
    }
  async register(req, res) {
    try {
      const { email, password, firstName, lastName } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email già registrata' });
      }

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role: 'user'
      });

      res.status(201).json({
        message: 'Registrazione completata con successo',
        user: user.toSafeJSON()
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.scope('withPassword').findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Credenziali non valide' });
      }

      if (user.isBlocked) {
        return res.status(403).json({ error: 'Account bloccato' });
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenziali non valide' });
      }

      await user.update({ lastLogin: new Date() });

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
        user: user.toSafeJSON(),
        tokens: { accessToken, refreshToken }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const user = await User.findByPk(req.user.id);
      res.json({ user: user.toSafeJSON() });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.scope('withPassword').findByPk(req.user.id);

      const isValidPassword = await user.comparePassword(currentPassword);
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

      if (!user || user.isBlocked) {
        return res.status(401).json({ error: 'Utente non valido' });
      }

      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        accessToken,
        user: user.toSafeJSON()
      });
    } catch (error) {
      res.status(401).json({ error: 'Refresh token non valido' });
    }
  }

  async logout(req, res) {
    res.json({ message: 'Logout effettuato con successo' });
  }
}

module.exports = new AuthController();