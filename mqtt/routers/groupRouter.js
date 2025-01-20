const groupRouter = require("express").Router();
const {
  createGroup,
  getGroup,
  addUserToGroup,
  removeUserFromGroup,
  getMembersFromGroup,
  updateGroupRole,
} = require("../controllers/groupController");

const authenticate = require("../middleware/authenticate");

groupRouter.post("/create-group", authenticate, createGroup);
groupRouter.get("/:id", authenticate, getGroup);
groupRouter.get("/get-members/:group_id", authenticate, getMembersFromGroup);
groupRouter.post("/add-user", authenticate, addUserToGroup);
groupRouter.post("/remove-user", authenticate, removeUserFromGroup);
groupRouter.patch("/update-role", authenticate, updateGroupRole);

module.exports = groupRouter;
