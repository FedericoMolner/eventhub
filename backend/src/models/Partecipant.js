// backend/src/models/Participant.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Participant = sequelize.define('Participant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    status: {
      type: DataTypes.ENUM('registered', 'cancelled', 'attended'),
      defaultValue: 'registered',
      allowNull: false
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'participants',
    timestamps: true,
    indexes: [
      { 
        unique: true, 
        fields: ['userId', 'eventId'],
        name: 'unique_user_event'
      },
      { fields: ['eventId', 'status'] },
      { fields: ['userId'] }
    ]
  });

  return Participant;
};