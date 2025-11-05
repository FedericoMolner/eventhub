// backend/src/controllers/events.controller.js
const { Event, User, Participant } = require('../models');
const { Op } = require('sequelize');

class EventsController {
  async getAllEvents(req, res) {
    try {
      const { page = 1, limit = 10, category, search, city, startDate, endDate } = req.query;
      const where = { status: 'approved', isPublic: true };

      if (category) {
        where.category = category;
      }

      if (city) {
        where.city = { [Op.iLike]: `%${city}%` };
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date[Op.gte] = new Date(startDate);
        if (endDate) where.date[Op.lte] = new Date(endDate);
      }

      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Event.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'organizer',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          },
          {
            model: Participant,
            as: 'eventParticipants',
            where: { status: 'registered' },
            required: false,
            attributes: ['id']
          }
        ],
        offset: (page - 1) * limit,
        limit: parseInt(limit),
        order: [['date', 'ASC']],
        distinct: true
      });

      res.json({
        events: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEventById(req, res) {
    try {
      const event = await Event.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: 'organizer',
            attributes: ['id', 'firstName', 'lastName', 'avatar', 'email']
          },
          {
            model: Participant,
            as: 'eventParticipants',
            where: { status: 'registered' },
            required: false,
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'avatar']
            }]
          }
        ]
      });

      if (!event) {
        return res.status(404).json({ error: 'Evento non trovato' });
      }

      res.json({ event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createEvent(req, res) {
    try {
      const eventData = {
        ...req.body,
        organizerId: req.user.id
      };

      const event = await Event.create(eventData);

      const createdEvent = await Event.findByPk(event.id, {
        include: [{
          model: User,
          as: 'organizer',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }]
      });

      res.status(201).json({ 
        message: 'Evento creato con successo',
        event: createdEvent 
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateEvent(req, res) {
    try {
      const event = await Event.findOne({
        where: {
          id: req.params.id,
          organizerId: req.user.id
        }
      });

      if (!event) {
        return res.status(404).json({ error: 'Evento non trovato o non autorizzato' });
      }

      await event.update(req.body);

      const updatedEvent = await Event.findByPk(event.id, {
        include: [{
          model: User,
          as: 'organizer',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }]
      });

      res.json({ 
        message: 'Evento aggiornato con successo',
        event: updatedEvent 
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteEvent(req, res) {
    try {
      const event = await Event.findOne({
        where: {
          id: req.params.id,
          organizerId: req.user.id
        }
      });

      if (!event) {
        return res.status(404).json({ error: 'Evento non trovato o non autorizzato' });
      }

      await event.destroy();
      res.json({ message: 'Evento eliminato con successo' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMyEvents(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const where = { organizerId: req.user.id };

      if (status) {
        where.status = status;
      }

      const { count, rows } = await Event.findAndCountAll({
        where,
        include: [{
          model: Participant,
          as: 'eventParticipants',
          where: { status: 'registered' },
          required: false,
          attributes: ['id']
        }],
        offset: (page - 1) * limit,
        limit: parseInt(limit),
        order: [['date', 'DESC']],
        distinct: true
      });

      res.json({
        events: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = [
        'sport',
        'musica',
        'arte',
        'tecnologia',
        'formazione',
        'networking',
        'beneficenza',
        'festa',
        'altro'
      ];
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new EventsController();