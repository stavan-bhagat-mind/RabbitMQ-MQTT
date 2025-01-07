const messageRouter = require("express").Router();
const {
  sendPrivateMessage,
  sendGroupMessage,
  getPrivateMessages,
  getGroupMessages,
} = require("../controllers/messageController");

const authenticate = require("../middleware/authenticate");

messageRouter.post("/messages/private", authenticate, sendPrivateMessage);
messageRouter.get("/messages/private/:userId", authenticate, getPrivateMessages);
messageRouter.post("/messages/group", authenticate, sendGroupMessage);
messageRouter.get("/messages/group/:groupId", authenticate, getGroupMessages);

module.exports = messageRouter;