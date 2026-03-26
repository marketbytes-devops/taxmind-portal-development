/**
 * Vue mixin for permission-based UI control
 * Provides reactive permission checking methods to Vue components
 */

import permissionService from '@/utils/permissions';

export default {
  data() {
    return {
      // Reactive flag to trigger updates when permissions change
      permissionUpdateFlag: 0
    };
  },

  computed: {
    /**
     * Get current user role
     */
    userRole() {
      // Include permissionUpdateFlag to make this reactive
      this.permissionUpdateFlag;
      return permissionService.getUserRole();
    },

    /**
     * Check if current user is super admin
     */
    isSuperAdmin() {
      this.permissionUpdateFlag;
      return permissionService.isSuperAdmin();
    },

    /**
     * Get all accessible modules for current user
     */
    accessibleModules() {
      this.permissionUpdateFlag;
      return permissionService.getAccessibleModules();
    }
  },

  methods: {
    /**
     * Check if user has specific permission for a module
     * @param {string} moduleName - The module name
     * @param {string} permissionName - The permission name
     * @returns {boolean}
     */
    hasPermission(moduleName, permissionName) {
      return permissionService.hasPermission(moduleName, permissionName);
    },

    /**
     * Check if user can view a module
     * @param {string} moduleName - The module name
     * @returns {boolean}
     */
    canView(moduleName) {
      return permissionService.canView(moduleName);
    },

    /**
     * Check if user can edit a module
     * @param {string} moduleName - The module name
     * @returns {boolean}
     */
    canEdit(moduleName) {
      return permissionService.canEdit(moduleName);
    },

    /**
     * Check if user can delete from a module
     * @param {string} moduleName - The module name
     * @returns {boolean}
     */
    canDelete(moduleName) {
      return permissionService.canDelete(moduleName);
    },

    /**
     * Check if user can create in a module
     * @param {string} moduleName - The module name
     * @returns {boolean}
     */
    canCreate(moduleName) {
      return permissionService.canCreate(moduleName);
    },

    /**
     * Check if user can access a specific route
     * @param {string} route - The route path
     * @returns {boolean}
     */
    canAccessRoute(route) {
      return permissionService.canAccessRoute(route);
    },

    /**
     * Get all permissions for a module
     * @param {string} moduleName - The module name
     * @returns {Set<string>}
     */
    getModulePermissions(moduleName) {
      return permissionService.getModulePermissions(moduleName);
    },

    /**
     * Check if user has any permissions for a module
     * @param {string} moduleName - The module name
     * @returns {boolean}
     */
    hasAnyPermission(moduleName) {
      return permissionService.hasAnyPermission(moduleName);
    },

    /**
     * Refresh permissions (call after login/role change)
     */
    refreshPermissions() {
      permissionService.refresh();
      this.permissionUpdateFlag++;
    },

    /**
     * Show/hide element based on permission
     * @param {string} moduleName - The module name
     * @param {string} permissionName - The permission name
     * @returns {boolean}
     */
    showIfHasPermission(moduleName, permissionName) {
      return this.hasPermission(moduleName, permissionName);
    },

    /**
     * Show/hide element based on view permission
     * @param {string} moduleName - The module name
     * @returns {boolean}
     */
    showIfCanView(moduleName) {
      return this.canView(moduleName);
    },

    /**
     * Show/hide element based on edit permission
     * @param {string} moduleName - The module name
     * @returns {boolean}
     */
    showIfCanEdit(moduleName) {
      return this.canEdit(moduleName);
    },

    /**
     * Show/hide element based on delete permission
     * @param {string} moduleName - The module name
     * @returns {boolean}
     */
    showIfCanDelete(moduleName) {
      return this.canDelete(moduleName);
    },

    /**
     * Show/hide element based on create permission
     * @param {string} moduleName - The module name
     * @returns {boolean}
     */
    showIfCanCreate(moduleName) {
      return this.canCreate(moduleName);
    }
  },

  created() {
    // Refresh permissions when component is created
    this.refreshPermissions();
  }
};
