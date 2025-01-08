const userRouter = require("express").Router();
const {
  register,
  login,
  getProfile,
  logout,
  getAllUsers,
  // updateProfile,
} = require("../controllers/userController");
const authenticate = require("../middleware/authenticate");

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.get("/profile", authenticate, getProfile);
// userRouter.put("/profile", authenticate, updateProfile);
userRouter.post("/logout", authenticate, logout);
userRouter.get("/get-all-users", authenticate, getAllUsers);

module.exports = userRouter;
