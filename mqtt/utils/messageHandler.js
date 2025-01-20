// const { Models } = require("../models");
// const mqttService = require("./mqttService");

// function initializeMessageHandlers() {
//   mqttService.subscribe("chat/message", handleIncomingMessage);
//   mqttService.subscribe("chat/read", handleMessageRead);
//   mqttService.subscribe("chat/group/message", handleGroupMessage);
//   mqttService.subscribe("chat/group/read", handleGroupMessageRead);
//   mqttService.subscribe("group/create", handleGroupCreation);
// }

// // async function handleIncomingMessage(payload) {
// //   try {
// //     const { messageId } = payload;
// //     const message = await Models.Message.findByPk(messageId);

// //     if (!message) {
// //       console.error("Message not found:", messageId);
// //       return;
// //     }

// //     // Notify receiver
// //     mqttService.publish(`chat/message/${payload.receiver_id}`, {
// //       messageId: message.id,
// //       ...payload,
// //     });

// //     // Update message status
// //     await message.update({ status: "delivered" });

// //     // Confirm delivery to sender
// //     mqttService.publish(`chat/delivery/${payload.sender_id}`, {
// //       messageId: message.id,
// //       status: "delivered",
// //     });
// //   } catch (error) {
// //     console.error("Message handling error:", error);
// //   }
// // }
// async function handleIncomingMessage(req, res) {
//   try {
//     const { recipient_id, recipient_type, content } = req.body;
//     const sender_id = req.userId;

//     // Validate recipient
//     let recipient;
//     if (recipient_type === "User") {
//       recipient = await Models.User.findByPk(recipient_id);
//     } else if (recipient_type === "Group") {
//       recipient = await Models.Group.findByPk(recipient_id);

//       // Check group membership for group messages
//       const membership = await Models.GroupMember.findOne({
//         where: {
//           group_id: recipient_id,
//           user_id: sender_id,
//         },
//       });

//       if (!membership) {
//         return res.status(403).json({
//           success: false,
//           message: "You are not a member of this group",
//         });
//       }
//     }

//     if (!recipient) {
//       return res.status(404).json({
//         success: false,
//         message: "Recipient not found",
//       });
//     }

//     // Publish message via MQTT based on recipient type
//     const mqttTopic = recipient_type === "User" ? "chat/send" : "group/send";

//     mqttService.publish(mqttTopic, {
//       sender_id,
//       recipient_id,
//       recipient_type,
//       content,
//       timestamp: new Date(),
//     });

//     res.status(201).json({
//       success: true,
//       message: "Message queued for sending",
//     });
//   } catch (error) {
//     console.error("Send Message Error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// async function handleMessageRead(payload) {
//   try {
//     const message = await Models.Message.findByPk(payload.messageId);

//     if (!message) {
//       console.error("Message not found:", payload.messageId);
//       return;
//     }

//     await message.update({ status: "read" });

//     // Notify sender
//     mqttService.publish(`chat/read/${message.senderId}`, {
//       messageId: payload.messageId,
//       readBy: payload.readerId,
//       timestamp: new Date(),
//     });
//   } catch (error) {
//     console.error("Message read handling error:", error);
//   }
// }

// async function handleGroupMessage(payload) {
//   try {
//     const { messageId, groupId } = payload;
//     const message = await Models.Message.findByPk(messageId);

//     if (!message) {
//       console.error("Message not found:", messageId);
//       return;
//     }

//     const members = await Models.GroupMember.findAll({
//       where: { groupId },
//     });

//     // Notify all members except sender
//     for (const member of members) {
//       if (member.userId !== message.senderId) {
//         mqttService.publish(`chat/group/${member.userId}`, {
//           messageId: message.id,
//           groupId,
//           senderId: message.senderId,
//           content: message.content,
//           timestamp: new Date(),
//         });
//       }
//     }

//     await message.update({ status: "delivered" });

//     // Confirm delivery to sender
//     mqttService.publish(`chat/delivery/${message.senderId}`, {
//       messageId: message.id,
//       status: "delivered",
//     });
//   } catch (error) {
//     console.error("Group message handling error:", error);
//   }
// }

// async function handleGroupMessageRead(payload) {
//   try {
//     const { messageId, readerId } = payload;
//     const message = await Models.Message.findByPk(messageId);

//     if (!message) {
//       console.error("Message not found:", messageId);
//       return;
//     }

//     const readBy = new Set(message.readBy || []);
//     readBy.add(readerId);

//     await message.update({ readBy: Array.from(readBy) });

//     mqttService.publish(`chat/group/${message.groupId}/read`, {
//       messageId,
//       readerId,
//       timestamp: new Date(),
//     });
//   } catch (error) {
//     console.error("Group message read handling error:", error);
//   }
// }

// async function handleGroupCreation(payload) {
//   try {
//     const group = await Models.Group.create({
//       name: payload.name,
//       creator_id: payload.creator_id,
//       is_private: payload.is_private,
//     });

//     await Models.GroupMember.create({
//       group_id: group.id,
//       user_id: payload.creator_id,
//       role: "admin",
//     });
//     mqttService.publish("group/create/response", {
//       success: true,
//       groupId: group.id,
//     });
//   } catch (error) {
//     mqttService.publish("group/create/response", {
//       success: false,
//       error: error.message,
//     });
//   }
// }

// // Initialize handlers when module is imported
// initializeMessageHandlers();

// module.exports = {
//   handleIncomingMessage,
//   handleMessageRead,
//   handleGroupMessage,
//   handleGroupMessageRead,
// };

const { Models } = require("../models");
const mqttService = require("./mqttService");

function initializeMessageHandlers() {
  // mqttService.subscribe("chat/send", handleIncomingMessage);
  mqttService.subscribe("chat/send", handleIncomingMessage);
  mqttService.subscribe("chat/read", handleMessageRead);
  mqttService.subscribe("group/send", handleGroupMessage);
  mqttService.subscribe("group/read", handleGroupMessageRead);
  mqttService.subscribe("group/create", handleGroupCreation);
}

async function handleIncomingMessage(payload) {
  try {
    console.log("hello honey boney");
    const { sender_id, recipient_id, recipient_type, content, timestamp } =
      payload;

    // Create message in database
    const message = await Models.Message.create({
      sender_id,
      messageable_id: recipient_id,
      messageable_type: recipient_type,
      content,
      status: "sent",
    });

    // For private messages, notify recipient
    if (recipient_type === "User") {
      mqttService.publish(`chat/receive/${recipient_id}`, {
        message_id: message.id,
        sender_id,
        content: message.content,
        timestamp,
      });
    }

    // Confirm delivery to sender
    mqttService.publish(`chat/delivery/${sender_id}`, {
      message_id: message.id,
      status: "delivered",
    });

    await message.update({ status: "delivered" });
  } catch (error) {
    console.error("Message handling error:", error);
  }
}

async function handleMessageRead(payload) {
  try {
    const { message_id, reader_id } = payload;
    const message = await Models.Message.findByPk(message_id);

    if (!message) {
      console.error("Message not found:", message_id);
      return;
    }

    await message.update({ status: "read" });

    // Notify sender that message was read
    mqttService.publish(`chat/read/${message.sender_id}`, {
      message_id,
      reader_id,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Message read handling error:", error);
  }
}

async function handleGroupMessage(payload) {
  try {
    const { sender_id, recipient_id, content, timestamp } = payload;

    // Create group message
    const message = await Models.Message.create({
      sender_id,
      messageable_id: recipient_id,
      messageable_type: "Group",
      content,
      status: "sent",
    });

    // Get all group members
    const members = await Models.GroupMember.findAll({
      where: { group_id: recipient_id },
    });

    // Notify all members except sender
    for (const member of members) {
      if (member.user_id !== sender_id) {
        mqttService.publish(`chat/group/receive/${member.user_id}`, {
          message_id: message.id,
          group_id: recipient_id,
          sender_id,
          content: message.content,
          timestamp,
        });
      }
    }

    // Confirm delivery to sender
    mqttService.publish(`chat/delivery/${sender_id}`, {
      message_id: message.id,
      status: "delivered",
    });

    await message.update({ status: "delivered" });
  } catch (error) {
    console.error("Group message handling error:", error);
  }
}

async function handleGroupMessageRead(payload) {
  try {
    const { message_id, reader_id, group_id } = payload;
    const message = await Models.Message.findByPk(message_id);

    if (!message) {
      console.error("Message not found:", message_id);
      return;
    }

    const readBy = new Set(message.readBy || []);
    readBy.add(reader_id);
    await message.update({ readBy: Array.from(readBy) });

    // Notify group about who read the message
    mqttService.publish(`chat/group/${group_id}/read`, {
      message_id,
      reader_id,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Group message read handling error:", error);
  }
}

async function handleGroupCreation(payload) {
  try {
    const group = await Models.Group.create({
      name: payload.name,
      creator_id: payload.creator_id,
      is_private: payload.is_private,
    });

    await Models.GroupMember.create({
      group_id: group.id,
      user_id: payload.creator_id,
      role: "admin",
    });
    mqttService.publish("group/create/response", {
      success: true,
      groupId: group.id,
    });
  } catch (error) {
    mqttService.publish("group/create/response", {
      success: false,
      error: error.message,
    });
  }
}
// // Initialize handlers when module is imported
initializeMessageHandlers();
module.exports = {
  // initializeMessageHandlers,
  handleIncomingMessage,
  handleMessageRead,
  handleGroupMessage,
  handleGroupMessageRead,
};
