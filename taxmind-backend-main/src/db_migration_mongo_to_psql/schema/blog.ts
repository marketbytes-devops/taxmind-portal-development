import mongoose from 'mongoose';

var blogSchema = new mongoose.Schema(
  {
    title: String,
    slug: String,
    image: String,
    content: String,
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

export const BlogModel = mongoose.model('BlogModel', blogSchema);
