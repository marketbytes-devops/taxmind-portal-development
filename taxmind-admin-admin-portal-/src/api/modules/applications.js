// Applications API
import http from "../http";

/**
 * List applications with pagination and filters
 * @param {Object} params - Query parameters
 * @returns {Promise} - Promise resolving to the applications list
 */
export function listApplications(params = {}) {
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

  return http.get("/applications", {
    params: apiParams,
    headers: {
      Accept: "application/json",
    },
  });
}

/**
 * Get a specific application by ID
 * @param {string} applicationId - The application ID
 * @returns {Promise} - Promise resolving to the application details
 */
export function getApplication(applicationId) {
  return http.get(`/applications/${applicationId}`, {
    headers: {
      Accept: "application/json",
    },
  });
}

/**
 * Get documents for a specific application
 * @param {string} applicationId - The application ID
 * @returns {Promise} - Promise resolving to the application documents
 */
export function getApplicationDocuments(applicationId) {
  return http.get(`/applications/${applicationId}/documents`, {
    headers: {
      Accept: "application/json",
    },
  });
}

/**
 * Update application status
 * @param {string} applicationId - The application ID
 * @param {Object} statusData - The status update data
 * @returns {Promise} - Promise resolving to the updated application
 */
export function updateApplicationStatus(applicationId, statusData) {
  return http.put(`/applications/${applicationId}/status`, statusData, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}

/**
 * Get commission summary for an application
 * @param {string} applicationId - The application ID
 * @returns {Promise} - Promise resolving to the commission summary
 */
export function getCommissionSummary(applicationId) {
  return http.get(`/applications/${applicationId}/commission-summary`, {
    headers: {
      Accept: "application/json",
    },
  });
}

/**
 * List additional documents for an application
 * @param {string} applicationId - The application ID
 * @returns {Promise} - Promise resolving to the additional documents list
 */
export function listAdditionalDocuments(applicationId) {
  return http.get(`/applications/${applicationId}/additional-documents`, {
    headers: {
      Accept: "application/json",
    },
  });
}

/**
 * Request additional documents for an application
 * @param {string} applicationId - The application ID
 * @param {Object} requestData - The request data
 * @returns {Promise} - Promise resolving to the request result
 */
export function requestAdditionalDocuments(applicationId, requestData) {
  return http.post(
    `/applications/${applicationId}/additional-documents`,
    requestData,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Accept an additional document
 * @param {string} applicationId - The application ID
 * @param {string} documentId - The document ID
 * @returns {Promise} - Promise resolving to the acceptance result
 */
export function acceptAdditionalDocument(applicationId, documentId) {
  return http.put(
    `/applications/${applicationId}/additional-documents/${documentId}/accept`,
    {},
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
}

/**
 * Reject an additional document
 * @param {string} applicationId - The application ID
 * @param {string} documentId - The document ID
 * @param {Object} rejectionData - The rejection reason data
 * @returns {Promise} - Promise resolving to the rejection result
 */
export function rejectAdditionalDocument(
  applicationId,
  documentId,
  rejectionData
) {
  return http.put(
    `/applications/${applicationId}/additional-documents/${documentId}/reject`,
    rejectionData,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Accept an application document
 * @param {string} documentId - The document ID
 * @returns {Promise} - Promise resolving to the acceptance result
 */
export function acceptApplicationDocument(documentId) {
  return http.patch(
    `/applications/documents/${documentId}/status`,
    {
      status: "accepted",
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Reject an application document
 * @param {string} documentId - The document ID
 * @param {Object} rejectionData - The rejection reason data
 * @returns {Promise} - Promise resolving to the rejection result
 */
export function rejectApplicationDocument(documentId, rejectionData) {
  return http.patch(
    `/applications/documents/${documentId}/status`,
    {
      status: "rejected",
      rejectedReason: rejectionData.reason,
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Withdraw an application document
 * @param {string} documentId - The document ID
 * @returns {Promise} - Promise resolving to the withdrawal result
 */
export function withdrawApplicationDocument(documentId) {
  return http.patch(
    `/applications/documents/${documentId}/status`,
    {
      status: "withdrawn",
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
}

// Document Categories functions
export async function getDocumentCategories(params = {}) {
  // Ensure page and size are >= 1 as required by API

  const response = await http.get("/site-contents/document-categories", {
    params: params,
  });
  return response;
}

/**
 * Withdraw an additional document
 * @param {string} applicationId - The application ID
 * @param {string} documentId - The document ID
 * @returns {Promise} - Promise resolving to the withdrawal result
 */
export function withdrawAdditionalDocument(applicationId, documentId) {
  return http.put(
    `/applications/${applicationId}/additional-documents/${documentId}/withdraw`,
    {},
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
}

/**
 * Check if documents are uploaded for an application
 * @param {string} applicationId - The application ID
 * @returns {Promise} - Promise resolving to the check result
 */
export function checkDocumentsUploaded(applicationId) {
  return http.post(
    `/applications/${applicationId}/check/documents_uploaded`,
    {},
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Update application status to documents_uploaded
 * @param {string} applicationId - The application ID
 * @returns {Promise} - Promise resolving to the status update result
 */
export function updateApplicationDocumentsUploaded(applicationId) {
  return http.patch(
    `/applications/${applicationId}/status/documents_uploaded`,
    {},
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
}

export function updateApplicationReview(applicationId) {
  return http.patch(
    `/applications/${applicationId}/status/reviewed`,
    {},
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
}

/**
 * Calculate amounts for an application
 * @param {string} applicationId - The application ID
 * @param {Object} calculationData - The calculation data including refundAmount
 * @returns {Promise} - Promise resolving to the calculation result
 */
export function calculateAmount(applicationId, calculationData) {
  return http.post(`/applications/amounts/calculate`, calculationData, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}

/**
 * Update application status with calculation data
 * @param {string} applicationId - The application ID
 * @param {Object} updateData - The update data including status and refundAmount
 * @returns {Promise} - Promise resolving to the updated application
 */
export function updateApplicationStatusWithCalculation(
  applicationId,
  updateData
) {
  return http.put(`/applications/${applicationId}/status`, updateData, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}

/**
 * Submit amount calculation for an application
 * @param {Object} submitData - The submission data including applicationId, refundAmount, discountAmount
 * @returns {Promise} - Promise resolving to the submission result
 */
export function submitAmount(submitData) {
  return http.post(`/applications/amounts/submit`, submitData, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}

/**
 * Get notes for a specific application
 * @param {string} applicationId - The application ID
 * @returns {Promise} - Promise resolving to the application notes
 */
export function getNotes(applicationId) {
  return http.get(`/applications/${applicationId}/notes`, {
    headers: {
      Accept: "application/json",
    },
  });
}

/**
 * Add a note to an application
 * @param {Object} noteData - The note data including applicationId and note text
 * @returns {Promise} - Promise resolving to the created note
 */
export function addNote(noteData) {
  return http.post(`/applications/notes`, noteData, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}

/**
 * Get comments/messages for a specific application
 * @param {string} applicationId - The application ID
 * @returns {Promise} - Promise resolving to the application comments
 */
export function getComments(applicationId) {
  return http.get("/chats/messages", {
    headers: {
      Accept: "application/json",
    },
    params: {
      applicationId, // sent as ?applicationId=123
    },
  });
}

/**
 * Add a comment/message to an application
 * @param {Object} commentData - The comment data including applicationId and message text
 * @returns {Promise} - Promise resolving to the created comment
 */
export function addComment(commentData) {
  return http.post(`/applications/messages`, commentData, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}

/**
 * Download application document
 * @param {string} applicationId - The application ID
 * @returns {Promise} - Promise resolving to the downloadable file
 */
export function downloadApplication(applicationId) {
  return http.get(`/applications/${applicationId}/download`, {
    responseType: "blob",
    headers: {
      Accept: "application/pdf",
    },
  });
}

/**
 * Get questionnaire by application ID
 * @param {string} applicationId - The application ID
 * @returns {Promise} - Promise resolving to the questionnaire data
 */
export function getQuestionnaireByApplicationId(applicationId) {
  return http.get(`/questionnaires/responses/${applicationId}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Update questionnaire progress
 * @param {string} responseId - The response ID
 * @param {Object} progressData - The progress data to update
 * @returns {Promise} - Promise resolving to the update result
 */
export function updateQuestionnaireProgress(responseId, progressData) {
  return http.patch(`/questionnaires/responses/${responseId}`, progressData, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
export function submitQuestionnaireAnswer(answerData) {
  return http
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
}

export function submitQuestionnaireResponse(payload) {
  return http.post("/questionnaires/responses/submit", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Process a tax return document with Maya & AI
 * @param {string} applicationId - The application ID
 * @returns {Promise} - Promise resolving to the summary and masked file info
 */
export function processTaxReturn(applicationId) {
  return http.post(`/applications/${applicationId}/process-tax-return`, {}, {
    headers: {
      Accept: "application/json",
    },
    timeout: 300000, // 5 minutes for document processing
  });
}

/**
 * Finalize and confirm a tax return summary
 * @param {string} applicationId - The application ID
 * @param {Object} confirmData - The finalized summary
 * @returns {Promise} - Promise resolving to the confirmation result
 */
export function confirmTaxReturn(applicationId, confirmData) {
  return http.post(`/applications/${applicationId}/confirm-tax-return`, confirmData, {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 300000, // 5 minutes for processing/emailing
  });
}

/**
 * Manually mark an application's payment as completed
 * @param {string} applicationId - The application ID
 * @returns {Promise} - Promise resolving to the result
 */
export function markPaymentAsCompleted(applicationId) {
  return http.post(
    `/applications/payments/manual-complete`,
    { applicationId },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
