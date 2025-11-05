const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/server.config');
const chatHandler = require('./chat.socket');
const notificationHandler = require('./notification.socket');

function initializeSocket(server) {
    const io = socketIO(server, {
        cors: {
            origin: config.cors.frontendUrl,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Middleware per autenticazione
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, config.jwt.accessSecret);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    // Namespace per le chat degli eventi
    const chatNamespace = io.of('/chat');
    chatNamespace.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, config.jwt.accessSecret);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    // Namespace per le notifiche
    const notificationNamespace = io.of('/notifications');
    notificationNamespace.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, config.jwt.accessSecret);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    // Inizializza i gestori
    chatHandler(chatNamespace);
    notificationHandler(notificationNamespace);

    // Gestione connessione principale
    io.on('connection', (socket) => {
        console.log('User connected:', socket.user.id);

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.user.id);
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    return io;
}

module.exports = initializeSocket;