const indexRouter = require("express").Router();
const userRouter = require("./userRouter");
const messageRouter = require("./messageRouter");

indexRouter.use("/user", userRouter);
indexRouter.use("/message", messageRouter);

module.exports = indexRouter;
