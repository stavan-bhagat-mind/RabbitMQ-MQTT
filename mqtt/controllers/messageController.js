const { Models } = require("../models");
const mqttService = require("../utils/mqttService");
const { Op } = require("sequelize");

function sendPrivateMessage(req, res) {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.userId;
ć
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

    // Mark unread messages as read
    const unreadMessages = messages.filter(
      (msg) => msg.receiverId === currentUserId && msg.status !== "read"
    );

    for (const msg of unreadMessages) {
      mqttService.publish("chat/read", {
        messageId: msg.id,
        readerId: currentUserId,
      });
    }

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
//send group messages
async function sendGroupMessage(req, res) {
  try {
    const { groupId, content } = req.body;
    const senderId = req.userId;

    // Verify user is a member of the group
    const membership = await Models.GroupMember.findOne({
      where: {
        groupId,
        userId: senderId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "User is not a member of this group",
      });
    }

    mqttService.publish("chat/group/message", {
      senderId,
      groupId,
      content,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Group message queued for sending",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

//getGroupMessages
async function getGroupMessages(req, res) {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    // Verify user is a member of the group
    const membership = await Models.GroupMember.findOne({
      where: {
        groupId,
        userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "User is not a member of this group",
      });
    }

    const messages = await Models.Message.findAll({
      where: {
        groupId,
        type: "group",
      },
      include: [
        {
          model: Models.User,
          as: "sender",
          attributes: ["id", "username"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    // Mark messages as read
    const unreadMessages = messages.filter(
      (msg) => !msg.readBy?.includes(userId)
    );

    for (const msg of unreadMessages) {
      mqttService.publish("chat/group/read", {
        messageId: msg.id,
        groupId,
        readerId: userId,
      });
    }

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

module.exports = {
  sendPrivateMessage,
  getPrivateMessages,
  markMessageAsRead,
  sendGroupMessage,
  getGroupMessages,
};
