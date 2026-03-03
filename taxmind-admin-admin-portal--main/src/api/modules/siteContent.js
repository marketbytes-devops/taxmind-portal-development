// Site Content API module
import http from "../http";

/**
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (0-based)
 * @param {number} params.size - Page size
 * @returns {Promise} API response with policies list
 */
export async function listPolicies(params = {}) {
  try {
    // Ensure page and size are >= 1 as required by API
    const apiParams = {
      ...params,
      ...(params.page !== undefined && { page: Math.max(1, params.page) }),
      ...(params.size !== undefined && { size: Math.max(1, params.size) }),
    };
    const response = await http.get("/site-contents/policies", {
      params: apiParams,
    });
    return {
      success: response?.data?.success === true,
      data: response?.data?.data || [],
      metadata: response?.data?.metadata || { page: 1, size: 10, total: 0 },
      message: response?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      metadata: { page: 1, size: 10, total: 0 },
      message: error?.response?.data?.message || "Failed to fetch policies",
    };
  }
}

/**
 * @param {string} policyId - The ID of the policy
 * @returns {Promise} API response with policy details
 */
export async function getPolicy(policyId) {
  try {
    const response = await http.get(`/site-contents/policies/${policyId}`);
    return {
      success: response?.data?.success === true,
      data: response?.data?.data || null,
      message: response?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error?.response?.data?.message || "Failed to fetch policy",
    };
  }
}

/**
 * @param {Object} policyData - Policy data
 * @param {string} policyData.type - Policy type (e.g., "privacy_policy")
 * @param {string} policyData.content - Policy content (HTML)
 * @returns {Promise} API response with created policy
 */
export async function createPolicy(policyData) {
  try {
    const response = await http.post("/site-contents/policies", policyData);
    return {
      success: response?.data?.success === true,
      data: response?.data?.data || null,
      message: response?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error?.response?.data?.message || "Failed to create policy",
    };
  }
}

/**
 * @param {string} policyId - The ID of the policy to update
 * @param {Object} policyData - Updated policy data
 * @param {string} policyData.type - Policy type (e.g., "privacy_policy")
 * @param {string} policyData.content - Policy content (HTML)
 * @returns {Promise} API response with updated policy
 */
export async function updatePolicy(policyId, policyData) {
  try {
    const response = await http.put(
      `/site-contents/policies/${policyId}`,
      policyData
    );
    return {
      success: response?.data?.success === true,
      data: response?.data?.data || null,
      message: response?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error?.response?.data?.message || "Failed to update policy",
    };
  }
}

/**
 * @param {string} policyId - The ID of the policy to delete
 * @returns {Promise} API response
 */
export async function deletePolicy(policyId) {
  try {
    const response = await http.delete(`/site-contents/policies/${policyId}`);
    return {
      success: response?.data?.success === true,
      message: response?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to delete policy",
    };
  }
}

// Tax Credits functions - Enhanced for TAXMIND.json API
export async function listTaxCredits(params = {}) {
  try {
    // Ensure page and size are >= 1 as required by API
    const apiParams = {
      ...params,
      ...(params.page !== undefined && { page: Math.max(1, params.page) }),
      ...(params.size !== undefined && { size: Math.max(1, params.size) }),
    };
    const response = await http.get("/site-contents/tax-credits", {
      params: apiParams,
    });
    return {
      success: true,
      data: response.data.data || [],
      metadata: response.data.metadata || { page: 1, size: 10, total: 0 },
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching tax credits:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch tax credits",
      error,
    };
  }
}

export async function getTaxCredit(taxCreditId) {
  try {
    const response = await http.get(
      `/site-contents/tax-credits/${taxCreditId}`
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching tax credit:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch tax credit",
      error,
    };
  }
}

export async function createTaxCredit(taxCreditData) {
  try {
    const response = await http.post(
      "/site-contents/tax-credits",
      taxCreditData
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating tax credit:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create tax credit",
      error,
    };
  }
}

export async function updateTaxCredit(taxCreditId, taxCreditData) {
  try {
    const response = await http.put(
      `/site-contents/tax-credits/${taxCreditId}`,
      taxCreditData
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error updating tax credit:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update tax credit",
      error,
    };
  }
}

export async function deleteTaxCredit(taxCreditId) {
  try {
    const response = await http.delete(
      `/site-contents/tax-credits/${taxCreditId}`
    );
    return {
      success: true,
      message: response.data.message || "Tax credit deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting tax credit:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete tax credit",
      error,
    };
  }
}

// New uploadTaxCreditIcon function using secure upload workflow
export async function uploadTaxCreditIcon(file) {
  try {
    // Step 1: Request upload URL
    const uploadRequest = await http.post("/files/request-upload", {
      type: "tax_credit_icon",
      filename: file.name,
    });

    if (!uploadRequest.data.success) {
      throw new Error(
        uploadRequest.data.message || "Failed to request upload URL"
      );
    }

    // Step 2: Upload file to provided URL
    const formData = new FormData();

    // Add any required fields from the upload request
    Object.keys(uploadRequest.data.data.fields || {}).forEach((key) => {
      formData.append(key, uploadRequest.data.data.fields[key]);
    });

    formData.append("file", file);

    const uploadResponse = await fetch(uploadRequest.data.data.uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    return {
      success: true,
      iconUrl: uploadRequest.data.data.finalUrl,
      message: "Icon uploaded successfully",
    };
  } catch (error) {
    console.error("Error uploading tax credit icon:", error);
    return {
      success: false,
      message: error.message || "Failed to upload tax credit icon",
      error,
    };
  }
}

// Site Configuration functions - Updated for TAXMIND.json API
export async function getSiteConfig() {
  try {
    const response = await http.get("/site-contents/config");
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching site configuration:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch site configuration",
      error,
    };
  }
}

export async function updateSiteConfig(configData) {
  try {
    // Validate required fields
    if (!configData || Object.keys(configData).length === 0) {
      throw new Error("Configuration data is required");
    }

    const response = await http.patch("/site-contents/config", configData);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error updating site configuration:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to update site configuration",
      error,
    };
  }
}

// Social Media functions - Based on TAXMIND.json API
export async function listSocialMedia(params = {}) {
  try {
    const response = await http.get("/site-contents/social-media", {
      params,
    });
    return {
      success: true,
      data: response.data.data || [],
      metadata: response.data.metadata || null,
      message: response.data.message || "Social media links retrieved",
    };
  } catch (error) {
    console.error("Error fetching social media links:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch social media links",
      error,
    };
  }
}

export async function createSocialMediaLink(payload) {
  try {
    const response = await http.post("/site-contents/social-media", payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Social media link created",
    };
  } catch (error) {
    console.error("Error creating social media link:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to create social media link",
      error,
    };
  }
}

export async function updateSocialMediaLink(id, payload) {
  try {
    if (!id) throw new Error("Social media id is required");
    const response = await http.put(
      `/site-contents/social-media/${id}`,
      payload
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Social media link updated",
    };
  } catch (error) {
    console.error("Error updating social media link:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to update social media link",
      error,
    };
  }
}

export async function deleteSocialMediaLink(id) {
  try {
    if (!id) throw new Error("Social media id is required");
    const response = await http.delete(`/site-contents/social-media/${id}`);
    return {
      success: true,
      message: response.data.message || "Social media link deleted",
    };
  } catch (error) {
    console.error("Error deleting social media link:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to delete social media link",
      error,
    };
  }
}

// About Us functions - Using site configuration API
export async function getAboutUsContent() {
  try {
    const result = await getSiteConfig();

    if (result.success) {
      return {
        success: true,
        data: {
          content: result.data.aboutUsContent || "",
        },
        message: "About Us content retrieved successfully",
      };
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error fetching About Us content:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch About Us content",
      error,
    };
  }
}

export async function updateAboutUsContent(content) {
  try {
    // Use partial update to only update aboutUsContent
    const result = await updateSiteConfig({
      aboutUsContent: content,
    });

    if (result.success) {
      return {
        success: true,
        data: {
          content: result.data.aboutUsContent,
        },
        message: result.message || "About Us content updated successfully",
      };
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error updating About Us content:", error);
    return {
      success: false,
      message: error.message || "Failed to update About Us content",
      error,
    };
  }
}

// Query Categories functions
export async function getQueryCategories(params = {}) {
  // Ensure page and size are >= 1 as required by API
  const apiParams = {
    ...params,
    ...(params.page !== undefined && { page: Math.max(1, params.page) }),
    ...(params.size !== undefined && { size: Math.max(1, params.size) }),
  };
  const response = await http.get("/site-contents/query-categories", {
    params: apiParams,
  });
  return response;
}

export async function createQueryCategory(categoryData) {
  const response = await http.post(
    "/site-contents/query-categories",
    categoryData
  );
  return response;
}

export async function updateQueryCategory(categoryId, categoryData) {
  const response = await http.put(
    `/site-contents/query-categories/${categoryId}`,
    categoryData
  );
  return response;
}

export async function deleteQueryCategory(categoryId) {
  const response = await http.delete(
    `/site-contents/query-categories/${categoryId}`
  );
  return response;
}

// Document Categories functions
export async function getDocumentCategories(params = {}) {
  // Ensure page and size are >= 1 as required by API
  const apiParams = {
    ...params,
    ...(params.page !== undefined && { page: Math.max(1, params.page) }),
    ...(params.size !== undefined && { size: Math.max(1, params.size) }),
  };
  const response = await http.get("/site-contents/document-categories", {
    params: apiParams,
  });
  return response;
}

export async function createDocumentCategory(categoryData) {
  const response = await http.post(
    "/site-contents/document-categories",
    categoryData
  );
  return response;
}

export async function updateDocumentCategory(categoryId, categoryData) {
  const response = await http.put(
    `/site-contents/document-categories/${categoryId}`,
    categoryData
  );
  return response;
}

export async function deleteDocumentCategory(categoryId) {
  const response = await http.delete(
    `/site-contents/document-categories/${categoryId}`
  );
  return response;
}

// Document Templates functions
export async function getDocumentTemplates(params = {}) {
  // Ensure page and size are >= 1 as required by API
  const apiParams = {
    ...params,
    ...(params.page !== undefined && { page: Math.max(1, params.page) }),
    ...(params.size !== undefined && { size: Math.max(1, params.size) }),
  };
  const response = await http.get("/site-contents/document-templates", {
    params: apiParams,
  });
  return response;
}

export async function createDocumentTemplate(templateData) {
  const response = await http.post(
    "/site-contents/document-templates",
    templateData
  );
  return response;
}

export async function updateDocumentTemplate(templateId, templateData) {
  const response = await http.put(
    `/site-contents/document-templates/${templateId}`,
    templateData
  );
  return response;
}

export async function deleteDocumentTemplate(templateId) {
  const response = await http.delete(
    `/site-contents/document-templates/${templateId}`
  );
  return response;
}

export async function uploadDocumentTemplate(formData) {
  const response = await http.post(
    "/site-contents/document-templates/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response;
}

// FAQs functions
export async function getFaqs(params = {}) {
  try {
    // Ensure page and size are >= 1 as required by API
    const apiParams = {
      ...params,
      ...(params.page !== undefined && { page: Math.max(1, params.page) }),
      ...(params.size !== undefined && { size: Math.max(1, params.size) }),
    };
    const response = await http.get("/site-contents/faqs", {
      params: apiParams,
    });

    // Normalize response shape
    const raw = response?.data || {};
    const rawData = raw.data;
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.faqs)
      ? rawData.faqs
      : [];
    const total = raw.metadata?.total ?? rawData?.total ?? list.length ?? 0;
    const metadata = raw.metadata || {
      page: apiParams.page || 1,
      size: apiParams.size || 10,
      total,
    };

    return {
      success: true,
      data: list,
      metadata,
      message: raw.message,
    };
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch FAQs",
      error,
    };
  }
}

export async function getFaq(faqId) {
  try {
    const response = await http.get(`/site-contents/faqs/${faqId}`);
    return {
      success: true,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error("Error fetching FAQ:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch FAQ",
      error,
    };
  }
}

export async function createFaq(faqData) {
  try {
    const response = await http.post("/site-contents/faqs", faqData);
    return {
      success: true,
      data: response.data?.data,
      message: response.data?.message || "FAQ created successfully",
    };
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create FAQ",
      error,
    };
  }
}

export async function updateFaq(faqId, faqData) {
  try {
    const response = await http.put(`/site-contents/faqs/${faqId}`, faqData);
    return {
      success: true,
      data: response.data?.data,
      message: response.data?.message || "FAQ updated successfully",
    };
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update FAQ",
      error,
    };
  }
}

export async function deleteFaq(faqId) {
  try {
    const response = await http.delete(`/site-contents/faqs/${faqId}`);
    return {
      success: true,
      message: response.data?.message || "FAQ deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete FAQ",
      error,
    };
  }
}

// Carousel functions - Updated for TAXMIND.json API specification
export async function listCarouselImages(params = {}) {
  try {
    // Ensure page and size are >= 1 as required by API
    const apiParams = {
      page: Math.max(1, params.page || 1),
      size: Math.max(1, params.size || 10),
      ...params,
    };
    const response = await http.get("/site-contents/carousel-images", {
      params: apiParams,
    });
    return {
      success: true,
      data: response.data.data || [],
      metadata: response.data.metadata || { page: 1, size: 10, total: 0 },
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching carousel images:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch carousel images",
      error,
    };
  }
}

export async function deleteCarouselImage(imageId) {
  try {
    if (!imageId) {
      throw new Error("Image ID is required");
    }
    const response = await http.delete(
      `/site-contents/carousel-images/${imageId}`
    );
    return {
      success: true,
      message: response.data.message || "Carousel image deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting carousel image:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to delete carousel image",
      error,
    };
  }
}

// New file upload workflow based on TAXMIND.json
export async function requestCarouselImageUpload(filename) {
  try {
    if (!filename) {
      throw new Error("Filename is required");
    }
    const response = await http.post("/files/request-upload", {
      type: "carousel_image",
      filename,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error requesting upload URL:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to request upload URL",
      error,
    };
  }
}

// Upload file to S3 using pre-signed URL
export async function uploadFileToS3(uploadUrl, file) {
  try {
    // Send file directly as blob instead of multipart form data
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return {
      success: true,
      message: "File uploaded successfully",
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    return {
      success: false,
      message: error.message || "Failed to upload file",
      error,
    };
  }
}

// Complete carousel image upload process
export async function uploadCarouselImage(file) {
  try {
    // Step 1: Request upload URL
    const uploadRequest = await requestCarouselImageUpload(file.name);
    if (!uploadRequest.success) {
      return uploadRequest;
    }

    // Step 2: Upload file to provided URL
    const uploadResult = await uploadFileToS3(
      uploadRequest.data.presignedUrl,
      file,
      uploadRequest.data.fields
    );

    if (!uploadResult.success) {
      return uploadResult;
    }

    return {
      success: true,
      message: "Carousel image uploaded successfully",
      data: {
        fileId: uploadRequest.data.fileId,
        filename: file.name,
      },
    };
  } catch (error) {
    console.error("Error in complete upload process:", error);
    return {
      success: false,
      message: error.message || "Failed to upload carousel image",
      error,
    };
  }
}

// Legacy functions kept for backward compatibility (DEPRECATED)
export async function createCarouselImage(imageData) {
  console.warn(
    "createCarouselImage is deprecated, use uploadCarouselImage instead"
  );
  const response = await http.post("/site-contents/carousel", imageData);
  return response;
}

export async function updateCarouselContent(contentData) {
  console.warn(
    "updateCarouselContent is deprecated, use updateSiteConfig instead"
  );
  const response = await http.put(
    "/site-contents/carousel/content",
    contentData
  );
  return response;
}

// Default export with all functions
export default {
  // Policies functions
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  // Tax Credits functions
  listTaxCredits,
  getTaxCredit,
  createTaxCredit,
  updateTaxCredit,
  deleteTaxCredit,
  uploadTaxCreditIcon,
  // Site Configuration functions
  getSiteConfig,
  updateSiteConfig,
  // Social Media functions
  listSocialMedia,
  createSocialMediaLink,
  updateSocialMediaLink,
  deleteSocialMediaLink,
  // About Us functions
  getAboutUsContent,
  updateAboutUsContent,
  // Query Categories functions
  getQueryCategories,
  createQueryCategory,
  updateQueryCategory,
  deleteQueryCategory,
  // Document Categories functions
  getDocumentCategories,
  createDocumentCategory,
  updateDocumentCategory,
  deleteDocumentCategory,
  // Document Templates functions
  getDocumentTemplates,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  uploadDocumentTemplate,
  // FAQs functions
  getFaqs,
  getFaq,
  createFaq,
  updateFaq,
  deleteFaq,
  // Carousel functions - Updated for TAXMIND.json API
  listCarouselImages,
  deleteCarouselImage,
  requestCarouselImageUpload,
  uploadFileToS3,
  uploadCarouselImage,
  // Legacy functions (deprecated)
  createCarouselImage,
  updateCarouselContent,
};
