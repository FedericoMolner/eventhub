const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class TicketType extends Model {}

TicketType.init({
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
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    description: {
        type: DataTypes.TEXT
    }
}, {
    sequelize,
    modelName: 'TicketType'
});

module.exports = TicketType;