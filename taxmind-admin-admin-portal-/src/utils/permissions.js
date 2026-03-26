/**
 * Permission utility service for role-based access control
 * Provides methods to check user permissions for modules and actions
 */

import { getAdminData } from "@/api/http";

class PermissionService {
  constructor() {
    this.userRole = null;
    this.permissions = new Map();
    this.modulePermissions = new Map();
    this.init();
  }

  /**
   * Initialize the permission service with current user data
   */
  init() {
    const adminData = getAdminData();
    if (adminData && adminData.role) {
      this.userRole = adminData.role;
      this.buildPermissionMaps();
    }
  }

  /**
   * Refresh permissions when user data changes
   */
  refresh() {
    this.init();
  }

  /**
   * Build permission maps for quick lookup
   */
  buildPermissionMaps() {
    if (!this.userRole || !this.userRole.modules) return;

    this.permissions.clear();
    this.modulePermissions.clear();

    this.userRole.modules.forEach((module) => {
      const moduleName = module.name;
      const modulePermissions = new Set();

      if (module.permissions) {
        module.permissions.forEach((permission) => {
          const permissionKey = `${moduleName}.${permission.permissionName}`;
          this.permissions.set(permissionKey, true);
          modulePermissions.add(permission.permissionName);
        });
      }

      this.modulePermissions.set(moduleName, modulePermissions);
    });
  }

  /**
   * Check if user has a specific permission for a module
   * @param {string} moduleName - The module name (e.g., 'users', 'applications')
   * @param {string} permissionName - The permission name (e.g., 'view', 'edit', 'delete', 'create')
   * @returns {boolean}
   */
  hasPermission(moduleName, permissionName) {
    if (!this.permissions.size) {
      this.init();
    }

    const permissionKey = `${moduleName}.${permissionName}`;
    return this.permissions.has(permissionKey);
  }

  /**
   * Check if user has view permission for a module
   * @param {string} moduleName - The module name
   * @returns {boolean}
   */
  canView(moduleName) {
    return this.hasPermission(moduleName, "view");
  }

  /**
   * Check if user has edit permission for a module
   * @param {string} moduleName - The module name
   * @returns {boolean}
   */
  canEdit(moduleName) {
    return this.hasPermission(moduleName, "edit");
  }

  /**
   * Check if user has delete permission for a module
   * @param {string} moduleName - The module name
   * @returns {boolean}
   */
  canDelete(moduleName) {
    return this.hasPermission(moduleName, "delete");
  }

  /**
   * Check if user has create permission for a module
   * @param {string} moduleName - The module name
   * @returns {boolean}
   */
  canCreate(moduleName) {
    return this.hasPermission(moduleName, "create");
  }

  /**
   * Get all permissions for a specific module
   * @param {string} moduleName - The module name
   * @returns {Set<string>}
   */
  getModulePermissions(moduleName) {
    return this.modulePermissions.get(moduleName) || new Set();
  }

  /**
   * Check if user has any permissions for a module
   * @param {string} moduleName - The module name
   * @returns {boolean}
   */
  hasAnyPermission(moduleName) {
    const modulePerms = this.getModulePermissions(moduleName);
    return modulePerms.size > 0;
  }

  /**
   * Get user role information
   * @returns {object|null}
   */
  getUserRole() {
    return this.userRole;
  }

  /**
   * Check if user is super admin
   * @returns {boolean}
   */
  isSuperAdmin() {
    return this.userRole && this.userRole.roleName === "Super Admin";
  }

  /**
   * Get all accessible modules for the user
   * @returns {Array<string>}
   */
  getAccessibleModules() {
    return Array.from(this.modulePermissions.keys());
  }

  /**
   * Module name mapping for sidebar items
   */
  getModuleNameMapping() {
    return {
      dashboard: "dashboard",
      "users-list": "users",
      "application-list": "applications",
      "agent-activation": "agent_activation",
      questionnaire: "questionnaire",
      RoleAndAccesss: "rbac",
      Payments: "payments",
      Offboardusers: "offboard_users",
      "review-list": "reviews",
      "review-view": "reviews",
      carousel_Img: "home_carousel",
      tax_credits: "tax_credits",
      aboutUs: "about_us",
      Category_Section: "categories",
      "document-templates": "document_templates",
      commission: "commission",
      faqs: "faqs",
      blogs: "blogs",
      contactUs: "contact_us",
      Privacy_Policy: "privacy_policy",
      Fee_Structure: "fee_structure",
      Cookies_Policy: "cookie_policy",
      "terms-conditions": "terms_and_conditions",
      "customer-support": "customer_support",
      "top-header": "top_header",
    };
  }

  /**
   * Check if a sidebar route is accessible
   * @param {string} route - The route path
   * @returns {boolean}
   */
  canAccessRoute(route) {
    const moduleMapping = this.getModuleNameMapping();
    const cleanRoute = route.startsWith("/") ? route.substring(1) : route;
    const moduleName = moduleMapping[cleanRoute];

    if (!moduleName) {
      // If no mapping found, allow access (for routes that don't require specific permissions)
      return true;
    }

    return this.canView(moduleName);
  }

  /**
   * Get the first accessible route from a list of sidebar items in their display order
   * @param {Array} sidebarItems - Array of sidebar items with 'to' property
   * @returns {string|null} - First accessible route or null if none found
   */
  getFirstAccessibleRoute(sidebarItems) {
    for (const item of sidebarItems) {
      if (this.canAccessRoute(item.to)) {
        return item.to;
      }
    }
    return null;
  }
}

// Create singleton instance
const permissionService = new PermissionService();

export default permissionService;

// Export individual methods for convenience
export const {
  hasPermission,
  canView,
  canEdit,
  canDelete,
  canCreate,
  getModulePermissions,
  hasAnyPermission,
  getUserRole,
  isSuperAdmin,
  getAccessibleModules,
  canAccessRoute,
  getFirstAccessibleRoute,
  refresh,
} = permissionService;
