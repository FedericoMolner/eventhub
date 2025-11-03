const { Transaction } = require('sequelize');
const sequelize = require('../config/database');
const Ticket = require('../models/ticket.model');
const TicketType = require('../models/ticket-type.model');
const Event = require('../models/event.model');
const QRCode = require('qrcode');

class TicketService {
    async purchaseTicket(eventId, userId, ticketTypeId) {
        const result = await sequelize.transaction(async (t) => {
            const ticketType = await TicketType.findByPk(ticketTypeId, { transaction: t });
            
            if (!ticketType || ticketType.eventId !== eventId) {
                throw new Error('Invalid ticket type');
            }

            if (ticketType.quantity <= 0) {
                throw new Error('Tickets sold out');
            }

            // Generate QR code
            const qrData = {
                eventId,
                userId,
                ticketTypeId,
                timestamp: Date.now()
            };
            const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

            // Create ticket
            const ticket = await Ticket.create({
                eventId,
                userId,
                ticketTypeId,
                qrCode
            }, { transaction: t });

            // Update ticket quantity
            await ticketType.decrement('quantity', { transaction: t });

            return ticket;
        });

        return result;
    }

    async validateTicket(ticketId, validatorId) {
        const ticket = await Ticket.findByPk(ticketId, {
            include: [
                { model: Event },
                { model: TicketType }
            ]
        });

        if (!ticket) {
            throw new Error('Ticket not found');
        }

        if (ticket.status !== 'active') {
            throw new Error('Ticket is not active');
        }

        await ticket.update({
            status: 'used',
            validationDate: new Date()
        });

        return ticket;
    }

    async refundTicket(ticketId, userId) {
        const result = await sequelize.transaction(async (t) => {
            const ticket = await Ticket.findOne({
                where: {
                    id: ticketId,
                    userId
                },
                transaction: t
            });

            if (!ticket) {
                throw new Error('Ticket not found');
            }

            if (ticket.status !== 'active') {
                throw new Error('Ticket cannot be refunded');
            }

            await ticket.update({
                status: 'refunded',
                refundDate: new Date()
            }, { transaction: t });

            await TicketType.increment('quantity', {
                where: { id: ticket.ticketTypeId },
                transaction: t
            });

            return ticket;
        });

        return result;
    }

    async getUserTickets(userId, status) {
        const where = { userId };
        if (status) {
            where.status = status;
        }

        return Ticket.findAll({
            where,
            include: [
                { model: Event },
                { model: TicketType }
            ],
            order: [['purchaseDate', 'DESC']]
        });
    }
}

module.exports = new TicketService();