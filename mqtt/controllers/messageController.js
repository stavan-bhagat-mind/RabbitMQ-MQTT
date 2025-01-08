const { Models } = require("../models");
const mqttService = require("../utils/mqttService");
const { Op } = require("sequelize");

function sendPrivateMessage(req, res) {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.userId;

    // Publish message via MQTT
    mqttService.publish("chat/message", {
      senderId,
      receiverId,
      content,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Message queued for sending",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getPrivateMessages(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const messages = await Models.Message.findAll({
      where: {
        type: "private",
        [Op.or]: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId },
        ],
      },
      order: [["created_at", "ASC"]],
    });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

function markMessageAsRead(req, res) {
  try {
    const { messageId } = req.params;
    const readerId = req.userId;

    // Publish read status via MQTT
    mqttService.publish("chat/read", {
      messageId,
      readerId,
    });

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  sendPrivateMessage,
  getPrivateMessages,
  markMessageAsRead,
};
