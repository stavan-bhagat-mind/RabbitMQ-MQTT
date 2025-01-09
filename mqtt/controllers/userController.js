const { Models } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mqttService = require("../utils/mqttService");
const { Op } = require("sequelize");

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check existing user
    const existingUser = await Models.User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await Models.User.create({
      username,
      email,
      password: hashedPassword,
      isOnline: false,
    });

    // Publish user registration event
    mqttService.publish("user/register", {
      userId: user.id,
      username: user.username,
      email: user.email,
      timestamp: new Date(),
    });

    res.status(201).json({
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
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await Models.User.findOne({
      where: {
        [Op.or]: [{ username }, { email: username }],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const clientId = `chat-client-${user.id}-${Date.now()}`;

    // Update user status
    await user.update({
      isOnline: true,
      lastLogin: new Date(),
      clientId: clientId,
    });

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );

    // Publish login event
    mqttService.publish("user/login", {
      userId: user.id,
      username: user.username,
      timestamp: new Date(),
      clientId: clientId,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isOnline: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function logout(req, res) {
  try {
    const user = await Models.User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user status
    await user.update({
      isOnline: false,
      lastLogout: new Date(),
    });

    // Publish logout event
    mqttService.publish("user/logout", {
      userId: user.id,
      username: user.username,
      timestamp: new Date(),
    });

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
}

async function getProfile(req, res) {
  try {
    const user = await Models.User.findByPk(req.userId, {
      attributes: ["id", "username", "email", "isOnline", "lastLogin"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await Models.User.findAll({
      where: {
        id: {
          [Op.ne]: req.userId, // Exclude current user
        },
      },
      attributes: ["id", "username", "isOnline", "lastLogin"],
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
}

module.exports = {
  register,
  login,
  logout,
  getProfile,
  getAllUsers,
};

// const { Models } = require("../models/index");
// const bcrypt = require("bcrypt");
// const { Op } = require("sequelize");
// const jwt = require("jsonwebtoken");

// // Models.User Registration
// module.exports.register = async (req, res) => {
//   try {
//     const { username, email, password } = req.body;
//     const existingUser = await Models.User.findOne({
//       where: {
//         [Op.or]: [{ username }, { email }],
//       },
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "Models.User already exists",
//       });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create user
//     const user = await Models.User.create({
//       username,
//       email,
//       password: hashedPassword,
//     });

//     res.status(201).json({
//       success: true,
//       user: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Models.User Login
// module.exports.login = async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     // Find user
//     const user = await Models.User.findOne({ where: { email: username } });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Models.User not found",
//       });
//     }

//     // Check password
//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }

//     // Update online status
//     await user.update({ isOnline: true });

//     // Generate JWT token
//     const token = jwt.sign(
//       { id: user.id, username: user.username },
//       process.env.JWT_KEY,
//       { expiresIn: "24h" }
//     );

//     res.json({
//       success: true,
//       user: {
//         id: user.id,
//         username: user.username,
//       },
//       token,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Logout
// module.exports.logout = async (req, res) => {
//   try {
//     const user = await Models.User.findByPk(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Models.User not found",
//       });
//     }

//     // Update online status
//     await user.update({ isOnline: false });

//     res.json({
//       success: true,
//       message: "Logged out successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Get All Users
// module.exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await Models.User.findAll({
//       attributes: ["id", "username", "isOnline"],
//       where: {
//         id: {
//           [Op.ne]: req.userId, // Exclude current user
//         },
//       },
//     });

//     res.json({
//       success: true,
//       users,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Get Models.User Profile
// module.exports.getProfile = async (req, res) => {
//   try {
//     const user = 1;
//     // const user = await Models.User.findByPk(req.user.id, {
//     //   attributes: ["id", "username", "email", "isOnline"],
//     //   include: [
//     //     {
//     //       model: Group,
//     //       through: {
//     //         attributes: ["role"],
//     //       },
//     //     },
//     //   ],
//     // });
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Models.User not found",
//       });
//     }
//     res.json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Update Models.User Profile
// module.exports.updateProfile = async (req, res) => {
//   try {
//     const { username, email } = req.body;

//     const user = await Models.User.findByPk(req.userId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Models.User not found",
//       });
//     }

//     // Update user details
//     await user.update({
//       username: username || user.username,
//       email: email || user.email,
//     });

//     res.json({
//       success: true,
//       user: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
