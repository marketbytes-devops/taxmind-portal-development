import mongoose from 'mongoose';

import { decrypt, encrypt } from '../util/crypto';

var chatSchema = new mongoose.Schema(
  {
    senderAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminModel',
    },
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel',
    },
    receiverAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminModel',
    },
    receiverUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel',
    },
    messageType: {
      type: String, //TEXT, PHOTO, VIDEO, FILE
      default: 'TEXT',
    },
    text: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    photo: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    video: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    file: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    originalFileName: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    status: {
      type: String,
      default: 'UNREAD', //READ, DELETED
    },
  },
  {
    //timestamps: true
    timestamps: { createdAt: 'create_date', updatedAt: 'update_date' },
  }
);

chatSchema.set('toObject', { getters: true });
chatSchema.set('toJSON', { getters: true });

export const ChatModel = mongoose.model('ChatModel', chatSchema);
