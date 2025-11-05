// backend/src/models/Report.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    reportedEventId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    reason: {
      type: DataTypes.ENUM(
        'inappropriate_content',
        'spam',
        'misleading_info',
        'dangerous_activity',
        'harassment',
        'copyright',
        'other'
      ),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Il motivo è obbligatorio' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La descrizione è obbligatoria' },
        len: {
          args: [1, 500],
          msg: 'La descrizione non può superare 500 caratteri'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewing', 'resolved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    reviewedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Le note non possono superare 1000 caratteri'
        }
      }
    },
    action: {
      type: DataTypes.ENUM('none', 'warning', 'event_removed', 'user_blocked'),
      defaultValue: 'none'
    }
  }, {
    tableName: 'reports',
    timestamps: true,
    indexes: [
      { fields: ['reportedEventId'] },
      { fields: ['reporterId'] },
      { fields: ['status', 'createdAt'] }
    ]
  });

  return Report;
};