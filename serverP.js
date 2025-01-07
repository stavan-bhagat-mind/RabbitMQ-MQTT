// const mqtt = require("mqtt");

// const publisher = mqtt.connect("mqtt://localhost:1883", {
//   clientId: "publisher_" + Math.random().toString(16).substr(2, 8),
//   username: "guest",
//   password: "guest",
// });

// publisher.on("connect", () => {
//   console.log("Publisher connected to RabbitMQ");

//   // Publish message every 5 seconds
//   setInterval(() => {
//     const message = {
//       timestamp: new Date().toISOString(),
//       value: Math.random() * 100,
//       sensor: "temperature",
//     };

//     publisher.publish(
//       "sensors/temperature",
//       JSON.stringify(message),
//       {
//         qos: 1,
//         retain: false,
//       },
//       (error) => {
//         if (error) {
//           console.error("Publish error:", error);
//         } else {
//           console.log("Message published:", message);
//         }
//       }
//     );
//   }, 5000);
// });

// publisher.on("error", (error) => {
//   console.error("Publisher error:", error);
// });

const mqtt = require("mqtt");
const publisher = mqtt.connect("mqtt://localhost:1883", {
  clientId: "publisher_" + Math.random().toString(16).substr(2, 8),
  username: "guest",
  password: "guest",
  // Will message - sent when client disconnects unexpectedly
  will: {
    topic: "device/status",
    payload: JSON.stringify({ status: "offline" }),
    qos: 1,
    retain: true,
  },
});

publisher.on("connect", async () => {
  console.log("Publisher connected to RabbitMQ");

  // Publish device status as online
  publisher.publish("device/status", JSON.stringify({ status: "online" }), {
    qos: 1,
    retain: true, // Retained message - new subscribers will get this immediately
  });

  // Simulate different types of sensor data
  setInterval(() => {
    // Temperature data for different locations
    const tempData = {
      timestamp: new Date().toISOString(),
      value: Math.random() * 100,
      unit: "Celsius",
    };
    publisher.publish("sensors/temperature/room1", JSON.stringify(tempData));
    publisher.publish("sensors/temperature/room2", JSON.stringify(tempData));

    // Humidity data
    const humidityData = {
      timestamp: new Date().toISOString(),
      value: Math.random() * 100,
      unit: "%",
    };
    publisher.publish("sensors/humidity/room1", JSON.stringify(humidityData));

    // High priority alerts (goes to specific queue)
    if (tempData.value > 80) {
      const alert = {
        type: "HIGH_TEMPERATURE",
        location: "room1",
        value: tempData.value,
        timestamp: tempData.timestamp,
      };
      publisher.publish("alerts/high_priority", JSON.stringify(alert), {
        qos: 2,
      });
    }
  }, 5000);
});
