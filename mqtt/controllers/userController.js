// const { db.User, Group, GroupMember } = require("../models");
const db = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userController = {
  // db.User Registration
  async register(req, res) {
    try {
      const { username, email, password } = req.body;
      const existingUser = await db.User.findOne({
        where: {
          [Op.or]: [{ username }, { email }],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "db.User already exists",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await db.User.create({
        username,
        email,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // db.User Login
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Find user
      const user = await db.User.findOne({ where: { username } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "db.User not found",
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Update online status
      await user.update({ isOnline: true });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
        },
        token,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get db.User Profile
  async getProfile(req, res) {
    // try {
    //   const user = await db.User.findByPk(req.user.id, {
    //     attributes: ["id", "username", "email", "isOnline"],
    //     include: [
    //       {
    //         model: Group,
    //         through: {
    //           attributes: ["role"],
    //         },
    //       },
    //     ],
    //   });
    //   if (!user) {
    //     return res.status(404).json({
    //       success: false,
    //       message: "db.User not found",
    //     });
    //   }
    //   res.json({
    //     success: true,
    //     user,
    //   });
    // } catch (error) {
    //   res.status(500).json({
    //     success: false,
    //     message: error.message,
    //   });
    // }
  },

  // Update db.User Profile
  async updateProfile(req, res) {
    try {
      const { username, email } = req.body;

      const user = await db.User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "db.User not found",
        });
      }

      // Update user details
      await user.update({
        username: username || user.username,
        email: email || user.email,
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Logout
  async logout(req, res) {
    try {
      const user = await db.User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "db.User not found",
        });
      }

      // Update online status
      await user.update({ isOnline: false });

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get All Users
  async getAllUsers(req, res) {
    try {
      const users = await db.User.findAll({
        attributes: ["id", "username", "isOnline"],
        where: {
          id: {
            [Op.ne]: req.user.id, // Exclude current user
          },
        },
      });

      res.json({
        success: true,
        users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = userController;
