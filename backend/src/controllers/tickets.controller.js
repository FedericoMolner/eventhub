const { Ticket, Event, TicketType, User } = require('../models');
const { Op } = require('sequelize');
const QRCode = require('qrcode');

class TicketsController {
    async purchaseTicket(req, res) {
        try {
            const { eventId, ticketTypeId, quantity = 1 } = req.body;
            
            // Verifica disponibilità biglietti
            const ticketType = await TicketType.findByPk(ticketTypeId);
            if (!ticketType || ticketType.quantity < quantity) {
                return res.status(400).json({ error: 'Biglietti non disponibili' });
            }

            const event = await Event.findByPk(eventId);
            if (!event || event.status !== 'published') {
                return res.status(400).json({ error: 'Evento non disponibile' });
            }

            // Crea i biglietti
            const tickets = [];
            for (let i = 0; i < quantity; i++) {
                const qrData = {
                    eventId,
                    userId: req.user.id,
                    ticketTypeId,
                    timestamp: Date.now(),
                    unique: Math.random().toString(36)
                };
                
                const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
                
                const ticket = await Ticket.create({
                    eventId,
                    userId: req.user.id,
                    ticketTypeId,
                    status: 'active',
                    qrCode,
                    purchasePrice: ticketType.price
                });
                
                tickets.push(ticket);
            }

            // Aggiorna la quantità disponibile
            await ticketType.decrement('quantity', { by: quantity });

            res.status(201).json({
                message: 'Acquisto completato con successo',
                tickets
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getMyTickets(req, res) {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            const where = { userId: req.user.id };
            
            if (status) {
                where.status = status;
            }

            const { count, rows } = await Ticket.findAndCountAll({
                where,
                include: [
                    {
                        model: Event,
                        attributes: ['id', 'title', 'date', 'locationName']
                    },
                    {
                        model: TicketType,
                        attributes: ['name', 'price']
                    }
                ],
                offset: (page - 1) * limit,
                limit,
                order: [['createdAt', 'DESC']]
            });

            res.json({
                tickets: rows,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async validateTicket(req, res) {
        try {
            const ticket = await Ticket.findByPk(req.params.id, {
                include: [
                    { model: Event },
                    { model: User }
                ]
            });

            if (!ticket) {
                return res.status(404).json({ error: 'Biglietto non trovato' });
            }

            if (ticket.status !== 'active') {
                return res.status(400).json({ error: 'Biglietto non valido' });
            }

            // Verifica che l'organizzatore sia autorizzato per questo evento
            const event = await Event.findByPk(ticket.eventId);
            if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Non autorizzato' });
            }

            await ticket.update({
                status: 'used',
                validationDate: new Date(),
                validatedBy: req.user.id
            });

            res.json({
                message: 'Biglietto validato con successo',
                ticket
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async refundTicket(req, res) {
        try {
            const ticket = await Ticket.findOne({
                where: {
                    id: req.params.id,
                    userId: req.user.id,
                    status: 'active'
                }
            });

            if (!ticket) {
                return res.status(404).json({ error: 'Biglietto non trovato o non rimborsabile' });
            }

            // Verifica policy di rimborso (esempio: solo entro 24h dall'evento)
            const event = await Event.findByPk(ticket.eventId);
            const hoursUntilEvent = (new Date(event.date) - new Date()) / (1000 * 60 * 60);
            
            if (hoursUntilEvent < 24) {
                return res.status(400).json({ error: 'Rimborso non più disponibile' });
            }

            await ticket.update({
                status: 'refunded',
                refundDate: new Date()
            });

            // Incrementa la quantità disponibile del tipo di biglietto
            await TicketType.increment('quantity', {
                where: { id: ticket.ticketTypeId }
            });

            res.json({
                message: 'Rimborso elaborato con successo',
                ticket
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getTicketStats(req, res) {
        try {
            const { eventId } = req.params;
            
            // Verifica autorizzazione
            const event = await Event.findByPk(eventId);
            if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Non autorizzato' });
            }

            const stats = await Ticket.findAll({
                where: { eventId },
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                    [sequelize.fn('SUM', sequelize.col('purchasePrice')), 'revenue']
                ],
                group: ['status']
            });

            res.json({ stats });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new TicketsController();