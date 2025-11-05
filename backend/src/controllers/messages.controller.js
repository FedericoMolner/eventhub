// backend/src/controllers/messages.controller.js
const { Message, User, Event, Participant, MessageRead } = require('../models');

class MessagesController {
  async getEventMessages(req, res) {
    try {
      const { eventId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const userId = req.user.id;

      // Verifica che l'utente sia partecipante o organizzatore
      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento non trovato' });
      }

      const isOrganizer = event.organizerId === userId;
      const isParticipant = await Participant.findOne({
        where: { eventId, userId, status: 'registered' }
      });

      if (!isOrganizer && !isParticipant) {
        return res.status(403).json({ error: 'Non autorizzato' });
      }

      const { count, rows } = await Message.findAndCountAll({
        where: { eventId, isDeleted: false },
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }],
        offset: (page - 1) * limit,
        limit: parseInt(limit),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        messages: rows.reverse(),
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async sendMessage(req, res) {
    try {
      const { eventId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      // Verifica partecipazione
      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento non trovato' });
      }

      const isOrganizer = event.organizerId === userId;
      const isParticipant = await Participant.findOne({
        where: { eventId, userId, status: 'registered' }
      });

      if (!isOrganizer && !isParticipant) {
        return res.status(403).json({ error: 'Non autorizzato' });
      }

      const message = await Message.create({
        eventId,
        senderId: userId,
        content,
        type: 'text'
      });

      const createdMessage = await Message.findByPk(message.id, {
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }]
      });

      // TODO: Emettere evento Socket.IO per notifica real-time

      res.status(201).json({
        message: 'Messaggio inviato',
        data: createdMessage
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async editMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      const message = await Message.findOne({
        where: { id: messageId, senderId: userId, isDeleted: false }
      });

      if (!message) {
        return res.status(404).json({ error: 'Messaggio non trovato' });
      }

      await message.update({
        content,
        isEdited: true
      });

      const updatedMessage = await Message.findByPk(message.id, {
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }]
      });

      res.json({
        message: 'Messaggio modificato',
        data: updatedMessage
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      const message = await Message.findOne({
        where: { id: messageId }
      });

      if (!message) {
        return res.status(404).json({ error: 'Messaggio non trovato' });
      }

      // Solo il mittente o un admin può eliminare
      if (message.senderId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Non autorizzato' });
      }

      await message.update({ isDeleted: true });

      res.json({ message: 'Messaggio eliminato' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      const message = await Message.findByPk(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Messaggio non trovato' });
      }

      await MessageRead.findOrCreate({
        where: { messageId, userId },
        defaults: { messageId, userId }
      });

      res.json({ message: 'Messaggio segnato come letto' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new MessagesController();