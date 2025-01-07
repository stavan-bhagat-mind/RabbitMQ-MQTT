// const { Group, User, GroupMember } = require("../models");

// const groupController = {
//   // Create Group
//   async createGroup(req, res) {
//     try {
//       const { name, isPrivate } = req.body;
//       const creatorId = req.user.id;

//       const group = await Group.create({
//         name,
//         creatorId,
//         isPrivate,
//       });

//       // Add creator as a member
//       await GroupMember.create({
//         groupId: group.id,
//         userId: creatorId,
//         role: "admin",
//       });

//       res.status(201).json({
//         success: true,
//         group: {
//           id: group.id,
//           name: group.name,
//           creatorId,
//           isPrivate,
//         },
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   },

//   // Get Group Details
//   async getGroup(req, res) {
//     try {
//       const { groupId } = req.params;

//       const group = await Group.findByPk(groupId, {
//         include: [
//           {
//             model: User,
//             through: {
//               attributes: ["role"],
//             },
//           },
//         ],
//       });

//       if (!group) {
//         return res.status(404).json({
//           success: false,
//           message: "Group not found",
//         });
//       }

//       res.json({
//         success: true,
//         group,
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   },

//   // Add User to Group
//   async addUserToGroup(req, res) {
//     try {
//       const { groupId, userId } = req.body;

//       const group = await Group.findByPk(groupId);
//       if (!group) {
//         return res.status(404).json({
//           success: false,
//           message: "Group not found",
//         });
//       }

//       await GroupMember.create({
//         groupId,
//         userId,
//         role: "member",
//       });

//       res.json({
//         success: true,
//         message: "User  added to group successfully",
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   },

//   // Remove User from Group
//   async removeUserFromGroup(req, res) {
//     try {
//       const { groupId, userId } = req.body;

//       const group = await Group.findByPk(groupId);
//       if (!group) {
//         return res.status(404).json({
//           success: false,
//           message: "Group not found",
//         });
//       }

//       await GroupMember.destroy({
//         where: {
//           groupId,
//           userId,
//         },
//       });

//       res.json({
//         success: true,
//         message: "User  removed from group successfully",
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   },
// };

// module.exports = groupController;
