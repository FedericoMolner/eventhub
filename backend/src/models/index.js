// backend/src/models/index.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Inizializza Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Importa i modelli
const User = require('./User')(sequelize);
const Event = require('./Event')(sequelize);
const Participant = require('./Participant')(sequelize);
const Message = require('./Message')(sequelize);
const MessageRead = require('./MessageRead')(sequelize);
const Notification = require('./Notification')(sequelize);
const Report = require('./Report')(sequelize);

// ===== DEFINIZIONE RELAZIONI =====

// User <-> Event (Organizzatore)
User.hasMany(Event, {
  foreignKey: 'organizerId',
  as: 'organizedEvents',
  onDelete: 'CASCADE'
});
Event.belongsTo(User, {
  foreignKey: 'organizerId',
  as: 'organizer'
});

// User <-> Event (Partecipanti) - Many to Many attraverso Participant
User.belongsToMany(Event, {
  through: Participant,
  foreignKey: 'userId',
  otherKey: 'eventId',
  as: 'participatingEvents'
});
Event.belongsToMany(User, {
  through: Participant,
  foreignKey: 'eventId',
  otherKey: 'userId',
  as: 'participants'
});

// Relazioni dirette con Participant
User.hasMany(Participant, {
  foreignKey: 'userId',
  as: 'participations'
});
Participant.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Event.hasMany(Participant, {
  foreignKey: 'eventId',
  as: 'eventParticipants'
});
Participant.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'event'
});

// User <-> Message
User.hasMany(Message, {
  foreignKey: 'senderId',
  as: 'sentMessages'
});
Message.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender'
});

// Event <-> Message
Event.hasMany(Message, {
  foreignKey: 'eventId',
  as: 'messages'
});
Message.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'event'
});

// Message <-> User (Lettura) - Many to Many
Message.belongsToMany(User, {
  through: MessageRead,
  foreignKey: 'messageId',
  otherKey: 'userId',
  as: 'readByUsers'
});
User.belongsToMany(Message, {
  through: MessageRead,
  foreignKey: 'userId',
  otherKey: 'messageId',
  as: 'readMessages'
});

// Relazioni dirette MessageRead
Message.hasMany(MessageRead, {
  foreignKey: 'messageId',
  as: 'reads'
});
MessageRead.belongsTo(Message, {
  foreignKey: 'messageId',
  as: 'message'
});

User.hasMany(MessageRead, {
  foreignKey: 'userId',
  as: 'messageReads'
});
MessageRead.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Notification <-> User (Destinatario)
User.hasMany(Notification, {
  foreignKey: 'recipientId',
  as: 'receivedNotifications'
});
Notification.belongsTo(User, {
  foreignKey: 'recipientId',
  as: 'recipient'
});

// Notification <-> User (Mittente)
User.hasMany(Notification, {
  foreignKey: 'senderId',
  as: 'sentNotifications'
});
Notification.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender'
});

// Notification <-> Event
Event.hasMany(Notification, {
  foreignKey: 'relatedEventId',
  as: 'notifications'
});
Notification.belongsTo(Event, {
  foreignKey: 'relatedEventId',
  as: 'relatedEvent'
});

// Notification <-> Message
Message.hasMany(Notification, {
  foreignKey: 'relatedMessageId',
  as: 'notifications'
});
Notification.belongsTo(Message, {
  foreignKey: 'relatedMessageId',
  as: 'relatedMessage'
});

// Report <-> User (Reporter)
User.hasMany(Report, {
  foreignKey: 'reporterId',
  as: 'reportsMade'
});
Report.belongsTo(User, {
  foreignKey: 'reporterId',
  as: 'reporter'
});

// Report <-> Event
Event.hasMany(Report, {
  foreignKey: 'reportedEventId',
  as: 'reports'
});
Report.belongsTo(Event, {
  foreignKey: 'reportedEventId',
  as: 'reportedEvent'
});

// Report <-> User (Reviewer)
User.hasMany(Report, {
  foreignKey: 'reviewedById',
  as: 'reviewedReports'
});
Report.belongsTo(User, {
  foreignKey: 'reviewedById',
  as: 'reviewer'
});

// ===== ESPORTA TUTTO =====
module.exports = {
  sequelize,
  Sequelize,
  User,
  Event,
  Participant,
  Message,
  MessageRead,
  Notification,
  Report
};