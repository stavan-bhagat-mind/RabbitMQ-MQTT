const db = require("../models");
const { Op } = require("sequelize");

const messageController = {
  // Send Private Message
  async sendPrivateMessage(req, res) {
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
  },

  // Get Private Messages
  async getPrivateMessages(req, res) {
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
  },

  // Send Group Message
  async sendGroupMessage(req, res) {
    // try {
    //   const { groupId, content } = req.body;
    //   const senderId = req.user.id;
    //   // Verify user is a member of the group
    //   const group = await db.Group.findByPk(req.body.groupId);
    //   if (!group) {
    //     return res.status(404).json({
    //       success: false,
    //       message: "Group not found",
    //     });
    //   }
    //   const message = await Message.create({
    //     senderId,
    //     groupId,
    //     content,
    //     type: "group",
    //   });
    //   res.status(201).json({
    //     success: true,
    //     message: {
    //       id: message.id,
    //       content: message.content,
    //       senderId,
    //       groupId,
    //     },
    //   });
    // } catch (error) {
    //   res.status(500).json({
    //     success: false,
    //     message: error.message,
    //   });
    // }
  },

  // Get Group Messages
  async getGroupMessages(req, res) {
    try {
      const { groupId } = req.params;

      const messages = await db.Message.findAll({
        where: {
          groupId,
          type: "group",
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
  },
};

module.exports = messageController;
