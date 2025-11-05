const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config/server.config');

const db = {};

// Configurazione della connessione al database
const sequelize = new Sequelize(

  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging,
    pool: config.database.pool
  }
);

// Caricamento automatico dei modelli
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== 'index.js' &&
      file.slice(-9) === '.model.js'
    );
  });

for (const file of modelFiles) {
  const model = require(path.join(__dirname, file))(sequelize);
  db[model.name] = model;
}

// Configurazione delle associazioni tra i modelli
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Definizione delle associazioni
// User - Event (come organizzatore)
db.User.hasMany(db.Event, {
  foreignKey: 'organizerId',
  as: 'organizedEvents'
});
db.Event.belongsTo(db.User, {
  foreignKey: 'organizerId',
  as: 'organizer'
});

// User - Event (come partecipante)
db.User.belongsToMany(db.Event, {
  through: db.EventParticipation,
  foreignKey: 'userId',
  as: 'participatedEvents'
});
db.Event.belongsToMany(db.User, {
  through: db.EventParticipation,
  foreignKey: 'eventId',
  as: 'participants'
});

// Event - EventParticipation
db.Event.hasMany(db.EventParticipation, {
  foreignKey: 'eventId',
  as: 'participations'
});
db.EventParticipation.belongsTo(db.Event, {
  foreignKey: 'eventId',
  as: 'event'
});

// User - EventParticipation
db.User.hasMany(db.EventParticipation, {
  foreignKey: 'userId',
  as: 'participations'
});
db.EventParticipation.belongsTo(db.User, {
  foreignKey: 'userId',
  as: 'user'
});

// Event - ChatMessage
db.Event.hasMany(db.ChatMessage, {
  foreignKey: 'eventId',
  as: 'chatMessages'
});
db.ChatMessage.belongsTo(db.Event, {
  foreignKey: 'eventId',
  as: 'event'
});

// User - ChatMessage
db.User.hasMany(db.ChatMessage, {
  foreignKey: 'userId',
  as: 'messages'
});
db.ChatMessage.belongsTo(db.User, {
  foreignKey: 'userId',
  as: 'user'
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;// backend/src/models/index.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');

// Inizializza Sequelize
// sequelize already declared above – skip re-declaration

// Importa i modelli
const User = require('./User')(sequelize);
const Event = require('./Event')(sequelize);
// Participant already declared below; skip duplicate import
// Message already declared below; skip duplicate import
// MessageRead already declared below; skip duplicate import
// Notification already declared below; skip duplicate import
// Report already declared below; skip duplicate import
const User = require('./user.model');
const Event = require('./event.model');
const TicketType = require('./ticket-type.model');
const Ticket = require('./ticket.model');

// User - Event associations
User.hasMany(Event, { as: 'organizedEvents', foreignKey: 'organizerId' });
Event.belongsTo(User, { as: 'organizer', foreignKey: 'organizerId' });

// Event - TicketType associations
Event.hasMany(TicketType, { as: 'ticketTypes' });
TicketType.belongsTo(Event);

// User - Ticket associations
User.hasMany(Ticket);
Ticket.belongsTo(User);

// Event - Ticket associations
Event.hasMany(Ticket);
Ticket.belongsTo(Event);

// TicketType - Ticket associations
TicketType.hasMany(Ticket);
Ticket.belongsTo(TicketType);

module.exports = {
    User,
    Event,
    TicketType,
    Ticket
};
const Participant = require('./Participant')(sequelize);
const Message = require('./Message')(sequelize);
const MessageRead = require('./MessageRead')(sequelize);
const Notification = require('./Notification')(sequelize);
const Report = require('./Report')(sequelize);

// ===== DEFINIZIONE RELAZIONI =====

// User <-> Event (Organizzatore)
User.hasMany(Event, {
  foreignKey: 'organizerId',
  as: 'organizedEvents'
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

// Relazioni dirette con Participant per accesso facilitato
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

// Message <-> User (Lettura messaggi) - Many to Many attraverso MessageRead
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

// Relazioni dirette con MessageRead
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

// Report <-> User (Reviewer/Admin)
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