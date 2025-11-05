const { ChatMessage, Event, User, MessageRead } = require('../models');
const { Op } = require('sequelize');
const uploadService = require('../services/upload.service');

class ChatController {
    // Ottiene i messaggi di una chat di un evento
    async getEventMessages(req, res) {
        try {
            const { eventId } = req.params;
            const { limit = 50, before } = req.query;

            // Verifica che l'utente sia partecipante all'evento
            const event = await Event.findOne({
                where: { id: eventId },
                include: [{
                    model: User,
                    as: 'participants',
                    where: { id: req.user.id }
                }]
            });

            if (!event) {
                return res.status(403).json({
                    error: 'Non sei autorizzato ad accedere a questa chat'
                });
            }

            // Costruisci la query per i messaggi
            const query = {
                where: { eventId },
                include: [{
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'firstName', 'lastName', 'avatar']
                }, {
                    model: User,
                    as: 'readBy',
                    attributes: ['id']
                }],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit)
            };

            // Se specificato, prendi i messaggi prima di una certa data
            if (before) {
                query.where.createdAt = { [Op.lt]: new Date(before) };
            }

            const messages = await ChatMessage.findAll(query);

            res.json(messages.reverse());
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            res.status(500).json({ error: 'Errore nel recupero dei messaggi' });
        }
    }

    // Invia un nuovo messaggio
    async sendMessage(req, res) {
        try {
            const { eventId } = req.params;
            const { content, type = 'text' } = req.body;

            // Verifica che l'utente sia partecipante all'evento
            const event = await Event.findOne({
                where: { id: eventId },
                include: [{
                    model: User,
                    as: 'participants',
                    where: { id: req.user.id }
                }]
            });

            if (!event) {
                return res.status(403).json({
                    error: 'Non sei autorizzato a inviare messaggi in questa chat'
                });
            }

            let messageData = {
                eventId,
                senderId: req.user.id,
                content,
                type
            };

            // Se è un messaggio di tipo immagine, processa l'upload
            if (type === 'image' && req.file) {
                const { url, filename } = await uploadService.processAndUploadImage(req.file, {
                    width: 1200,
                    height: 1200,
                    quality: 85,
                    folder: 'chat'
                });

                messageData.content = url;
                messageData.metadata = {
                    imageFilename: filename
                };
            }

            const message = await ChatMessage.create(messageData);

            // Carica il messaggio con i dati del mittente
            const messageWithSender = await ChatMessage.findByPk(message.id, {
                include: [{
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'firstName', 'lastName', 'avatar']
                }]
            });

            // Emetti l'evento socket per il nuovo messaggio
            const io = req.app.get('io');
            io.to(`event-${eventId}`).emit('new-message', messageWithSender);

            res.status(201).json(messageWithSender);
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ error: 'Errore nell\'invio del messaggio' });
        }
    }

    // Modifica un messaggio esistente
    async editMessage(req, res) {
        try {
            const { messageId } = req.params;
            const { content } = req.body;

            const message = await ChatMessage.findByPk(messageId);

            if (!message) {
                return res.status(404).json({ error: 'Messaggio non trovato' });
            }

            if (message.senderId !== req.user.id) {
                return res.status(403).json({
                    error: 'Non sei autorizzato a modificare questo messaggio'
                });
            }

            if (message.isDeleted) {
                return res.status(400).json({
                    error: 'Non puoi modificare un messaggio eliminato'
                });
            }

            await message.update({
                content,
                isEdited: true,
                editedAt: new Date()
            });

            // Ricarica il messaggio con i dati del mittente
            const updatedMessage = await ChatMessage.findByPk(messageId, {
                include: [{
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'firstName', 'lastName', 'avatar']
                }]
            });

            // Emetti l'evento socket per il messaggio modificato
            const io = req.app.get('io');
            io.to(`event-${message.eventId}`).emit('message-edited', updatedMessage);

            res.json(updatedMessage);
        } catch (error) {
            console.error('Error editing message:', error);
            res.status(500).json({ error: 'Errore nella modifica del messaggio' });
        }
    }

    // Elimina un messaggio
    async deleteMessage(req, res) {
        try {
            const { messageId } = req.params;
            const message = await ChatMessage.findByPk(messageId);

            if (!message) {
                return res.status(404).json({ error: 'Messaggio non trovato' });
            }

            // Verifica che l'utente sia il mittente o un admin
            if (message.senderId !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'Non sei autorizzato a eliminare questo messaggio'
                });
            }

            // Se è un'immagine, elimina il file
            if (message.type === 'image' && message.metadata?.imageFilename) {
                try {
                    await uploadService.deleteImage(message.metadata.imageFilename);
                } catch (error) {
                    console.error('Error deleting message image:', error);
                }
            }

            await message.update({
                content: 'Questo messaggio è stato eliminato',
                isDeleted: true,
                deletedAt: new Date(),
                metadata: {}
            });

            // Emetti l'evento socket per il messaggio eliminato
            const io = req.app.get('io');
            io.to(`event-${message.eventId}`).emit('message-deleted', {
                messageId: message.id,
                eventId: message.eventId
            });

            res.json({ message: 'Messaggio eliminato con successo' });
        } catch (error) {
            console.error('Error deleting message:', error);
            res.status(500).json({ error: 'Errore nell\'eliminazione del messaggio' });
        }
    }

    // Marca i messaggi come letti
    async markMessagesAsRead(req, res) {
        try {
            const { eventId } = req.params;
            const { messageIds } = req.body;

            // Verifica che l'utente sia partecipante all'evento
            const event = await Event.findOne({
                where: { id: eventId },
                include: [{
                    model: User,
                    as: 'participants',
                    where: { id: req.user.id }
                }]
            });

            if (!event) {
                return res.status(403).json({
                    error: 'Non sei autorizzato ad accedere a questa chat'
                });
            }

            // Marca i messaggi come letti
            await MessageRead.bulkCreate(
                messageIds.map(messageId => ({
                    messageId,
                    userId: req.user.id,
                    eventId
                })),
                { ignoreDuplicates: true }
            );

            // Emetti l'evento socket per i messaggi letti
            const io = req.app.get('io');
            io.to(`event-${eventId}`).emit('messages-read', {
                userId: req.user.id,
                messageIds
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Error marking messages as read:', error);
            res.status(500).json({ error: 'Errore nel marcare i messaggi come letti' });
        }
    }

    // Ottiene lo stato di lettura dei messaggi
    async getReadStatus(req, res) {
        try {
            const { eventId } = req.params;
            const { messageIds } = req.query;

            const readStatus = await MessageRead.findAll({
                where: {
                    messageId: messageIds,
                    eventId
                },
                include: [{
                    model: User,
                    attributes: ['id', 'firstName', 'lastName']
                }]
            });

            const statusByMessage = messageIds.reduce((acc, messageId) => {
                acc[messageId] = readStatus
                    .filter(status => status.messageId === messageId)
                    .map(status => ({
                        userId: status.User.id,
                        name: `${status.User.firstName} ${status.User.lastName}`
                    }));
                return acc;
            }, {});

            res.json(statusByMessage);
        } catch (error) {
            console.error('Error fetching read status:', error);
            res.status(500).json({ error: 'Errore nel recupero dello stato di lettura' });
        }
    }
}

module.exports = new ChatController();