// const { Models } = require("../models");
// const mqttService = require("../utils/mqttService");

// async function createGroup(req, res) {
//   try {
//     const { name, isPrivate } = req.body;
//     const creatorId = req.userId;

//     // Publish the group creation event via MQTT
//     mqttService.publish("group/create", {
//       name,
//       creatorId,
//       isPrivate,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Group queued for creation",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// // Get Group Details
// async function getGroup(req, res) {
//   try {
//     const { id } = req.params;

//     const group = await Models.Group.findByPk(id, {
//       include: [
//         {
//           model: Models.User,
//           through: {
//             attributes: ["role"],
//           },
//         },
//       ],
//     });

//     if (!group) {
//       return res.status(404).json({
//         success: false,
//         message: "Group not found",
//       });
//     }

//     res.json({
//       success: true,
//       group,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// async function addUserToGroup(req, res) {
//   try {
//     const { groupId, userId } = req.body;

//     const group = await Models.Group.findByPk(groupId);
//     if (!group) {
//       return res.status(404).json({
//         success: false,
//         message: "Group not found",
//       });
//     }

//     await Models.GroupMember.create({
//       groupId,
//       userId,
//       role: "member",
//     });

//     res.json({
//       success: true,
//       message: "User  added to group successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// // Remove User from Group
// async function removeUserFromGroup(req, res) {
//   try {
//     const { groupId, userId } = req.body;

//     const group = await Models.Group.findByPk(groupId);
//     if (!group) {
//       return res.status(404).json({
//         success: false,
//         message: "Group not found",
//       });
//     }

//     await Models.GroupMember.destroy({
//       where: {
//         groupId,
//         userId,
//       },
//     });

//     res.json({
//       success: true,
//       message: "User  removed from group successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// async function getMembersFromGroup(req, res) {
//   try {
//     const { groupId } = req.params;
//     const creatorId = req.userId;
//     const group = await Models.Group.findByPk(groupId);
//     if (!group) {
//       return res.status(404).json({
//         success: false,
//         message: "Group not found",
//       });
//     }

//     const data = await Models.GroupMember.findAll({
//       where: {
//         groupId,
//       },
//       include: [
//         {
//           model: Models.User,
//           attributes: ["username"],
//         },
//       ],
//       raw: true,
//     });

//     res.json({
//       success: true,
//       data,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// module.exports = {
//   createGroup,
//   getGroup,
//   addUserToGroup,
//   removeUserFromGroup,
//   getMembersFromGroup,
// };
const { Models } = require("../models");
const mqttService = require("../utils/mqttService");
const { Op } = require("sequelize");

async function createGroup(req, res) {
  try {
    const { name, description, isPrivate = false } = req.body;
    const creatorId = req.userId;

    // Validate group name
    if (!name?.trim() || name.length < 3 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Group name must be between 3 and 100 characters",
      });
    }

    // Create group with transaction
    const group = await Models.sequelize.transaction(async (t) => {
      const newGroup = await Models.Group.create(
        {
          name: name.trim(),
          description: description?.trim(),
          creatorId,
          isPrivate,
        },
        { transaction: t }
      );

      // Add creator as admin
      await Models.GroupMember.create(
        {
          groupId: newGroup.id,
          userId: creatorId,
          role: "admin",
        },
        { transaction: t }
      );

      return newGroup;
    });

    // Publish group creation event
    mqttService.publish("group/create", {
      groupId: group.id,
      name: group.name,
      creatorId,
      isPrivate,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the group",
    });
  }
}

async function getGroup(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const group = await Models.Group.findOne({
      where: { id },
      include: [
        {
          model: Models.User,
          through: {
            attributes: ["role"],
            where: { userId },
            required: false,
          },
          attributes: ["id", "username", "isOnline"],
        },
        {
          model: Models.User,
          as: "creator",
          attributes: ["id", "username"],
        },
      ],
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if user has access to private group
    if (group.isPrivate && !group.Users.length) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this group",
      });
    }

    res.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Get group error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the group",
    });
  }
}

async function addUserToGroup(req, res) {
  try {
    const { groupId, userId, role = "member" } = req.body;
    const requesterId = req.userId;

    // Check if group exists
    const group = await Models.Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if requester is admin
    const requesterMembership = await Models.GroupMember.findOne({
      where: { groupId, userId: requesterId },
    });

    if (!requesterMembership || requesterMembership.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only group admins can add members",
      });
    }

    // Check if user exists
    const userToAdd = await Models.User.findByPk(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is already a member
    const existingMembership = await Models.GroupMember.findOne({
      where: { groupId, userId },
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this group",
      });
    }

    // Add user to group
    const membership = await Models.GroupMember.create({
      groupId,
      userId,
      role,
    });

    // Publish member added event
    mqttService.publish("group/member/added", {
      groupId,
      userId,
      role,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "User added to group successfully",
      membership,
    });
  } catch (error) {
    console.error("Add user to group error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding user to group",
    });
  }
}

async function removeUserFromGroup(req, res) {
  try {
    const { groupId, userId } = req.body;
    const requesterId = req.userId;

    // Check if group exists
    const group = await Models.Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if requester is admin
    const requesterMembership = await Models.GroupMember.findOne({
      where: { groupId, userId: requesterId },
    });

    if (!requesterMembership || requesterMembership.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only group admins can remove members",
      });
    }

    // Check if user is a member
    const membership = await Models.GroupMember.findOne({
      where: { groupId, userId },
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this group",
      });
    }

    // Don't allow removing the last admin
    const adminCount = await Models.GroupMember.count({
      where: { groupId, role: "admin" },
    });

    if (adminCount === 1 && membership.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot remove the last admin from the group",
      });
    }

    // Remove user from group
    await membership.destroy();

    // Publish member removed event
    mqttService.publish("group/member/removed", {
      groupId,
      userId,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "User removed from group successfully",
    });
  } catch (error) {
    console.error("Remove user from group error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while removing user from group",
    });
  }
}

async function getMembersFromGroup(req, res) {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    // Check if group exists and user is a member
    const membership = await Models.GroupMember.findOne({
      where: { groupId, userId },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Access denied or group not found",
      });
    }

    const members = await Models.GroupMember.findAll({
      where: { groupId },
      include: [
        {
          model: Models.User,
          attributes: ["id", "username", "isOnline", "lastLogin"],
        },
      ],
      order: [
        ["role", "ASC"], // Admins first
        [Models.User, "username", "ASC"], // Then alphabetically by username
      ],
    });

    res.json({
      success: true,
      members: members.map((member) => ({
        id: member.User.id,
        username: member.User.username,
        isOnline: member.User.isOnline,
        lastLogin: member.User.lastLogin,
        role: member.role,
      })),
    });
  } catch (error) {
    console.error("Get group members error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching group members",
    });
  }
}

async function updateGroupRole(req, res) {
  try {
    const { groupId, userId, newRole } = req.body;
    const requesterId = req.userId;

    if (!["admin", "member"].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Check if requester is admin
    const requesterMembership = await Models.GroupMember.findOne({
      where: { groupId, userId: requesterId },
    });

    if (!requesterMembership || requesterMembership.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only group admins can change roles",
      });
    }

    // Don't allow changing the last admin's role
    if (newRole === "member") {
      const adminCount = await Models.GroupMember.count({
        where: { groupId, role: "admin" },
      });

      if (adminCount === 1) {
        const memberToChange = await Models.GroupMember.findOne({
          where: { groupId, userId },
        });

        if (memberToChange?.role === "admin") {
          return res.status(400).json({
            success: false,
            message: "Cannot demote the last admin",
          });
        }
      }
    }

    // Update role
    const [updated] = await Models.GroupMember.update(
      { role: newRole },
      { where: { groupId, userId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Publish role update event
    mqttService.publish("group/member/role-updated", {
      groupId,
      userId,
      newRole,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "Member role updated successfully",
    });
  } catch (error) {
    console.error("Update group role error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating member role",
    });
  }
}

module.exports = {
  createGroup,
  getGroup,
  addUserToGroup,
  removeUserFromGroup,
  getMembersFromGroup,
  updateGroupRole,
};
