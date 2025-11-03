const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Ticket extends Model {}

Ticket.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    eventId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Events',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    ticketTypeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'TicketTypes',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'used', 'refunded', 'cancelled'),
        defaultValue: 'active'
    },
    qrCode: {
        type: DataTypes.STRING
    },
    purchaseDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    validationDate: {
        type: DataTypes.DATE
    },
    refundDate: {
        type: DataTypes.DATE
    }
}, {
    sequelize,
    modelName: 'Ticket'
});

module.exports = Ticket;