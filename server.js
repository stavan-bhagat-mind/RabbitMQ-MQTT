// First install dependencies:
// npm install mqtt

const mqtt = require("mqtt");

// Publisher
const publisherClient = mqtt.connect("mqtt://localhost:1883", {
  clientId: "publisher_" + Math.random().toString(16).substr(2, 8),
  username: "guest",
  password: "guest",
});

publisherClient.on("connect", () => {
  console.log("Publisher connected to RabbitMQ");

  // Publish message every 5 seconds
  setInterval(() => {
    const message = {
      timestamp: new Date().toISOString(),
      value: Math.random() * 100,
      sensor: "temperature",
    };

    publisherClient.publish(
      "sensors/temperature",
      JSON.stringify(message),
      {
        qos: 1, // At least once delivery
        retain: false,
      },
      (error) => {
        if (error) {
          console.error("Publish error:", error);
        } else {
          console.log("Message published:", message);
        }
      }
    );
  }, 5000);
});

publisherClient.on("error", (error) => {
  console.error("Publisher error:", error);
});

// Subscriber
const subscriberClient = mqtt.connect("mqtt://localhost:1883", {
  clientId: "subscriber_" + Math.random().toString(16).substr(2, 8),
  username: "guest",
  password: "guest",
});

subscriberClient.on("connect", () => {
  console.log("Subscriber connected to RabbitMQ");

  // Subscribe to the topic
  subscriberClient.subscribe("sensors/#", { qos: 1 }, (error) => {
    if (error) {
      console.error("Subscribe error:", error);
    } else {
      console.log("Subscribed to sensors/#");
    }
  });
});

subscriberClient.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("Received message:", {
      topic,
      data,
    });
  } catch (error) {
    console.error("Error parsing message:", error);
  }
});

subscriberClient.on("error", (error) => {
  console.error("Subscriber error:", error);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  publisherClient.end();
  subscriberClient.end();
  process.exit();
});
