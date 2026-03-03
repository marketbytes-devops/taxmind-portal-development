// RBAC API
import http from "../http";

/**
 * List roles with pagination and filters
 * Maps to endpoint: GET /rbac/roles
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-indexed)
 * @param {number} params.limit - Number of items per page
 * @param {string} params.keyword - Search keyword
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.orderBy - Sort direction (asc/desc)
 * @returns {Promise} - Promise resolving to the roles list with metadata
 */
export function listRoles(params = {}) {
  // Transform parameters to match API
  const apiParams = {
    page: params.page || 1,
    size: params.limit || 10,
    keyword: params.keyword || null,
    sortBy: params.sortBy || "updatedAt",
    orderBy: params.orderBy || "desc",
  };

  // Remove null/undefined parameters
  Object.keys(apiParams).forEach((key) => {
    if (apiParams[key] === null || apiParams[key] === undefined) {
      delete apiParams[key];
    }
  });

  return http.get("/rbac/roles", {
    params: apiParams,
    headers: {
      Accept: "application/json",
    },
  });
}

export function listAllRoles() {
  // Transform parameters to match API

  return http.get("/rbac/list-all-roles", {
    headers: {
      Accept: "application/json",
    },
  });
}

/**
 * List users with pagination and filters
 * Maps to endpoint: GET /users
 * Used in the Role & Access section
 */
export function listUsers(params = {}) {
  // Transform parameters to match API
  const apiParams = {
    page: params.page || 1,
    size: params.limit || 10,
    keyword: params.keyword || null,
    sortBy: params.sortBy || "updatedAt",
    orderBy: params.orderBy || "desc",
  };

  // Remove null/undefined parameters
  Object.keys(apiParams).forEach((key) => {
    if (apiParams[key] === null || apiParams[key] === undefined) {
      delete apiParams[key];
    }
  });

  return http.get("/admins", {
    params: apiParams,
    headers: {
      Accept: "application/json",
    },
  });
}

/**
 * Block/Unblock admin
 * Maps to endpoint: PUT /admins/{adminId}/profile
 * @param {string} adminId - The admin ID
 * @param {boolean} status - Status to set (true for active, false for blocked)
 * @returns {Promise} - Promise resolving to the updated admin
 */
export function blockUnblockAdmin(adminId, status) {
  return http.put(
    `/admins/${adminId}/profile`,
    {
      status: status,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
}

/**
 * Create an admin with a role
 * Maps to endpoint: POST /admins
 * @param {Object} adminData - The admin data
 * @param {string} adminData.name - Admin's name
 * @param {string} adminData.email - Admin's email
 * @param {string} adminData.roleId - Role ID to assign to the admin
 * @returns {Promise} - Promise resolving to the created admin
 */
export function createAdmin(adminData) {
  return http.post("/admins", adminData, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

/**
 * Update an admin's profile
 * Maps to endpoint: PUT /admins/{adminId}/profile
 * @param {string} adminId - The admin ID
 * @param {Object} profileData - The profile data to update
 * @param {string} profileData.name - Admin's name
 * @param {string} profileData.roleId - Role ID to assign to the admin
 * @param {boolean} profileData.status - Admin's status (true for active, false for blocked)
 * @returns {Promise} - Promise resolving to the updated admin
 */
export function updateAdminProfile(adminId, profileData) {
  return http.put(`/admins/${adminId}/profile`, profileData, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

/**
 * List modules with their permissions
 * Maps to endpoint: GET /rbac/modules
 * @returns {Promise} - Promise resolving to the modules list with permissions
 */
export function listModules() {
  return http.get("/rbac/modules", {
    headers: {
      Accept: "application/json",
    },
  });
}

/**
 * Create a new role
 * Maps to endpoint: POST /rbac/roles
 * @param {Object} roleData - Role data containing roleName and modulePermissionIds
 * @returns {Promise} - Promise resolving to the created role
 */
export function createRole(roleData) {
  return http.post("/rbac/roles", roleData, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

/**
 * Update an existing role
 * Maps to endpoint: PUT /rbac/roles/:id
 * @param {string} roleId - The ID of the role to update
 * @param {Object} roleData - Role data containing roleName and modulePermissionIds
 * @returns {Promise} - Promise resolving to the updated role
 */
export function updateRole(roleId, roleData) {
  return http.put(`/rbac/roles/${roleId}`, roleData, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

/**
 * Delete a role by ID
 * @param {string} roleId - The ID of the role to delete
 * @returns {Promise} - Promise resolving to the deletion confirmation
 */
export function deleteRole(roleId) {
  return http.delete(`/rbac/roles/${roleId}`, {
    headers: {
      Accept: "application/json",
    },
  });
}
