const db = require("../models");
const { Op } = require("sequelize");

// Send Private Message
async function sendPrivateMessage(req, res) {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    const message = await db.Message.create({
      senderId,
      receiverId,
      content,
      type: "private",
    });

    res.status(201).json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId,
        receiverId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Get Private Messages
async function getPrivateMessages(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await db.Message.findAll({
      where: {
        type: "private",
        [Op.or]: [
          {
            senderId: currentUserId,
            receiverId: userId,
          },
          {
            senderId: userId,
            receiverId: currentUserId,
          },
        ],
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "username"],
        },
      ],
      order: [["createdAt", "ASC"]],
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

module.exports = {
  sendPrivateMessage,
  getPrivateMessages,
};
