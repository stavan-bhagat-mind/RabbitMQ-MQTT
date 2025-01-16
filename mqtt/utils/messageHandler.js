// const { Models } = require("../models");
// const mqttService = require("./mqttService");

// function initializeMessageHandlers() {
//   // Subscribe to private message topic
//   mqttService.subscribe("chat/message", handleIncomingMessage);
//   mqttService.subscribe("chat/read", handleMessageRead);
//   mqttService.subscribe("chat/group/message", handleGroupMessage);
//   mqttService.subscribe("chat/group/read", handleGroupMessageRead);
//   mqttService.subscribe("group/create", handleGroupCreation);
// }

// async function handleIncomingMessage(payload) {
//   try {
//     // Create message in database
//     const message = await Models.Message.create({
//       senderId: payload.senderId,
//       receiverId: payload.receiverId,
//       content: payload.content,
//       type: "private",
//       status: "sent",
//     });

//     // Notify receiver
//     mqttService.publish(`chat/message/${payload.receiverId}`, {
//       messageId: message.id,
//       ...payload,
//       timestamp: new Date(),
//     });

//     // Update message status
//     await message.update({ status: "delivered" });

//     // Confirm message delivery to sender
//     mqttService.publish(`chat/delivery/${payload.senderId}`, {
//       messageId: message.id,
//       status: "delivered",
//     });
//   } catch (error) {
//     console.error("Message handling error:", error);
//   }
// }

// async function handleMessageRead(payload) {
//   try {
//     // Find and update message status
//     const message = await Models.Message.findByPk(payload.messageId);

//     if (message) {
//       message.status = "read";
//       await message.save();

//       // Notify sender about read status
//       mqttService.publish(`chat/read/${message.senderId}`, {
//         messageId: payload.messageId,
//         readBy: payload.readerId,
//         timestamp: new Date(),
//       });
//     }
//   } catch (error) {
//     console.error("Message read handling error:", error);
//   }
// }

// async function handleGroupMessage(payload) {
//   try {
//     const members = await Models.GroupMember.findAll({
//       where: { groupId: payload.groupId },
//     });

//     const message = await Models.Message.create({
//       senderId: payload.senderId,
//       groupId: payload.groupId,
//       content: payload.content,
//       type: "group",
//       readBy: [payload.senderId],
//       status: "sent",
//     });

//     members.forEach((member) => {
//       if (member.userId !== payload.senderId) {
//         mqttService.publish(`chat/group/${member.userId}`, {
//           messageId: message.id,
//           groupId: payload.groupId,
//           senderId: payload.senderId,
//           content: payload.content,
//           timestamp: payload.timestamp,
//         });
//       }
//     });

//     await message.update({ status: "delivered" });

//     mqttService.publish(`chat/delivery/${payload.senderId}`, {
//       messageId: message.id,
//       status: "delivered",
//     });
//   } catch (error) {
//     console.error("Group message handling error:", error);
//   }
// }

// async function handleGroupMessageRead(payload) {
//   try {
//     const message = await Models.Message.findByPk(payload.messageId);

//     if (message) {
//       const readBy = message.readBy || [];
//       if (!readBy.includes(payload.readerId)) {
//         message.readBy = [...readBy, payload.readerId];
//         await message.save();
//       }

//       mqttService.publish(`chat/group/${payload.groupId}/read`, {
//         messageId: payload.messageId,
//         readerId: payload.readerId,
//         timestamp: new Date(),
//       });
//     }
//   } catch (error) {
//     console.error("Group message read handling error:", error);
//   }
// }

// async function handleGroupCreation(payload) {
//   try {
//     const group = await Models.Group.create({
//       name: payload.name,
//       creatorId: payload.creatorId,
//       isPrivate: payload.isPrivate,
//     });

//     await Models.GroupMember.create({
//       groupId: group.id,
//       userId: payload.creatorId,
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
//   handleGroupCreation,
//   handleGroupMessageRead,
// };

const { Models } = require("../models");
const mqttService = require("./mqttService");

function initializeMessageHandlers() {
  mqttService.subscribe("chat/message", handleIncomingMessage);
  mqttService.subscribe("chat/read", handleMessageRead);
  mqttService.subscribe("chat/group/message", handleGroupMessage);
  mqttService.subscribe("chat/group/read", handleGroupMessageRead);
  mqttService.subscribe("group/create", handleGroupCreation);
}

async function handleIncomingMessage(payload) {
  try {
    const { messageId } = payload;
    const message = await Models.Message.findByPk(messageId);

    if (!message) {
      console.error("Message not found:", messageId);
      return;
    }

    // Notify receiver
    mqttService.publish(`chat/message/${payload.receiver_id}`, {
      messageId: message.id,
      ...payload,
    });

    // Update message status
    await message.update({ status: "delivered" });

    // Confirm delivery to sender
    mqttService.publish(`chat/delivery/${payload.sender_id}`, {
      messageId: message.id,
      status: "delivered",
    });
  } catch (error) {
    console.error("Message handling error:", error);
  }
}

async function handleMessageRead(payload) {
  try {
    const message = await Models.Message.findByPk(payload.messageId);

    if (!message) {
      console.error("Message not found:", payload.messageId);
      return;
    }

    await message.update({ status: "read" });

    // Notify sender
    mqttService.publish(`chat/read/${message.senderId}`, {
      messageId: payload.messageId,
      readBy: payload.readerId,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Message read handling error:", error);
  }
}

async function handleGroupMessage(payload) {
  try {
    const { messageId, groupId } = payload;
    const message = await Models.Message.findByPk(messageId);

    if (!message) {
      console.error("Message not found:", messageId);
      return;
    }

    const members = await Models.GroupMember.findAll({
      where: { groupId },
    });

    // Notify all members except sender
    for (const member of members) {
      if (member.userId !== message.senderId) {
        mqttService.publish(`chat/group/${member.userId}`, {
          messageId: message.id,
          groupId,
          senderId: message.senderId,
          content: message.content,
          timestamp: new Date(),
        });
      }
    }

    await message.update({ status: "delivered" });

    // Confirm delivery to sender
    mqttService.publish(`chat/delivery/${message.senderId}`, {
      messageId: message.id,
      status: "delivered",
    });
  } catch (error) {
    console.error("Group message handling error:", error);
  }
}

async function handleGroupMessageRead(payload) {
  try {
    const { messageId, readerId } = payload;
    const message = await Models.Message.findByPk(messageId);

    if (!message) {
      console.error("Message not found:", messageId);
      return;
    }

    const readBy = new Set(message.readBy || []);
    readBy.add(readerId);

    await message.update({ readBy: Array.from(readBy) });

    mqttService.publish(`chat/group/${message.groupId}/read`, {
      messageId,
      readerId,
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
      creatorId: payload.creatorId,
      isPrivate: payload.isPrivate,
    });

    await Models.GroupMember.create({
      groupId: group.id,
      userId: payload.creatorId,
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

// Initialize handlers when module is imported
initializeMessageHandlers();

module.exports = {
  handleIncomingMessage,
  handleMessageRead,
  handleGroupMessage,
  handleGroupMessageRead,
};
