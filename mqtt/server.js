const express = require("express");
const { sequelize, syncModels } = require("./models");
// const createMqttHandler = require("./utils/mqttHandler");
const routes = require("./routers/indexRouter");
const app = express();
app.use(express.json());
app.use("/api", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
//   await syncModels();
//   createMqttHandler();
});
