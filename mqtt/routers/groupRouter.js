const groupRouter = require("express").Router();
const {
  createGroup,
  getGroup,
  addUserToGroup,
  removeUserFromGroup,
  getMembersFromGroup,
} = require("../controllers/groupController");

const authenticate = require("../middleware/authenticate");

groupRouter.post("/create-group", authenticate, createGroup);
groupRouter.get("/:id", authenticate, getGroup);
groupRouter.get("/get-members/:groupId", authenticate, getMembersFromGroup);
groupRouter.post("/add-user", authenticate, addUserToGroup);
groupRouter.post("/remove-user", authenticate, removeUserFromGroup);

module.exports = groupRouter;
