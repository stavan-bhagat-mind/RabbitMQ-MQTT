const rabbit = require("rabbitmq-stream-js-client");

async function main() {
  const streamName = "hello-nodejs-stream";

  console.log("Connecting to RabbitMQ...");
  const client = await rabbit.connect({
    hostname: "localhost",
    port: 5552, // Port for RabbitMQ Streams
    username: "guest",
    password: "guest",
    vhost: "/",
  });

  console.log("Making sure the stream exists...");
  const streamSizeRetention = 5 * 1e9; // Set stream size retention to 5 GB
  await client.createStream({
    stream: streamName,
    arguments: { "max-length-bytes": streamSizeRetention },
  });

  console.log("Sending messages to the stream...");
  for (let i = 0; i < 10; i++) {
    const message = `Hello, message ${i + 1}`;
    await client.publish(streamName, Buffer.from(message));
    console.log(`Sent: ${message}`);
  }

  // Close the connection after sending messages
  await client.close();
  console.log("Producer finished sending messages.");
}

// Execute the main function and handle errors
main().catch((error) => {
  console.error("Error in producer:", error);
  process.exit(-1);
});
