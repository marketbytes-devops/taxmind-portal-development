import mongoose from 'mongoose';

import { decrypt, encrypt } from '../util/crypto';

const applicationReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel',
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApplicationModel',
      required: true,
    },
    rating: {
      type: Number,
    },
    review: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    status: {
      type: String,
      default: 'PENDING', //ACTIVE, REJECTED, DELETED
    },
  },
  {
    //timestamps: true
    timestamps: { createdAt: 'create_date', updatedAt: 'update_date' },
  }
);

applicationReviewSchema.set('toObject', { getters: true });
applicationReviewSchema.set('toJSON', { getters: true });

export const ApplicationReviewModel = mongoose.model(
  'ApplicationReviewModel',
  applicationReviewSchema
);
