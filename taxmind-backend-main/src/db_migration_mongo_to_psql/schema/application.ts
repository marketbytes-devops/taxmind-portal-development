import mongoose from 'mongoose';

import { decrypt, encrypt } from '../util/crypto';

const applicationSchema = new mongoose.Schema(
  {
    uid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel',
      required: true,
    },
    applicationId: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    applicationIdNo: {
      type: Number,
    },
    year: {
      type: Number,
    },
    isNoDocumentToUpload: {
      type: Boolean,
      default: false,
    },
    documents: [
      {
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'DocumentCategoryModel',
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
        uploadDate: {
          type: Date,
        },
      },
    ],
    refundAmount: {
      type: Number,
    },
    commissionPercentage: {
      type: Number,
    },
    commissionAmount: {
      type: Number,
    },
    promoCode: {
      type: String,
    },
    promoCodeDiscountPercentage: {
      type: Number,
    },
    promoCodeDiscountAmount: {
      type: Number,
    },
    vatPercentage: {
      type: Number,
    },
    vatAmount: {
      type: Number,
    },
    discountAmount: {
      type: Number,
    },
    totalCommissionAmount: {
      type: Number,
    },
    isQuestionnaireSubmitted: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      default: 'PENDING', //INITIATE, PAID, FAILED
    },
    invoiceId: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    invoiceIdNo: {
      type: Number,
    },
    status: {
      type: String,
      default: 'SUBMITTED', //DOCUMENTS_UPLOADED, PROCESSING, APPROVED, DELETED
    },
    statusHistory: [
      {
        status: String,
        updatedAt: Date,
      },
    ],
  },
  {
    //timestamps: true
    timestamps: { createdAt: 'create_date', updatedAt: 'update_date' },
  }
);

applicationSchema.set('toObject', { getters: true });
applicationSchema.set('toJSON', { getters: true });

export const ApplicationModel = mongoose.model('ApplicationModel', applicationSchema);
