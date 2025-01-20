"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Message, {
        foreignKey: "sender_id",
        as: "sentMessages",
      });

      // User can receive messages (polymorphic)
      User.hasMany(models.Message, {
        foreignKey: "messageable_id",
        constraints: false,
        scope: {
          messageable_type: "User",
        },
        as: "receivedMessages",
      });

      User.belongsToMany(models.Group, {
        through: models.GroupMember,
        foreignKey: "user_id",
        otherKey: "group_id",
        as: "groups",
      });

      User.hasMany(models.Group, {
        foreignKey: "creator_id",
        as: "createdGroups",
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50],
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      client_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_online: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      last_login: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      timestamps: true,
      paranoid: true,
      deletedAt: "deleted_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      modelName: "User",
      tableName: "users",
      indexes: [
        {
          unique: true,
          fields: ["username", "email"],
        },
      ],
    }
  );

  return User;
};
  