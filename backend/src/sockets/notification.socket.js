const Notification = require('../models/Notification');
const Event = require('../models/Event');
const User = require('../models/User');

function handleNotifications(io) {
    const connectedUsers = new Map(); // userId -> socketId

    io.on('connection', async (socket) => {
        const userId = socket.user.id;
        connectedUsers.set(userId, socket.id);

        // Invia notifiche non lette all'utente quando si connette
        try {
            const unreadNotifications = await Notification.findAll({
                where: {
                    userId,
                    read: false
                },
                order: [['createdAt', 'DESC']],
                limit: 50
            });

            socket.emit('unread-notifications', unreadNotifications);
        } catch (error) {
            console.error('Error fetching unread notifications:', error);
        }

        // Gestisce la marcatura delle notifiche come lette
        socket.on('mark-notifications-read', async (notificationIds) => {
            try {
                await Notification.update(
                    { read: true },
                    { 
                        where: {
                            id: notificationIds,
                            userId: socket.user.id
                        }
                    }
                );

                socket.emit('notifications-marked-read', notificationIds);
            } catch (error) {
                console.error('Error marking notifications as read:', error);
                socket.emit('error', { message: 'Failed to mark notifications as read' });
            }
        });

        // Funzioni helper per inviare notifiche
        async function sendEventNotification(type, eventId, recipientId, data = {}) {
            try {
                const notification = await Notification.create({
                    type,
                    userId: recipientId,
                    eventId,
                    data,
                    read: false
                });

                const recipientSocket = connectedUsers.get(recipientId);
                if (recipientSocket) {
                    io.to(recipientSocket).emit('new-notification', notification);
                }

                return notification;
            } catch (error) {
                console.error('Error creating notification:', error);
                throw error;
            }
        }

        // Gestione sottoscrizioni agli eventi
        socket.on('subscribe-to-event', async (eventId) => {
            try {
                const event = await Event.findByPk(eventId);
                if (!event) {
                    socket.emit('error', { message: 'Event not found' });
                    return;
                }

                socket.join(`event-notifications-${eventId}`);
            } catch (error) {
                console.error('Error subscribing to event:', error);
                socket.emit('error', { message: 'Failed to subscribe to event notifications' });
            }
        });

        socket.on('unsubscribe-from-event', (eventId) => {
            socket.leave(`event-notifications-${eventId}`);
        });

        // Gestione notifiche specifiche
        socket.on('event-registration', async ({ eventId, userId }) => {
            try {
                const event = await Event.findByPk(eventId);
                const user = await User.findByPk(userId);

                if (!event || !user) {
                    socket.emit('error', { message: 'Event or user not found' });
                    return;
                }

                // Notifica all'organizzatore
                await sendEventNotification(
                    'new-registration',
                    eventId,
                    event.organizerId,
                    {
                        userName: `${user.firstName} ${user.lastName}`,
                        eventTitle: event.title
                    }
                );

            } catch (error) {
                console.error('Error sending registration notification:', error);
                socket.emit('error', { message: 'Failed to send registration notification' });
            }
        });

        socket.on('event-cancelled', async ({ eventId }) => {
            try {
                const event = await Event.findByPk(eventId, {
                    include: [{
                        model: User,
                        as: 'participants'
                    }]
                });

                if (!event) {
                    socket.emit('error', { message: 'Event not found' });
                    return;
                }

                // Notifica tutti i partecipanti
                for (const participant of event.participants) {
                    await sendEventNotification(
                        'event-cancelled',
                        eventId,
                        participant.id,
                        {
                            eventTitle: event.title,
                            eventDate: event.startDate
                        }
                    );
                }

                io.to(`event-notifications-${eventId}`).emit('event-cancelled', { eventId });
            } catch (error) {
                console.error('Error sending cancellation notifications:', error);
                socket.emit('error', { message: 'Failed to send cancellation notifications' });
            }
        });

        socket.on('event-updated', async ({ eventId }) => {
            try {
                const event = await Event.findByPk(eventId, {
                    include: [{
                        model: User,
                        as: 'participants'
                    }]
                });

                if (!event) {
                    socket.emit('error', { message: 'Event not found' });
                    return;
                }

                // Notifica tutti i partecipanti dell'aggiornamento
                for (const participant of event.participants) {
                    await sendEventNotification(
                        'event-updated',
                        eventId,
                        participant.id,
                        {
                            eventTitle: event.title,
                            eventDate: event.startDate
                        }
                    );
                }

                io.to(`event-notifications-${eventId}`).emit('event-updated', { eventId });
            } catch (error) {
                console.error('Error sending update notifications:', error);
                socket.emit('error', { message: 'Failed to send update notifications' });
            }
        });

        socket.on('event-reported', async ({ eventId, reporterId, reason }) => {
            try {
                const event = await Event.findByPk(eventId);
                if (!event) {
                    socket.emit('error', { message: 'Event not found' });
                    return;
                }

                // Notifica gli amministratori
                const admins = await User.findAll({
                    where: { role: 'admin' }
                });

                for (const admin of admins) {
                    await sendEventNotification(
                        'event-reported',
                        eventId,
                        admin.id,
                        {
                            eventTitle: event.title,
                            reportReason: reason,
                            reporterId
                        }
                    );
                }
            } catch (error) {
                console.error('Error sending report notifications:', error);
                socket.emit('error', { message: 'Failed to send report notifications' });
            }
        });

        socket.on('disconnect', () => {
            connectedUsers.delete(userId);
            console.log('User disconnected from notifications:', userId);
        });
    });
}

module.exports = handleNotifications;