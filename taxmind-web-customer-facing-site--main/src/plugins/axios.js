import axios from "axios";
import store from "@/store";
// import router from "@/router";

/**
 * Axios Configuration and Interceptors
 * Centralized API client with request/response interceptors
 */

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.VUE_APP_API_BASE_URL,
      timeout: parseInt(process.env.VUE_APP_API_TIMEOUT) || 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.setupInterceptors();
    this.retryAttempts = parseInt(process.env.VUE_APP_API_RETRY_ATTEMPTS) || 3;
    this.retryDelay = parseInt(process.env.VUE_APP_API_RETRY_DELAY) || 1000;
    this.enableLogging = process.env.VUE_APP_ENABLE_API_LOGGING === "true";
  }

  setupInterceptors() {
    // Request Interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication token
        const token =
          localStorage.getItem("accesstoken") || localStorage.getItem("token");
        if (token) {
          config.headers.token = token;
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add user ID for certain requests
        const userId = localStorage.getItem("userId");
        if (userId && config.headers.includeUserId !== false) {
          config.headers["X-User-ID"] = userId;
        }

        // Log request if enabled
        if (this.enableLogging) {
          console.log("🔥 API Request:", {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            headers: this.sanitizeHeaders(config.headers),
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        if (this.enableLogging) {
          console.error("❌ Request Error:", error);
        }
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log successful response if enabled
        if (this.enableLogging) {
          console.log("✅ API Response:", {
            status: response.status,
            url: response.config.url,
            data: response.data,
          });
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Log error if enabled
        if (this.enableLogging) {
          console.error("❌ API Error:", {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message,
            data: error.response?.data,
          });
        }

        // ALWAYS log 401/498 errors for debugging
        console.log("🚨 Response Interceptor - Error Status:", error.response?.status);
        console.log("🚨 Error response object:", error.response);
        console.log("🚨 Full error:", error);

        // Handle different error status codes
        // 401 Unauthorized and 498 Invalid/Expired Token - Direct login redirect
        if (error.response?.status === 401 || error.response?.status === 498) {
          console.warn(`⚠️ Received ${error.response?.status} - Clearing auth and redirecting to login`);
          // Set flag to prevent popups/snackbars
          localStorage.setItem('authExpired', 'true');
          this.clearAuthAndRedirect();
          // Don't propagate the error to prevent popups in components
          return Promise.resolve();
        }

        if (error.response?.status === 403) {
          return this.handleForbidden(error);
        }

        if (error.response?.status === 429) {
          return this.handleRateLimit(error, originalRequest);
        }

        // Retry logic for network errors and 5xx errors
        if (
          this.shouldRetry(error) &&
          !originalRequest._retry &&
          originalRequest._retryCount < this.retryAttempts
        ) {
          return this.retryRequest(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle 401 Unauthorized errors - Auto refresh token
   */
  async handleUnauthorized(error) {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem("refreshtoken");

    // If no refresh token or already retried, clear session and redirect
    if (!refreshToken || originalRequest._tokenRetry) {
      console.warn("⚠️ No refresh token or already retried, redirecting to login");
      this.clearAuthAndRedirect();
      return Promise.reject(error);
    }

    // Mark request as being retried to prevent infinite loops
    originalRequest._tokenRetry = true;

    try {
      // Attempt to refresh the access token using raw axios (not the intercepted client)
      console.log("🔄 Attempting to refresh token...");
      const refreshResponse = await axios.post(
        `${process.env.VUE_APP_API_BASE_URL}/users/auth/token/refresh`,
        {
          refreshToken: refreshToken,
        },
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
            "Content-Type": "application/json",
          },
          __tokenRetry: true,
        }
      );

      if (
        refreshResponse.data?.success &&
        refreshResponse.data?.data?.accessToken
      ) {
        // Update tokens in localStorage
        const newAccessToken = refreshResponse.data.data.accessToken;
        localStorage.setItem("accesstoken", newAccessToken);

        // Update refresh token if provided
        if (refreshResponse.data.data.refreshToken) {
          localStorage.setItem(
            "refreshtoken",
            refreshResponse.data.data.refreshToken
          );
        }

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.token = newAccessToken;
        
        // Remove the retry flag so it can be retried again if needed
        delete originalRequest._tokenRetry;

        // Log successful token refresh if enabled
        if (this.enableLogging) {
          console.log("✅ Token refreshed successfully, retrying original request");
        }

        // Retry the original request with new token
        return this.client(originalRequest);
      } else {
        // Refresh response structure invalid, clear session and redirect
        console.error("❌ Invalid refresh token response structure");
        this.clearAuthAndRedirect();
        return Promise.reject(error);
      }
    } catch (refreshError) {
      // Refresh request failed, clear session and redirect
      console.error("❌ Token refresh failed:", refreshError.response?.status, refreshError.message);
      this.clearAuthAndRedirect();
      return Promise.reject(refreshError);
    }
  }

  /**
   * Clear authentication data and redirect to login
   */
  clearAuthAndRedirect() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === "/login" || currentPath === "/";
    
    console.log("🔒 Clearing auth and redirecting to login - current path:", currentPath);
    
    // Clear all authentication data immediately
    localStorage.removeItem("accesstoken");
    localStorage.removeItem("refreshtoken");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("authExpired");

    // Update store state
    if (store) {
      try {
        store.dispatch("sessionOut");
      } catch (e) {
        console.warn("Store dispatch failed:", e);
      }
    }

    // Redirect to login page if not already there
    if (!isLoginPage) {
      console.log("🔀 Force redirecting to /login with window.location.replace()");
      // Use window.location.replace() for hard redirect that bypasses everything
      window.location.replace("/login");
    } else {
      console.log("Already on login page, no redirect needed");
    }
  }

  /**
   * Handle 403 Forbidden errors
   */
  handleForbidden(error) {
    // You can add custom forbidden handling logic here
    console.warn("Access forbidden:", error.response?.data?.message);
    return Promise.reject(error);
  }

  /**
   * Handle 429 Rate Limit errors
   */
  async handleRateLimit(error, originalRequest) {
    const retryAfter =
      error.response?.headers["retry-after"] || this.retryDelay / 1000;

    console.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);

    await this.delay(retryAfter * 1000);
    return this.client(originalRequest);
  }

  /**
   * Determine if request should be retried
   */
  shouldRetry(error) {
    return (
      !error.response || // Network error
      error.response.status >= 500 || // Server error
      error.code === "ECONNABORTED" || // Timeout
      error.code === "NETWORK_ERROR"
    );
  }

  /**
   * Retry failed request
   */
  async retryRequest(originalRequest) {
    originalRequest._retry = true;
    originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

    console.log(
      `Retrying request (${originalRequest._retryCount}/${this.retryAttempts}):`,
      originalRequest.url
    );

    await this.delay(this.retryDelay * originalRequest._retryCount);
    return this.client(originalRequest);
  }

  /**
   * Delay function for retry logic
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Sanitize headers for logging (remove sensitive data)
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    if (sanitized.token) sanitized.token = "***";
    if (sanitized.Authorization) sanitized.Authorization = "Bearer ***";
    return sanitized;
  }

  /**
   * GET request
   */
  get(url, config = {}) {
    return this.client.get(url, config);
  }

  /**
   * POST request
   */
  post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  /**
   * PUT request
   */
  put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  /**
   * PATCH request
   */
  patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }

  /**
   * DELETE request
   */
  delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  /**
   * Generic request method (backward compatibility)
   */
  request(config) {
    return this.client(config);
  }

  /**
   * Upload file with progress tracking
   */
  uploadFile(url, formData, onUploadProgress = null, config = {}) {
    return this.client.post(url, formData, {
      ...config,
      headers: {
        "Content-Type": "multipart/form-data",
        ...config.headers,
      },
      onUploadProgress,
    });
  }

  /**
   * Download file
   */
  downloadFile(url, config = {}) {
    return this.client.get(url, {
      ...config,
      responseType: "blob",
    });
  }
}

// Create and export the API client instance
const apiClient = new ApiClient();

// Export both the instance and the axios client for backward compatibility
export default apiClient;
export const axiosInstance = apiClient.client;

// For components that need direct access to axios instance
window.axios = apiClient.client;
