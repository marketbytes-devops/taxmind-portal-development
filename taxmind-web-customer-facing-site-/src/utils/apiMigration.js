/**
 * API Migration Utility
 * Helper functions to migrate components from old axios usage to new API client
 */
import apiClient from "@/plugins/axios";

/**
 * Migration helper mixin for Vue components
 */
export const ApiMigrationMixin = {
  methods: {
    /**
     * Migrated API call method - replaces direct axios usage
     * @param {Object} config - API configuration object
     * @returns {Promise} - API response promise
     */
    async migratedApiCall(config) {
      try {
        // Handle different config formats for backward compatibility
        if (typeof config === "string") {
          // Simple URL string
          return await apiClient.get(config);
        }

        const {
          url,
          method = "GET",
          data,
          headers = {},
          ...restConfig
        } = config;

        // Merge headers with config
        const requestConfig = {
          headers: {
            ...headers,
            // Remove old token header format if present
            ...(config.headers?.token && { token: config.headers.token }),
          },
          ...restConfig,
        };

        // Make API call based on method
        switch (method.toUpperCase()) {
          case "GET":
            return await apiClient.get(url, requestConfig);
          case "POST":
            return await apiClient.post(url, data, requestConfig);
          case "PUT":
            return await apiClient.put(url, data, requestConfig);
          case "PATCH":
            return await apiClient.patch(url, data, requestConfig);
          case "DELETE":
            return await apiClient.delete(url, requestConfig);
          default:
            return await apiClient.request({
              method,
              url,
              data,
              ...requestConfig,
            });
        }
      } catch (error) {
        // Enhanced error handling
        console.error("API call failed:", {
          config,
          error: error.response?.data || error.message,
        });
        throw error;
      }
    },

    /**
     * Handle API errors consistently
     * @param {Error} error - API error object
     * @param {string} context - Context for error logging
     */
    handleApiError(error, context = "API call") {
      // Preserve ServerError flag for server-side 500 responses
      if (error.response?.status === 500) {
        this.ServerError = true;
      }

      console.error(`${context} failed:`, error);

      // Prefer global snackbar API to surface backend-provided messages.
      // Use showApiError which extracts `error` or `message` from response objects.
      try {
        if (
          this.$snackbar &&
          typeof this.$snackbar.showApiError === "function"
        ) {
          // If axios Error contains a response, pass the response object so the global snackbar
          // can extract backend-provided messages from response.data.*. This avoids showing
          // axios' default error.message like 'Request failed with status code 400'.
          const payload = error?.response ? error.response : error;
          this.$snackbar.showApiError(payload);
        } else if (
          this.$snackbar &&
          typeof this.$snackbar.showError === "function"
        ) {
          // Fallback: pass through a likely backend message or generic message
          const fallbackMsg =
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            "An unexpected error occurred.";
          this.$snackbar.showError(fallbackMsg);
        }
      } catch (e) {
        // Do nothing if snackbar isn't available — components should not crash on error handling
        console.warn("Snackbar not available to show API error", e);
      }

      return error;
    },

    /**
     * Wrapper for common API patterns
     */
    async fetchData(url, options = {}) {
      this.appLoading = true;
      try {
        const response = await this.migratedApiCall({ url, ...options });
        return response.data;
      } catch (error) {
        this.handleApiError(error, `Fetching data from ${url}`);
        throw error;
      } finally {
        this.appLoading = false;
      }
    },

    async submitData(url, data, options = {}) {
      this.appLoading = true;
      try {
        const response = await this.migratedApiCall({
          url,
          method: "POST",
          data,
          ...options,
        });
        return response.data;
      } catch (error) {
        this.handleApiError(error, `Submitting data to ${url}`);
        throw error;
      } finally {
        this.appLoading = false;
      }
    },

    async updateData(url, data, options = {}) {
      this.appLoading = true;
      try {
        const response = await this.migratedApiCall({
          url,
          method: "PATCH",
          data,
          ...options,
        });
        return response.data;
      } catch (error) {
        this.handleApiError(error, `Updating data at ${url}`);
        throw error;
      } finally {
        this.appLoading = false;
      }
    },

    async deleteData(url, options = {}) {
      this.appLoading = true;
      try {
        const response = await this.migratedApiCall({
          url,
          method: "DELETE",
          ...options,
        });
        return response.data;
      } catch (error) {
        this.handleApiError(error, `Deleting data at ${url}`);
        throw error;
      } finally {
        this.appLoading = false;
      }
    },
  },
};

/**
 * Migration patterns for common axios usage
 */
export const MigrationPatterns = {
  /**
   * Convert old axios config to new format
   */
  convertAxiosConfig(oldConfig) {
    const { url, method, headers = {}, data, ...rest } = oldConfig;

    return {
      url,
      method: method || "GET",
      data,
      headers: {
        ...headers,
        // Handle old token header format
        ...(headers.token && { token: headers.token }),
      },
      ...rest,
    };
  },

  /**
   * Common patterns found in the codebase
   */
  patterns: {
    // Pattern: axios({ url: "/api/endpoint", method: "GET", headers: { token: "..." } })
    basicGet: (url, token) => ({
      url,
      method: "GET",
      headers: token ? { token } : {},
    }),

    // Pattern: axios({ url: "/api/endpoint", method: "POST", data: {...}, headers: { token: "..." } })
    basicPost: (url, data, token) => ({
      url,
      method: "POST",
      data,
      headers: token ? { token } : {},
    }),

    // Pattern for file uploads
    fileUpload: (url, formData, token, onUploadProgress) => ({
      url,
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token && { token }),
      },
      onUploadProgress,
    }),
  },
};

/**
 * Component migration examples
 */
export const MigrationExamples = {
  // Before: axios({ url: "/v1/guest/webpage/get-home", method: "GET", headers: { token: localStorage.getItem("token") } })
  // After: this.$api.get("/v1/guest/webpage/get-home")
  // Before: axios({ url: "/api/user/profile", method: "POST", data: userData, headers: { token: token } })
  // After: this.$api.post("/api/user/profile", userData)
  // Before: Complex error handling in each component
  // After: this.handleApiError(error, "Profile update")
};

/**
 * Legacy axios wrapper for gradual migration
 */
export const legacyAxiosWrapper = {
  // Wraps old axios calls to use new client while maintaining compatibility
  wrapAxiosCall(axiosConfig) {
    return apiClient.request(MigrationPatterns.convertAxiosConfig(axiosConfig));
  },
};

export default {
  ApiMigrationMixin,
  MigrationPatterns,
  MigrationExamples,
  legacyAxiosWrapper,
};
