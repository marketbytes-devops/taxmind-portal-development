import mongoose from 'mongoose';

var faqSchema = new mongoose.Schema(
  {
    question: String,
    answer: String,
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

export const FaqModel = mongoose.model('FaqModel', faqSchema);
