import { Router } from 'express';

import { MODULE_CONFIGS } from '@/constants/modulePermissions';
import { authorize } from '@/middleware/authorize';
import { paginate } from '@/middleware/paginate';
import { requireAnyPermission, requirePermission } from '@/middleware/rbac';

import {
  createCarouselImage,
  createDocumentCategory,
  createDocumentTemplate,
  createFaq,
  createPolicy,
  createQueryCategory,
  createSocialMedia,
  createTaxCredit,
  deleteCarouselImage,
  deleteDocumentCategory,
  deleteDocumentTemplate,
  deleteFaq,
  deletePolicy,
  deleteQueryCategory,
  deleteSocialMedia,
  deleteTaxCredit,
  getActivePolicyByType,
  getSingleFaq,
  getSingleTaxCredit,
  getSiteContents,
  listCarouselImages,
  listDocumentCategories,
  listDocumentTemplates,
  listFaqs,
  listPolicies,
  listQueryCategories,
  listSocialMedias,
  listTaxCredits,
  updateDocumentCategory,
  updateDocumentTemplate,
  updateFaq,
  updatePolicy,
  updateQueryCategory,
  updateSiteContents,
  updateSocialMedia,
  updateTaxCredit,
} from './services';

const router = Router();

// =====================
// FAQ Routes
// =====================
router.get(
  '/faqs',
  authorize('ADMIN', 'USER', 'PUBLIC'),
  requirePermission(MODULE_CONFIGS.faqs.name, 'view'),
  paginate,
  listFaqs
);
router.get(
  '/faqs/:id',
  authorize('ADMIN', 'USER', 'PUBLIC'),
  requirePermission(MODULE_CONFIGS.faqs.name, 'view'),
  getSingleFaq
);
router.post(
  '/faqs',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.faqs.name, 'create'),
  createFaq
);
router.put(
  '/faqs/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.faqs.name, 'edit'),
  updateFaq
);
router.delete(
  '/faqs/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.faqs.name, 'delete'),
  deleteFaq
);

// =====================
// Social Media Routes
// =====================
router.get(
  '/social-media',
  authorize('ADMIN', 'USER', 'PUBLIC'),
  requirePermission(MODULE_CONFIGS.topHeader.name, 'view'),
  paginate,
  listSocialMedias
);
router.post(
  '/social-media',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.topHeader.name, 'create'),
  createSocialMedia
);
router.put(
  '/social-media/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.topHeader.name, 'edit'),
  updateSocialMedia
);
router.delete(
  '/social-media/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.topHeader.name, 'delete'),
  deleteSocialMedia
);

// =====================
// Tax Credits Routes
// =====================
router.get(
  '/tax-credits',
  authorize('ADMIN', 'USER', 'PUBLIC'),
  requirePermission(MODULE_CONFIGS.taxCredits.name, 'view'),
  paginate,
  listTaxCredits
);
router.get(
  '/tax-credits/:id',
  authorize('ADMIN', 'USER', 'PUBLIC'),
  requirePermission(MODULE_CONFIGS.taxCredits.name, 'view'),
  getSingleTaxCredit
);
router.post(
  '/tax-credits',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.taxCredits.name, 'create'),
  createTaxCredit
);
router.put(
  '/tax-credits/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.taxCredits.name, 'edit'),
  updateTaxCredit
);
router.delete(
  '/tax-credits/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.taxCredits.name, 'delete'),
  deleteTaxCredit
);

// =====================
// Carousel Images Routes
// =====================
router.get(
  '/carousel-images',
  authorize('ADMIN', 'USER', 'PUBLIC'),
  requirePermission(MODULE_CONFIGS.homeCarousel.name, 'view'),
  paginate,
  listCarouselImages
);
router.post(
  '/carousel-images',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.homeCarousel.name, 'edit'),
  createCarouselImage
);
router.delete(
  '/carousel-images/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.homeCarousel.name, 'delete'),
  deleteCarouselImage
);

// =====================
// Document Templates Routes
// =====================
router.get(
  '/document-templates',
  authorize('ADMIN', 'USER', 'PUBLIC'),
  requirePermission(MODULE_CONFIGS.documentTemplates.name, 'view'),
  paginate,
  listDocumentTemplates
);
router.post(
  '/document-templates',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.documentTemplates.name, 'create'),
  createDocumentTemplate
);
router.put(
  '/document-templates/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.documentTemplates.name, 'edit'),
  updateDocumentTemplate
);
router.delete(
  '/document-templates/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.documentTemplates.name, 'delete'),
  deleteDocumentTemplate
);

// =====================
// Policies Routes
// =====================
router.get(
  '/policies',
  authorize('ADMIN', 'USER', 'PUBLIC'),
  requireAnyPermission([
    [MODULE_CONFIGS.cookiePolicy.name, 'view'],
    [MODULE_CONFIGS.privacyPolicy.name, 'view'],
    [MODULE_CONFIGS.termsAndConditions.name, 'view'],
    [MODULE_CONFIGS.feeStructure.name, 'view'],
  ]),
  paginate,
  listPolicies
);
router.post(
  '/policies',
  authorize('ADMIN'),
  requireAnyPermission([
    [MODULE_CONFIGS.cookiePolicy.name, 'create'],
    [MODULE_CONFIGS.privacyPolicy.name, 'create'],
    [MODULE_CONFIGS.termsAndConditions.name, 'create'],
    [MODULE_CONFIGS.feeStructure.name, 'create'],
  ]),
  createPolicy
);
router.put(
  '/policies/:id',
  authorize('ADMIN'),
  requireAnyPermission([
    [MODULE_CONFIGS.cookiePolicy.name, 'edit'],
    [MODULE_CONFIGS.privacyPolicy.name, 'edit'],
    [MODULE_CONFIGS.termsAndConditions.name, 'edit'],
    [MODULE_CONFIGS.feeStructure.name, 'edit'],
  ]),
  updatePolicy
);
router.delete(
  '/policies/:id',
  requireAnyPermission([
    [MODULE_CONFIGS.cookiePolicy.name, 'delete'],
    [MODULE_CONFIGS.privacyPolicy.name, 'delete'],
    [MODULE_CONFIGS.termsAndConditions.name, 'delete'],
    [MODULE_CONFIGS.feeStructure.name, 'delete'],
  ]),
  deletePolicy
);
router.get('/policies/active', authorize('ADMIN', 'USER', 'PUBLIC'), getActivePolicyByType);

// =====================
// Query Categories Routes
// =====================
router.get(
  '/query-categories',
  authorize('ADMIN', 'USER', 'PUBLIC'),
  requirePermission(MODULE_CONFIGS.categories.name, 'view'),
  paginate,
  listQueryCategories
);
router.post(
  '/query-categories',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.categories.name, 'create'),
  createQueryCategory
);
router.put(
  '/query-categories/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.categories.name, 'edit'),
  updateQueryCategory
);
router.delete(
  '/query-categories/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.categories.name, 'delete'),
  deleteQueryCategory
);

// =====================
// Document Categories Routes
// =====================
router.get(
  '/document-categories',
  authorize('ADMIN', 'USER', 'PUBLIC'),
  requirePermission(MODULE_CONFIGS.categories.name, 'view'),
  paginate,
  listDocumentCategories
);
router.post(
  '/document-categories',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.categories.name, 'create'),
  createDocumentCategory
);
router.put(
  '/document-categories/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.categories.name, 'edit'),
  updateDocumentCategory
);
router.delete(
  '/document-categories/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.categories.name, 'delete'),
  deleteDocumentCategory
);

// =====================
// Site Contents Routes (Global Configuration)
// =====================
router.get('/config', getSiteContents);
router.patch(
  '/config',
  authorize('ADMIN'),
  requireAnyPermission([
    [MODULE_CONFIGS.aboutUs.name, 'edit'],
    [MODULE_CONFIGS.commission.name, 'edit'],
    [MODULE_CONFIGS.topHeader.name, 'edit'],
    [MODULE_CONFIGS.homeCarousel.name, 'edit'],
    [MODULE_CONFIGS.commission.name, 'edit'],
  ]),
  updateSiteContents
);

export default router;
