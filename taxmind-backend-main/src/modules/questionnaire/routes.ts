import { Router } from 'express';

import { MODULE_CONFIGS } from '@/constants/modulePermissions';
import { authorize } from '@/middleware/authorize';
import { paginate } from '@/middleware/paginate';
import { requirePermission } from '@/middleware/rbac';

import {
  createQuestion,
  createQuestionCategory,
  createQuestionnaire,
  createQuestionnaireResponse,
  deleteQuestion,
  deleteQuestionCategory,
  deleteQuestionnaire,
  getQuestion,
  getQuestionnaire,
  getQuestionnaireResponse,
  getQuestionnaireResponseByApplicationId,
  importQuestionnaire,
  listQuestionCategories,
  listQuestionnaireResponses,
  listQuestionnaires,
  listQuestions,
  publishQuestionnaire,
  saveAnswer,
  submitQuestionnaireResponse,
  updateQuestion,
  updateQuestionCategory,
  updateQuestionnaireResponse,
} from './services';

const router = Router();

// =====================
// Questionnaire Routes (Admin Only)
// =====================

// List questionnaires with filters
router.get(
  '/',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'view'),
  paginate,
  listQuestionnaires
);

// Create new questionnaire
router.post(
  '/',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'create'),
  createQuestionnaire
);

// Import questionnaire
router.post(
  '/import',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'create'),
  importQuestionnaire
);

// Publish questionnaire
router.post(
  '/:questionnaireId/publish',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'edit'),
  publishQuestionnaire
);

// Delete questionnaire (only drafts without responses)
router.delete(
  '/:questionnaireId',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'delete'),
  deleteQuestionnaire
);

// =====================
// Question Category Routes (Admin Only)
// =====================

// List categories for a questionnaire
router.get(
  '/:questionnaireId/categories',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'view'),
  listQuestionCategories
);

// Create question category
router.post(
  '/categories',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'create'),
  createQuestionCategory
);

// Update question category
router.patch(
  '/categories/:categoryId',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'edit'),
  updateQuestionCategory
);

// Delete question category
router.delete(
  '/categories/:categoryId',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'delete'),
  deleteQuestionCategory
);

// =====================
// Question Routes (Admin Only)
// =====================

// List questions in a category
router.get(
  '/categories/:categoryId/questions',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'view'),
  listQuestions
);

// Get single question details
router.get(
  '/questions/:questionId',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'view'),
  getQuestion
);

// Create question
router.post(
  '/questions',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'create'),
  createQuestion
);

// Update question
router.patch(
  '/questions/:questionId',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'edit'),
  updateQuestion
);

// Delete question
router.delete(
  '/questions/:questionId',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'delete'),
  deleteQuestion
);

// =====================
// Questionnaire Response Routes
// =====================

// List all questionnaire responses (Admin only)
router.get(
  '/responses',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  paginate,
  listQuestionnaireResponses
);

// Get questionnaire + answers by response
router.get(
  '/applications/:applicationId',
  authorize('ADMIN', 'USER'),
  requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  getQuestionnaireResponseByApplicationId
);

// Get questionnaire + answers by response
router.get(
  '/responses/:responseId',
  authorize('ADMIN', 'USER'),
  requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  getQuestionnaireResponse
);

// Create questionnaire response (User / Admin)
router.post('/responses', authorize('ADMIN','USER'), createQuestionnaireResponse);

// Update questionnaire response progress (User / Admin)
router.patch('/responses/:responseId', authorize('ADMIN','USER'), updateQuestionnaireResponse);

// Submit questionnaire response (User / Admin)
router.post('/responses/submit', authorize('USER', 'ADMIN'), submitQuestionnaireResponse);

// Save answer to a specific question (User / Admin)
router.post('/answers', authorize('USER', 'ADMIN'), saveAnswer);

// Get single questionnaire with full details
router.get(
  '/:questionnaireId',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.questionnaire.name, 'view'),
  getQuestionnaire
);

export default router;
