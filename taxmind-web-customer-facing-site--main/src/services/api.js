import apiClient from "@/plugins/axios";

/**
 * API Service Helper
 * Provides convenient methods for common API operations
 */

class ApiService {
  /**
   * Authentication APIs
   */
  auth = {
    login: (credentials) => apiClient.post("/auth/login", credentials),
    logout: () => apiClient.get("/user/logout"),
    register: (userData) => apiClient.post("/auth/register", userData),
    forgotPassword: (email) =>
      apiClient.post("/auth/forgot-password", { email }),
    resetPassword: (data) => apiClient.post("/auth/reset-password", data),
    verifyToken: () => apiClient.get("/auth/verify-token"),
  };

  /**
   * User/Profile APIs
   */
  user = {
    getProfile: () => apiClient.get("/users/profile"),
    updateProfile: (userData) => apiClient.patch("/users/profile", userData),
    changePassword: (passwords) =>
      apiClient.post("/users/auth/password/change", passwords),
    deleteAccount: () => apiClient.delete("/users/account"),
    uploadAvatar: (formData, onProgress) =>
      apiClient.uploadFile("/users/avatar", formData, onProgress),
  };

  /**
   * Site Content APIs (New Structure)
   */
  siteContent = {
    getConfig: () => apiClient.get("/site-contents/config"),
    updateConfig: (data) => apiClient.patch("/site-contents/config", data),
    getCarouselImages: () => apiClient.get("/site-contents/carousel-images"),
    deleteCarouselImage: (id) =>
      apiClient.delete(`/site-contents/carousel-images/${id}`),
    getAdvantages: () => apiClient.get("/site-contents/advantages"),
    getFAQs: () => apiClient.get("/site-contents/faqs"),
    getBlogs: (params = {}) =>
      apiClient.get("/site-contents/blogs", { params }),
  };

  /**
   * Site Content APIs (Migrated from legacy)
   */
  siteContent = {
    getConfig: () => apiClient.get("/site-contents/config"),
    getCarouselImages: () => apiClient.get("/site-contents/carousel-images"),
    getFAQs: () => apiClient.get("/site-contents/faqs"),
    getTaxCredits: () => apiClient.get("/site-contents/tax-credits"),
    getSocialMedia: () => apiClient.get("/site-contents/social-media"),
    getPolicies: (type) =>
      apiClient.get("/site-contents/policies", { params: { type } }),
    getQueryCategories: () => apiClient.get("/site-contents/query-categories"),
  };

  /**
   * Application APIs
   */
  application = {
    submit: (applicationData) =>
      apiClient.post("/application/submit", applicationData),
    getStatus: (applicationId) =>
      apiClient.get(`/application/${applicationId}/status`),
    getHistory: () => apiClient.get("/application/history"),
    uploadDocument: (applicationId, formData, onProgress) =>
      apiClient.uploadFile(
        `/application/${applicationId}/documents`,
        formData,
        onProgress
      ),
    downloadDocument: (documentId) =>
      apiClient.downloadFile(`/application/documents/${documentId}`),
  };

  /**
   * File APIs
   */
  files = {
    upload: (formData, onProgress) =>
      apiClient.uploadFile("/files/upload", formData, onProgress),
    delete: (fileId) => apiClient.delete(`/files/${fileId}`),
    getPresignedUrl: (fileName, fileType) =>
      apiClient.post("/files/presigned-url", { fileName, fileType }),
  };

  /**
   * Communication APIs
   */
  communication = {
    sendMessage: (message) => apiClient.post("/communication/message", message),
    getMessages: (params = {}) =>
      apiClient.get("/communication/messages", { params }),
    markAsRead: (messageId) =>
      apiClient.patch(`/communication/messages/${messageId}/read`),
  };

  /**
   * Generic API call with error handling
   */
  async call(method, url, data = null, config = {}) {
    try {
      let response;

      switch (method.toLowerCase()) {
        case "get":
          response = await apiClient.get(url, config);
          break;
        case "post":
          response = await apiClient.post(url, data, config);
          break;
        case "put":
          response = await apiClient.put(url, data, config);
          break;
        case "patch":
          response = await apiClient.patch(url, data, config);
          break;
        case "delete":
          response = await apiClient.delete(url, config);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status,
        originalError: error,
      };
    }
  }

  /**
   * Batch API calls
   */
  async batch(requests) {
    try {
      const promises = requests.map((request) => {
        const { method, url, data, config } = request;
        return this.call(method, url, data, config);
      });

      const results = await Promise.allSettled(promises);

      return results.map((result, index) => ({
        ...result.value,
        originalRequest: requests[index],
      }));
    } catch (error) {
      console.error("Batch request failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ApiService();

// Named exports for specific services
export const authService = new ApiService().auth;
export const userService = new ApiService().user;
export const siteContentService = new ApiService().siteContent;
export const legacyService = new ApiService().legacy;
export const applicationService = new ApiService().application;
export const fileService = new ApiService().files;
export const communicationService = new ApiService().communication;
