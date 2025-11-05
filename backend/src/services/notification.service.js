const { Notification, User, Event } = require('../models');
const emailService = require('./email.service');

class NotificationService {
    constructor() {
        this.notificationTypes = {
            EVENT_REGISTRATION: 'event-registration',
            EVENT_CANCELLATION: 'event-cancelled',
            EVENT_UPDATE: 'event-updated',
            EVENT_REMINDER: 'event-reminder',
            CHAT_MENTION: 'chat-mention',
            EVENT_REPORTED: 'event-reported',
            REGISTRATION_APPROVED: 'registration-approved',
            REGISTRATION_REJECTED: 'registration-rejected'
        };
    }

    async createNotification(userId, type, data, options = {}) {
        try {
            const notification = await Notification.create({
                userId,
                type,
                data,
                read: false,
                ...options
            });

            // Se c'è una connessione socket attiva, invia la notifica in tempo reale
            if (global.io) {
                global.io.to(`user-${userId}`).emit('new-notification', notification);
            }

            // Se richiesto, invia anche una email
            if (options.sendEmail) {
                await this._sendNotificationEmail(notification);
            }

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    async createEventRegistrationNotification(eventId, userId) {
        try {
            const event = await Event.findByPk(eventId);
            const user = await User.findByPk(userId);

            // Notifica all'organizzatore dell'evento
            await this.createNotification(
                event.organizerId,
                this.notificationTypes.EVENT_REGISTRATION,
                {
                    eventId,
                    eventTitle: event.title,
                    userId,
                    userName: `${user.firstName} ${user.lastName}`
                },
                {
                    sendEmail: true,
                    eventId
                }
            );
        } catch (error) {
            console.error('Error creating event registration notification:', error);
            throw error;
        }
    }

    async createEventCancellationNotification(eventId) {
        try {
            const event = await Event.findByPk(eventId, {
                include: [{
                    model: User,
                    as: 'participants'
                }]
            });

            // Notifica tutti i partecipanti
            const notifications = event.participants.map(participant =>
                this.createNotification(
                    participant.id,
                    this.notificationTypes.EVENT_CANCELLATION,
                    {
                        eventId,
                        eventTitle: event.title,
                        eventDate: event.startDate
                    },
                    {
                        sendEmail: true,
                        eventId
                    }
                )
            );

            await Promise.all(notifications);
        } catch (error) {
            console.error('Error creating event cancellation notifications:', error);
            throw error;
        }
    }

    async createEventUpdateNotification(eventId, changes) {
        try {
            const event = await Event.findByPk(eventId, {
                include: [{
                    model: User,
                    as: 'participants'
                }]
            });

            // Notifica tutti i partecipanti delle modifiche
            const notifications = event.participants.map(participant =>
                this.createNotification(
                    participant.id,
                    this.notificationTypes.EVENT_UPDATE,
                    {
                        eventId,
                        eventTitle: event.title,
                        changes
                    },
                    {
                        eventId
                    }
                )
            );

            await Promise.all(notifications);
        } catch (error) {
            console.error('Error creating event update notifications:', error);
            throw error;
        }
    }

    async createEventReminderNotifications(eventId) {
        try {
            const event = await Event.findByPk(eventId, {
                include: [{
                    model: User,
                    as: 'participants'
                }]
            });

            // Notifica tutti i partecipanti 24 ore prima dell'evento
            const notifications = event.participants.map(participant =>
                this.createNotification(
                    participant.id,
                    this.notificationTypes.EVENT_REMINDER,
                    {
                        eventId,
                        eventTitle: event.title,
                        eventDate: event.startDate,
                        eventLocation: event.location
                    },
                    {
                        sendEmail: true,
                        eventId
                    }
                )
            );

            await Promise.all(notifications);
        } catch (error) {
            console.error('Error creating event reminder notifications:', error);
            throw error;
        }
    }

    async createChatMentionNotification(userId, eventId, messageId) {
        try {
            const event = await Event.findByPk(eventId);

            await this.createNotification(
                userId,
                this.notificationTypes.CHAT_MENTION,
                {
                    eventId,
                    eventTitle: event.title,
                    messageId
                },
                {
                    eventId
                }
            );
        } catch (error) {
            console.error('Error creating chat mention notification:', error);
            throw error;
        }
    }

    async createEventReportedNotification(eventId, reporterId, reason) {
        try {
            const event = await Event.findByPk(eventId);
            const reporter = await User.findByPk(reporterId);

            // Trova tutti gli admin
            const admins = await User.findAll({
                where: { role: 'admin' }
            });

            // Notifica tutti gli admin
            const notifications = admins.map(admin =>
                this.createNotification(
                    admin.id,
                    this.notificationTypes.EVENT_REPORTED,
                    {
                        eventId,
                        eventTitle: event.title,
                        reporterId,
                        reporterName: `${reporter.firstName} ${reporter.lastName}`,
                        reason
                    },
                    {
                        sendEmail: true,
                        eventId
                    }
                )
            );

            await Promise.all(notifications);
        } catch (error) {
            console.error('Error creating event reported notifications:', error);
            throw error;
        }
    }

    async markAsRead(notificationIds, userId) {
        try {
            await Notification.update(
                { read: true },
                {
                    where: {
                        id: notificationIds,
                        userId
                    }
                }
            );

            return { success: true };
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            throw error;
        }
    }

    async getUserNotifications(userId, options = {}) {
        try {
            const { limit = 50, offset = 0, unreadOnly = false } = options;

            const query = {
                where: { userId },
                order: [['createdAt', 'DESC']],
                limit,
                offset
            };

            if (unreadOnly) {
                query.where.read = false;
            }

            const notifications = await Notification.findAndCountAll(query);
            return notifications;
        } catch (error) {
            console.error('Error fetching user notifications:', error);
            throw error;
        }
    }

    async _sendNotificationEmail(notification) {
        try {
            const user = await User.findByPk(notification.userId);
            let emailTemplate;
            let subject;

            switch (notification.type) {
                case this.notificationTypes.EVENT_REGISTRATION:
                    subject = `Nuova registrazione per ${notification.data.eventTitle}`;
                    emailTemplate = 'eventRegistration';
                    break;
                case this.notificationTypes.EVENT_CANCELLATION:
                    subject = `Evento Cancellato: ${notification.data.eventTitle}`;
                    emailTemplate = 'eventCancellation';
                    break;
                case this.notificationTypes.EVENT_REMINDER:
                    subject = `Promemoria: ${notification.data.eventTitle}`;
                    emailTemplate = 'eventReminder';
                    break;
                // Aggiungi altri casi per diversi tipi di notifica
            }

            if (emailTemplate) {
                await emailService.sendEmail(
                    user.email,
                    subject,
                    await emailService.getEmailTemplate(emailTemplate, {
                        name: user.firstName,
                        ...notification.data
                    })
                );
            }
        } catch (error) {
            console.error('Error sending notification email:', error);
            // Non rilanciare l'errore per evitare che un errore nell'invio email
            // blocchi la creazione della notifica
        }
    }
}

module.exports = new NotificationService();