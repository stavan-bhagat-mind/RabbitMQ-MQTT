// const mqtt = require("mqtt");

// function createMQTTService() {
//   let client = null;

//   function connect() {
//     if (!client) {
//       client = mqtt.connect(process.env.MQTT_BROKER_URL, {
//         clientId: `chat-app-${Math.random().toString(16).substr(2, 8)}`,
//         clean: true,
//         reconnectPeriod: 1000,
//       });

//       client.on("connect", () => {
//         console.log("Connected to MQTT Broker");
//       });

//       client.on("error", (error) => {
//         console.error("MQTT Connection Error:", error);
//       });
//     }
//     return client;
//   }

//   function publish(topic, message) {
//     if (!client) connect();
//     client.publish(topic, JSON.stringify(message));
//   }

//   function subscribe(topic, callback) {
//     if (!client) connect();

//     client.subscribe(topic, (err) => {
//       if (err) console.error(`Subscription error to ${topic}:`, err);
//     });

//     client.on("message", (receivedTopic, message) => {
//       if (receivedTopic === topic) {
//         callback(JSON.parse(message.toString()));
//       }
//     });
//   }

//   function getClient() {
//     return client || connect();
//   }

//   // Initialize connection
//   connect();

//   return {
//     publish,
//     subscribe,
//     getClient,
//   };
// }

// module.exports = createMQTTService();

const mqtt = require("mqtt");

function createMQTTService() {
  let client = null;

  function connect() {
    if (!client) {
      client = mqtt.connect(process.env.MQTT_BROKER_URL, {
        clientId: `chat-app-${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        reconnectPeriod: 1000,
      });

      client.on("connect", () => {
        console.log("Connected to MQTT Broker");
      });

      client.on("error", (error) => {
        console.error("MQTT Connection Error:", error);
      });

      client.on("offline", () => {
        console.warn("MQTT Client is offline");
      });

      client.on("reconnect", () => {
        console.log("Attempting to reconnect to MQTT Broker...");
      });
    }
    return client;
  }

  function publish(topic, message) {
    if (!client) connect();
    client.publish(topic, JSON.stringify(message), { qos: 0 }, (err) => {
      if (err) {
        console.error(`Publish error to ${topic}:`, err);
      } else {
        console.log(`Message published to ${topic}`);
      }
    });
  }

  function subscribe(topic, callback) {
    if (!client) connect();

    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Subscription error to ${topic}:`, err);
        return;
      }
      console.log(`Subscribed to topic: ${topic}`);
    });

    client.on("message", (receivedTopic, message) => {
      if (receivedTopic === topic) {
        try {
          const parsedMessage = JSON.parse(message.toString());
          callback(parsedMessage);
        } catch (parseError) {
          console.error("Error parsing message:", parseError);
        }
      }
    });
  }

  function getClient() {
    return client || connect();
  }

  // Initialize connection
  connect();

  return {
    publish,
    subscribe,
    getClient,
  };
}

module.exports = createMQTTService();
  