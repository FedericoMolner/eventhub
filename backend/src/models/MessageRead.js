// backend/src/models/MessageRead.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MessageRead = sequelize.define('MessageRead', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'messages',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    readAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'message_reads',
    timestamps: false,
    indexes: [
      { 
        unique: true, 
        fields: ['messageId', 'userId'],
        name: 'unique_message_user_read'
      },
      { fields: ['userId'] }
    ]
  });

  return MessageRead;
};