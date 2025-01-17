"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class GroupMember extends Model {
    static associate(models) {
      // GroupMember belongs to Group
      GroupMember.belongsTo(models.Group, {
        foreignKey: "group_id",
      });

      // GroupMember belongs to User
      GroupMember.belongsTo(models.User, {
        foreignKey: "user_id",
      });
    }
  }

  GroupMember.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      group_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "groups",
          key: "id",
        },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      role: {
        type: DataTypes.ENUM("admin", "member"),
        defaultValue: "member",
      },
    },
    {
      sequelize,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      modelName: "GroupMember",
      tableName: "group_members",
      indexes: [
        {
          unique: true,
          fields: ["group_id", "user_id"],
        },
      ],
    }
  );

  return GroupMember;
};
  