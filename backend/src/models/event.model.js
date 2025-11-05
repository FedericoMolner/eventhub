const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Event extends Model {
    isPublished() {
      return this.status === 'published' && this.isApproved;
    }

    isCancelled() {
      return this.status === 'cancelled';
    }

    isPast() {
      return new Date(this.endDate) < new Date();
    }

    getSummary() {
      const { id, title, description, location, startDate, endDate, status, isApproved } = this;
      return { id, title, description, location, startDate, endDate, status, isApproved };
    }

    hasAvailableCapacity() {
      return this.currentParticipants < this.capacity;
    }

    needsModeration() {
      return this.reportCount >= 3 && !this.isModerated;
    }
  }

  Event.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    organizerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: new Date().toISOString()
      }
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterStart(value) {
          if (value <= this.startDate) {
            throw new Error('La data di fine deve essere successiva alla data di inizio');
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'cancelled'),
      defaultValue: 'draft',
      allowNull: false
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    currentParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isModerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isReported: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reportCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    chatEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    timestamps: true,
    indexes: [
      {
        fields: ['organizerId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['startDate']
      },
      {
        fields: ['category']
      },
      {
        fields: ['location']
      },
      {
        fields: ['isApproved']
      }
    ]
  });

  return Event;
};const { Model, DataTypes } = require('sequelize');
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