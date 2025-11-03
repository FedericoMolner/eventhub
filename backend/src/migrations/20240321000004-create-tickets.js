'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tickets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      eventId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ticketTypeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'TicketTypes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('active', 'used', 'refunded', 'cancelled'),
        defaultValue: 'active'
      },
      qrCode: {
        type: Sequelize.STRING
      },
      purchaseDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      validationDate: {
        type: Sequelize.DATE
      },
      refundDate: {
        type: Sequelize.DATE
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('Tickets', ['userId']);
    await queryInterface.addIndex('Tickets', ['eventId']);
    await queryInterface.addIndex('Tickets', ['ticketTypeId']);
    await queryInterface.addIndex('Tickets', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Tickets');
  }
};