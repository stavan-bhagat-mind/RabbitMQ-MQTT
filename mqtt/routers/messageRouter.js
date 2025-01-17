const messageRouter = require("express").Router();
const {
  sendPrivateMessage,
  getPrivateMessages,
  markMessageAsRead,
  sendGroupMessage,
  getGroupMessages,
} = require("../controllers/messageController");

const authenticate = require("../middleware/authenticate");

messageRouter.post("/private", authenticate, sendPrivateMessage);
messageRouter.get("/private/:recipient_id", authenticate, getPrivateMessages);
messageRouter.patch("/read/:messageId", authenticate, markMessageAsRead);
messageRouter.post("/group", authenticate, sendGroupMessage);
messageRouter.get("/group/:groupId", authenticate, getGroupMessages);

module.exports = messageRouter;
