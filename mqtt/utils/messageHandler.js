const { Models } = require("../models");
const mqttService = require("./mqttService");

function initializeMessageHandlers() {
  // Subscribe to private message topic
  mqttService.subscribe("chat/message", handleIncomingMessage);
  mqttService.subscribe("chat/read", handleMessageRead);
}

async function handleIncomingMessage(payload) {
  try {
    // Create message in database
    const message = await Models.Message.create({
      senderId: payload.senderId,
      receiverId: payload.receiverId,
      content: payload.content,
      type: "private",
      status: "sent",
    });

    // Notify receiver
    mqttService.publish(`chat/message/${payload.receiverId}`, {
      messageId: message.id,
      ...payload,
      timestamp: new Date(),
    });

    // Update message status
    await message.update({ status: "delivered" });

    // Confirm message delivery to sender
    mqttService.publish(`chat/delivery/${payload.senderId}`, {
      messageId: message.id,
      status: "delivered",
    });
  } catch (error) {
    console.error("Message handling error:", error);
  }
}

async function handleMessageRead(payload) {
  try {
    // Find and update message status
    const message = await Models.Message.findByPk(payload.messageId);

    if (message) {
      message.status = "read";
      await message.save();

      // Notify sender about read status
      mqttService.publish(`chat/read/${message.senderId}`, {
        messageId: payload.messageId,
        readBy: payload.readerId,
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error("Message read handling error:", error);
  }
}

// Initialize handlers when module is imported
initializeMessageHandlers();

module.exports = {
  handleIncomingMessage,
  handleMessageRead,
};

// ?--------------????
// const mqtt = require("mqtt");
// const {Models} = require("../models");

// const createMqttHandler = () => {
//   const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
//     clientId: `chat-server-${Math.random().toString(16).substr(2, 8)}`,
//   });

//   const handleUserRegistration = async (payload) => {
//     try {
//       const user = await Models.User.create({
//         username: payload.username,
//         email: payload.email,
//         password: payload.password,
//         clientId: payload.clientId,
//         isOnline: true,
//       });

//       client.publish(
//         "user/register/response",
//         JSON.stringify({
//           success: true,
//           userId: user.id,
//         })
//       );
//     } catch (error) {
//       client.publish(
//         "user/register/response",
//         JSON.stringify({
//           success: false,
//           error: error.message,
//         })
//       );
//     }
//   };

//   const handlePrivateMessage = async (payload) => {
//     try {
//       const message = await Models.Message.create({
//         senderId: payload.senderId,
//         receiverId: payload.receiverId,
//         content: payload.content,
//         type: "private",
//       });

//       client.publish(
//         `message/private/${payload.receiverId}`,
//         JSON.stringify({
//           messageId: message.id,
//           senderId: payload.senderId,
//           content: payload.content,
//         })
//       );
//     } catch (error) {
//       console.error("Error sending private message:", error);
//     }
//   };

//   //   const handleGroupMessage = async (payload) => {
//   //     try {
//   //       const message = await Message.create({
//   //         senderId: payload.senderId,
//   //         groupId: payload.groupId,
//   //         content: payload.content,
//   //         type: "group",
//   //       });

//   //       client.publish(
//   //         `message/group/${payload.groupId}`,
//   //         JSON.stringify({
//   //           messageId: message.id,
//   //           senderId: payload.senderId,
//   //           content: payload.content,
//   //         })
//   //       );
//   //     } catch (error) {
//   //       console.error("Error sending group message:", error);
//   //     }
//   //   };

//   //   const handleGroupCreation = async (payload) => {
//   //     try {
//   //       const group = await Group.create({
//   //         name: payload.name,
//   //         creatorId: payload.creatorId,
//   //         isPrivate: payload.isPrivate,
//   //       });

//   //       client.publish(
//   //         "group/create/response",
//   //         JSON.stringify({
//   //           success: true,
//   //           groupId: group.id,
//   //         })
//   //       );
//   //     } catch (error) {
//   //       client.publish(
//   //         "group/create/response",
//   //         JSON.stringify({
//   //           success: false,
//   //           error: error.message,
//   //         })
//   //       );
//   //     }
//   //   };

//   client.on("connect", () => {
//     console.log("Connected to MQTT broker");
//     client.subscribe([
//       "user/register",
//       "message/private",
//       "message/group",
//       "group/create",
//     ]);
//   });

//   client.on("message", (topic, message) => {
//     const payload = JSON.parse(message.toString());
//     switch (topic) {
//       case "user/register":
//         handleUserRegistration(payload);
//         break;
//       case "message/private":
//         handlePrivateMessage(payload);
//         break;
//       case "message/group":
//         handleGroupMessage(payload);
//         break;
//       case "group/create":
//         handleGroupCreation(payload);
//         break;
//       default:
//         console.log("Unknown topic:", topic);
//     }
//   });
// };

// module.exports = createMqttHandler;
