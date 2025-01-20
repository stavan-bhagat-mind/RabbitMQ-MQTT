const { Models } = require("../models");
const mqttService = require("../utils/mqttService");
const { Op } = require("sequelize");

async function sendMessage(req, res) {
  try {
    const { recipient_id, recipient_type, content } = req.body;
    const sender_id = req.userId;

    // Validate recipient
    let recipient;
    if (recipient_type === "User") {
      recipient = await Models.User.findByPk(recipient_id);
    } else if (recipient_type === "Group") {
      recipient = await Models.Group.findByPk(recipient_id);

      // Check group membership
      const membership = await Models.GroupMember.findOne({
        where: { group_id: recipient_id, user_id: sender_id },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this group",
        });
      }
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    // Publish message via MQTT
    const mqttTopic = recipient_type === "User" ? "chat/send" : "group/send";
    mqttService.publish(mqttTopic, {
      sender_id,
      recipient_id,
      recipient_type,
      content,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Message queued for sending",
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getMessages(req, res) {
  try {
    const { recipient_id, recipient_type } = req.query;
    const current_user_id = req.userId;

    // Validate recipient and access
    let recipient;
    if (recipient_type === "User") {
      recipient = await Models.User.findByPk(recipient_id);
    } else if (recipient_type === "Group") {
      recipient = await Models.Group.findByPk(recipient_id);

      // Check group membership
      const membership = await Models.GroupMember.findOne({
        where: { group_id: recipient_id, user_id: current_user_id },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this group",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient type",
      });
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Query conditions
    let whereCondition = {
      messageable_type: recipient_type,
    };

    if (recipient_type === "User") {
      whereCondition[Op.or] = [
        { sender_id: current_user_id, messageable_id: recipient_id },
        { sender_id: recipient_id, messageable_id: current_user_id },
      ];
    } else {
      whereCondition.messageable_id = recipient_id;
    }

    // Fetch messages
    const { count, rows: messages } = await Models.Message.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Models.User,
          as: "sender",
          attributes: ["id", "username"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      messages,
      pagination: {
        total: count,
        page,
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function markAsRead(req, res) {
  try {
    const { message_id } = req.params;
    const reader_id = req.userId;

    const message = await Models.Message.findByPk(message_id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Publish read status via MQTT
    const topic =
      message.messageable_type === "User" ? "chat/read" : "group/read";
    mqttService.publish(topic, {
      message_id,
      reader_id,
      group_id:
        message.messageable_type === "Group"
          ? message.messageable_id
          : undefined,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Mark As Read Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  sendMessage,
  getMessages,
  markAsRead,
};
