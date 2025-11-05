const { Event, User, Partecipant } = require('../models');
const notificationService = require('./notification.service');
const emailService = require('./email.service');
const { Op } = require('sequelize');

class ParticipantService {
    async registerForEvent(eventId, userId) {
        try {
            // Verifica che l'evento esista e sia pubblicato
            const event = await Event.findOne({
                where: {
                    id: eventId,
                    status: 'published',
                    isApproved: true,
                    startDate: {
                        [Op.gt]: new Date() // Verifica che l'evento non sia già passato
                    }
                }
            });

            if (!event) {
                throw new Error('Evento non trovato o non disponibile per la registrazione');
            }

            // Verifica che ci sia ancora posto disponibile
            if (event.currentParticipants >= event.capacity) {
                throw new Error('L\'evento è al completo');
            }

            // Verifica che l'utente non sia già registrato
            const existingRegistration = await Partecipant.findOne({
                where: {
                    eventId,
                    userId
                }
            });

            if (existingRegistration) {
                throw new Error('Sei già registrato a questo evento');
            }

            // Registra l'utente all'evento
            await Partecipant.create({
                eventId,
                userId,
                status: 'confirmed', // o 'pending' se richiede approvazione
                registrationDate: new Date()
            });

            // Incrementa il contatore dei partecipanti
            await event.increment('currentParticipants');

            // Invia notifica all'organizzatore
            await notificationService.createEventRegistrationNotification(eventId, userId);

            // Invia email di conferma al partecipante
            const user = await User.findByPk(userId);
            await emailService.sendEventRegistrationConfirmation(user, event);

            return { success: true };
        } catch (error) {
            console.error('Error registering for event:', error);
            throw error;
        }
    }

    async cancelRegistration(eventId, userId) {
        try {
            // Verifica che la registrazione esista
            const registration = await Partecipant.findOne({
                where: {
                    eventId,
                    userId
                },
                include: [{
                    model: Event,
                    where: {
                        startDate: {
                            [Op.gt]: new Date() // Verifica che l'evento non sia già passato
                        }
                    }
                }]
            });

            if (!registration) {
                throw new Error('Registrazione non trovata');
            }

            // Cancella la registrazione
            await registration.destroy();

            // Decrementa il contatore dei partecipanti
            await registration.Event.decrement('currentParticipants');

            return { success: true };
        } catch (error) {
            console.error('Error cancelling registration:', error);
            throw error;
        }
    }

    async getEventParticipants(eventId, options = {}) {
        try {
            const { limit = 50, offset = 0, status } = options;

            const query = {
                where: { eventId },
                include: [{
                    model: User,
                    attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
                }],
                order: [['registrationDate', 'DESC']],
                limit,
                offset
            };

            if (status) {
                query.where.status = status;
            }

            const participants = await Partecipant.findAndCountAll(query);
            return participants;
        } catch (error) {
            console.error('Error fetching event participants:', error);
            throw error;
        }
    }

    async getUserEvents(userId, options = {}) {
        try {
            const { limit = 50, offset = 0, status, past = false } = options;

            const query = {
                include: [{
                    model: Event,
                    where: {
                        startDate: past
                            ? { [Op.lt]: new Date() }
                            : { [Op.gt]: new Date() }
                    }
                }],
                where: { userId },
                order: [[Event, 'startDate', past ? 'DESC' : 'ASC']],
                limit,
                offset
            };

            if (status) {
                query.where.status = status;
            }

            const registrations = await Partecipant.findAndCountAll(query);
            return registrations;
        } catch (error) {
            console.error('Error fetching user events:', error);
            throw error;
        }
    }

    async approveRegistration(eventId, userId) {
        try {
            const registration = await Partecipant.findOne({
                where: {
                    eventId,
                    userId,
                    status: 'pending'
                }
            });

            if (!registration) {
                throw new Error('Registrazione non trovata o già approvata');
            }

            await registration.update({ status: 'confirmed' });

            // Notifica l'utente dell'approvazione
            await notificationService.createNotification(
                userId,
                'registration-approved',
                { eventId }
            );

            return { success: true };
        } catch (error) {
            console.error('Error approving registration:', error);
            throw error;
        }
    }

    async rejectRegistration(eventId, userId, reason) {
        try {
            const registration = await Partecipant.findOne({
                where: {
                    eventId,
                    userId,
                    status: 'pending'
                }
            });

            if (!registration) {
                throw new Error('Registrazione non trovata');
            }

            await registration.update({ 
                status: 'rejected',
                rejectionReason: reason
            });

            // Notifica l'utente del rifiuto
            await notificationService.createNotification(
                userId,
                'registration-rejected',
                { eventId, reason }
            );

            return { success: true };
        } catch (error) {
            console.error('Error rejecting registration:', error);
            throw error;
        }
    }

    async checkEventCapacity(eventId) {
        try {
            const event = await Event.findByPk(eventId);
            return {
                total: event.capacity,
                current: event.currentParticipants,
                available: event.capacity - event.currentParticipants
            };
        } catch (error) {
            console.error('Error checking event capacity:', error);
            throw error;
        }
    }

    async isUserRegistered(eventId, userId) {
        try {
            const registration = await Partecipant.findOne({
                where: {
                    eventId,
                    userId
                }
            });

            return {
                isRegistered: !!registration,
                status: registration?.status
            };
        } catch (error) {
            console.error('Error checking user registration:', error);
            throw error;
        }
    }
}

module.exports = new ParticipantService();