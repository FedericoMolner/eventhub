const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ChatMessage extends Model {
        static associate(models) {
            // Associazione con l'utente che ha inviato il messaggio
            ChatMessage.belongsTo(models.User, {
                foreignKey: 'senderId',
                as: 'sender'
            });

            // Associazione con l'evento a cui appartiene la chat
            ChatMessage.belongsTo(models.Event, {
                foreignKey: 'eventId',
                as: 'event'
            });

            // Associazione con gli utenti che hanno letto il messaggio
            ChatMessage.belongsToMany(models.User, {
                through: 'MessageReads',
                as: 'readBy',
                foreignKey: 'messageId',
                otherKey: 'userId'
            });
        }
    }

    ChatMessage.init({
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
            }
        },
        senderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 1000] // Limita la lunghezza del messaggio
            }
        },
        type: {
            type: DataTypes.ENUM('text', 'image', 'system'),
            defaultValue: 'text',
            allowNull: false
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
            comment: 'Metadata aggiuntivi per il messaggio (es. dimensioni immagine, link preview, etc.)'
        },
        isEdited: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        editedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'ChatMessage',
        tableName: 'chat_messages',
        paranoid: true, // Soft delete
        indexes: [
            {
                fields: ['eventId']
            },
            {
                fields: ['senderId']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    return ChatMessage;
};