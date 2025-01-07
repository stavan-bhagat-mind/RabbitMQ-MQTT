const mqtt = require("mqtt");
const db = require("../models");

const createMqttHandler = () => {
  const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    clientId: `chat-server-${Math.random().toString(16).substr(2, 8)}`,
  });

  const handleUserRegistration = async (payload) => {
    try {
      const user = await db.User.create({
        username: payload.username,
        email: payload.email,
        password: payload.password,
        clientId: payload.clientId,
        isOnline: true,
      });

      client.publish(
        "user/register/response",
        JSON.stringify({
          success: true,
          userId: user.id,
        })
      );
    } catch (error) {
      client.publish(
        "user/register/response",
        JSON.stringify({
          success: false,
          error: error.message,
        })
      );
    }
  };

  const handlePrivateMessage = async (payload) => {
    try {
      const message = await db.Message.create({
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        content: payload.content,
        type: "private",
      });

      client.publish(
        `message/private/${payload.receiverId}`,
        JSON.stringify({
          messageId: message.id,
          senderId: payload.senderId,
          content: payload.content,
        })
      );
    } catch (error) {
      console.error("Error sending private message:", error);
    }
  };

  //   const handleGroupMessage = async (payload) => {
  //     try {
  //       const message = await Message.create({
  //         senderId: payload.senderId,
  //         groupId: payload.groupId,
  //         content: payload.content,
  //         type: "group",
  //       });

  //       client.publish(
  //         `message/group/${payload.groupId}`,
  //         JSON.stringify({
  //           messageId: message.id,
  //           senderId: payload.senderId,
  //           content: payload.content,
  //         })
  //       );
  //     } catch (error) {
  //       console.error("Error sending group message:", error);
  //     }
  //   };

  //   const handleGroupCreation = async (payload) => {
  //     try {
  //       const group = await Group.create({
  //         name: payload.name,
  //         creatorId: payload.creatorId,
  //         isPrivate: payload.isPrivate,
  //       });

  //       client.publish(
  //         "group/create/response",
  //         JSON.stringify({
  //           success: true,
  //           groupId: group.id,
  //         })
  //       );
  //     } catch (error) {
  //       client.publish(
  //         "group/create/response",
  //         JSON.stringify({
  //           success: false,
  //           error: error.message,
  //         })
  //       );
  //     }
  //   };

  client.on("connect", () => {
    console.log("Connected to MQTT broker");
    client.subscribe([
      "user/register",
      "message/private",
      "message/group",
      "group/create",
    ]);
  });

  client.on("message", (topic, message) => {
    const payload = JSON.parse(message.toString());
    switch (topic) {
      case "user/register":
        handleUserRegistration(payload);
        break;
      case "message/private":
        handlePrivateMessage(payload);
        break;
      case "message/group":
        handleGroupMessage(payload);
        break;
      case "group/create":
        handleGroupCreation(payload);
        break;
      default:
        console.log("Unknown topic:", topic);
    }
  });
};

module.exports = createMqttHandler;
