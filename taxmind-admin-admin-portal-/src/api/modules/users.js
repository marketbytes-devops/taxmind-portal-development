// Users API - Complete Implementation for usersList.vue
import http from "../http";

/**
 * List users with pagination and filters
 * Maps to TAXMIND endpoint: GET /users
 * Admin-only endpoint requiring proper authorization
 */
export function listUsers(params = {}) {
  // Transform parameters to match TAXMIND API
  const apiParams = {
    page: params.page || 1, // Keep 1-based indexing as API expects page >= 1
    size: params.limit || 20,
    keyword: params.keyword || null,
    // include status filter when provided
    status: params.status || null,
    startDate: params.startDate || null,
    endDate: params.endDate || null,
    sortBy: params.sortBy || "createdAt",
    orderBy: params.orderBy || "desc",
  };

  // Remove null/undefined parameters
  Object.keys(apiParams).forEach((key) => {
    if (apiParams[key] === null || apiParams[key] === undefined) {
      delete apiParams[key];
    }
  });

  return http.get("/users", {
    params: apiParams,
    headers: {
      Accept: "application/json",
    },
  });
}

/**
 * Get single user details
 * Maps to TAXMIND endpoint: GET /users/{userId}
 */
export function getUser(userId) {
  return http.get(`/users/${userId}`, {
    headers: {
      Accept: "application/json",
    },
  });
}

export function getUserApplications(userId, params = {}) {
  return http.get(`/users/${userId}/applications`, {
    params,
    headers: {
      Accept: "application/json",
    },
  });
}
/**
 * Activate or terminate user status
 * Note: TAXMIND.json doesn't specify exact endpoint,
 * but based on RESTful conventions, likely PATCH /users/{userId}
 */
export function terminateOrActivateUser(userId, status) {
  // Transform status to match new API expectations
  const statusMap = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    PENDING: "pending",
  };

  return http.patch(
    `/users/${userId}`,
    {
      status: statusMap[status] || status.toLowerCase(),
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
 * Permanently delete user
 * Maps to inferred endpoint: DELETE /users/{userId}
 */
export function deleteUser(userId) {
  return http.delete(`/users/${userId}`, {
    headers: {
      Accept: "application/json",
    },
  });
}

/**
 * Download user data as PDF
 * Maps to potential endpoint: GET /users/{userId}/export
 */
export function downloadUserPdf(userId) {
  return http.get(`/users/${userId}/export`, {
    responseType: "blob",
    headers: {
      Accept: "application/pdf",
    },
  });
}

/**
 * Request agent activation for a user
 * Maps to endpoint: POST /users/agent-activations/requested
 * Triggers ROS update request
 */
export function requestAgentActivation(userId) {
  return http.post(
    "/users/agent-activations/requested",
    {
      userId: userId,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
}

export function updateUserRemark(userId, remark) {
  return http.patch(
    `/users/${userId}/remark`,
    { remark },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
}

export function updateUserActivationStatus(userId, status) {
  return http.patch(
    `/users/${userId}/activation-status`,
    { status },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
}

export function pairUser(primaryUserId, spouseUserId) {
  return http.post(
    "/users/pair",
    {
      primaryUserId,
      spouseUserId,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
}

export function unpairUser(userId) {
  return http.post(
    `/users/${userId}/unpair`,
    {},
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
}

export function searchProfessions(keyword) {
  return http.get('/users/professions/search', {
    params: { keyword },
    headers: {
      Accept: 'application/json',
    },
  });
}
