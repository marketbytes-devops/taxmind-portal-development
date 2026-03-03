/**
 * Questionnaire module services
 * - CRUD for questionnaires, categories, and questions
 * - Response lifecycle: draft/save/submit
 * - Enforcement: required questions, parent-child visibility, per-option doc rules
 */
import { and, desc, eq, ilike, inArray, isNotNull, isNull } from 'drizzle-orm';

import { applicationStatuses } from '@/constants';
import { activityLogEntityNames } from '@/constants';
import { db, models } from '@/database';
import { getPresignedGetObjectUrl } from '@/integrations/awsS3';
import logger from '@/logger';
import { activityLog } from '@/logger/activityLog';
import { mail } from '@/mail';
import { notificationHandler,adminNotificationHandler } from '@/notifications';
import { notificationTemplates } from '@/notifications/templates';
import ApiError from '@/utils/apiError';
import { serviceHandler } from '@/utils/serviceHandler';

import { applicationIdParamSchema } from '../applications/validations';
import {
  createQuestionCategorySchema,
  createQuestionSchema,
  createQuestionnaireResponseSchema,
  createQuestionnaireSchema,
  deleteQuestionCategorySchema,
  deleteQuestionSchema,
  idParamSchema,
  importQuestionnaireSchema,
  listQuestionnaireResponsesSchema,
  listQuestionnairesSchema,
  publishQuestionnaireSchema,
  questionIdParamSchema,
  questionnaireIdParamSchema,
  responseIdParamSchema,
  saveAnswerSchema,
  submitQuestionnaireResponseSchema,
  updateQuestionCategorySchema,
  updateQuestionSchema,
  updateQuestionnaireResponseSchema,
} from './validations';

// ----------
// Helpers
// ----------

/**
 * Helper function to fetch a questionnaire with nested question tree structure
 * Returns the same format as getQuestionnaire for consistency
 * Categories and questions are sorted by createdAt in ascending order for consistent ordering
 */
const fetchQuestionnaireWithNestedQuestions = async (questionnaireId: string) => {
  // Fetch questionnaire with categories and icons
  const questionnaire = await db.query.questionnaires.findFirst({
    where: eq(models.questionnaires.id, questionnaireId),
    columns: {
      createdBy: false,
      publishedBy: false,
      publishedAt: false,
      createdAt: false,
      updatedAt: false,
    },
    with: {
      questionCategories: {
        columns: { questionnaireId: false, iconId: false, updatedAt: false },
        orderBy: (t, { asc }) => [asc(t.createdAt)], // Sort categories by createdAt ascending
        with: {
          icon: {
            columns: {
              id: true,
              key: true,
              fileName: true,
              mimeType: true,
              uploadedAt: true,
            },
          },
        },
      },
    },
  });

  if (!questionnaire) {
    throw new ApiError('Questionnaire not found', 404);
  }

  // Attach presigned filePath for each question category icon (if present)
  const questionCategoriesWithUrls = await Promise.all(
    questionnaire.questionCategories.map(async (q) => {
      if (q.icon?.key) {
        try {
          const filePath = await getPresignedGetObjectUrl(q.icon.key);
          return { ...q, icon: { ...q.icon, filePath } };
        } catch (err) {
          console.warn('Failed to generate presigned image URL for category:', q.id, err);
        }
      }
      return q;
    })
  );

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const { questionCategories, ...rest } = questionnaire;

  const formattedQuestionnaire = { ...rest, questionCategories: questionCategoriesWithUrls };

  // Fetch all questions once (avoid N+1) with minimal columns needed, sorted by createdAt ascending
  const allQuestions = await db.query.questions.findMany({
    where: eq(models.questions.questionnaireId, questionnaireId),
    columns: {
      questionnaireId: false,
      placeholder: false,
      updatedAt: false,
    },
    orderBy: (t, { asc }) => [asc(t.createdAt)], // Sort questions by createdAt ascending
  });

  // Narrow local types for augmentation under options
  type QuestionBase = (typeof allQuestions)[number];
  type AugmentedQuestion = QuestionBase & {
    options?: AugmentedOption[];
  };
  type AugmentedOption = Record<string, unknown> & {
    value?: string | number;
    questions?: AugmentedQuestion[];
  };

  // Build children lookup by parentQuestionId
  const childrenByParentId = new Map<string, QuestionBase[]>();
  for (const q of allQuestions) {
    if (q.parentQuestionId) {
      const arr = childrenByParentId.get(q.parentQuestionId) ?? [];
      arr.push(q);
      childrenByParentId.set(q.parentQuestionId, arr);
    }
  }

  // Helper: attach matched children under each option based on showIfParentOptionValue
  const attachUnderOptions = (q: QuestionBase): AugmentedQuestion => {
    const directChildren = childrenByParentId.get(q.id) ?? [];

    // Only attach children under options when options is an array
    if (Array.isArray(q.options)) {
      // Shallow copy options and inject questions per matching option
      const optionsArray = q.options as unknown as AugmentedOption[];
      const newOptions = optionsArray.map((opt) => {
        const optValue = String(opt?.value ?? '');
        // Filter children whose showIfParentOptionValue matches this option value
        // Children are already sorted by createdAt from the initial query
        const matchingChildren: AugmentedQuestion[] = directChildren
          .filter((child) => String(child.showIfParentOptionValue ?? '') === optValue)
          .map((child) => attachUnderOptions(child));

        return {
          ...opt,
          questions: matchingChildren,
        } as AugmentedOption;
      });

      return { ...(q as QuestionBase), options: newOptions } as AugmentedQuestion;
    }

    // No options: cannot attach children under options, ensure options undefined to satisfy type
    return { ...(q as QuestionBase), options: undefined } as AugmentedQuestion;
  };

  // Collect root questions per category (no parent)
  const rootsByCategory = new Map<string, QuestionBase[]>();
  for (const q of allQuestions) {
    if (!q.parentQuestionId) {
      const arr = rootsByCategory.get(q.categoryId) ?? [];
      arr.push(q);
      rootsByCategory.set(q.categoryId, arr);
    }
  }

  // Build nested structure per category (roots are already sorted by createdAt from query)
  const nestedByCategory = new Map<string, AugmentedQuestion[]>();
  for (const [catId, arr] of rootsByCategory.entries()) {
    // arr is already sorted by createdAt from the initial query, no need to sort again
    nestedByCategory.set(
      catId,
      arr.map((q) => attachUnderOptions(q))
    );
  }

  // Attach nested questions per category (children under options)
  // Categories are already sorted by createdAt from the initial query
  const categoriesWithTrees = formattedQuestionnaire.questionCategories.map((c) => ({
    ...c,
    questions: nestedByCategory.get(c.id) ?? [],
  }));

  return {
    ...questionnaire,
    questionCategories: categoriesWithTrees,
  };
};

// Ensure setting parentQuestionId won't create a cycle and stays within same category
const assertNoCycleWithNewParent = async (
  categoryId: string,
  currentQuestionId: string,
  newParentId: string
) => {
  if (currentQuestionId === newParentId) {
    throw new ApiError('A question cannot be its own parent', 400);
  }

  // Fetch all questions in the category once
  const questionsInCategory = await db.query.questions.findMany({
    where: eq(models.questions.categoryId, categoryId),
    columns: { id: true, parentQuestionId: true },
  });

  const parentMap = new Map<string, string | null>(
    questionsInCategory.map((q) => [q.id, q.parentQuestionId || null])
  );

  // Validate the new parent exists and is in same category
  if (!parentMap.has(newParentId)) {
    throw new ApiError('Parent question not found in the same category', 404);
  }

  // Walk up the chain from the proposed parent; if we encounter currentQuestionId, it's a cycle
  const seen = new Set<string>();
  let cursor: string | null = newParentId;
  let depth = 0;
  while (cursor) {
    if (cursor === currentQuestionId) {
      throw new ApiError('Invalid parent: would create a cyclic question hierarchy', 400);
    }
    if (seen.has(cursor)) {
      // Existing data already forms a cycle; block updates until fixed
      throw new ApiError('Invalid hierarchy: detected cycle in existing data', 400);
    }
    seen.add(cursor);
    cursor = parentMap.get(cursor) ?? null;

    depth += 1;
    if (depth > 1000) {
      // Safety guard
      throw new ApiError('Hierarchy depth exceeded safe limit', 400);
    }
  }
};

// =======================
// Questionnaire Services
// =======================

/** List questionnaires with optional filters (taxYear, status), paginated */
export const listQuestionnaires = serviceHandler(listQuestionnairesSchema, async (req, res) => {
  const { taxYear, status } = req.query;
  const { limit, offset, page, size } = req.pagination;

  const whereConditions = [];
  if (taxYear) {
    whereConditions.push(eq(models.questionnaires.taxYear, taxYear));
  }
  let sortBy = [desc(models.questionnaires.taxYear), desc(models.questionnaires.createdAt)];
  if (status) {
    whereConditions.push(eq(models.questionnaires.status, status));
    if (status === 'draft') {
      sortBy = [desc(models.questionnaires.updatedAt)];
    }
  }

  const [questionnaires, totalCount] = await Promise.all([
    db.query.questionnaires.findMany({
      columns: { createdBy: false, publishedBy: false },
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      orderBy: sortBy,
      limit: limit,
      offset,
    }),
    db.$count(
      models.questionnaires,
      whereConditions.length > 0 ? and(...whereConditions) : undefined
    ),
  ]);

  // attach each questionnaire's total question count, total applications count, applications in review count and completed count
  // if questionnaire status is draft, just questionCount is only needed
  const questionnairesWithCounts = await Promise.all(
    questionnaires.map(async (q) => {
      try {
        if (q.status === 'draft') {
          const questionCount = await db.$count(
            models.questions,
            eq(models.questions.questionnaireId, q.id)
          );
          return {
            ...q,
            questionCount,
          };
        }

        // For published/archived, fetch all counts in parallel
        const [questionCount, totalApplications, applicationsInReview, applicationsCompleted] =
          await Promise.all([
            db.$count(models.questions, eq(models.questions.questionnaireId, q.id)),
            db.$count(
              models.questionnaireResponses,
              eq(models.questionnaireResponses.questionnaireId, q.id)
            ),
            db.$count(
              models.questionnaireResponses,
              and(
                eq(models.questionnaireResponses.questionnaireId, q.id),
                eq(models.questionnaireResponses.status, 'under_review')
              )
            ),
            db.$count(
              models.questionnaireResponses,
              and(
                eq(models.questionnaireResponses.questionnaireId, q.id),
                eq(models.questionnaireResponses.status, 'approved')
              )
            ),
          ]);

        return {
          ...q,
          questionCount,
          totalApplications,
          applicationsInReview,
          applicationsCompleted,
        };
      } catch (error) {
        console.error(`Error fetching counts for questionnaire ${q.id}:`, error);
        // Return questionnaire with default counts on error
        return {
          ...q,
          questionCount: 0,
          totalResponses: 0,
          responsesInReview: 0,
          responsesCompleted: 0,
          responsesSubmitted: 0,
        };
      }
    })
  );

  return res.data('Questionnaires retrieved successfully', questionnairesWithCounts, {
    page,
    size,
    total: totalCount,
  });
});

/**
 * Get a questionnaire shell plus categories (with icons) and nested questions tree.
 * Question tree is built in-memory to avoid N+1.
 */
export const getQuestionnaire = serviceHandler(idParamSchema, async (req, res) => {
  const { questionnaireId } = req.params;

  const questionnaireWithNestedQuestions =
    await fetchQuestionnaireWithNestedQuestions(questionnaireId);

  return res.success('Questionnaire retrieved successfully', questionnaireWithNestedQuestions);
});

/** Create a new questionnaire (auto version/title/description), default status=draft */
export const createQuestionnaire = serviceHandler(createQuestionnaireSchema, async (req, res) => {
  const { taxYear } = req.body;
  const createdBy = req.admin.id;

  // Get the highest version for this tax year to auto-generate next version
  const existingQuestionnaire = await db.query.questionnaires.findFirst({
    where: eq(models.questionnaires.taxYear, taxYear),
    orderBy: [desc(models.questionnaires.version)],
  });

  // Auto-generate version (increment from existing or start at 1)
  const version = existingQuestionnaire ? existingQuestionnaire.version + 1 : 1;

  // Auto-generate title and description
  const title = `Tax Return Questionnaire for ${taxYear}`;
  const description = `Comprehensive tax questionnaire for the ${taxYear} tax year. Please complete all applicable sections to ensure accurate tax return preparation.`;

  const [questionnaire] = await db
    .insert(models.questionnaires)
    .values({
      taxYear,
      title,
      description,
      version,
      status: 'draft', // Default status is always draft
      createdBy,
    })
    .returning();
  const activityLogData = {
    entityName: activityLogEntityNames.questionnaire,
    entityId: questionnaire.id,
    action: 'insert' as const,
    modifiedUserId: req.admin.id,
    oldData: null,
    newData: questionnaire,
  };
  await activityLog(activityLogData);
  return res.success('Questionnaire created successfully', questionnaire);
});

/**
 * Helper function to insert questions hierarchically using a queue-based approach
 * This ensures parent questions are always created before their children
 */
const insertQuestionsHierarchically = async (
  tx: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  allQuestions: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  newQuestionnaireId: string,
  oldToNewCategoryMap: Map<string, string>
) => {
  if (allQuestions.length === 0) return;

  // Create mapping of old question IDs to new ones
  const oldToNewQuestionMap = new Map<string, string>();

  // Separate root questions from child questions
  const rootQuestions = allQuestions.filter((q) => !q.parentQuestionId);
  const childQuestions = allQuestions.filter((q) => q.parentQuestionId);

  console.log(`Root questions: ${rootQuestions.length}, Child questions: ${childQuestions.length}`);

  // Sort all questions by sortOrder
  rootQuestions.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  childQuestions.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Step 1: Insert all root questions first
  if (rootQuestions.length > 0) {
    const rootInserts = rootQuestions.map((q) => ({
      questionnaireId: newQuestionnaireId,
      categoryId: oldToNewCategoryMap.get(q.categoryId)!,
      parentQuestionId: null,
      questionText: q.questionText,
      helpText: q.helpText,
      placeholder: q.placeholder,
      questionType: q.questionType,
      isRequired: q.isRequired,
      sortOrder: q.sortOrder,
      options: q.options,
      showIfParentOptionValue: q.showIfParentOptionValue,
    }));

    const newRootQuestions = await tx
      .insert(models.questions)
      .values(rootInserts)
      .returning({ id: models.questions.id });

    // Map old root question IDs to new ones
    rootQuestions.forEach((oldQ, index) => {
      oldToNewQuestionMap.set(oldQ.id, newRootQuestions[index].id);
    });

    console.log(`Inserted ${newRootQuestions.length} root questions`);
  }

  // Step 2: Process child questions in waves until all are processed
  let remainingChildQuestions = [...childQuestions];
  let processedInThisWave = 0;
  let waveCount = 0;
  const maxWaves = 10; // Safety limit

  while (remainingChildQuestions.length > 0 && waveCount < maxWaves) {
    processedInThisWave = 0;
    const questionsToProcess = [];
    const questionsToPostpone = [];

    // Find child questions whose parents have been processed
    for (const childQ of remainingChildQuestions) {
      const oldParentId = childQ.parentQuestionId;
      const newParentId = oldToNewQuestionMap.get(oldParentId);

      if (newParentId) {
        // Parent exists, we can process this question
        questionsToProcess.push({
          oldQuestion: childQ,
          newParentId: newParentId,
        });
      } else {
        // Parent not yet processed, postpone this question
        questionsToPostpone.push(childQ);
      }
    }

    console.log(
      `Wave ${waveCount + 1}: Processing ${questionsToProcess.length} questions, postponing ${questionsToPostpone.length}`
    );

    // Process questions that can be processed in this wave
    if (questionsToProcess.length > 0) {
      const childInserts = questionsToProcess.map(({ oldQuestion: q, newParentId }) => ({
        questionnaireId: newQuestionnaireId,
        categoryId: oldToNewCategoryMap.get(q.categoryId)!,
        parentQuestionId: newParentId,
        questionText: q.questionText,
        helpText: q.helpText,
        placeholder: q.placeholder,
        questionType: q.questionType,
        isRequired: q.isRequired,
        sortOrder: q.sortOrder,
        options: q.options,
        showIfParentOptionValue: q.showIfParentOptionValue,
      }));

      const newChildQuestions = await tx
        .insert(models.questions)
        .values(childInserts)
        .returning({ id: models.questions.id });

      // Map old child question IDs to new ones
      questionsToProcess.forEach(({ oldQuestion: oldQ }, index) => {
        oldToNewQuestionMap.set(oldQ.id, newChildQuestions[index].id);
      });

      processedInThisWave = questionsToProcess.length;
      console.log(`Inserted ${processedInThisWave} child questions in wave ${waveCount + 1}`);
    }

    // Update remaining questions for next wave
    remainingChildQuestions = questionsToPostpone;
    waveCount++;

    // Safety check: if no progress was made, break to prevent infinite loop
    if (processedInThisWave === 0 && remainingChildQuestions.length > 0) {
      console.error(
        `Failed to process ${remainingChildQuestions.length} child questions - possible orphaned references`
      );
      console.error(
        'Orphaned questions:',
        remainingChildQuestions.map((q) => ({ id: q.id, parentId: q.parentQuestionId }))
      );
      break;
    }
  }

  const totalProcessed =
    rootQuestions.length + (childQuestions.length - remainingChildQuestions.length);
  console.log(
    `Successfully processed ${totalProcessed} out of ${allQuestions.length} questions in ${waveCount} waves`
  );

  return oldToNewQuestionMap;
};

/** Create a new questionnaire from import, default status=draft */
export const importQuestionnaire = serviceHandler(importQuestionnaireSchema, async (req, res) => {
  const { taxYear, importFromTaxYear } = req.body;
  const createdBy = req.admin.id;

  // Validate source questionnaire exists and is published
  const sourceQuestionnaire = await db.query.questionnaires.findFirst({
    where: and(
      eq(models.questionnaires.taxYear, importFromTaxYear),
      eq(models.questionnaires.status, 'published')
    ),
    with: {
      questionCategories: {
        orderBy: models.questionCategories.sortOrder,
      },
    },
  });

  if (!sourceQuestionnaire) {
    throw new ApiError(`No published questionnaire found for tax year ${importFromTaxYear}`, 404);
  }

  // Get next version for target tax year
  const existingQuestionnaire = await db.query.questionnaires.findFirst({
    where: eq(models.questionnaires.taxYear, taxYear),
    orderBy: [desc(models.questionnaires.version)],
    columns: { version: true },
  });

  const version = existingQuestionnaire ? existingQuestionnaire.version + 1 : 1;

  // Fetch all questions for the source questionnaire in one optimized query
  const allSourceQuestions = await db.query.questions.findMany({
    where: eq(models.questions.questionnaireId, sourceQuestionnaire.id),
    orderBy: [models.questions.sortOrder],
  });

  // Debug logging
  console.log(
    `Source questionnaire has ${sourceQuestionnaire.questionCategories.length} categories`
  );
  console.log(`Found ${allSourceQuestions.length} questions to import`);

  // Check if we have child questions
  const childQuestions = allSourceQuestions.filter((q) => q.parentQuestionId !== null);
  console.log(`Found ${childQuestions.length} child questions`);

  // Execute import in transaction for atomicity
  const result = await db.transaction(async (tx) => {
    // Create new questionnaire
    const [newQuestionnaire] = await tx
      .insert(models.questionnaires)
      .values({
        taxYear,
        title: `Tax Return Questionnaire for ${taxYear}`,
        description: `Comprehensive tax questionnaire for the ${taxYear} tax year. Please complete all applicable sections to ensure accurate tax return preparation.`,
        version,
        status: 'draft',
        createdBy,
        importedFrom: importFromTaxYear,
      })
      .returning();

    console.log(`Created new questionnaire with ID: ${newQuestionnaire.id}`);

    // Batch insert all question categories
    if (sourceQuestionnaire.questionCategories.length > 0) {
      const categoryInserts = sourceQuestionnaire.questionCategories.map((category) => ({
        questionnaireId: newQuestionnaire.id,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        iconId: category.iconId,
      }));

      const newCategories = await tx
        .insert(models.questionCategories)
        .values(categoryInserts)
        .returning({ id: models.questionCategories.id });

      console.log(`Created ${newCategories.length} categories`);

      // Create mapping from old category IDs to new ones
      const oldToNewCategoryMap = new Map<string, string>();
      sourceQuestionnaire.questionCategories.forEach((oldCat, index) => {
        oldToNewCategoryMap.set(oldCat.id, newCategories[index].id);
      });

      // Insert all questions hierarchically with proper parent-child relationships
      if (allSourceQuestions.length > 0) {
        console.log('Starting hierarchical question insertion...');
        await insertQuestionsHierarchically(
          tx,
          allSourceQuestions,
          newQuestionnaire.id,
          oldToNewCategoryMap
        );
        console.log('Completed question insertion');
      }
    }

    return newQuestionnaire;
  });

  // Fetch the imported questionnaire with nested structure for consistent response format
  const importedQuestionnaireWithNestedQuestions = await fetchQuestionnaireWithNestedQuestions(
    result.id
  );

  return res.success('Questionnaire imported successfully', {
    ...importedQuestionnaireWithNestedQuestions,
    // Add import statistics
    importStats: {
      categoriesImported: sourceQuestionnaire.questionCategories.length,
      questionsImported: allSourceQuestions.length,
      importedFromTaxYear: importFromTaxYear,
    },
  });
});

/** Publish a questionnaire; archives prior published entries for the same year */
export const publishQuestionnaire = serviceHandler(publishQuestionnaireSchema, async (req, res) => {
  const { questionnaireId } = req.params;
  const publishedBy = req.admin.id;

  // Check if questionnaire exists
  const existingQuestionnaire = await db.query.questionnaires.findFirst({
    where: eq(models.questionnaires.id, questionnaireId),
    with: {
      questionCategories: {
        columns: { id: true, name: true },
        with: {
          questions: {
            columns: { id: true },
          },
        },
      },
    },
  });

  if (!existingQuestionnaire) {
    throw new ApiError('Questionnaire not found', 404);
  }

  if (existingQuestionnaire.status === 'published') {
    throw new ApiError('Questionnaire is already published', 400);
  }

  // Ensure there is at least one category
  if (existingQuestionnaire.questionCategories.length === 0) {
    throw new ApiError('Cannot publish a questionnaire with no categories', 400);
  }

  // Ensure each category has at least one question
  const categoriesWithoutQuestions = existingQuestionnaire.questionCategories.filter(
    (cat) => !cat.questions || cat.questions.length === 0
  );

  if (categoriesWithoutQuestions.length > 0) {
    const categoryNames = categoriesWithoutQuestions.map((cat) => cat.name || cat.id).join(', ');
    throw new ApiError(
      `Cannot publish questionnaire. The following categories have no questions: ${categoryNames}`,
      400
    );
  }
  const publishedQuestionnaire = await db.transaction(async (tx) => {
    // Archive existing published questionnaire for this tax year
    await tx
      .update(models.questionnaires)
      .set({ status: 'archived' })
      .where(
        and(
          eq(models.questionnaires.taxYear, existingQuestionnaire.taxYear),
          isNotNull(models.questionnaires.publishedAt)
        )
      );

    // Publish the new questionnaire
    const [publishedQuestionnaire] = await tx
      .update(models.questionnaires)
      .set({
        status: 'published',
        publishedBy,
        publishedAt: new Date(),
      })
      .where(eq(models.questionnaires.id, questionnaireId))
      .returning();

    return publishedQuestionnaire;
  });

  return res.success('Questionnaire published successfully', publishedQuestionnaire);
});

/** Delete a questionnaire if not published and no responses exist */
export const deleteQuestionnaire = serviceHandler(idParamSchema, async (req, res) => {
  const { questionnaireId } = req.params;

  // Check if questionnaire exists
  const existingQuestionnaire = await db.query.questionnaires.findFirst({
    where: eq(models.questionnaires.id, questionnaireId),
  });

  if (!existingQuestionnaire) {
    throw new ApiError('Questionnaire not found', 404);
  }

  // Don't allow deletion of published questionnaires
  if (existingQuestionnaire.status === 'published') {
    throw new ApiError(
      'Cannot delete a published questionnaire. Only draft questionnaires can be deleted.',
      400
    );
  }

  // Check if there are any responses
  const responsesExist = await db.query.questionnaireResponses.findFirst({
    where: eq(models.questionnaireResponses.questionnaireId, questionnaireId),
  });

  if (responsesExist) {
    throw new ApiError('Cannot delete questionnaire with existing responses.', 400);
  }
  const categories = await db.query.questionCategories.findMany({
    where: eq(models.questionCategories.questionnaireId, questionnaireId),
    columns: { id: true },
  });

  const categoryIds = categories.map((cat) => cat.id);
  await db.delete(models.questions).where(inArray(models.questions.categoryId, categoryIds));
  await db
    .delete(models.questionCategories)
    .where(inArray(models.questionCategories.id, categoryIds));

  await db.delete(models.questionnaires).where(eq(models.questionnaires.id, questionnaireId));
  const activityLogData = {
    entityName: activityLogEntityNames.questionnaire,
    entityId: existingQuestionnaire.id,
    action: 'delete' as const,
    modifiedUserId: req.admin.id,
    oldData: existingQuestionnaire,
    newData: null,
  };
  await activityLog(activityLogData);
  return res.success('Questionnaire deleted successfully');
});

// =======================
// Question Category Services
// =======================

/** List all categories for a questionnaire (with icon metadata) */
export const listQuestionCategories = serviceHandler(
  questionnaireIdParamSchema,
  async (req, res) => {
    const { questionnaireId } = req.params;

    // Verify questionnaire exists
    const questionnaire = await db.query.questionnaires.findFirst({
      where: eq(models.questionnaires.id, questionnaireId),
    });

    if (!questionnaire) {
      throw new ApiError('Questionnaire not found', 404);
    }

    const categories = await db.query.questionCategories.findMany({
      where: eq(models.questionCategories.questionnaireId, questionnaireId),
      orderBy: (t, { asc }) => [asc(t.createdAt)], // Sort categories by createdAt ascending
      columns: { questionnaireId: false, iconId: false, createdAt: false, updatedAt: false },
      with: {
        icon: {
          columns: {
            id: true,
            key: true,
            fileName: true,
            mimeType: true,
            uploadedAt: true,
          },
        },
      },
    });

    // Attach presigned filePath for each question category icon (if present)
    const questionCategoriesWithUrls = await Promise.all(
      categories.map(async (q) => {
        if (q.icon?.key) {
          try {
            const filePath = await getPresignedGetObjectUrl(q.icon.key);
            return { ...q, icon: { ...q.icon, filePath } };
          } catch (err) {
            console.warn('Failed to generate presigned image URL for blog:', q.id, err);
          }
        }
        return q;
      })
    );

    return res.success('Question categories retrieved successfully', questionCategoriesWithUrls);
  }
);

/** Create a question category; description is auto-generated if omitted */
export const createQuestionCategory = serviceHandler(
  createQuestionCategorySchema,
  async (req, res) => {
    const { questionnaireId, name, description, sortOrder } = req.body;

    // Verify questionnaire exists
    const questionnaire = await db.query.questionnaires.findFirst({
      where: eq(models.questionnaires.id, questionnaireId),
    });

    if (!questionnaire) {
      throw new ApiError('Questionnaire not found', 404);
    }

    // Duplicate name validation (case-insensitive) within same questionnaire
    const existingSameName = await db.query.questionCategories.findFirst({
      where: and(
        eq(models.questionCategories.questionnaireId, questionnaireId),
        // Simple case-insensitive compare by normalizing both sides in JS after fetch fallback
        ilike(models.questionCategories.name, name)
      ),
      columns: { id: true, name: true },
    });
    if (existingSameName) {
      throw new ApiError('A category with this name already exists for this questionnaire', 409);
    }

    // Auto-generate description if not provided
    const autoDescription = description?.trim().length
      ? description
      : `Documents and questions related to ${name}.`;

    const [category] = await db
      .insert(models.questionCategories)
      .values({
        questionnaireId,
        name,
        description: autoDescription,
        sortOrder,
      })
      .returning();
    const activityLogData = {
      entityName: activityLogEntityNames.question_category,
      entityId: category.id,
      action: 'insert' as const,
      modifiedUserId: req.admin.id,
      oldData: null,
      newData: category,
    };
    await activityLog(activityLogData);
    return res.success('Question category created successfully', category);
  }
);

/** Update a question category (name/description/sortOrder) */
export const updateQuestionCategory = serviceHandler(
  updateQuestionCategorySchema,
  async (req, res) => {
    const { categoryId } = req.params;
    const updateData = req.body;

    // Check if category exists
    const existingCategory = await db.query.questionCategories.findFirst({
      where: eq(models.questionCategories.id, categoryId),
    });

    if (!existingCategory) {
      throw new ApiError('Question category not found', 404);
    }

    // If name provided but description not provided, we won't auto-change description on update to avoid surprises
    const [updatedCategory] = await db
      .update(models.questionCategories)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(models.questionCategories.id, categoryId))
      .returning();
    const activityLogData = {
      entityName: activityLogEntityNames.question_category,
      entityId: existingCategory.id,
      action: 'update' as const,
      modifiedUserId: req.admin.id,
      oldData: existingCategory,
      newData: updatedCategory,
    };
    await activityLog(activityLogData);
    return res.success('Question category updated successfully', updatedCategory);
  }
);

/** Delete a category if empty (no questions) */
export const deleteQuestionCategory = serviceHandler(
  deleteQuestionCategorySchema,
  async (req, res) => {
    const { categoryId } = req.params;

    // Check if category exists
    const existingCategory = await db.query.questionCategories.findFirst({
      where: eq(models.questionCategories.id, categoryId),
      with: { questionnaire: { columns: { status: true } } },
    });

    if (!existingCategory) {
      throw new ApiError('Question category not found', 404);
    }

    if (existingCategory.questionnaire.status === 'published') {
      throw new ApiError('Cannot delete category from a published questionnaire', 400);
    }

    await db.delete(models.questions).where(eq(models.questions.categoryId, categoryId));

    await db.delete(models.questionCategories).where(eq(models.questionCategories.id, categoryId));
    const activityLogData = {
      entityName: activityLogEntityNames.question_category,
      entityId: existingCategory.id,
      action: 'delete' as const,
      modifiedUserId: req.admin.id,
      oldData: existingCategory,
      newData: null,
    };
    await activityLog(activityLogData);

    return res.success('Question category deleted successfully');
  }
);

// =======================
// Question Services
// =======================

/** List questions within a category, returned as a nested tree by parentQuestionId */
export const listQuestions = serviceHandler(deleteQuestionCategorySchema, async (req, res) => {
  const { categoryId } = req.params;

  // Verify category exists
  const category = await db.query.questionCategories.findFirst({
    where: eq(models.questionCategories.id, categoryId),
  });

  if (!category) {
    throw new ApiError('Question category not found', 404);
  }

  // Fetch all questions for the category (include parentQuestionId for tree building)
  const allQuestions = await db.query.questions.findMany({
    where: eq(models.questions.categoryId, categoryId),
    orderBy: (t, { asc }) => [asc(t.createdAt)], // Sort questions by createdAt ascending
    columns: {
      questionnaireId: false,
      helpText: false,
      placeholder: false,
      createdAt: false,
      updatedAt: false,
    },
  });

  // Build nested tree similar to getQuestionnaire
  // type QNode = (typeof allQuestions)[number] & { children: QNode[] };
  // const nodeMap = new Map<string, QNode>();
  // for (const q of allQuestions) nodeMap.set(q.id, { ...q, children: [] });

  // const roots: QNode[] = [];
  // for (const node of nodeMap.values()) {
  //   if (node.parentQuestionId) {
  //     const parent = nodeMap.get(node.parentQuestionId);
  //     if (parent) parent.children.push(node);
  //     else roots.push(node); // orphaned parent, treat as root
  //   } else {
  //     roots.push(node);
  //   }
  // }

  // // Sort by sortOrder at every depth
  // const sortTree = (nodes: QNode[]) => {
  //   nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  //   for (const n of nodes) sortTree(n.children);
  // };
  // sortTree(roots);

  return res.success('Questions retrieved successfully', allQuestions);
});

/**
 * Get a single question with detailed information including documents organized by option value
 */
export const getQuestion = serviceHandler(questionIdParamSchema, async (req, res) => {
  const { questionId } = req.params;

  // Fetch question with category details
  const question = await db.query.questions.findFirst({
    where: eq(models.questions.id, questionId),
    columns: { questionnaireId: false, categoryId: false, parentQuestionId: false },
    with: {
      questionnaire: {
        columns: {
          id: true,
          title: true,
          description: true,
          taxYear: true,
          status: true,
        },
      },
      category: {
        columns: {
          id: true,
          name: true,
          description: true,
        },
      },
      parentQuestion: {
        columns: { parentQuestionId: false, questionnaireId: false, categoryId: false },
      },
    },
  });

  if (!question) {
    throw new ApiError('Question not found', 404);
  }

  // Extract documents from options if they exist
  // const documents: Array<{
  //   documentCategoryId: string;
  //   optionValue: string;
  //   optionLabel?: string;
  //   isDocumentRequired?: boolean;
  // }> = [];

  // if (Array.isArray(question.options)) {
  //   try {
  //     const opts = question.options as Array<{
  //       value: string | number;
  //       label?: string;
  //       order?: number;
  //       isDocumentRequired?: boolean;
  //       documentCategoryId?: string | null;
  //     }>;

  //     for (const opt of opts) {
  //       if (opt.documentCategoryId) {
  //         documents.push({
  //           documentCategoryId: opt.documentCategoryId,
  //           optionValue: String(opt.value),
  //           optionLabel: opt.label,
  //           isDocumentRequired: opt.isDocumentRequired,
  //         });
  //       }
  //     }
  //   } catch (err) {
  //     console.warn('Failed to parse question options for documents:', questionId, err);
  //   }
  // }

  // Format response to include documents array
  const questionWithDocuments = {
    ...question,
    documents: Array.isArray(question.options)
      ? question.options.filter((opt) => opt.documentCategoryId)
      : [],
  };

  return res.success('Question details retrieved successfully', questionWithDocuments);
});

/**
 * Create a question.
 * - Validates parent belongs to same category
 * - For dropdown/radio, options may include per-option doc rules
 */
export const createQuestion = serviceHandler(createQuestionSchema, async (req, res) => {
  const { categoryId, ...questionData } = req.body;

  // Verify category exists
  const category = await db.query.questionCategories.findFirst({
    where: eq(models.questionCategories.id, categoryId),
  });

  if (!category) {
    throw new ApiError('Question category not found', 404);
  }

  // Validate parent question if provided
  if (questionData.parentQuestionId) {
    const parentQuestion = await db.query.questions.findFirst({
      where: and(
        eq(models.questions.id, questionData.parentQuestionId),
        eq(models.questions.categoryId, categoryId)
      ),
      columns: { id: true },
    });

    if (!parentQuestion) throw new ApiError('Parent question not found in the same category', 404);
  }

  // If dropdown/radio with options, ensure each option has isDocumentRequired flag (validated at schema)
  // No extra DB checks needed here.

  const [question] = await db
    .insert(models.questions)
    .values({
      questionnaireId: category.questionnaireId,
      categoryId,
      ...questionData,
    })
    .returning();
  const activityLogData = {
    entityName: activityLogEntityNames.question,
    entityId: question.id,
    action: 'insert' as const,
    modifiedUserId: req.admin.id,
    oldData: null,
    newData: question,
  };
  await activityLog(activityLogData);
  return res.success('Question created successfully', question);
});

/** Update a question; prevents cyclic parent relationships */
export const updateQuestion = serviceHandler(updateQuestionSchema, async (req, res) => {
  const { questionId } = req.params;
  const updateData = req.body;

  // Check if question exists
  const existingQuestion = await db.query.questions.findFirst({
    where: eq(models.questions.id, questionId),
  });

  if (!existingQuestion) {
    throw new ApiError('Question not found', 404);
  }

  if (typeof updateData.parentQuestionId !== 'undefined' && updateData.parentQuestionId !== null) {
    await assertNoCycleWithNewParent(
      existingQuestion.categoryId,
      existingQuestion.id,
      updateData.parentQuestionId
    );
  }

  // For dropdown/radio with options provided, options[].isDocumentRequired is required by schema

  const [updatedQuestion] = await db
    .update(models.questions)
    .set({ ...updateData })
    .where(eq(models.questions.id, questionId))
    .returning();
  const activityLogData = {
    entityName: activityLogEntityNames.question,
    entityId: existingQuestion.id,
    action: 'update' as const,
    modifiedUserId: req.admin.id,
    oldData: existingQuestion,
    newData: updateQuestion,
  };
  await activityLog(activityLogData);
  return res.success('Question updated successfully', updatedQuestion);
});

/** Delete a question if no children, no responses, and questionnaire is published */
export const deleteQuestion = serviceHandler(deleteQuestionSchema, async (req, res) => {
  const { questionId } = req.params;

  // Check if question exists
  const existingQuestion = await db.query.questions.findFirst({
    where: eq(models.questions.id, questionId),
    columns: { id: true, questionnaireId: true },
  });

  if (!existingQuestion) {
    throw new ApiError('Question not found', 404);
  }

  // Check if question has child questions
  const childQuestions = await db.query.questions.findFirst({
    where: eq(models.questions.parentQuestionId, questionId),
    columns: { id: true },
  });

  if (childQuestions) {
    throw new ApiError('Cannot delete question with child questions', 400);
  }

  //check if question has any responses
  const responsesExist = await db.query.questionResponses.findFirst({
    where: eq(models.questionResponses.questionId, questionId),
    columns: { id: true },
  });

  if (responsesExist) {
    throw new ApiError('Cannot delete question with existing responses', 400);
  }

  // check if question is belonged to a published questionnaire
  const questionnaire = await db.query.questionnaires.findFirst({
    where: eq(models.questionnaires.id, existingQuestion.questionnaireId),
    columns: { id: true, status: true },
  });

  if (!questionnaire || questionnaire.status === 'published') {
    throw new ApiError('Cannot delete question from published questionnaire', 400);
  }

  await db.delete(models.questions).where(eq(models.questions.id, questionId));
  const activityLogData = {
    entityName: activityLogEntityNames.question,
    entityId: existingQuestion.id,
    action: 'delete' as const,
    modifiedUserId: req.admin.id,
    oldData: existingQuestion,
    newData: null,
  };
  await activityLog(activityLogData);
  return res.success('Question deleted successfully');
});

// =======================
// Questionnaire Response Services
// =======================

/** List questionnaire responses with filters (questionnaireId, applicationId, status) */
export const listQuestionnaireResponses = serviceHandler(
  listQuestionnaireResponsesSchema,
  async (req, res) => {
    const { questionnaireId, applicationId, status } = req.query;
    const { limit, offset, page, size } = req.pagination;

    const whereConditions = [isNull(models.questionnaireResponses.deletedAt)];

    if (questionnaireId) {
      whereConditions.push(eq(models.questionnaireResponses.questionnaireId, questionnaireId));
    }
    if (applicationId) {
      whereConditions.push(eq(models.questionnaireResponses.applicationId, applicationId));
    }
    if (status) {
      whereConditions.push(eq(models.questionnaireResponses.status, status));
    }

    // convert the responses and totalCount to Promise.all
    const [responses, totalCount] = await Promise.all([
      db.query.questionnaireResponses.findMany({
        where: and(...whereConditions),
        orderBy: desc(models.questionnaireResponses.createdAt),
        limit,
        offset,
      }),
      db.$count(models.questionnaireResponses, and(...whereConditions)),
    ]);

    return res.data('Questionnaire responses retrieved successfully', responses, {
      page,
      size,
      total: totalCount,
    });
  }
);

// Fetch full questionnaire (categories + nested questions) for a given response,
// and include user's answers for each question.
/**
 * Get a full questionnaire (categories + nested questions) for a given response,
 * and attach user's answers to each question.
 */
export const getQuestionnaireResponse = serviceHandler(responseIdParamSchema, async (req, res) => {
  const { responseId } = req.params;

  const response = await db.query.questionnaireResponses.findFirst({
    where: and(
      eq(models.questionnaireResponses.id, responseId),
      isNull(models.questionnaireResponses.deletedAt)
    ),
    columns: {
      id: true,
      questionnaireId: true,
      applicationId: true,
      status: true,
      completionPercentage: true,
      currentCategoryId: true,
      completedCategories: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!response) throw new ApiError('Questionnaire response not found', 404);

  if (req.user && !req.admin) {
    const app = await db.query.applications.findFirst({
      where: eq(models.applications.id, response.applicationId),
      columns: { id: true, userId: true },
    });
    if (!app || app.userId !== req.user.id) throw new ApiError('Access denied', 403);
  }

  const questionnaireWithNested = await fetchQuestionnaireWithNestedQuestions(
    response.questionnaireId
  );

  const answers = await db.query.questionResponses.findMany({
    where: eq(models.questionResponses.questionnaireResponseId, responseId),
    columns: { questionId: true, value: true, answeredAt: true },
  });
  const answerByQ = new Map(answers.map((a) => [a.questionId, a]));

  // Types matching helper output shape
  interface NestedOption {
    value?: string | number;
    questions?: NestedQuestion[];
    // Allow arbitrary extra serialized properties on option
    [key: string]: unknown;
  }
  interface NestedQuestion {
    id: string;
    categoryId: string;
    parentQuestionId: string | null;
    questionText: string;
    questionType: string;
    isRequired: boolean | null;
    sortOrder: number | null;
    options?: NestedOption[] | unknown; // could be array or something else
    showIfParentOptionValue?: string | null;
    // augmentation
    answer?: { value: unknown; answeredAt: Date | null } | null;
  }
  interface QuestionnaireCategoryWithQuestions {
    id: string;
    name: string;
    description?: string | null;
    sortOrder?: number | null;
    icon?: unknown;
    questions: NestedQuestion[];
    isCompleted?: boolean;
    isDisabled?: boolean;
  }

  const attachAnswersToQuestion = (q: NestedQuestion): NestedQuestion => {
    const a = answerByQ.get(q.id);

    if (Array.isArray(q.options)) {
      const newOptions: NestedOption[] = (q.options as NestedOption[]).map((opt) => {
        if (Array.isArray(opt.questions)) {
          return {
            ...opt,
            questions: opt.questions.map((child) => attachAnswersToQuestion(child)),
          } as NestedOption;
        }
        return opt;
      });
      return {
        ...q,
        options: newOptions,
        answer: a ? { value: a.value, answeredAt: a.answeredAt ?? null } : null,
      };
    }

    return {
      ...q,
      answer: a ? { value: a.value, answeredAt: a.answeredAt ?? null } : null,
    };
  };

  const categoriesWithAnswers = (
    questionnaireWithNested.questionCategories as QuestionnaireCategoryWithQuestions[]
  ).map((c) => ({
    ...c,
    questions: c.questions.map((q) => attachAnswersToQuestion(q as NestedQuestion)),
  }));

  // Get completedCategories array from response (defaults to empty array if null/undefined)
  const completedCategoryIds = response.completedCategories || [];

  // Calculate isCompleted for each category based on completedCategories field
  const categoriesWithCompletion = categoriesWithAnswers.map((category) => {
    // A category is completed if its ID exists in the completedCategories array
    const isCompleted = completedCategoryIds.includes(category.id);

    return {
      ...category,
      isCompleted,
    };
  });

  // Calculate isDisabled for each category based on completion status
  const categoriesWithDisabledStatus = categoriesWithCompletion.map((category, index) => {
    let isDisabled = true;

    // First category is never disabled
    if (index === 0) {
      isDisabled = false;
    } else {
      // Check if all previous categories are completed
      const allPreviousCompleted = categoriesWithCompletion
        .slice(0, index)
        .every((prevCategory) => prevCategory.isCompleted);

      isDisabled = !allPreviousCompleted;
    }

    return {
      ...category,
      isDisabled,
    };
  });

  const questionnaireWithAnswers = {
    ...questionnaireWithNested,
    questionCategories: categoriesWithDisabledStatus,
  };

  return res.success('Questionnaire with responses', {
    response,
    questionnaire: questionnaireWithAnswers,
  });
});

// Fetch full questionnaire (categories + nested questions) for a given response,
// and include user's answers for each question.
/**
 * Get a full questionnaire (categories + nested questions) for a given response,
 * and attach user's answers to each question.
 */
export const getQuestionnaireResponseByApplicationId = serviceHandler(
  applicationIdParamSchema,
  async (req, res) => {
    const { applicationId } = req.params;

    // Load response
    const response = await db.query.questionnaireResponses.findFirst({
      where: and(
        eq(models.questionnaireResponses.applicationId, applicationId),
        isNull(models.questionnaireResponses.deletedAt)
      ),
      columns: {
        id: true,
        questionnaireId: true,
        applicationId: true,
        status: true,
        completionPercentage: true,
        currentCategoryId: true,
        submittedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        questionnaire: { columns: { id: true, title: true, description: true, taxYear: true } },
      },
    });

    if (!response)
      return res.success('No questionnaire response found for this application', {
        response: null,
        questionnaire: null,
      });

    // Fetch questions with answers and category metadata in a single joined query
    const rows = await db
      .select({
        questionId: models.questions.id,
        categoryId: models.questions.categoryId,
        questionText: models.questions.questionText,
        questionType: models.questions.questionType,
        isRequired: models.questions.isRequired,
        sortOrder: models.questions.sortOrder,
        questionCreatedAt: models.questions.createdAt,
        options: models.questions.options,
        answerValue: models.questionResponses.value,
        answeredAt: models.questionResponses.answeredAt,
        categoryName: models.questionCategories.name,
        categorySortOrder: models.questionCategories.sortOrder,
        categoryCreatedAt: models.questionCategories.createdAt,
        iconId: models.files.id,
        iconKey: models.files.key,
        iconFileName: models.files.fileName,
        iconMimeType: models.files.mimeType,
        iconUploadedAt: models.files.uploadedAt,
      })
      .from(models.questions)
      .leftJoin(
        models.questionResponses,
        and(
          eq(models.questionResponses.questionId, models.questions.id),
          eq(models.questionResponses.questionnaireResponseId, response.id),
          isNull(models.questionResponses.deletedAt)
        )
      )
      .leftJoin(
        models.questionCategories,
        eq(models.questionCategories.id, models.questions.categoryId)
      )
      .leftJoin(models.files, eq(models.files.id, models.questionCategories.iconId))
      .where(eq(models.questions.questionnaireId, response.questionnaireId))
      .orderBy(models.questionCategories.createdAt, models.questions.createdAt);

    // Batch presign category icon URLs for performance
    const iconKeySet = new Set<string>();
    for (const r of rows) {
      if (r.iconKey) iconKeySet.add(r.iconKey);
    }
    const iconUrlMap = new Map<string, string>();
    for (const key of iconKeySet) {
      try {
        const url = await getPresignedGetObjectUrl(key);
        iconUrlMap.set(key, url);
      } catch (err) {
        console.warn('Failed to generate presigned category icon URL for key:', key, err);
      }
    }

    // Group questions by category with flat lists (no children)
    type FlatQuestion = {
      id: string;
      questionText: string;
      questionType: string;
      isRequired: boolean | null;
      sortOrder: number | null;
      createdAt: Date | null;
      options: unknown;
      answer: { value: unknown; answeredAt: Date | null } | null;
    };

    const categoriesMap = new Map<
      string,
      {
        id: string;
        name: string | null;
        sortOrder: number | null;
        createdAt: Date | null;
        icon: null | {
          id: string | null;
          key: string | null;
          fileName: string | null;
          mimeType: string | null;
          uploadedAt: Date | null;
          filePath?: string;
        };
        questions: FlatQuestion[];
      }
    >();

    for (const r of rows) {
      if (!categoriesMap.has(r.categoryId)) {
        categoriesMap.set(r.categoryId, {
          id: r.categoryId,
          name: r.categoryName ?? null,
          sortOrder: r.categorySortOrder ?? null,
          createdAt: (r.categoryCreatedAt as unknown as Date) ?? null,
          icon: r.iconId
            ? {
                id: r.iconId,
                key: r.iconKey,
                fileName: r.iconFileName,
                mimeType: r.iconMimeType,
                uploadedAt: (r.iconUploadedAt as unknown as Date) ?? null,
                ...(r.iconKey ? { filePath: iconUrlMap.get(r.iconKey) } : {}),
              }
            : null,
          questions: [],
        });
      }
      const cat = categoriesMap.get(r.categoryId)!;
      cat.questions.push({
        id: r.questionId,
        questionText: r.questionText,
        questionType: r.questionType,
        isRequired: r.isRequired ?? false,
        sortOrder: r.sortOrder ?? 0,
        createdAt: (r.questionCreatedAt as unknown as Date) ?? null,
        options: r.options,
        answer:
          r.answeredAt != null || r.answerValue != null
            ? { value: r.answerValue, answeredAt: (r.answeredAt as unknown as Date) ?? null }
            : null,
      });
    }

    // Sort categories and their questions by createdAt in ascending order
    const questionCategories = Array.from(categoriesMap.values()).sort(
      (a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
    );
    for (const c of questionCategories) {
      c.questions.sort(
        (a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
      );
    }

    const { questionnaire, ...rest } = response;
    // Minimal questionnaire shell
    const questionnaireShell = { ...questionnaire, questionCategories };

    return res.success('Questionnaire with responses', {
      response: rest,
      questionnaire: questionnaireShell,
    });
  }
);

/** Create a draft questionnaire response for an application */
export const createQuestionnaireResponse = serviceHandler(
  createQuestionnaireResponseSchema,
  async (req, res) => {
    const { questionnaireId, applicationId } = req.body;

    // Verify questionnaire exists and is published
    const questionnaire = await db.query.questionnaires.findFirst({
      where: eq(models.questionnaires.id, questionnaireId),
    });

    if (!questionnaire) {
      throw new ApiError('Questionnaire not found', 404);
    }

    if (questionnaire.status !== 'published') {
      throw new ApiError('Cannot create response for unpublished questionnaire', 400);
    }

    // Verify application exists
    const application = await db.query.applications.findFirst({
      where: eq(models.applications.id, applicationId),
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    // Check if response already exists
    const existingResponse = await db.query.questionnaireResponses.findFirst({
      where: and(
        eq(models.questionnaireResponses.questionnaireId, questionnaireId),
        eq(models.questionnaireResponses.applicationId, applicationId),
        isNull(models.questionnaireResponses.deletedAt)
      ),
    });

    if (existingResponse) {
      throw new ApiError('Response already exists for this application and questionnaire', 400);
    }

    // Get first category as starting point
    const firstCategory = await db.query.questionCategories.findFirst({
      where: eq(models.questionCategories.questionnaireId, questionnaireId),
      orderBy: models.questionCategories.sortOrder,
    });

    const [response] = await db
      .insert(models.questionnaireResponses)
      .values({
        questionnaireId,
        applicationId,
        currentCategoryId: firstCategory?.id,
      })
      .returning();

    return res.success('Questionnaire response created successfully', { response });
  }
);

/** Update a questionnaire response (current category, completion %) */
export const updateQuestionnaireResponse = serviceHandler(
  updateQuestionnaireResponseSchema,
  async (req, res) => {
    const { responseId } = req.params;
    const updateData = req.body;

    // Check if response exists
    const existingResponse = await db.query.questionnaireResponses.findFirst({
      where: and(
        eq(models.questionnaireResponses.id, responseId),
        isNull(models.questionnaireResponses.deletedAt)
      ),
    });

    if (!existingResponse) {
      throw new ApiError('Questionnaire response not found', 404);
    }

    if (existingResponse.status === 'submitted') {
      throw new ApiError('Cannot update submitted response', 400);
    }

    // If currentCategoryId is being updated, add it to completedCategories array (unique)
    let completedCategories = existingResponse.completedCategories || [];
    if (updateData.currentCategoryId) {
      // Ensure completedCategories is an array
      if (!Array.isArray(completedCategories)) {
        completedCategories = [];
      }
      // Add currentCategoryId to completedCategories if not already present
      if (!completedCategories.includes(updateData.currentCategoryId)) {
        completedCategories = [...completedCategories, updateData.currentCategoryId];
      }
    }

    const [updatedResponse] = await db
      .update(models.questionnaireResponses)
      .set({
        ...updateData,
        completedCategories,
        updatedAt: new Date(),
      })
      .where(eq(models.questionnaireResponses.id, responseId))
      .returning({
        id: models.questionnaireResponses.id,
        applicationId: models.questionnaireResponses.applicationId,
        completionPercentage: models.questionnaireResponses.completionPercentage,
        completedCategories: models.questionnaireResponses.completedCategories,
        createdAt: models.questionnaireResponses.createdAt,
        updatedAt: models.questionnaireResponses.updatedAt,
      });

    return res.success('Questionnaire response updated successfully', updatedResponse);
  }
);

/**
 * Submit a questionnaire response:
 * - Enforces required questions (child required only when parent value matches)
 * - Determines required document categories based on per-option rules
 * - Atomically inserts missing app doc categories, updates app status/history, and marks response submitted
 */
export const submitQuestionnaireResponse = serviceHandler(
  submitQuestionnaireResponseSchema,
  async (req, res) => {
    const { responseId } = req.body;

    // Check if response exists
    const existingResponse = await db.query.questionnaireResponses.findFirst({
      where: and(
        eq(models.questionnaireResponses.id, responseId),
        isNull(models.questionnaireResponses.deletedAt)
      ),
    });

    if (!existingResponse) {
      throw new ApiError('Questionnaire response not found', 404);
    }

    if (existingResponse.status === 'submitted') {
      throw new ApiError('Response is already submitted', 400);
    }
    const application = await db.query.applications.findFirst({
      where: eq(models.applications.id, existingResponse.applicationId),
      columns: { id: true, userId: true, applicationNo: true },
      with: {
        user: { columns: { id: true, email: true, name: true, ppsNumber: true, phone: true } },
      },
    });
    if (!application) {
      throw new ApiError('Associated application not found', 404);
    }
    // Validate: required child questions are only mandatory if parent's answer matches showIfParentOptionValue
    // 1. Get all required questions (include parent and conditional value)
    const requiredQuestions = await db.query.questions.findMany({
      where: and(
        eq(models.questions.questionnaireId, existingResponse.questionnaireId),
        eq(models.questions.isRequired, true)
      ),
      columns: { id: true, parentQuestionId: true, showIfParentOptionValue: true },
    });

    // 2. Get all answers for this response (needed to check applicability + answered set)
    const answeredRows = await db.query.questionResponses.findMany({
      where: and(
        eq(models.questionResponses.questionnaireResponseId, responseId),
        isNull(models.questionResponses.deletedAt)
      ),
      columns: { questionId: true, value: true },
    });
    const answeredSet = new Set(answeredRows.map((a) => a.questionId));
    const answerValueByQ = new Map<string, string>(
      answeredRows.map((a) => [a.questionId, String(a.value)])
    );

    // 3. Determine which required questions are applicable
    const applicableRequiredIds: string[] = [];
    for (const q of requiredQuestions) {
      // No parent -> always applicable
      if (!q.parentQuestionId) {
        applicableRequiredIds.push(q.id);
        continue;
      }

      // Has parent: only applicable if parent's answer exists and matches the configured value
      const parentAnswer = answerValueByQ.get(q.parentQuestionId);
      const expected = q.showIfParentOptionValue ?? '';
      if (parentAnswer != null && expected !== '' && String(parentAnswer) === String(expected)) {
        applicableRequiredIds.push(q.id);
      }
      // Else: not applicable -> not required to be answered
    }

    // 4. Find missing answers among applicable required questions
    const missingRequired = applicableRequiredIds.filter((id) => !answeredSet.has(id));
    if (missingRequired.length > 0) {
      console.log(true, missingRequired);
      throw new ApiError(`Cannot submit: missing answers for required questions`, 400);
    }

    // Create application document category records for required documents based on answers
    // 1) Fetch all questions that may require documents
    const docQuestions = await db.query.questions.findMany({
      where: and(
        eq(models.questions.questionnaireId, existingResponse.questionnaireId),
        isNotNull(models.questions.id)
      ),
      columns: {
        id: true,
        questionType: true,
        parentQuestionId: true,
        showIfParentOptionValue: true,
        options: true,
      },
    });

    // 2) Use already-fetched answers map (answerValueByQ) from required-questions validation above

    // 3) Determine which document categories are needed (per-option mapping)
    // Accumulate required flags per document category (true if any contributing question marks it required)
    const docCatRequiredMap = new Map<string, boolean>();
    for (const q of docQuestions) {
      const userAnswer = q.id ? answerValueByQ.get(q.id) : undefined;
      if (userAnswer == null) continue; // nothing to evaluate

      // Enforce parent conditional applicability
      if (q.parentQuestionId && q.showIfParentOptionValue) {
        const parentAns = answerValueByQ.get(q.parentQuestionId);
        if (String(parentAns ?? '') !== String(q.showIfParentOptionValue)) continue;
      }

      // Per-option document mapping (dropdown/radio only). If match requires doc and has a category, mark it.
      if ((q.questionType === 'dropdown' || q.questionType === 'radio') && q.options) {
        try {
          const opts = q.options as unknown as Array<{
            value: string | number;
            isDocumentRequired: boolean;
            documentCategoryId?: string | null;
          }>;
          const match = opts.find((o) => String(o.value) === String(userAnswer));
          if (match && match.documentCategoryId) {
            const docCatId = match.documentCategoryId;
            const prev = docCatRequiredMap.get(docCatId) ?? match.isDocumentRequired;
            docCatRequiredMap.set(docCatId, prev || match.isDocumentRequired);
          }
        } catch {
          // ignore malformed options
        }
      }
    }

    // 4) Avoid duplicates: get existing application doc categories
    const existingDocCats = await db.query.applicationDocumentCategories.findMany({
      where: eq(models.applicationDocumentCategories.applicationId, existingResponse.applicationId),
      columns: { documentCategoryId: true },
    });
    const existingDocCatSet = new Set(existingDocCats.map((d) => d.documentCategoryId));

    const toInsert = Array.from(docCatRequiredMap.entries())
      .filter(([id]) => !existingDocCatSet.has(id))
      .map(([docCatId, isReq]) => ({
        applicationId: existingResponse.applicationId,
        documentCategoryId: docCatId,
        isAdditionalDocument: false,
        isRequired: !!isReq,
        status: 'pending' as const,
      }));

    // 5) Submit everything atomically
    const submittedResponse = await db.transaction(async (tx) => {
      if (toInsert.length > 0) {
        await tx.insert(models.applicationDocumentCategories).values(toInsert);
      }
      // Update related application status to submitted
      await tx
        .update(models.applications)
        .set({ status: applicationStatuses.SUBMITTED, updatedAt: new Date() })
        .where(eq(models.applications.id, existingResponse.applicationId));
      // Record application status history: submitted
      await tx.insert(models.applicationStatusHistories).values({
        applicationId: existingResponse.applicationId,
        status: applicationStatuses.SUBMITTED,
      });
      const [updated] = await tx
        .update(models.questionnaireResponses)
        .set({
          status: 'submitted',
          submittedAt: new Date(),
          completionPercentage: 100,
          updatedAt: new Date(),
        })
        .where(eq(models.questionnaireResponses.id, responseId))
        .returning({
          id: models.questionnaireResponses.id,
          applicationId: models.questionnaireResponses.applicationId,
          status: models.questionnaireResponses.status,
          submittedAt: models.questionnaireResponses.submittedAt,
          completionPercentage: models.questionnaireResponses.completionPercentage,
          updatedAt: models.questionnaireResponses.updatedAt,
        });

      // check if there is no document categories to submit

      if (toInsert.length === 0) {
        // Update related application status to DOCUMENTS_UPLOADED
        await tx
          .update(models.applications)
          .set({ status: applicationStatuses.DOCUMENTS_UPLOADED, updatedAt: new Date() })
          .where(eq(models.applications.id, existingResponse.applicationId));
        // Record application status history: DOCUMENTS_UPLOADED
        await tx.insert(models.applicationStatusHistories).values({
          applicationId: existingResponse.applicationId,
          status: applicationStatuses.DOCUMENTS_UPLOADED,
        });
      }
      return updated;
    });
    // send email to admin notify new submission
    await mail.applicationSubmitted({
      recipient: process.env.SUPPORT_EMAIL_ID,
      replacements: {
        applicationNumber: application.applicationNo,
        name: application.user.name,
        ppsNumber: application.user.ppsNumber,
        email: application.user.email,
        phoneNumber: application.user.phone,
        date: new Date().toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
        adminPortalLink: `${process.env.ADMIN_DASHBOARD_BASE_URL}/#/application-view/?id=${application.id}`,
      },
    });

    // send notification to all admins with application module permissions
    const adminsWithApplicationPermission = await db
      .selectDistinct({
        id: models.admins.id,
        name: models.admins.name,
        email: models.admins.email,
        fcmToken: models.admins.fcmToken,
      })
      .from(models.admins)
      .innerJoin(models.roles, eq(models.admins.roleId, models.roles.id))
      .innerJoin(
        models.roleModulePermissions,
        eq(models.roles.id, models.roleModulePermissions.roleId)
      )
      .innerJoin(
        models.modulePermissions,
        eq(models.roleModulePermissions.modulePermissionId, models.modulePermissions.id)
      )
      .innerJoin(models.modules, eq(models.modulePermissions.moduleId, models.modules.id))
      .where(
        and(
          eq(models.admins.status, true),
          eq(models.roleModulePermissions.isEnabled, true),
          eq(models.modules.name, 'applications')
        )
      );

    // Send notifications to eligible admins
    if (adminsWithApplicationPermission.length > 0) {
      const adminFcmTokens = adminsWithApplicationPermission
        .map((admin) => admin.fcmToken)
        .filter((token): token is string => !!token);

      await adminNotificationHandler({
        tokens: adminFcmTokens.length > 0 ? adminFcmTokens : undefined,
        payload: {
          title: notificationTemplates.applicationSubmitted.title,
          body: notificationTemplates.applicationSubmitted.body.replace(
            'APP_NO',
            application.applicationNo
          ),
          type: notificationTemplates.applicationSubmitted.type,
        },
        data: {
          type: notificationTemplates.applicationSubmitted.type,
          applicationId: application.id,
          applicationNo: application.applicationNo,
        },
        adminIds: adminsWithApplicationPermission.map((admin) => admin.id),
      });
    }

    if (req.user && !req.user.isTaxAgentVerificationCompleted) {
      // Send email to user to notify the tax agent verification is pending
      await mail.taxAgentRequest({
        recipient: application.user.email,
        replacements: {
          name: application.user.name,
        },
      });
      // if (req.user.fcmToken) {
      //   // Send FCM notification to user
      //   await sendNotification({
      //     tokens: [req.user.fcmToken],
      //     payload: {
      //       title: notificationTemplates.taxAgentRequest.title,
      //       body: notificationTemplates.taxAgentRequest.body,
      //     },
      //     data: { type: notificationTemplates.taxAgentRequest.type },
      //   });
      // }

      notificationHandler({
        tokens: req.user.fcmToken?.split(','),
        payload: notificationTemplates.taxAgentRequest,
        data: {
          type: notificationTemplates.taxAgentRequest.type,
        },
        userId: req.user.id,
        appNotificationsEnabled: req.user.isAppNotificationEnabled,
      });
    }
    return res.success('Questionnaire response submitted successfully', submittedResponse);
  }
);

/** Save an answer in draft only; validates ownership, type, and options */
export const saveAnswer = serviceHandler(saveAnswerSchema, async (req, res) => {
  const { responseId, questionId, answer, isDeselected } = req.body;

  // 1. Fetch response and enforce user ownership
  const response = await db.query.questionnaireResponses.findFirst({
    where: and(
      eq(models.questionnaireResponses.id, responseId),
      isNull(models.questionnaireResponses.deletedAt)
    ),
    columns: { id: true, questionnaireId: true, applicationId: true, status: true },
  });
  if (!response) throw new ApiError('Questionnaire response not found', 404);
  if (response.status !== 'draft') {
    throw new ApiError('Cannot save answer: response is not in draft stage', 400);
  }
  if (req.user && !req.admin) {
    const app = await db.query.applications.findFirst({
      where: eq(models.applications.id, response.applicationId),
      columns: { userId: true },
    });
    if (!app || app.userId !== req.user.id) throw new ApiError('Access denied', 403);
  }

  // 2. Fetch question and validate linkage
  const question = await db.query.questions.findFirst({
    where: eq(models.questions.id, questionId),
    columns: {
      id: true,
      questionnaireId: true,
      questionType: true,
      isRequired: true,
      options: true,
    },
  });
  if (!question) throw new ApiError('Question not found', 404);
  if (question.questionnaireId !== response.questionnaireId)
    throw new ApiError('Question does not belong to the questionnaire for this response', 400);

  // For radio/dropdown, validate answer matches one of the options.value
  if (
    !isDeselected &&
    (question.questionType === 'radio' || question.questionType === 'dropdown') &&
    question.options
  ) {
    const allowedValues = Array.isArray(question.options)
      ? (question.options as { value: string }[]).map((opt) => opt.value)
      : [];
    if (!allowedValues.includes(String(answer))) {
      throw new ApiError(
        `Answer value does not match allowed options: ${allowedValues.join(', ')}`,
        400
      );
    }
  }

  // 3. Validate answer type
  const type = question.questionType;
  let valid = false;
  switch (type) {
    case 'text':
      valid = typeof answer === 'string';
      break;
    case 'dropdown':
    case 'radio':
      valid = typeof answer === 'string' || typeof answer === 'number';
      break;
    case 'date':
      valid = typeof answer === 'string' && !isNaN(Date.parse(answer));
      break;
    default:
      valid = false;
  }
  if (!isDeselected && !valid)
    throw new ApiError(`Answer type mismatch for question type: ${type}`, 400);

  // 4. Check if this question has child questions
  const childQuestions = await db.query.questions.findMany({
    where: eq(models.questions.parentQuestionId, questionId),
    columns: { id: true },
  });
  let saved;

  if (isDeselected) {
    // 4A. If deselected, delete existing answer if any
    const deletedCount = await db
      .delete(models.questionResponses)
      .where(
        and(
          eq(models.questionResponses.questionnaireResponseId, responseId),
          eq(models.questionResponses.questionId, questionId)
        )
      );
    logger.info(
      `Answer deselected - deleted ${deletedCount} existing responses for question ${questionId}`
    );
  } else {
    // 5. Upsert answer (update if exists, else insert)
    const existing = await db.query.questionResponses.findFirst({
      where: and(
        eq(models.questionResponses.questionnaireResponseId, responseId),
        eq(models.questionResponses.questionId, questionId),
        isNull(models.questionResponses.deletedAt)
      ),
      columns: { id: true, value: true },
    });

    // Always store value as string for encryption
    let answerStr: string;
    if (typeof answer === 'string') {
      answerStr = type === 'date' ? new Date(answer).toISOString() : answer;
    } else if (typeof answer === 'number' || typeof answer === 'boolean') {
      answerStr = String(answer);
    } else {
      answerStr = JSON.stringify(answer);
    }

    if (existing) {
      [saved] = await db
        .update(models.questionResponses)
        .set({ value: answerStr, answeredAt: new Date(), updatedAt: new Date() })
        .where(eq(models.questionResponses.id, existing.id))
        .returning();
    } else {
      [saved] = await db
        .insert(models.questionResponses)
        .values({
          questionnaireResponseId: responseId,
          questionId,
          value: answerStr,
          answeredAt: new Date(),
        })
        .returning();
    }
  }

  // 6. Always delete all child and nested child responses when parent answer is saved
  if (childQuestions.length > 0) {
    // Recursively collect all descendant question IDs
    const collectDescendantQuestionIds = async (parentQuestionIds: string[]): Promise<string[]> => {
      if (parentQuestionIds.length === 0) return [];

      const children = await db.query.questions.findMany({
        where: inArray(models.questions.parentQuestionId, parentQuestionIds),
        columns: { id: true },
      });

      const childIds = children.map((c) => c.id);
      if (childIds.length === 0) return [];

      // Recursively get descendants
      const descendants = await collectDescendantQuestionIds(childIds);
      return [...childIds, ...descendants];
    };

    const immediateChildIds = childQuestions.map((c) => c.id);
    const allDescendantIds = await collectDescendantQuestionIds(immediateChildIds);
    allDescendantIds.push(...immediateChildIds);

    // Delete all responses for child and descendant questions
    if (allDescendantIds.length > 0) {
      const deletedCount = await db
        .delete(models.questionResponses)
        .where(
          and(
            eq(models.questionResponses.questionnaireResponseId, responseId),
            inArray(models.questionResponses.questionId, allDescendantIds)
          )
        );

      logger.info(
        `Parent question answer saved - cleared ${deletedCount} child/descendant responses for question ${questionId}`
      );
    }
  }

  return res.success('Answer saved successfully', saved);
});
