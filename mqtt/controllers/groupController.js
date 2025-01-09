const { raw } = require("express");
const { Models } = require("../models");
const { Op } = require("sequelize");

async function createGroup(req, res) {
  try {
    const { name, isPrivate } = req.body;
    const creatorId = req.userId;

    const group = await Models.Group.create({
      name,
      creatorId,
      isPrivate,
    });

    await Models.GroupMember.create({
      groupId: group.id,
      userId: creatorId,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        creatorId,
        isPrivate,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Get Group Details
async function getGroup(req, res) {
  try {
    const { id } = req.params;

    const group = await Models.Group.findByPk(id, {
      include: [
        {
          model: Models.User,
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
    const { groupId, userId } = req.body;

    const group = await Models.Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    await Models.GroupMember.create({
      groupId,
      userId,
      role: "member",
    });

    res.json({
      success: true,
      message: "User  added to group successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Remove User from Group
async function removeUserFromGroup(req, res) {
  try {
    const { groupId, userId } = req.body;

    const group = await Models.Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    await Models.GroupMember.destroy({
      where: {
        groupId,
        userId,
      },
    });

    res.json({
      success: true,
      message: "User  removed from group successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getMembersFromGroup(req, res) {
  try {
    const { groupId } = req.params;
    const creatorId = req.userId;
    const group = await Models.Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const data = await Models.GroupMember.findAll({
      where: {
        groupId,
      },
      include: [
        {
          model: Models.User,
          attributes: ["username"],
        },
      ],
      raw: true,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  createGroup,
  getGroup,
  addUserToGroup,
  removeUserFromGroup,
  getMembersFromGroup,
};
