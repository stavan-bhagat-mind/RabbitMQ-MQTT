const express = require("express");
const amqp = require("amqplib");
const app = express();
const PORT = process.env.PORT || 4001;
app.use(express.json());
app.get("/send-msg", (req, res) => {
  res.send("Hello world");
});

var channel, connection; //global variables
async function connectQueue() {
  try {
    connection = await amqp.connect("amqp://localhost:5672");
    channel = await connection.createChannel();

    await channel.assertQueue("test-queue");
    await channel.assertQueue("email-queue");
  } catch (error) {
    console.log(error);
  }
}
connectQueue();

async function sendData(data) {
  try {
    // send data to queue
    await channel.sendToQueue("test-queue", Buffer.from(JSON.stringify(data)), {
      persistent: true, // Ensures message survives broker restart
    });
  } catch (err) {
    console.log(err);
  }
}
app.get("/send-msgs", (req, res) => {
  // data to be sent
  try {
    const data = {
      title: "about time",
      author: "Stephen King",
    };
    sendData(data);
    console.log("A message is sent to queue");
    res.status(201).json("Message Sent");
  } catch (err) {
    console.log(err);
  }
});

app.post("/send-email", async (req, res) => {
  // data to be sent
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({
        error: "Missing required email fields",
      });
    }

    const emailMessage = {
      to,
      subject,
      body,
      timestamp: new Date().toISOString(),
      status: "queued",
    };

    await channel.sendToQueue(
      "email-queue",
      Buffer.from(JSON.stringify(emailMessage)),
      {
        persistent: true,
      }
    );
    console.log("A message is sent to queue");
    res.status(200).json({
      message: "Email queued successfully",
      queuedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.log(err);
  }
});
app.listen(PORT, () => console.log("Server running at port " + PORT));
