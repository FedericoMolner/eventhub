const { Op } = require('sequelize');
const Event = require('../models/event.model');
const TicketType = require('../models/ticket-type.model');
const User = require('../models/user.model');

class EventService {
    async createEvent(eventData, organizerId) {
        const { ticketTypes, ...eventDetails } = eventData;
        
        const event = await Event.create({
            ...eventDetails,
            organizerId
        });

        if (ticketTypes && ticketTypes.length > 0) {
            await TicketType.bulkCreate(
                ticketTypes.map(type => ({
                    ...type,
                    eventId: event.id
                }))
            );
        }

        return this.getEventById(event.id);
    }

    async getEvents(filters = {}, page = 1, limit = 10) {
        const where = {};
        
        if (filters.category) {
            where.category = filters.category;
        }
        
        if (filters.search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${filters.search}%` } },
                { description: { [Op.iLike]: `%${filters.search}%` } }
            ];
        }

        const { count, rows } = await Event.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'organizer',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: TicketType,
                    as: 'ticketTypes'
                }
            ],
            offset: (page - 1) * limit,
            limit,
            order: [['date', 'ASC']]
        });

        return {
            events: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    }

    async getEventById(eventId) {
        const event = await Event.findByPk(eventId, {
            include: [
                {
                    model: User,
                    as: 'organizer',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: TicketType,
                    as: 'ticketTypes'
                }
            ]
        });

        if (!event) {
            throw new Error('Event not found');
        }

        return event;
    }

    async updateEvent(eventId, updateData, organizerId) {
        const { ticketTypes, ...eventDetails } = updateData;
        
        const event = await Event.findOne({
            where: {
                id: eventId,
                organizerId
            }
        });

        if (!event) {
            throw new Error('Event not found or unauthorized');
        }

        await event.update(eventDetails);

        if (ticketTypes) {
            await TicketType.destroy({ where: { eventId } });
            await TicketType.bulkCreate(
                ticketTypes.map(type => ({
                    ...type,
                    eventId
                }))
            );
        }

        return this.getEventById(eventId);
    }

    async deleteEvent(eventId, organizerId) {
        const deleted = await Event.destroy({
            where: {
                id: eventId,
                organizerId
            }
        });

        if (!deleted) {
            throw new Error('Event not found or unauthorized');
        }

        return true;
    }
}

module.exports = new EventService();