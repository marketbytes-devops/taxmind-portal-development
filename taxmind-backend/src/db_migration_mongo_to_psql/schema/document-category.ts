import mongoose from 'mongoose';

const documentCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
      default: 'ACTIVE',
    },
    pgDocumentCategoryId: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'create_date', updatedAt: 'update_date' },
  }
);

export const DocumentCategoryModel = mongoose.model(
  'DocumentCategoryModel',
  documentCategorySchema
);
