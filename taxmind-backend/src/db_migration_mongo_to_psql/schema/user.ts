import mongoose from 'mongoose';

import { decrypt, encrypt } from '../util/crypto';

// Type definitions for user schema
// interface SpouseDetails {
//   fullName?: string;
//   maidenName?: string;
//   email?: string;
//   phone?: string;
//   dob?: Date;
//   profession?: string;
//   ppsNumber?: string;
//   address?: string;
//   eircode?: string;
//   signature?: string;
// }

// interface StatusHistoryItem {
//   status: string;
//   isAuto: boolean;
//   updatedAt: Date;
// }

var userSchema = new mongoose.Schema(
  {
    role: {
      type: String, //CLIENT
      default: 'CLIENT',
    },
    fullName: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    maidenName: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    email: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    phone: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    dob: {
      type: Date,
      // get: decrypt,
      // set: encrypt
    },
    profession: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    ppsNumber: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    address: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    eircode: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    signature: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    maritalStatus: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    spouseDetails: {
      fullName: {
        type: String,
        get: decrypt,
        set: encrypt,
      },
      maidenName: {
        type: String,
        get: decrypt,
        set: encrypt,
      },
      email: {
        type: String,
        get: decrypt,
        set: encrypt,
      },
      phone: {
        type: String,
        get: decrypt,
        set: encrypt,
      },
      dob: {
        type: Date,
        // get: decrypt,
        // set: encrypt
      },
      profession: {
        type: String,
        get: decrypt,
        set: encrypt,
      },
      ppsNumber: {
        type: String,
        get: decrypt,
        set: encrypt,
      },
      address: {
        type: String,
        get: decrypt,
        set: encrypt,
      },
      eircode: {
        type: String,
        get: decrypt,
        set: encrypt,
      },
      signature: {
        type: String,
        get: decrypt,
        set: encrypt,
      },
    },
    password: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    lastUpdatedOn: {
      //last details update date and time
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      default: 'PENDING', //ACTIVE, INACTIVE, DELETED
    },
    statusHistory: [
      {
        status: String,
        isAuto: Boolean,
        updatedAt: Date,
      },
    ],
    pgUserId: { type: String },
  },
  {
    //timestamps: true
    timestamps: { createdAt: 'create_date', updatedAt: 'update_date' },
  }
);

userSchema.set('toObject', { getters: true });
userSchema.set('toJSON', { getters: true });

export const UserModel = mongoose.model('UserModel', userSchema);
