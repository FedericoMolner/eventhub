// backend/src/controllers/admin.controller.js
const { User, Event, Report, Participant, sequelize } = require('../models');
const { Op } = require('sequelize');

class AdminController {
  // Dashboard statistiche
  async getDashboardStats(req, res) {
    try {
      const totalUsers = await User.count();
      const totalEvents = await Event.count();
      const activeEvents = await Event.count({
        where: {
          status: 'approved',
          date: { [Op.gte]: new Date() }
        }
      });
      const pendingReports = await Report.count({
        where: { status: 'pending' }
      });

      res.json({
        stats: {
          totalUsers,
          totalEvents,
          activeEvents,
          pendingReports
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Gestione utenti
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, search, role, isBlocked } = req.query;
      const where = {};

      if (search) {
        where[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (role) {
        where.role = role;
      }

      if (isBlocked !== undefined) {
        where.isBlocked = isBlocked === 'true';
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        offset: (page - 1) * limit,
        limit: parseInt(limit),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        users: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async blockUser(req, res) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      if (user.role === 'admin') {
        return res.status(403).json({ error: 'Non puoi bloccare un admin' });
      }

      await user.update({ isBlocked: true });

      res.json({
        message: 'Utente bloccato con successo',
        user
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async unblockUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      await user.update({ isBlocked: false });

      res.json({
        message: 'Utente sbloccato con successo',
        user
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Gestione eventi
  async moderateEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { status, reason } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status non valido' });
      }

      const event = await Event.findByPk(eventId, {
        include: [{ model: User, as: 'organizer' }]
      });

      if (!event) {
        return res.status(404).json({ error: 'Evento non trovato' });
      }

      await event.update({ status });

      // TODO: Invia notifica all'organizzatore

      res.json({
        message: `Evento ${status === 'approved' ? 'approvato' : 'rifiutato'}`,
        event
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteEvent(req, res) {
    try {
      const { eventId } = req.params;

      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento non trovato' });
      }

      await event.destroy();

      res.json({ message: 'Evento eliminato con successo' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new AdminController();