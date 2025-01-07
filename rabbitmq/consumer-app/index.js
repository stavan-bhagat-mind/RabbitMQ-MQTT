const express = require("express");
const amqp = require("amqplib");
const nodemailer = require("nodemailer");
const app = express();
const PORT = process.env.PORT || 4002;
app.use(express.json());
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

let channel, connection;

async function connectQueue() {
  try {
    connection = await amqp.connect("amqp://localhost:5672");
    channel = await connection.createChannel();

    // Ensure queue is durable
    await channel.assertQueue("test-queue", { durable: true });
    await channel.assertQueue("email-queue", { durable: true });

    channel.prefetch(5); // Process 5 messages simultaneously
    console.log("Waiting for email messages...");

    // Consume messages for email-queue
    channel.consume("email-queue", async (msg) => {
      if (msg !== null) {
        try {
          const emailData = JSON.parse(msg.content.toString());

          // time-consuming email sending
          await sendEmailWithDelay(emailData);
          channel.ack(msg);
        } catch (error) {
          console.error("Email Processing Error:", error);
          channel.nack(msg, false, true); //negative acknowledgement
        }
      }
    });

    // Consume messages for test-queue(simple one to one message only)
    channel.consume(
      "test-queue",
      (data) => {
        if (data) {
          const message = JSON.parse(Buffer.from(data.content));
          console.log("Received Message:", message);
          channel.ack(data); // Acknowledge message
        }
      },
      {
        noAck: false, // Ensure manual acknowledgment
      }
    );

    console.log("Waiting for messages...");
  } catch (error) {
    console.log(error);
  }
}
connectQueue();

// Simulated Email Sending with Delay
async function sendEmailWithDelay(emailData) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const info = await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: emailData.to,
          subject: emailData.subject,
          text: emailData.body,
        });

        console.log("Email Sent:", {
          to: emailData.to,
          subject: emailData.subject,
          timestamp: new Date().toISOString(),
        });

        resolve(info);
      } catch (error) {
        reject(error);
      }
    }, Math.random() * 5000); // Random delay up to 5 seconds
  });
}

app.listen(PORT, () => console.log("Server running at port " + PORT));
