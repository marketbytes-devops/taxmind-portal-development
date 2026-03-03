/**
 * Questionnaire Module - Text Labels and Constants
 * TaxMind Admin Portal
 */

export const QUESTIONNAIRE_LABELS = {
  // Page Headers
  PAGE_TITLE: "Questionnaire",
  QUESTIONNAIRE: "Questionnaire",
  QUESTIONNAIRE_YEAR: "Questionnaire year",

  // Button Labels
  PUBLISHED: "Published",
  CREATE_QUESTIONNAIRE: "Create questionnaire",
  VIEW_QUESTIONNAIRE: "View Questionnaire",
  SAVE_CHANGES: "Save",
  SAVE_AND_ADD_NEW: "Save & add new",
  CANCEL: "Cancel",
  DELETE: "Delete",
  CONFIRM: "Confirm",
  UPLOAD: "Upload",
  EDIT: "Edit",
  DUPLICATE: "Duplicate",

  // Form Labels
  YEAR_LABEL: "Year",
  DESCRIPTION_LABEL: "Description",
  STATUS_LABEL: "Status",

  // Statistics Labels
  TOTAL_QUESTIONS: "Total questions",
  TOTAL_APPLICATIONS: "Total applications",
  APPLICATIONS_IN_REVIEW: "Applications in review",
  COMPLETED: "Completed",

  // Messages
  SUCCESS_MESSAGE: "Operation completed successfully",
  ERROR_MESSAGE: "An error occurred. Please try again",
  SERVER_ERROR: "A server error occurred. Please try again later",
  LOADING_MESSAGE: "Loading...",
  NO_DATA: "No questionnaires found",
  NO_QUESTIONNAIRES: "No questionnaires found",
  NO_DATA_DESCRIPTION: "Create your first questionnaire to get started",

  // Confirmation Messages
  DELETE_CONFIRMATION: "Are you sure you want to delete this questionnaire?",
  DELETE_WARNING: "This action cannot be undone",
  PUBLISHED_QUESTIONNAIRE_WARNING:
    "This questionnaire has already been published.",
  EDIT_PUBLISHED_CONFIRMATION:
    "Are you sure you want to edit the published questionnaire?",
  YES_EDIT: "Yes, Edit",

  // Create Questionnaire Modal
  CREATE_QUESTIONNAIRE_MODAL: "Start New Claim",
  FINANCIAL_YEAR: "Financial year",
  IMPORT_QUESTION: "Do you want to import questionnaire ?",
  IMPORT_FROM_QUESTION: "Import questionnaire from ?",
  YES: "Yes",
  NO: "No",
  PROCEED: "Proceed",

  // Create Questionnaire Page Header (will be set dynamically)
  CREATE_QUESTIONNAIRE_TITLE: "Create Questionnaire",
  IMPORTED_FROM: "", // Will be set dynamically only when importing
  ADD_CATEGORY: "Add category",
  PREVIEW: "Preview",
  PUBLISH: "Publish",

  // Add Category Modal
  ADD_CATEGORY_MODAL: "Add Category",
  CATEGORY_NAME: "Category Name",
  CATEGORY_NAME_PLACEHOLDER: "Enter category name",
  UPLOAD_CATEGORY_ICON: "Upload Category Icon",
  CHOOSE_FILE: "Choose file",
  ADD_QUESTION: "Add question",

  // Category Names
  MEDICAL_EXPENSES_TAX_CREDIT: "Medical Expenses Tax Credit",
  DEPENDENT_RELATIVE_TAX_CREDIT: "Dependent Relative Tax Credit",
  TUITION_FEES_TAX_CREDIT: "Tuition Fees Tax Credit",
  RENT_TAX_CREDIT: "Rent Tax Credit",
  REMOTE_WORKING_TAX_CREDIT: "Remote Working Tax Credit",
  FLAT_RATE_EXPENSES: "Flat Rate Expenses",
  MORTGAGE_INTEREST_RELIEF: "Mortgage Interest Relief",
  HOME_CARER_TAX_CREDIT: "Home Carer Tax Credit",

  // Placeholders
  SEARCH_PLACEHOLDER: "Search questionnaires...",
  YEAR_PLACEHOLDER: "Enter year (e.g., 2025)",
  DESCRIPTION_PLACEHOLDER: "Enter questionnaire description",

  // Status Options
  STATUS_DRAFT: "Draft",
  STATUS_PUBLISHED: "Published",
  STATUS_ARCHIVED: "Archived",
};

export default QUESTIONNAIRE_LABELS;
