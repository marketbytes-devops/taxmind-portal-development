import apiClient from "@/plugins/axios";

// Application service for handling all application-related API calls
const ApplicationService = {
  /**
   * Get all applications for the current user
   * @returns {Promise} Promise with applications data
   */
  getApplications(params = {}) {
    const { page = 1, size = 10 } = params;
    return apiClient
      .get("/applications", {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          page,
          size,
        },
      })
      .then((response) => {
        return response; // return full axios response so callers can read data and pagination meta
      })
      .catch((error) => {
        throw error;
      });
  },

  /**
   * Get a specific application by ID
   * @param {string} applicationId - The application ID
   * @returns {Promise} Promise with application data
   */
  getApplicationById(applicationId) {
    return apiClient
      .get(`/applications/${applicationId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },
  /**
   * Get comments/messages for a specific application
   * @param {string} applicationId - The application ID
   * @returns {Promise} - Promise resolving to the application comments
   */
  getComments(applicationId) {
    return apiClient
      .get("/chats/messages", {
        headers: {
          Accept: "application/json",
        },
        params: {
          applicationId, // sent as ?applicationId=123
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },
  /**
   * Add a comment to an application
   * @param {string} applicationId - The ID of the application
   * @param {Object} commentData - The comment data to add
   * @returns {Promise} Promise with comment data
   */
  // addComment(applicationId, commentData) {
  //   return axios.post(
  //     `${API_URL}/applications/${applicationId}/comments`,
  //     commentData,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${store.state.token}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  // },

  getQuestionnaire(responseId) {
    return apiClient
      .get(
        `/questionnaires/responses/${responseId}`,

        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        return response.data;
      });
  },

  /**
   * Update questionnaire progress
   * @param {string} responseId - The questionnaire response ID
   * @param {Object} progressData - The progress data containing currentCategoryId and completionPercentage
   * @returns {Promise} Promise with response data
   */
  updateQuestionnaireProgress(responseId, progressData) {
    return apiClient
      .patch(`/questionnaires/responses/${responseId}`, progressData, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.error("Error updating questionnaire progress:", error);
        throw error;
      });
  },

  /**
   * Submit a questionnaire answer
   * @param {Object} answerData - The answer data containing responseId, questionId, and answer
   * @returns {Promise} Promise with response data
   */
  submitQuestionnaireAnswer(answerData) {
    return apiClient
      .post("/questionnaires/answers", answerData, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.error("Error submitting questionnaire answer:", error);
        throw error;
      });
  },

  /**
   * Start a new application
   * @param {Object} applicationData - The application data containing year, isAmendment, and parentApplicationId
   * @returns {Promise} Promise with response data
   */
  startApplication(applicationData) {
    return apiClient
      .post("/applications/start", applicationData, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.error("Error starting application:", error);
        throw error;
      });
  },

  /**
   * Submit questionnaire response
   * @param {Object} submitData - The submit data containing responseId
   * @returns {Promise} Promise with response data
   */
  submitQuestionnaireResponse(submitData) {
    return apiClient
      .post("/questionnaires/responses/submit", submitData, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.error("Error submitting questionnaire:", error);
        throw error;
      });
  },

  /**
   * Mark chat messages as read
   * @param {Object} data - The data containing chatType and applicationId
   * @returns {Promise} Promise with response data
   */
  markChatAsRead(data) {
    return apiClient
      .post("/chats/read", data, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },

  /**
   * Get documents step data for a specific application
   * @param {string} applicationId - The application ID
   * @returns {Promise} Promise with documents step data
   */
  getDocumentsStepData(applicationId) {
    return apiClient
      .get(`/applications/${applicationId}/steps/documents`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },

  /**
   * Get agent activation step data for a specific application
   * @param {string} applicationId - The application ID
   * @returns {Promise} Promise with agent activation step data
   */
  getAgentActivationStepData(applicationId) {
    return apiClient
      .get(`/applications/${applicationId}/steps/agent_activation`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },

  /**
   * Get review step data for a specific application
   * @param {string} applicationId - The application ID
   * @returns {Promise} Promise with review step data
   */
  getReviewStepData(applicationId) {
    return apiClient
      .get(`/applications/${applicationId}/steps/review`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },

  /**
   * Get processing step data for a specific application
   * @param {string} applicationId - The application ID
   * @returns {Promise} Promise with processing step data
   */
  getProcessingStepData(applicationId) {
    return apiClient
      .get(`/applications/${applicationId}/steps/processing`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },

  /**
   * Get refund step data for a specific application
   * @param {string} applicationId - The application ID
   * @returns {Promise} Promise with refund step data
   */
  getRefundStepData(applicationId) {
    return apiClient
      .get(`/applications/${applicationId}/steps/refund`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },

  /**
   * Generic method to get step data for any step type
   * @param {string} applicationId - The application ID
   * @param {string} stepKey - The step key (documents, agent_activation, review, processing, refund)
   * @returns {Promise} Promise with step data
   */
  getStepData(applicationId, stepKey) {
    return apiClient
      .get(`/applications/${applicationId}/steps/${stepKey}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },

  /**
   * Request offline payment for an application
   * @param {string} applicationId - The application ID
   * @returns {Promise} Promise with offline payment request response
   */
  requestOfflinePayment(applicationId) {
    return apiClient
      .post(
        "/applications/payments/offline/request",
        { applicationId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },

  /**
   * Initiate payment checkout for an application
   * @param {string} applicationId - The application ID
   * @returns {Promise} Promise with checkout response
   */
  paymentCheckout(applicationId) {
    return apiClient
      .post(
        "/applications/payments/checkout",
        { applicationId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },

  /**
   * Get questionnaire data for a specific application
   * @param {string} applicationId - The application ID
   * @returns {Promise} Promise with questionnaire data
   */
  getQuestionnaireByApplicationId(applicationId) {
    return apiClient
      .get(`/questionnaires/applications/${applicationId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },

  /**
   * Check if documents are uploaded for a specific application
   * @param {string} applicationId - The application ID
   * @returns {Promise} Promise with documents upload status
   */
  checkDocumentsUploaded(applicationId) {
    return apiClient
      .post(`/applications/${applicationId}/check/documents_uploaded`, {})
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },

  /**
   * Submit a review for an application
   * @param {Object} reviewData - The review data containing applicationId, rating, and review
   * @returns {Promise} Promise with review submission response
   */
  submitReview(reviewData) {
    return apiClient
      .post("/applications/reviews", reviewData, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error;
      });
  },
};

export default ApplicationService;
