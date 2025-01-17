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
var CryptoJS = require("crypto-js");

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      // Message belongs to sender
      Message.belongsTo(models.User, {
        foreignKey: "sender_id",
        as: "sender",
      });

      // Polymorphic associations
      Message.belongsTo(models.User, {
        foreignKey: "messageable_id",
        constraints: false,
        scope: {
          messageable_type: "User",
        },
        as: "recipientUser",
      });

      Message.belongsTo(models.Group, {
        foreignKey: "messageable_id",
        constraints: false,
        scope: {
          messageable_type: "Group",
        },
        as: "recipientGroup",
      });
    }

    // Simple decrypt method
    static decrypt(encryptedText, key) {
      try {
        if (!encryptedText || !encryptedText.includes(":")) return "";

        const [salt, encrypted] = encryptedText.split(":");
        const decrypted = CryptoJS.AES.decrypt(encrypted, key);
        return decrypted.toString(CryptoJS.enc.Utf8);
      } catch (error) {
        console.error("Decryption error:", error);
        return "";
      }
    }

    // Simple encrypt method
    static encrypt(text, key) {
      try {
        const salt = CryptoJS.lib.WordArray.random(128 / 8);
        const encrypted = CryptoJS.AES.encrypt(text, key);
        return `${salt}:${encrypted}`;
      } catch (error) {
        console.error("Encryption error:", error);
        return text;
      }
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
        get() {
          const encrypted = this.getDataValue("content");
          const key = process.env.ENCRYPTION_KEY;
          return Message.decrypt(encrypted, key);
        },
        set(value) {
          const key = process.env.ENCRYPTION_KEY;
          this.setDataValue("content", Message.encrypt(value, key));
        },
      },
      sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      messageable_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      messageable_type: {
        type: DataTypes.ENUM("User", "Group"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("sent", "delivered", "read"),
        defaultValue: "sent",
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
          fields: ["messageable_id", "messageable_type"],
        },
      ],
    }
  );

  return Message;
};
