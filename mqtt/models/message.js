"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.User, {
        as: "sender",
        foreignKey: "senderId",
      });

      Message.belongsTo(models.User, {
        as: "receiver",
        foreignKey: "receiverId",
      });

      //   Message.belongsTo(models.Group, {
      //     foreignKey: "groupId",
      //   });
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
      // groupId: {
      //   type: DataTypes.UUID,
      //   allowNull: true,
      // },
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
