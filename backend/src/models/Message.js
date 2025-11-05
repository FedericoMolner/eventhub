// backend/src/models/Message.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Il contenuto è obbligatorio' },
        len: {
          args: [1, 1000],
          msg: 'Il messaggio non può superare 1000 caratteri'
        }
      }
    },
    type: {
      type: DataTypes.ENUM('text', 'system', 'image'),
      defaultValue: 'text',
      allowNull: false
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      { fields: ['eventId', 'createdAt'] },
      { fields: ['senderId'] }
    ]
  });

  return Message;
};