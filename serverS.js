// const mqtt = require("mqtt");

// const subscriber = mqtt.connect("mqtt://localhost:1883", {
//   clientId: "subscriber_" + Math.random().toString(16).substr(2, 8),
//   username: "guest",
//   password: "guest",
// });

// subscriber.on("connect", () => {
//   console.log("Subscriber connected to RabbitMQ");

//   subscriber.subscribe("sensors/#", { qos: 1 }, (error) => {
//     if (error) {
//       console.error("Subscribe error:", error);
//     } else {
//       console.log("Subscribed to sensors/#");
//     }
//   });
// });

// subscriber.on("message", (topic, message) => {
//   try {
//     const data = JSON.parse(message.toString());
//     console.log("Received message:", {
//       topic,
//       data,
//     });
//   } catch (error) {
//     console.error("Error parsing message:", error);
//   }
// });

// subscriber.on("error", (error) => {
//   console.error("Subscriber error:", error);
// });

const mqtt = require("mqtt");
const subscriber = mqtt.connect("mqtt://localhost:1883", {
  clientId: "subscriber_" + Math.random().toString(16).substr(2, 8),
  username: "guest",
  password: "guest",
});

subscriber.on("connect", () => {
  console.log("Subscriber connected to RabbitMQ");

  // Subscribe to different topic patterns
  const subscriptions = {
    // All temperature sensors
    "sensors/temperature/#": { qos: 1 },
    // All humidity sensors
    "sensors/humidity/#": { qos: 1 },
    // Device status updates
    "device/status": { qos: 1 },
    // High priority alerts
    "alerts/high_priority": { qos: 2 },
  };

  subscriber.subscribe(subscriptions, (error) => {
    if (error) {
      console.error("Subscribe error:", error);
    } else {
      console.log("Subscribed to topics:", Object.keys(subscriptions));
    }
  });
});

subscriber.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    // Handle different types of messages based on topic
    if (topic.startsWith("sensors/temperature")) {
      handleTemperatureData(topic, data);
    } else if (topic.startsWith("sensors/humidity")) {
      handleHumidityData(topic, data);
    } else if (topic === "device/status") {
      handleDeviceStatus(data);
    } else if (topic === "alerts/high_priority") {
      handleHighPriorityAlert(data);
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
});

// Message handlers
function handleTemperatureData(topic, data) {
  const location = topic.split("/")[2]; // Extract room number
  console.log(`Temperature in ${location}:`, data.value, data.unit);
}

function handleHumidityData(topic, data) {
  const location = topic.split("/")[2];
  console.log(`Humidity in ${location}:`, data.value, data.unit);
}

function handleDeviceStatus(data) {
  console.log("Device status changed:", data.status);
}

function handleHighPriorityAlert(data) {
  console.log("⚠️ HIGH PRIORITY ALERT:", data);
  // Here you might want to trigger immediate actions
}

subscriber.on("error", (error) => {
  console.error("Subscriber error:", error);
});
