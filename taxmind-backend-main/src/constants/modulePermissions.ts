/**
 * Module Permission Constants
 * Defines standardized permission names and module configurations
 */

// Standard permission types
export const PERMISSION_TYPES = {
  CREATE: 'create',
  VIEW: 'view',
  EDIT: 'edit',
  DELETE: 'delete',
} as const;

// Module configurations with their available permissions
export const MODULE_CONFIGS = {
  dashboard: {
    name: 'dashboard',
    displayName: 'Dashboard',
    permissions: [PERMISSION_TYPES.VIEW],
  },
  users: {
    name: 'users',
    displayName: 'User Management',
    permissions: [PERMISSION_TYPES.VIEW, PERMISSION_TYPES.EDIT, PERMISSION_TYPES.DELETE],
  },
  applications: {
    name: 'applications',
    displayName: 'Application Management',
    permissions: [PERMISSION_TYPES.VIEW, PERMISSION_TYPES.EDIT],
  },
  reviews: {
    name: 'reviews',
    displayName: 'Reviews',
    permissions: [PERMISSION_TYPES.VIEW, PERMISSION_TYPES.EDIT],
  },
  homeCarousel: {
    name: 'home_carousel',
    displayName: 'Home Carousel',
    permissions: [
      PERMISSION_TYPES.VIEW,
      PERMISSION_TYPES.EDIT,
      PERMISSION_TYPES.DELETE,
      PERMISSION_TYPES.CREATE,
    ],
  },
  taxCredits: {
    name: 'tax_credits',
    displayName: 'Tax Credits',
    permissions: [
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.VIEW,
      PERMISSION_TYPES.EDIT,
      PERMISSION_TYPES.DELETE,
    ],
  },
  aboutUs: {
    name: 'about_us',
    displayName: 'About Us',
    permissions: [PERMISSION_TYPES.VIEW, PERMISSION_TYPES.EDIT],
  },
  categories: {
    name: 'categories',
    displayName: 'Category Management',
    permissions: [
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.VIEW,
      PERMISSION_TYPES.EDIT,
      PERMISSION_TYPES.DELETE,
    ],
  },
  documentTemplates: {
    name: 'document_templates',
    displayName: 'Document Templates',
    permissions: [
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.VIEW,
      PERMISSION_TYPES.EDIT,
      PERMISSION_TYPES.DELETE,
    ],
  },
  commission: {
    name: 'commission',
    displayName: 'Commission',
    permissions: [PERMISSION_TYPES.VIEW, PERMISSION_TYPES.EDIT],
  },
  faqs: {
    name: 'faqs',
    displayName: 'FAQs Management',
    permissions: [
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.VIEW,
      PERMISSION_TYPES.EDIT,
      PERMISSION_TYPES.DELETE,
    ],
  },
  blogs: {
    name: 'blogs',
    displayName: 'Blogs Management',
    permissions: [
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.VIEW,
      PERMISSION_TYPES.EDIT,
      PERMISSION_TYPES.DELETE,
    ],
  },
  contactUs: {
    name: 'contact_us',
    displayName: 'Contact Us',
    permissions: [PERMISSION_TYPES.VIEW],
  },
  privacyPolicy: {
    name: 'privacy_policy',
    displayName: 'Privacy Policy',
    permissions: [PERMISSION_TYPES.VIEW, PERMISSION_TYPES.EDIT],
  },
  feeStructure: {
    name: 'fee_structure',
    displayName: 'Fee Structure',
    permissions: [PERMISSION_TYPES.VIEW, PERMISSION_TYPES.EDIT],
  },
  cookiePolicy: {
    name: 'cookie_policy',
    displayName: 'Cookie Policy',
    permissions: [PERMISSION_TYPES.VIEW, PERMISSION_TYPES.EDIT],
  },
  termsAndConditions: {
    name: 'terms_and_conditions',
    displayName: 'Terms and Conditions',
    permissions: [PERMISSION_TYPES.VIEW, PERMISSION_TYPES.EDIT],
  },
  topHeader: {
    name: 'top_header',
    displayName: 'Top Header',
    permissions: [
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.VIEW,
      PERMISSION_TYPES.EDIT,
      PERMISSION_TYPES.DELETE,
    ],
  },
  customerSupport: {
    name: 'customer_support',
    displayName: 'Customer Support',
    permissions: [PERMISSION_TYPES.EDIT, PERMISSION_TYPES.VIEW],
  },
  questionnaire: {
    name: 'questionnaire',
    displayName: 'Questionnaire',
    permissions: [
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.VIEW,
      PERMISSION_TYPES.EDIT,
      PERMISSION_TYPES.DELETE,
    ],
  },
  offboardUsers: {
    name: 'offboard_users',
    displayName: 'Offboard Users',
    permissions: [PERMISSION_TYPES.VIEW, PERMISSION_TYPES.CREATE],
  },
  agentActivation: {
    name: 'agent_activation',
    displayName: 'Agent Activation',
    permissions: [PERMISSION_TYPES.VIEW, PERMISSION_TYPES.EDIT],
  },
  payments: {
    name: 'payments',
    displayName: 'Payments',
    permissions: [PERMISSION_TYPES.VIEW, PERMISSION_TYPES.EDIT],
  },
  rbac: {
    name: 'rbac',
    displayName: 'Role-Based Access Control',
    permissions: [
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.VIEW,
      PERMISSION_TYPES.EDIT,
      PERMISSION_TYPES.DELETE,
    ],
  },
} as const;

// Helper function to get permission display names
export const getPermissionDisplayName = (moduleName: string, permissionName: string): string => {
  const moduleConfig = MODULE_CONFIGS[moduleName as keyof typeof MODULE_CONFIGS];
  const moduleDisplayName = moduleConfig?.displayName || moduleName;

  const permissionDisplayNames = {
    create: `Create ${moduleDisplayName}`,
    view: `View ${moduleDisplayName}`,
    edit: `Edit ${moduleDisplayName}`,
    delete: `Delete ${moduleDisplayName}`,
  };

  return (
    permissionDisplayNames[permissionName as keyof typeof permissionDisplayNames] || permissionName
  );
};

export type ModuleName = keyof typeof MODULE_CONFIGS;
export type PermissionType = (typeof PERMISSION_TYPES)[keyof typeof PERMISSION_TYPES];
