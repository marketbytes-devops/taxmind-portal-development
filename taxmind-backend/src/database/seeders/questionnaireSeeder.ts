import { eq } from 'drizzle-orm';

import { db, models } from '@/database';

/**
 * Questionnaire Seeder
 * - Creates a sample draft questionnaire for a given tax year
 * - Adds sample categories and questions
 * - Idempotent: skips existing items and only inserts missing ones
 * - Uses bulk inserts (no DB calls inside loops)
 */
export const seedQuestionnaires = async () => {
  const targetTaxYear = Number(process.env.SEED_TAX_YEAR || '2025');

  console.log('Seeding Questionnaire module...');

  // 1) Find a creator user (required by schema)
  const creator = await db.query.admins.findFirst({ columns: { id: true } });
  if (!creator) {
    console.warn(
      'No admins found. Skipping questionnaire seeding (questionnaires.createdBy requires a user).'
    );
    return;
  }

  // 2) Upsert questionnaire for target year (draft)
  const existingForYear = await db.query.questionnaires.findMany({
    where: eq(models.questionnaires.taxYear, targetTaxYear),
  });

  const nextVersion = existingForYear.length
    ? Math.max(...existingForYear.map((q) => q.version)) + 1
    : 1;

  const title = `Tax Return Questionnaire for ${targetTaxYear}`;
  const description = `Comprehensive tax questionnaire for the ${targetTaxYear} tax year. Please complete all applicable sections to ensure accurate tax return preparation.`;

  const [questionnaire] = await db
    .insert(models.questionnaires)
    .values({
      taxYear: targetTaxYear,
      title,
      description,
      version: nextVersion,
      status: 'draft',
      createdBy: creator.id,
    })
    .returning();

  console.log(
    `Questionnaire created: { id: ${questionnaire.id}, year: ${questionnaire.taxYear}, version: ${questionnaire.version} }`
  );

  // 3) Seed categories (avoid duplicates by name within this questionnaire)
  const desiredCategories = [
    { name: 'Personal Details', sortOrder: 1 },
    { name: 'Income', sortOrder: 2 },
    { name: 'Deductions', sortOrder: 3 },
  ];

  const existingCategories = await db.query.questionCategories.findMany({
    where: eq(models.questionCategories.questionnaireId, questionnaire.id),
  });

  const existingCategoryNames = new Set(existingCategories.map((c) => c.name));
  const categoriesToInsert = desiredCategories
    .filter((c) => !existingCategoryNames.has(c.name))
    .map((c) => ({
      questionnaireId: questionnaire.id,
      name: c.name,
      description: `Documents and questions related to ${c.name}.`,
      sortOrder: c.sortOrder,
    }));

  let insertedCategories: Array<{ id: string; name: string }> = [];
  if (categoriesToInsert.length > 0) {
    insertedCategories = await db
      .insert(models.questionCategories)
      .values(categoriesToInsert)
      .returning({ id: models.questionCategories.id, name: models.questionCategories.name });
  }

  const allCategories = [...existingCategories, ...insertedCategories];
  const categoryIdByName = new Map(allCategories.map((c) => [c.name, c.id] as const));

  // 4) Seed questions (fetch once, compute missing, bulk insert)
  const desiredQuestions: Array<{
    categoryName: string;
    questionText: string;
    questionType: 'text' | 'dropdown' | 'radio' | 'date';
    isRequired?: boolean;
    sortOrder?: number;
    options?: Array<{ value: string; label: string; order?: number }>;
    parentQuestionText?: string; // for linking child questions
    showIfParentOptionValue?: string;
  }> = [
    {
      categoryName: 'Personal Details',
      questionText: 'What is your marital status?',
      questionType: 'radio',
      isRequired: true,
      sortOrder: 1,
      options: [
        { value: 'single', label: 'Single' },
        { value: 'married', label: 'Married' },
        { value: 'divorced', label: 'Divorced' },
        { value: 'widowed', label: 'Widowed' },
      ],
    },
    {
      categoryName: 'Income',
      questionText: 'What was your gross employment income?',
      questionType: 'text',
      isRequired: true,
      sortOrder: 1,
    },
    {
      categoryName: 'Income',
      questionText: 'Did you have rental income?',
      questionType: 'radio',
      isRequired: true,
      sortOrder: 2,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
    {
      categoryName: 'Income',
      questionText: 'Enter total rental income for the year',
      questionType: 'text',
      isRequired: true,
      sortOrder: 3,
      parentQuestionText: 'Did you have rental income?',
      showIfParentOptionValue: 'yes',
    },
    {
      categoryName: 'Deductions',
      questionText: 'Did you have qualifying medical expenses?',
      questionType: 'radio',
      isRequired: true,
      sortOrder: 1,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
    {
      categoryName: 'Deductions',
      questionText: 'Total medical expenses amount',
      questionType: 'text',
      isRequired: true,
      sortOrder: 2,
      parentQuestionText: 'Did you have qualifying medical expenses?',
      showIfParentOptionValue: 'yes',
    },
  ];

  // Fetch all existing questions for this questionnaire once
  const existingQuestions = await db.query.questions.findMany({
    where: eq(models.questions.questionnaireId, questionnaire.id),
  });

  // Build helper maps
  const makeKey = (categoryId: string, questionText: string) =>
    `${categoryId}|${questionText}` as const;
  const questionByTextAndCategory = new Map<
    ReturnType<typeof makeKey>,
    { id: string; categoryId: string; questionText: string }
  >(
    existingQuestions.map((q) => [
      makeKey(q.categoryId, q.questionText),
      { id: q.id, categoryId: q.categoryId, questionText: q.questionText },
    ])
  );

  // Prepare parent questions to insert
  const parentToInsert = desiredQuestions.filter((q) => !q.parentQuestionText);
  const parentInsertRows = parentToInsert
    .filter((q) => {
      const categoryId = categoryIdByName.get(q.categoryName);
      if (!categoryId) return false;
      const key = makeKey(categoryId, q.questionText);
      return !questionByTextAndCategory.has(key);
    })
    .map((q, idx) => ({
      questionnaireId: questionnaire.id,
      categoryId: categoryIdByName.get(q.categoryName)!,
      questionText: q.questionText,
      helpText: null,
      placeholder: null,
      questionType: q.questionType,
      isRequired: q.isRequired ?? false,
      sortOrder: q.sortOrder ?? idx + 1,
      options: q.options ? q.options.map((o, i) => ({ ...o, order: o.order ?? i })) : null,
      isDocumentRequired: false,
      documentCategoryId: null,
      documentRequiredForValue: null,
      parentQuestionId: null,
      showIfParentOptionValue: null,
    }));

  let insertedParents: Array<{ id: string; categoryId: string; questionText: string }> = [];
  if (parentInsertRows.length > 0) {
    insertedParents = await db.insert(models.questions).values(parentInsertRows).returning({
      id: models.questions.id,
      categoryId: models.questions.categoryId,
      questionText: models.questions.questionText,
    });
  }

  // Update map with newly inserted parents
  for (const p of insertedParents) {
    questionByTextAndCategory.set(makeKey(p.categoryId, p.questionText), p);
  }

  // Prepare child questions to insert (those with parentQuestionText)
  const childToInsert = desiredQuestions.filter((q) => q.parentQuestionText);
  const childInsertRows = childToInsert
    .map((q, idx) => {
      const categoryId = categoryIdByName.get(q.categoryName);
      if (!categoryId) return null;
      const key = makeKey(categoryId, q.questionText);
      if (questionByTextAndCategory.has(key)) return null; // already exists

      // Find parent ID by matching parentQuestionText in same category
      const parentKey = makeKey(categoryId, q.parentQuestionText!);
      const parent = questionByTextAndCategory.get(parentKey);
      const parentId = parent ? parent.id : null;

      return {
        questionnaireId: questionnaire.id,
        categoryId,
        questionText: q.questionText,
        helpText: null,
        placeholder: null,
        questionType: q.questionType,
        isRequired: q.isRequired ?? false,
        sortOrder: q.sortOrder ?? idx + 100, // place children after parents by default
        options: q.options ? q.options.map((o, i) => ({ ...o, order: o.order ?? i })) : null,
        isDocumentRequired: false,
        documentCategoryId: null,
        documentRequiredForValue: null,
        parentQuestionId: parentId,
        showIfParentOptionValue: q.showIfParentOptionValue || null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => !!row);

  if (childInsertRows.length > 0) {
    await db
      .insert(models.questions)
      .values(childInsertRows)
      .returning({ id: models.questions.id });
  }

  console.log('Questionnaire seeding completed.');
};

// Allow running directly
if (require.main === module) {
  seedQuestionnaires()
    .then(() => {
      console.log('Questionnaire seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Questionnaire seeding failed:', error);
      process.exit(1);
    });
}
