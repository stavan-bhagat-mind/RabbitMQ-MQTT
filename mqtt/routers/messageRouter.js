const messageRouter = require("express").Router();
const {
  sendMessage,
  getMessages,
  markAsRead,
} = require("../controllers/messageController");

const authenticate = require("../middleware/authenticate");

messageRouter.post("/private", authenticate, sendMessage);
messageRouter.get("/private", authenticate, getMessages);
messageRouter.patch("/read/:message_id", authenticate, markAsRead);

module.exports = messageRouter;
