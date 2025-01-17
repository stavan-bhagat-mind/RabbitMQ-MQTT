"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("messages", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      content: {
        type: Sequelize.TEXT("long"),
        allowNull: false,
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      messageable_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      messageable_type: {
        type: Sequelize.ENUM("User", "Group"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("sent", "delivered", "read"),
        defaultValue: "sent",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex("messages", ["sender_id"]);
    await queryInterface.addIndex("messages", [
      "messageable_id",
      "messageable_type",
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("messages");
  },
};
