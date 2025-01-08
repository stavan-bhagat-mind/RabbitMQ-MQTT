const messageRouter = require("express").Router();
const {
  sendPrivateMessage,
  getPrivateMessages,
  markMessageAsRead,
} = require("../controllers/messageController");

const authenticate = require("../middleware/authenticate");

messageRouter.post("/private", authenticate, sendPrivateMessage);
messageRouter.get("/private/:userId", authenticate, getPrivateMessages);
messageRouter.patch("/read/:messageId", authenticate, markMessageAsRead);

module.exports = messageRouter;
