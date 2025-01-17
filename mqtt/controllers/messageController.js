// const { Models } = require("../models");
// const mqttService = require("../utils/mqttService");
// const { Op } = require("sequelize");

// function sendPrivateMessage(req, res) {
//   try {
//     const { receiverId, content } = req.body;
//     const senderId = req.userId;
// ć
//     mqttService.publish("chat/ ", {
//       senderId,
//       receiverId,
//       content,
//       timestamp: new Date(),
//     });

//     res.status(201).json({
//       success: true,
//       message: "Message queued for sending",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// async function getPrivateMessages(req, res) {
//   try {
//     const { userId } = req.params;
//     const currentUserId = req.userId;

//     const messages = await Models.Message.findAll({
//       where: {
//         type: "private",
//         [Op.or]: [
//           { senderId: currentUserId, receiverId: userId },
//           { senderId: userId, receiverId: currentUserId },
//         ],
//       },
//       order: [["created_at", "ASC"]],
//     });

//     // Mark unread messages as read
//     const unreadMessages = messages.filter(
//       (msg) => msg.receiverId === currentUserId && msg.status !== "read"
//     );

//     for (const msg of unreadMessages) {
//       mqttService.publish("chat/read", {
//         messageId: msg.id,
//         readerId: currentUserId,
//       });
//     }

//     res.json({
//       success: true,
//       messages,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// function markMessageAsRead(req, res) {
//   try {
//     const { messageId } = req.params;
//     const readerId = req.userId;

//     mqttService.publish("chat/read", {
//       messageId,
//       readerId,
//     });

//     res.json({
//       success: true,
//       message: "Message marked as read",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }
// //send group messages
// async function sendGroupMessage(req, res) {
//   try {
//     const { groupId, content } = req.body;
//     const senderId = req.userId;

//     // Verify user is a member of the group
//     const membership = await Models.GroupMember.findOne({
//       where: {
//         groupId,
//         userId: senderId,
//       },
//     });

//     if (!membership) {
//       return res.status(403).json({
//         success: false,
//         message: "User is not a member of this group",
//       });
//     }

//     mqttService.publish("chat/group/message", {
//       senderId,
//       groupId,
//       content,
//       timestamp: new Date(),
//     });

//     res.status(201).json({
//       success: true,
//       message: "Group message queued for sending",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// //getGroupMessages
// async function getGroupMessages(req, res) {
//   try {
//     const { groupId } = req.params;
//     const userId = req.userId;

//     // Verify user is a member of the group
//     const membership = await Models.GroupMember.findOne({
//       where: {
//         groupId,
//         userId,
//       },
//     });

//     if (!membership) {
//       return res.status(403).json({
//         success: false,
//         message: "User is not a member of this group",
//       });
//     }

//     const messages = await Models.Message.findAll({
//       where: {
//         groupId,
//         type: "group",
//       },
//       include: [
//         {
//           model: Models.User,
//           as: "sender",
//           attributes: ["id", "username"],
//         },
//       ],
//       order: [["created_at", "ASC"]],
//     });

//     // Mark messages as read
//     const unreadMessages = messages.filter(
//       (msg) => !msg.readBy?.includes(userId)
//     );

//     for (const msg of unreadMessages) {
//       mqttService.publish("chat/group/read", {
//         messageId: msg.id,
//         groupId,
//         readerId: userId,
//       });
//     }

//     res.json({
//       success: true,
//       messages,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// module.exports = {
//   sendPrivateMessage,
//   getPrivateMessages,
//   markMessageAsRead,
//   sendGroupMessage,
//   getGroupMessages,
// };

const { Models } = require("../models");
const mqttService = require("../utils/mqttService");
const { Op } = require("sequelize");

// async function sendPrivateMessage(req, res) {
//   try {
//     const { receiver_id, content } = req.body;
//     const sender_id = req.userId;

//     // Check if receiver exists
//     const receiver = await Models.User.findByPk(receiver_id);
//     if (!receiver) {
//       return res.status(404).json({
//         success: false,
//         message: "Receiver not found",
//       });
//     }

//     // Create message first to get ID
//     const message = await Models.Message.create({
//       sender_id,
//       receiver_id,
//       content,
//       type: "private",
//       status: "sent",
//     });

//     mqttService.publish("chat/message", {
//       messageId: message.id,
//       sender_id,
//       receiver_id,
//       content,
//       timestamp: new Date(),
//     });

//     res.status(201).json({
//       success: true,
//       message: "Message sent",
//       data: message,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }
async function sendPrivateMessage(req, res) {
  try {
    const { recipient_id, recipient_type, content } = req.body;
    const sender_id = req.userId;

    // Validate recipient
    let recipient;
    if (recipient_type === "User") {
      recipient = await Models.User.findByPk(recipient_id);
    } else if (recipient_type === "Group") {
      recipient = await Models.Group.findByPk(recipient_id);

      // Check group membership for group messages
      const membership = await Models.GroupMember.findOne({
        where: {
          group_id: recipient_id,
          user_id: sender_id,
        },
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

    // Create message
    const message = await Models.Message.create({
      sender_id,
      content,
      messageable_id: recipient_id,
      messageable_type: recipient_type,
      status: "sent",
    });

    // Publish message via MQTT
    // mqttService.publish(`chat/${recipient_type.toLowerCase()}`, {
    //   messageId: message.id,
    //   senderId: sender_id,
    //   recipientId: recipient_id,
    //   content: message.content,
    //   timestamp: new Date(),
    // });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// async function getPrivateMessages(req, res) {
//   try {
//     const { recipient_id, type } = req.query;
//     const currentUserId = req.userId;

//     // Validate recipient based on type
//     let recipient;
//     if (type === "User") {
//       recipient = await Models.User.findByPk(recipient_id);
//     } else if (type === "Group") {
//       recipient = await Models.Group.findByPk(recipient_id);

//       // Check group membership for group messages
//       const membership = await Models.GroupMember.findOne({
//         where: {
//           group_id: recipient_id,
//           user_id: currentUserId,
//         },
//       });

//       if (!membership) {
//         return res.status(403).json({
//           success: false,
//           message: "You are not a member of this group",
//         });
//       }
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid recipient type. Must be 'User' or 'Group'",
//       });
//     }

//     if (!recipient) {
//       return res.status(404).json({
//         success: false,
//         message: "Recipient not found",
//       });
//     }

//     // Retrieve messages with pagination
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 50;
//     const offset = (page - 1) * limit;

//     const { count, rows: messages } = await Models.Message.findAndCountAll({
//       where: {
//         messageable_id: recipient_id,
//         messageable_type: type,
//       },
//       include: [
//         {
//           model: Models.User,
//           as: "sender",
//           attributes: ["id", "username"],
//         },
//       ],
//       order: [["created_at", "DESC"]],
//       limit,
//       offset,
//     });

//     res.json({
//       success: true,
//       messages,
//       pagination: {
//         total: count,
//         page,
//         pageSize: limit,
//         totalPages: Math.ceil(count / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Get Messages Error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

async function getPrivateMessages(req, res) {
  try {
    const { recipient_id } = req.params;
    const currentUserId = req.userId;

    // Validate recipient
    const recipient = await Models.User.findByPk(recipient_id);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    // Retrieve messages with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows: messages } = await Models.Message.findAndCountAll({
      where: {
        messageable_type: "User",
        [Op.or]: [
          {
            sender_id: currentUserId,
            messageable_id: recipient_id,
          },
          {
            sender_id: recipient_id,
            messageable_id: currentUserId,
          },
        ],
      },
      include: [
        {
          model: Models.User,
          as: "sender",
          attributes: ["id", "username"],
        },
        {
          model: Models.User,
          as: "recipientUser",
          attributes: ["id", "username"],
        },
      ],
      order: [["created_at", "ASC"]],
      limit,
      offset,
    });

    // Transform messages to include sender and recipient details
    // const transformedMessages = messages.map(message => ({
    //   ...message.toJSON(),
    //   isSentByCurrentUser: message.sender_id === currentUserId,
    // }));

    res.json({
      success: true,
      // messages: transformedMessages,
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

    // Create message first
    const message = await Models.Message.create({
      senderId,
      groupId,
      content,
      type: "group",
      status: "sent",
      readBy: [senderId], // Sender has read the message
    });

    mqttService.publish("chat/group/message", {
      messageId: message.id,
      senderId,
      groupId,
      content,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

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

    // Bulk update read status
    const unreadMessages = messages.filter(
      (msg) => !msg.readBy?.includes(userId)
    );
    await Promise.all(
      unreadMessages.map((msg) =>
        Models.Message.update(
          { readBy: [...(msg.readBy || []), userId] },
          { where: { id: msg.id } }
        )
      )
    );

    // Notify about read messages
    unreadMessages.forEach((msg) => {
      mqttService.publish("chat/group/read", {
        messageId: msg.id,
        groupId,
        readerId: userId,
      });
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
  sendGroupMessage,
  getGroupMessages,
};
