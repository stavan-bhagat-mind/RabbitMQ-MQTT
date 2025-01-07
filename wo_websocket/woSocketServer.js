// // server.js
// const express = require("express");
// const mqtt = require("mqtt");
// const amqp = require("amqplib");
// const app = express();

// // Middleware for parsing JSON
// app.use(express.json());
// app.use(express.static("public"));

// // Store connected clients
// const clients = new Set();

// // MQTT Setup
// const mqttClient = mqtt.connect("mqtt://localhost:1883");
// mqttClient.on("connect", () => {
//   console.log("Connected to MQTT");
//   mqttClient.subscribe("chat/messages");
// });

// // RabbitMQ Setup
// let rabbitChannel;
// async function setupRabbitMQ() {
//   const connection = await amqp.connect("amqp://localhost");
//   rabbitChannel = await connection.createChannel();
//   await rabbitChannel.assertQueue("chat_queue");

//   // Consume messages from RabbitMQ
//   rabbitChannel.consume("chat_queue", (msg) => {
//     if (msg) {
//       const message = msg.content.toString();
//       // Send to all connected SSE clients
//       clients.forEach((client) => client.write(`data: ${message}\n\n`));
//       rabbitChannel.ack(msg);
//     }
//   });
// }
// setupRabbitMQ();

// // Handle MQTT messages
// mqttClient.on("message", (topic, message) => {
//   // Send to all connected SSE clients
//   clients.forEach((client) => client.write(`data: ${message.toString()}\n\n`));
// });

// // SSE endpoint for receiving messages
// app.get("/events", (req, res) => {
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   // Add client to the set
//   clients.add(res);

//   req.on("close", () => {
//     clients.delete(res);
//   });
// });

// // Endpoint for sending messages
// app.post("/send", async (req, res) => {
//   const message = JSON.stringify({
//     content: req.body.message,
//     timestamp: new Date().toISOString(),
//   });

//   // Publish to both MQTT and RabbitMQ
//   mqttClient.publish("chat/messages", message);
//   rabbitChannel.sendToQueue("chat_queue", Buffer.from(message));

//   res.json({ status: "sent" });
// });

// app.listen(3000, () => {
//   console.log("Server running on port 3000");
// });

// bidirectional
const express = require("express");
const mqtt = require("mqtt");
const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Store connected users and messages
const users = [];
const messages = [];

// MQTT Setup
const mqttClient = mqtt.connect("mqtt://localhost:1883", {
  clientId: `chat_server_${Math.random().toString(16).slice(2)}`,
  clean: true,
  reconnectPeriod: 1000,
});

// MQTT Topics
const CHAT_TOPIC = "two_user_chat";

// MQTT Connection
mqttClient.on("connect", () => {
  console.log("Connected to MQTT");
  mqttClient.subscribe(CHAT_TOPIC);
});

// Handle MQTT Messages
mqttClient.on("message", (topic, message) => {
  try {
    const chatMessage = JSON.parse(message.toString());
    messages.push(chatMessage);
  } catch (error) {
    console.error("Message parsing error:", error);
  }
});

// User Join Endpoint
app.post("/join", (req, res) => {
  const { username } = req.body;

  // Limit to two users
  if (users.length >= 2) {
    return res.status(400).json({ error: "Chat is full" });
  }

  // Check if username already exists
  if (users.some((u) => u.username === username)) {
    return res.status(400).json({ error: "Username already taken" });
  }

  // Add user
  const newUser = {
    username,
    id: Date.now().toString(),
  };
  users.push(newUser);

  res.json({
    user: newUser,
    users: users,
    messages: messages,
  });
});

// Send Message Endpoint
app.post("/send", (req, res) => {
  const { message, sender } = req.body;

  // Validate message
  if (!message || !sender) {
    return res.status(400).json({ error: "Invalid message" });
  }

  // Create chat message
  const chatMessage = {
    id: Date.now().toString(),
    content: message,
    sender: sender,
    timestamp: new Date().toISOString(),
  };

  // Publish to MQTT
  mqttClient.publish(CHAT_TOPIC, JSON.stringify(chatMessage));

  res.json({ status: "sent" });
});

// Get Users Endpoint
app.get("/users", (req, res) => {
  res.json({ users });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
