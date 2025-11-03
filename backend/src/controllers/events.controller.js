const { Event, User, TicketType, Ticket } = require('../models');
const { Op } = require('sequelize');

class EventsController {
    async getAllEvents(req, res) {
        try {
            const { page = 1, limit = 10, category, search, city, startDate, endDate } = req.query;
            const where = {};

            if (category) {
                where.category = category;
            }

            if (city) {
                where.city = city;
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
                        attributes: ['id', 'name']
                    },
                    {
                        model: TicketType,
                        attributes: ['id', 'name', 'price', 'quantity']
                    }
                ],
                offset: (page - 1) * limit,
                limit,
                order: [['date', 'ASC']]
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
                        attributes: ['id', 'name']
                    },
                    {
                        model: TicketType,
                        attributes: ['id', 'name', 'price', 'quantity', 'description']
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

            if (req.body.ticketTypes) {
                await TicketType.bulkCreate(
                    req.body.ticketTypes.map(type => ({
                        ...type,
                        eventId: event.id
                    }))
                );
            }

            const createdEvent = await Event.findByPk(event.id, {
                include: [
                    {
                        model: User,
                        as: 'organizer',
                        attributes: ['id', 'name']
                    },
                    {
                        model: TicketType,
                        attributes: ['id', 'name', 'price', 'quantity', 'description']
                    }
                ]
            });

            res.status(201).json({ event: createdEvent });
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

            if (req.body.ticketTypes) {
                await TicketType.destroy({ where: { eventId: event.id } });
                await TicketType.bulkCreate(
                    req.body.ticketTypes.map(type => ({
                        ...type,
                        eventId: event.id
                    }))
                );
            }

            const updatedEvent = await Event.findByPk(event.id, {
                include: [
                    {
                        model: User,
                        as: 'organizer',
                        attributes: ['id', 'name']
                    },
                    {
                        model: TicketType,
                        attributes: ['id', 'name', 'price', 'quantity', 'description']
                    }
                ]
            });

            res.json({ event: updatedEvent });
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
                include: [
                    {
                        model: TicketType,
                        attributes: ['id', 'name', 'price', 'quantity']
                    }
                ],
                offset: (page - 1) * limit,
                limit,
                order: [['date', 'DESC']]
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
}

module.exports = new EventsController();