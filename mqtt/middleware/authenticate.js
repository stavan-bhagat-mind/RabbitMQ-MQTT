require("dotenv").config;
const jwt = require("jsonwebtoken");

const authenticationMiddleware = (req, res, next) => {
  try {
    const authenticationToken = req.headers["authorization"];
    if (!authenticationToken) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Authentication token not provided",
      });
    }
    const token = authenticationToken.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.userId = decoded.id;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Token has expired",
        errorName: error.name,
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Invalid authentication token",
        errorName: error.name,
      });
    } else {
      return res.status(500).json({
        success: false,
        data: null,
        message: "Internal server error",
      });
    }
  }
};

module.exports = authenticationMiddleware;
