import http from "../http";

/**
 * Approve an offline payment request
 * @param {Object} data - Payment approval data
 * @param {string} data.offlinePaymentRequestId - ID of the payment request to approve
 * @param {string} data.paymentMethod - Payment method (cash, bank_transfer, etc)
 * @param {string} data.transactionId - Transaction ID for the payment
 * @returns {Promise} - API response
 */
export function approveOfflinePayment(data) {
  return http.post("applications/payments/offline/request/approve", data, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}

/**
 * Reject an offline payment request
 * @param {Object} data - Payment rejection data
 * @param {string} data.offlinePaymentRequestId - ID of the payment request to reject
 * @param {string} data.rejectionReason - Required reason for rejection
 * @param {string} [data.rejectionCategory] - Optional category for rejection
 * @returns {Promise} - API response
 */
export function rejectOfflinePayment(data) {
  // Transform the data to match the API requirements
  const apiData = {
    offlinePaymentRequestId: data.offlinePaymentRequestId,
    rejectionReason: data.reason || data.rejectionReason,
    rejectionCategory: data.rejectionCategory,
  };

  // Remove null or undefined values
  Object.keys(apiData).forEach((key) => {
    if (apiData[key] === null || apiData[key] === undefined) {
      delete apiData[key];
    }
  });

  return http.post("applications/payments/offline/request/reject", apiData, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}

export function listcompleted(params = {}) {
  // Transform parameters to match TAXMIND API
  const apiParams = {
    page: params.page || 1, // Keep 1-based indexing as API expects page >= 1
    size: params.limit || 20,
    search: params.keyword || null,
    startDate: params.startDate || null,
    endDate: params.endDate || null,
    sortBy: params.sortBy || "updatedAt",
    orderBy: params.orderBy || "desc",
  };

  // Remove null/undefined parameters
  Object.keys(apiParams).forEach((key) => {
    if (apiParams[key] === null || apiParams[key] === undefined) {
      delete apiParams[key];
    }
  });

  return http.get("applications/payments/completed", {
    params: apiParams,
    headers: {
      Accept: "application/json",
    },
  });
}

export function listpending(params = {}) {
  // Transform parameters to match TAXMIND API
  const apiParams = {
    page: params.page || 1, // Keep 1-based indexing as API expects page >= 1
    size: params.limit || 20,
    search: params.keyword || null,
    startDate: params.startDate || null,
    endDate: params.endDate || null,
    sortBy: params.sortBy || "updatedAt",
    orderBy: params.orderBy || "desc",
  };

  // Remove null/undefined parameters
  Object.keys(apiParams).forEach((key) => {
    if (apiParams[key] === null || apiParams[key] === undefined) {
      delete apiParams[key];
    }
  });

  return http.get("applications/payments/offline/request/pending", {
    params: apiParams,
    headers: {
      Accept: "application/json",
    },
  });
}

export function listrejected(params = {}) {
  // Transform parameters to match TAXMIND API
  const apiParams = {
    page: params.page || 1, // Keep 1-based indexing as API expects page >= 1
    size: params.limit || 20,
    search: params.keyword || null,
    startDate: params.startDate || null,
    endDate: params.endDate || null,
    sortBy: params.sortBy || "updatedAt",
    orderBy: params.orderBy || "desc",
  };

  // Remove null/undefined parameters
  Object.keys(apiParams).forEach((key) => {
    if (apiParams[key] === null || apiParams[key] === undefined) {
      delete apiParams[key];
    }
  });

  return http.get("applications/payments/offline/request/rejected", {
    params: apiParams,
    headers: {
      Accept: "application/json",
    },
  });
}

export function listPendingPayments(params = {}) {
  // Transform parameters to match TAXMIND API
  const apiParams = {
    page: params.page || 1, // Keep 1-based indexing as API expects page >= 1
    size: params.limit || 20,
    search: params.keyword || null,
    paymentStatus: "pending",
  };

  // Remove null/undefined parameters
  Object.keys(apiParams).forEach((key) => {
    if (apiParams[key] === null || apiParams[key] === undefined) {
      delete apiParams[key];
    }
  });

  return http.get("applications/all", {
    params: apiParams,
    headers: {
      Accept: "application/json",
    },
  });
}
