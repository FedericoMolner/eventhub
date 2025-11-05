// backend/src/models/Notification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    type: {
      type: DataTypes.ENUM(
        'event_registration',
        'event_cancellation',
        'event_update',
        'event_cancelled',
        'event_reminder',
        'event_reported',
        'message',
        'admin_action'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    message: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    relatedEventId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'events',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    relatedMessageId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    link: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      { fields: ['recipientId', 'isRead', 'createdAt'] },
      { fields: ['createdAt'] }
    ]
  });

  Notification.markAsRead = async function(userId, notificationIds) {
    return await this.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      {
        where: {
          recipientId: userId,
          id: notificationIds
        }
      }
    );
  };

  Notification.countUnread = async function(userId) {
    return await this.count({
      where: {
        recipientId: userId,
        isRead: false
      }
    });
  };

  return Notification;
};