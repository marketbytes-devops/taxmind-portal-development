import http from "../http";

/**
 * Get list of offboard users with pagination and search
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.size - Page size
 * @param {string} params.keyword - Search keyword
 * @param {string} params.sortBy - Sort field
 * @param {string} params.orderBy - Sort order (asc/desc)
 * @returns {Promise} API response
 */
export const listOffboardUsers = (params = {}) => {
  const apiParams = {};

  // Add pagination parameters
  if (params.page) {
    apiParams.page = params.page;
  }
  if (params.size) {
    apiParams.size = params.size;
  }

  // Add search parameter
  if (params.keyword) {
    apiParams.keyword = params.keyword;
  }

  // Add sorting parameters
  if (params.sortBy) {
    apiParams.sortBy = params.sortBy;
  }
  if (params.orderBy) {
    apiParams.orderBy = params.orderBy;
  }

  return http.get("users/off-boarded", {
    params: apiParams,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};

/**
 * Add user to offboard list
 * @param {Object} userData - User data to offboard
 * @param {string} userData.userId - ID of the user to offboard
 * @returns {Promise} API response
 */
export const addOffboardUser = (userData) => {
  const userId = userData.userId;
  if (!userId) {
    return Promise.reject(new Error("User ID is required"));
  }

  return http.post(
    `users/${userId}/offboard`,
    {},
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
};

/**
 * Remove user from offboard list
 * @param {string} userId - User ID to remove
 * @returns {Promise} API response
 */
export const removeOffboardUser = (userId) => {
  const userIdS = userId.userId;
  return http.delete(`users/${userIdS}/offboard`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
};
