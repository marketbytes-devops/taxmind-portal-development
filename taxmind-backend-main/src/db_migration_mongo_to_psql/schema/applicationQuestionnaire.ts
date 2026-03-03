import mongoose from 'mongoose';

import { decrypt, encrypt } from '../util/crypto';

const applicationQuestionnaireSchema = new mongoose.Schema(
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
    // PostgreSQL questionnaire ID for bidirectional linking
    pgQuestionnaireId: {
      type: String,
      required: false,
    },
    // PostgreSQL application ID for bidirectional linking
    pgApplicationId: {
      type: String,
      required: false,
    },
    allQuestionAnswers: [
      {
        category: {
          type: String,
          get: decrypt,
          set: encrypt,
        },
        // PostgreSQL questionnaire category ID for bidirectional linking
        pgQuestionnaireCategoryId: {
          type: String,
          required: false,
        },
        questions: [
          {
            question: { type: String, get: decrypt, set: encrypt },
            answer: { type: mongoose.Schema.Types.Mixed },
            answerType: { type: String, enum: ['String', 'Number', 'Date', 'Boolean'] },
            // PostgreSQL question ID for bidirectional linking
            pgQuestionId: {
              type: String,
              required: false,
            },
          },
        ],
      },
    ],
    status: {
      type: String,
      default: 'ACTIVE', //ACTIVE, DELETED
    },
  },
  {
    //timestamps: true
    timestamps: { createdAt: 'create_date', updatedAt: 'update_date' },
  }
);

applicationQuestionnaireSchema.set('toObject', { getters: true });
applicationQuestionnaireSchema.set('toJSON', { getters: true });

export const ApplicationQuestionnaireModel = mongoose.model(
  'ApplicationQuestionnaireModel',
  applicationQuestionnaireSchema
);
