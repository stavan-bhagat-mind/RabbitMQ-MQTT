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

// const { Models } = require("../models");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const mqttService = require("../utils/mqttService");
// const { Op } = require("sequelize");

// async function register(req, res) {
//   try {
//     const { username, email, password } = req.body;

//     // Enhanced input validation
//     if (!username?.trim() || !email?.trim() || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required and must not be empty",
//       });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Password must be at least 6 characters long",
//       });
//     }

//     // Check existing user with transaction
//     const existingUser = await Models.User.findOne({
//       where: {
//         [Op.or]: [
//           { username: username.trim().toLowerCase() },
//           { email: email.trim().toLowerCase() },
//         ],
//       },
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message:
//           existingUser.email === email.toLowerCase()
//             ? "Email already registered"
//             : "Username already taken",
//       });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create user
//     const user = await Models.User.create({
//       username: username.trim(),
//       email: email.trim().toLowerCase(),
//       password: hashedPassword,
//       isOnline: false,
//       lastLogin: null,
//     });

//     // Generate initial token
//     // const token = jwt.sign(
//     //   { id: user.id, username: user.username },
//     //   process.env.JWT_KEY,
//     //   { expiresIn: "24h" }
//     // );

//     // Publish user registration event
//     mqttService.publish("user/register", {
//       userId: user.id,
//       username: user.username,
//       timestamp: new Date(),
//     });

//     res.status(201).json({
//       success: true,
//       // token,
//       user: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     console.error("Registration error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to register user",
//     });
//   }
// }

// async function login(req, res) {
//   try {
//     const { username, password } = req.body;

//     if (!username?.trim() || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Username and password are required",
//       });
//     }

//     // Find user
//     const user = await Models.User.findOne({
//       where: {
//         [Op.or]: [
//           // { username: username.trim() },
//           { email: username.trim().toLowerCase() },
//         ],
//       },
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Validate password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }

//     const clientId = `chat-client-${user.id}-${Date.now()}`;

//     // Use transaction for updating user status
//     await Models.sequelize.transaction(async (transaction) => {
//       await user.update(
//         {
//           isOnline: true,
//           lastLogin: new Date(),
//           clientId: clientId,
//         },
//         { transaction }
//       );

//       // Force logout from other sessions
//       if (user.clientId && user.clientId !== clientId) {
//         mqttService.publish("user/force-logout", {
//           userId: user.id,
//           oldClientId: user.clientId,
//         });
//       }
//     });

//     // Generate token
//     const token = jwt.sign(
//       { id: user.id, username: user.username },
//       process.env.JWT_KEY,
//       { expiresIn: "24h" }
//     );

//     // Publish login event
//     mqttService.publish("user/login", {
//       userId: user.id,
//       username: user.username,
//       timestamp: new Date(),
//       clientId: clientId,
//     });

//     res.json({
//       success: true,
//       token,
//       user: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//         isOnline: true,
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to login",
//     });
//   }
// }

// async function logout(req, res) {
//   try {
//     const user = await Models.User.findByPk(req.userId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     await Models.sequelize.transaction(async (transaction) => {
//       // Update user status
//       await user.update(
//         {
//           isOnline: false,
//           clientId: null,
//         },
//         { transaction }
//       );

//       // Publish logout event
//       mqttService.publish("user/logout", {
//         userId: user.id,
//         username: user.username,
//         timestamp: new Date(),
//       });
//     });

//     res.json({
//       success: true,
//       message: "Logged out successfully",
//     });
//   } catch (error) {
//     console.error("Logout error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to logout",
//     });
//   }
// }

// async function getProfile(req, res) {
//   try {
//     const user = await Models.User.findByPk(req.userId, {
//       attributes: ["id", "username", "email", "isOnline", "lastLogin"],
//       include: [
//         {
//           model: Models.Group,
//           through: { attributes: ["role"] },
//           attributes: ["id", "name", "isPrivate"],
//         },
//       ],
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     console.error("Get profile error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch profile",
//     });
//   }
// }

// async function getAllUsers(req, res) {
//   try {
//     const users = await Models.User.findAll({
//       where: {
//         id: { [Op.ne]: req.userId },
//       },
//       attributes: ["id", "username", "isOnline", "lastLogin"],
//       order: [
//         ["isOnline", "DESC"],
//         ["username", "ASC"],
//       ],
//     });

//     res.json({
//       success: true,
//       users,
//     });
//   } catch (error) {
//     console.error("Get users error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch users",
//     });
//   }
// }

// module.exports = {
//   register,
//   login,
//   logout,
//   getProfile,
//   getAllUsers,
// };
