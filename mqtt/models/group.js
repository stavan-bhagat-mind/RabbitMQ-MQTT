"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      // Group belongs to many users through group_members
      Group.belongsToMany(models.User, {
        through: models.GroupMember,
        foreignKey: "group_id",
        otherKey: "user_id",
        as: "members",
      });

      // Group belongs to creator
      Group.belongsTo(models.User, {
        foreignKey: "creator_id",
        as: "creator",
      });

      // Group can receive messages (polymorphic)
      Group.hasMany(models.Message, {
        foreignKey: "messageable_id",
        constraints: false,
        scope: {
          messageable_type: "Group",
        },
        as: "messages",
      });
    }
  }

  Group.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [3, 100],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      creator_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      is_private: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      timestamps: true,
      paranoid: true,
      deletedAt: "deleted_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      modelName: "Group",
      tableName: "groups",
    }
  );

  return Group;
};
  