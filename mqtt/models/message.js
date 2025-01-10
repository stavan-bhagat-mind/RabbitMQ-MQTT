"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      //messages belong to a user as a sender
      Message.belongsTo(models.User, {
        as: "sender",
        foreignKey: "senderId",
      });
      //messages belong to a user as a receiver
      Message.belongsTo(models.User, {
        as: "receiver",
        foreignKey: "receiverId",
      });
      // messages belong to a group
      Message.belongsTo(models.Group, {
        foreignKey: "groupId",
      });
    }
  }

  Message.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("private", "group"),
        allowNull: false,
        defaultValue: "private",
      },
      status: {
        type: DataTypes.ENUM("sent", "delivered", "read"),
        defaultValue: "sent",
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      receiverId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      groupId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      // underscored: true,
      timestamps: true,
      paranoid: true,
      deletedAt: "deleted_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      modelName: "Message",
      tableName: "messages",
      indexes: [
        {
          fields: ["senderId", "receiverId", "groupId"],
        },
      ],
    }
  );

  return Message;
};
