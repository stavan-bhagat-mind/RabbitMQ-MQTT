const { Models } = require("../models");
const mqttService = require("../utils/mqttService");

async function createGroup(req, res) {
  try {
    const { name, is_private } = req.body;
    const creator_id = req.userId;

    // Publish the group creation event via MQTT
    mqttService.publish("group/create", {
      name,
      creator_id,
      is_private,
    });

    res.status(201).json({
      success: true,
      message: "Group queued for creation",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getGroup(req, res) {
  try {
    const { id } = req.params;

    const group = await Models.Group.findByPk(id, {
      include: [
        {
          model: Models.User,
          as: "members",
          attributes: ["id", "username", "email"],
          through: {
            attributes: ["role"],
          },
        },
      ],
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.json({
      success: true,
      group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function addUserToGroup(req, res) {
  try {
    const { group_id, user_id, role = "member" } = req.body;
    const requesterId = req.userId;

    // Check if group exists
    const group = await Models.Group.findByPk(group_id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if requester is admin
    const requesterMembership = await Models.GroupMember.findOne({
      where: { group_id, user_id: requesterId },
    });

    if (!requesterMembership || requesterMembership.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only group admins can add members",
      });
    }

    // Check if user exists
    const userToAdd = await Models.User.findByPk(user_id);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is already a member
    const existingMembership = await Models.GroupMember.findOne({
      where: { group_id, user_id },
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this group",
      });
    }

    // Add user to group
    const membership = await Models.GroupMember.create({
      group_id,
      user_id,
      role,
    });

    // Publish member added event
    // mqttService.publish("group/member/added", {
    //   group_id,
    //   user_id,
    //   role,
    //   timestamp: new Date(),
    // });

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
    const { group_id } = req.params;
    const user_id = req.userId;

    // Check if group exists and user is a member
    const membership = await Models.GroupMember.findOne({
      where: { group_id, user_id },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Access denied or group not found",
      });
    }

    const members = await Models.GroupMember.findAll({
      where: { group_id },
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
        isOnline: member.User.is_online,
        lastLogin: member.User.last_login,
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
    const { group_id, user_id, newRole } = req.body;
    const requesterId = req.userId;

    if (!["admin", "member"].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Check if requester is admin
    const requesterMembership = await Models.GroupMember.findOne({
      where: { group_id, user_id: requesterId },
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
        where: { group_id, role: "admin" },
      });

      if (adminCount === 1) {
        const memberToChange = await Models.GroupMember.findOne({
          where: { group_id, user_id },
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
      { where: { group_id, user_id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Publish role update event
    // mqttService.publish("group/member/role-updated", {
    //   group_id,
    //   user_id,
    //   newRole,
    //   timestamp: new Date(),
    // });

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
