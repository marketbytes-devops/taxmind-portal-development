// MIGRATION ORDER - Export in dependency order (independent tables first)
// Base tables with no dependencies
export * from './enums';
export * from './files';
export * from './roles';
export * from './modules';
export * from './modulePermissions';
export * from './policies';
export * from './documentCategories';
export * from './queryCategories';

// Tables that depend on base tables
export * from './roleModulePermissions';
export * from './admins';
export * from './users';
export * from './userPolicyAcceptances';

// Application and payment system
export * from './applications';
export * from './applicationStatusHistories';
export * from './applicationNotes';
export * from './applicationReviews';
export * from './applicationDocumentCategories';
export * from './applicationDocumentCategoryFiles';
export * from './payments';
export * from './offlinePaymentRequests';

// Communication system
export * from './chats';
export * from './adminReadChats';
export * from './notifications';
export * from './userNotifications';
export * from './adminNotifications';
export * from './whatsappChats';
export * from './adminReadWhatsappChats';

// Questionnaire system (order matters for foreign keys)
export * from './questionnaires';
export * from './questionCategories';
export * from './questions';
export * from './questionnaireResponses';
export * from './questionResponses';

// Site content management
export * from './faq';
export * from './socialMedias';
export * from './taxCredits';
export * from './carouselImages';
export * from './documentTemplates';
export * from './queries';
export * from './siteContents';

// Blog system
export * from './blogs';

// Audit and logging
export * from './adminActivityLogs';

// Agent activations (depends on users)
export * from './agentActivations';
