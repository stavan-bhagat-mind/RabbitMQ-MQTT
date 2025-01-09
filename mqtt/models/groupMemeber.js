// models/groupMember.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class GroupMember extends Model {
    static associate(models) {
      // GroupMember belongs to Group
      GroupMember.belongsTo(models.Group, {
        foreignKey: "groupId",
      });
      // GroupMember belongs to User
      GroupMember.belongsTo(models.User, {
        foreignKey: "userId",
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
      groupId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("admin", "member"),
        defaultValue: "member",
      },
    },
    {
      sequelize,
    //   underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      modelName: "GroupMember",
      tableName: "group_members",
    }
  );

  return GroupMember;
};
