const messageRouter = require("express").Router();
const {
  sendPrivateMessage,
  getPrivateMessages,
} = require("../controllers/messageController");

const authenticate = require("../middleware/authenticate");

messageRouter.post("/messages/private", authenticate, sendPrivateMessage);
messageRouter.get(
  "/messages/private/:userId",
  authenticate,
  getPrivateMessages
);

module.exports = messageRouter;
