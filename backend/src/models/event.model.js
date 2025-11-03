const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Event extends Model {}

Event.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    locationName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    latitude: {
        type: DataTypes.FLOAT
    },
    longitude: {
        type: DataTypes.FLOAT
    },
    category: {
        type: DataTypes.ENUM('music', 'sports', 'theater', 'conference', 'exhibition', 'other'),
        allowNull: false
    },
    image: {
        type: DataTypes.STRING
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    status: {
        type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'),
        defaultValue: 'draft'
    },
    organizerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'Event'
});

module.exports = Event;