const Message = require('../models/Message');
const Event = require('../models/Event');
const User = require('../models/User');

function handleChat(io) {
    io.on('connection', async (socket) => {
        const userId = socket.user.id;
        
        // Join all event rooms where user is participant
        const userEvents = await Event.findAll({
            include: [{
                model: User,
                as: 'participants',
                where: { id: userId }
            }]
        });

        userEvents.forEach(event => {
            socket.join(`event-${event.id}`);
        });

        // Handle joining a specific event chat
        socket.on('join-event', async (eventId) => {
            try {
                const event = await Event.findByPk(eventId, {
                    include: [{
                        model: User,
                        as: 'participants',
                        where: { id: userId }
                    }]
                });

                if (!event) {
                    socket.emit('error', { message: 'Event not found or not authorized' });
                    return;
                }

                socket.join(`event-${eventId}`);
                
                // Fetch last 50 messages
                const messages = await Message.findAll({
                    where: { eventId },
                    limit: 50,
                    order: [['createdAt', 'DESC']],
                    include: [{
                        model: User,
                        attributes: ['id', 'firstName', 'lastName', 'avatar']
                    }]
                });

                socket.emit('chat-history', messages.reverse());
            } catch (error) {
                console.error('Error joining event chat:', error);
                socket.emit('error', { message: 'Failed to join event chat' });
            }
        });

        // Handle leaving an event chat
        socket.on('leave-event', (eventId) => {
            socket.leave(`event-${eventId}`);
        });

        // Handle new message
        socket.on('send-message', async (data) => {
            try {
                const { eventId, content } = data;
                
                // Verifica che l'utente sia partecipante all'evento
                const event = await Event.findByPk(eventId, {
                    include: [{
                        model: User,
                        as: 'participants',
                        where: { id: userId }
                    }]
                });

                if (!event) {
                    socket.emit('error', { message: 'Not authorized to send messages in this event' });
                    return;
                }

                // Crea il messaggio
                const message = await Message.create({
                    eventId,
                    userId,
                    content,
                    type: 'text'
                });

                // Carica i dati dell'utente per il messaggio
                const messageWithUser = await Message.findByPk(message.id, {
                    include: [{
                        model: User,
                        attributes: ['id', 'firstName', 'lastName', 'avatar']
                    }]
                });

                // Invia il messaggio a tutti i partecipanti dell'evento
                io.to(`event-${eventId}`).emit('new-message', messageWithUser);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing status
        socket.on('typing-start', (eventId) => {
            socket.to(`event-${eventId}`).emit('user-typing', {
                userId: socket.user.id,
                name: `${socket.user.firstName} ${socket.user.lastName}`
            });
        });

        socket.on('typing-stop', (eventId) => {
            socket.to(`event-${eventId}`).emit('user-stop-typing', {
                userId: socket.user.id
            });
        });

        // Handle message read status
        socket.on('mark-read', async (messageIds) => {
            try {
                await Message.update(
                    { readBy: socket.user.id },
                    { where: { id: messageIds } }
                );
                
                socket.emit('messages-marked-read', messageIds);
            } catch (error) {
                console.error('Error marking messages as read:', error);
                socket.emit('error', { message: 'Failed to mark messages as read' });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected from chat:', socket.user.id);
        });
    });
}

module.exports = handleChat;