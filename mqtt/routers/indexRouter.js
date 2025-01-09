const indexRouter = require("express").Router();
const userRouter = require("./userRouter");
const messageRouter = require("./messageRouter");
const groupRouter = require("./groupRouter");

indexRouter.use("/user", userRouter);
indexRouter.use("/message", messageRouter);
indexRouter.use("/group", groupRouter);

module.exports = indexRouter;
