// backend/src/controllers/reports.controller.js
const { Report, Event, User, Notification } = require('../models');

class ReportsController {
  // Utente segnala un evento
  async createReport(req, res) {
    try {
      const { eventId, reason, description } = req.body;
      const userId = req.user.id;

      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento non trovato' });
      }

      // Verifica che non abbia già segnalato
      const existingReport = await Report.findOne({
        where: { reporterId: userId, reportedEventId: eventId }
      });

      if (existingReport) {
        return res.status(400).json({ error: 'Hai già segnalato questo evento' });
      }

      const report = await Report.create({
        reporterId: userId,
        reportedEventId: eventId,
        reason,
        description,
        status: 'pending'
      });

      // Incrementa contatore segnalazioni evento
      await event.increment('reportCount');

      // Notifica admin
      const admins = await User.findAll({ where: { role: 'admin' } });
      for (const admin of admins) {
        await Notification.create({
          recipientId: admin.id,
          senderId: userId,
          type: 'event_reported',
          title: 'Nuova segnalazione',
          message: `L'evento "${event.title}" è stato segnalato`,
          relatedEventId: eventId,
          link: `/admin/reports/${report.id}`
        });
      }

      res.status(201).json({
        message: 'Segnalazione inviata con successo',
        report
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Admin: Ottieni tutte le segnalazioni
  async getAllReports(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const where = {};

      if (status) {
        where.status = status;
      }

      const { count, rows } = await Report.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Event,
            as: 'reportedEvent',
            attributes: ['id', 'title', 'organizerId', 'status'],
            include: [{
              model: User,
              as: 'organizer',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }]
          },
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        offset: (page - 1) * limit,
        limit: parseInt(limit),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        reports: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Admin: Revisiona segnalazione
  async reviewReport(req, res) {
    try {
      const { reportId } = req.params;
      const { status, adminNotes, action } = req.body;
      const adminId = req.user.id;

      const report = await Report.findByPk(reportId, {
        include: [{
          model: Event,
          as: 'reportedEvent',
          include: [{ model: User, as: 'organizer' }]
        }]
      });

      if (!report) {
        return res.status(404).json({ error: 'Segnalazione non trovata' });
      }

      await report.update({
        status,
        adminNotes,
        action,
        reviewedById: adminId,
        reviewedAt: new Date()
      });

      // Esegui azione se specificata
      if (action === 'event_removed') {
        await Event.update(
          { status: 'rejected' },
          { where: { id: report.reportedEventId } }
        );
      } else if (action === 'user_blocked') {
        await User.update(
          { isBlocked: true },
          { where: { id: report.reportedEvent.organizerId } }
        );
      }

      // Notifica organizzatore
      await Notification.create({
        recipientId: report.reportedEvent.organizerId,
        type: 'admin_action',
        title: 'Azione amministrativa',
        message: `Il tuo evento "${report.reportedEvent.title}" è stato revisionato`,
        relatedEventId: report.reportedEventId
      });

      res.json({
        message: 'Segnalazione revisionata',
        report
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Ottieni dettaglio segnalazione
  async getReportById(req, res) {
    try {
      const { reportId } = req.params;

      const report = await Report.findByPk(reportId, {
        include: [
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Event,
            as: 'reportedEvent',
            include: [{
              model: User,
              as: 'organizer',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }]
          },
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      if (!report) {
        return res.status(404).json({ error: 'Segnalazione non trovata' });
      }

      res.json({ report });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ReportsController();