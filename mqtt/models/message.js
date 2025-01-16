// "use strict";
// const { Model } = require("sequelize");

// module.exports = (sequelize, DataTypes) => {
//   class Message extends Model {
//     static associate(models) {
//       //messages belong to a user as a sender
//       Message.belongsTo(models.User, {
//         as: "sender",
//         foreignKey: "senderId",
//       });
//       //messages belong to a user as a receiver
//       Message.belongsTo(models.User, {
//         as: "receiver",
//         foreignKey: "receiverId",
//       });
//       // messages belong to a group
//       Message.belongsTo(models.Group, {
//         foreignKey: "groupId",
//       });
//     }
//     encrypt(text, key) {
//       const iv = crypto.randomBytes(16);
//       const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
//       let encrypted = cipher.update(text);
//       encrypted = Buffer.concat([encrypted, cipher.final()]);
//       return iv.toString("hex") + ":" + encrypted.toString("hex");
//     }

//     decrypt(text, key) {
//       const textParts = text.split(":");
//       const iv = Buffer.from(textParts.shift(), "hex");
//       const encryptedText = Buffer.from(textParts.join(":"), "hex");
//       const decipher = crypto.createDecipheriv(
//         "aes-256-cbc",
//         Buffer.from(key),
//         iv
//       );
//       let decrypted = decipher.update(encryptedText);
//       decrypted = Buffer.concat([decrypted, decipher.final()]);
//       return decrypted.toString();
//     }
//   }

//   Message.init(
//     {
//       id: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         primaryKey: true,
//       },
//       content: {
//         type: DataTypes.TEXT("long"),
//         allowNull: false,
//         // Decrypt when retrieving
//         get() {
//           const encrypted = this.getDataValue("content");
//           if (encrypted) {
//             const key = process.env.ENCRYPTION_KEY;
//             return this.decrypt(encrypted, key);
//           }
//           return encrypted;
//         },
//         // Encrypt when storing
//         set(value) {
//           if (value) {
//             const key = process.env.ENCRYPTION_KEY;
//             this.setDataValue("content", this.encrypt(value, key));
//           }
//         },
//       },
//       type: {
//         type: DataTypes.ENUM("private", "group"),
//         allowNull: false,
//         defaultValue: "private",
//       },
//       status: {
//         type: DataTypes.ENUM("sent", "delivered", "read"),
//         defaultValue: "sent",
//       },
//       senderId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//       },
//       receiverId: {
//         type: DataTypes.UUID,
//         allowNull: true,
//       },
//       groupId: {
//         type: DataTypes.UUID,
//         allowNull: true,
//         validate: {
//           groupValidation(value) {
//             if (this.type === "group" && !value) {
//               throw new Error("groupId cannot be null for group messages");
//             }
//           },
//         },
//       },
//     },
//     {
//       sequelize,
//       // underscored: true,
//       timestamps: true,
//       paranoid: true,
//       deletedAt: "deleted_at",
//       createdAt: "created_at",
//       updatedAt: "updated_at",
//       modelName: "Message",
//       tableName: "messages",
//       indexes: [
//         {
//           fields: ["senderId", "receiverId", "groupId"],
//         },
//       ],
//     }
//   );

//   return Message;
// };

"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      // Messages belong to a user as a sender
      Message.belongsTo(models.User, {
        as: "sender",
        foreignKey: "sender_id",
      });

      // For direct messages only
      Message.belongsTo(models.User, {
        as: "receiver",
        foreignKey: "receiver_id",
      });

      // For group messages
      Message.belongsTo(models.Group, {
        foreignKey: "group_id",
      });
    }
  }

  Message.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      content: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("private", "group"),
        allowNull: false,
        defaultValue: "private",
        validate: {
          customValidator(value) {
            if (value === "private" && !this.receiver_id) {
              throw new Error("receiverId is required for private messages");
            }
            if (value === "group" && !this.group_id) {
              throw new Error("groupId is required for group messages");
            }
          },
        },
      },
      status: {
        type: DataTypes.ENUM("sent", "delivered", "read"),
        defaultValue: "sent",
      },
      sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      receiver_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      group_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      timestamps: true,
      paranoid: true,
      deletedAt: "deleted_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      modelName: "Message",
      tableName: "messages",
      indexes: [
        {
          fields: ["sender_id"],
        },
        {
          fields: ["receiver_id"],
          where: {
            type: "private",
          },
        },
        {
          fields: ["group_id"],
          where: {
            type: "group",
          },
        },
      ],
    }
  );

  return Message;
};
