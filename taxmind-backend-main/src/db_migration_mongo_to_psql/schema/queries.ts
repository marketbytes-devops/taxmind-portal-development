import mongoose from 'mongoose';

var queryCategorySchema = new mongoose.Schema(
  {
    name: String,
    status: {
      type: String,
      default: 'ACTIVE', //INACTIVE, DELETED
    },
  },
  {
    //timestamps: true
    timestamps: { createdAt: 'create_date', updatedAt: 'update_date' },
  }
);

var querySchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueryCategoryModel',
    },
    message: String,
    status: {
      type: String,
      default: 'ACTIVE', //INACTIVE, DELETED
    },
  },
  {
    //timestamps: true
    timestamps: { createdAt: 'create_date', updatedAt: 'update_date' },
  }
);

export const QueryModel = mongoose.model('QueryModel', querySchema);

export const QueryCategoryModel = mongoose.model('QueryCategoryModel', queryCategorySchema);
