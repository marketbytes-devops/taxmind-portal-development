import mongoose from 'mongoose';

var taxCreditSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    icon: String,
    description: String,
    details: String,
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

export const TaxCreditModel = mongoose.model('TaxCreditModel', taxCreditSchema);
