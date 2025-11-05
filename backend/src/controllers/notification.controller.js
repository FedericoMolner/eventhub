// backend/src/controllers/notifications.controller.js
const { Notification, User, Event } = require('../models');

class NotificationsController {
  async getMyNotifications(req, res) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      const userId = req.user.id;
      const where = { recipientId: userId };

      if (unreadOnly === 'true') {
        where.isRead = false;
      }

      const { count, rows } = await Notification.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          },
          {
            model: Event,
            as: 'relatedEvent',
            attributes: ['id', 'title', 'date']
          }
        ],
        offset: (page - 1) * limit,
        limit: parseInt(limit),
        order: [['createdAt', 'DESC']]
      });

      const unreadCount = await Notification.countUnread(userId);

      res.json({
        notifications: rows,
        total: count,
        unreadCount,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const { notificationIds } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({ error: 'IDs notifiche non validi' });
      }

      await Notification.markAsRead(userId, notificationIds);

      res.json({ message: 'Notifiche segnate come lette' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { recipientId: userId, isRead: false } }
      );

      res.json({ message: 'Tutte le notifiche segnate come lette' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { id: notificationId, recipientId: userId }
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notifica non trovata' });
      }

      await notification.destroy();

      res.json({ message: 'Notifica eliminata' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await Notification.countUnread(userId);

      res.json({ unreadCount: count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new NotificationsController();