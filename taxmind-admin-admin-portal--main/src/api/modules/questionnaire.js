// Questionnaire API - Full implementation based on TAXMIND.json
import http from "../http";

// Utility to clean null/undefined from params
function cleanParams(obj = {}) {
  const out = { ...obj };
  Object.keys(out).forEach((k) => {
    if (out[k] === null || out[k] === undefined || out[k] === "") delete out[k];
  });
  return out;
}

// 1) Questionnaires
export async function listQuestionnaires(params = {}) {
  try {
    const apiParams = cleanParams({
      taxYear: params.taxYear,
      status: params.status, // 'draft' | 'published'
      page: params.page ?? 1, // normalize to 1-based in UI
      size: params.limit ?? 20,
    });
    const resp = await http.get("/questionnaires", { params: apiParams });
    return {
      success: resp?.data?.success === true,
      data: resp?.data?.data || [],
      metadata: resp?.data?.metadata || { page: 1, size: 20, total: 0 },
      message: resp?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      metadata: { page: 1, size: 20, total: 0 },
      message:
        error?.response?.data?.message || "Failed to fetch questionnaires",
      error,
    };
  }
}

export async function createQuestionnaire({ taxYear }) {
  try {
    if (!taxYear) throw new Error("taxYear is required");
    const resp = await http.post("/questionnaires", { taxYear });
    return {
      success: resp?.data?.success === true,
      data: resp?.data?.data || null,
      message: resp?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message || "Failed to create questionnaire",
      error,
    };
  }
}

export async function getQuestionnaire(id) {
  try {
    if (!id) throw new Error("questionnaire id is required");
    const resp = await http.get(`/questionnaires/${id}`);
    return {
      success: resp?.data?.success === true,
      data: resp?.data?.data || null,
      message: resp?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message || "Failed to fetch questionnaire",
      error,
    };
  }
}

export async function publishQuestionnaire(id) {
  try {
    if (!id) throw new Error("questionnaire id is required");
    const resp = await http.post(`/questionnaires/${id}/publish`);
    const respData = resp?.data || {};
    const message =
      respData?.message ||
      respData?.error ||
      (typeof respData === "string" ? respData : JSON.stringify(respData)) ||
      "";

    return {
      success: respData?.success === true,
      data: respData?.data || null,
      message,
    };
  } catch (error) {
    const respErrData = error?.response?.data;
    const message =
      respErrData?.message ||
      respErrData?.error ||
      (typeof respErrData === "string"
        ? respErrData
        : JSON.stringify(respErrData)) ||
      error?.message ||
      "Failed to publish questionnaire";

    return {
      success: false,
      data: null,
      message,
      error,
    };
  }
}

export async function deleteQuestionnaire(id) {
  try {
    if (!id) throw new Error("questionnaire id is required");
    const resp = await http.delete(`/questionnaires/${id}`);
    return {
      success: resp?.data?.success === true,
      message: resp?.data?.message || "Questionnaire deleted",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error?.response?.data?.message || "Failed to delete questionnaire",
      error,
    };
  }
}

export async function importQuestionnaire({ importFromTaxYear, taxYear }) {
  try {
    if (!importFromTaxYear) throw new Error("importFromTaxYear is required");
    if (!taxYear) throw new Error("taxYear is required");
    const resp = await http.post("/questionnaires/import", {
      importFromTaxYear,
      taxYear,
    });
    return {
      success: resp?.data?.success === true,
      data: resp?.data?.data || null,
      message: resp?.data?.message || "",
    };
  } catch (error) {
    console.log("🔍 Import API Error:", error);

    // If the import endpoint returns 404 or is not implemented, provide detailed error info
    if (error?.response?.status === 404) {
      console.log(
        "⚠️ Import endpoint not found (404) - this may be expected if not implemented yet"
      );
    }

    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message || error?.response?.status === 404
          ? "Import endpoint not implemented yet"
          : "Failed to import questionnaire",
      error,
    };
  }
}

// 2) Categories
export async function listCategories(questionnaireId) {
  try {
    if (!questionnaireId) throw new Error("questionnaireId is required");
    const resp = await http.get(`/questionnaires/${questionnaireId}`);

    // Extract questionnaire data and categories
    const questionnaireData = resp?.data?.data || {};
    const categories = questionnaireData.questionCategories || [];

    return {
      success: resp?.data?.success === true,
      data: categories,
      questionnaire: {
        id: questionnaireData.id,
        title: questionnaireData.title,
        taxYear: questionnaireData.taxYear,
        status: questionnaireData.status,
        version: questionnaireData.version,
        description: questionnaireData.description,
      },
      message: resp?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      questionnaire: null,
      message:
        error?.response?.data?.message || "Failed to fetch question categories",
      error,
    };
  }
}

export async function listAllCategories() {
  try {
    const resp = await http.get("/questionnaires/categories");
    return {
      success: resp?.data?.success === true,
      data: resp?.data?.data || [],
      message: resp?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: error?.response?.data?.message || "Failed to fetch categories",
      error,
    };
  }
}

export async function createCategory(payload) {
  try {
    // Categories can be global or linked to a questionnaire
    const name = payload?.name || payload?.categoryName;
    if (!name) throw new Error("name is required to create category");

    const requestPayload = { name };

    // Include questionnaireId if provided
    if (payload?.questionnaireId) {
      requestPayload.questionnaireId = payload.questionnaireId;
    }

    // Include sortOrder if provided, otherwise default to 0
    if (payload?.sortOrder !== undefined && payload?.sortOrder !== null) {
      requestPayload.sortOrder = payload.sortOrder;
    } else {
      requestPayload.sortOrder = 0;
    }

    console.log("📤 API createCategory sending payload:", requestPayload);

    const resp = await http.post("/questionnaires/categories", requestPayload);
    return {
      success: resp?.data?.success === true,
      data: resp?.data?.data || null,
      message: resp?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message || "Failed to create question category",
      error,
    };
  }
}

export async function updateCategory(categoryId, payload) {
  try {
    if (!categoryId) throw new Error("categoryId is required");
    const resp = await http.patch(
      `/questionnaires/categories/${categoryId}`,
      payload
    );
    return {
      success: resp?.data?.success === true,
      data: resp?.data?.data || null,
      message: resp?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message || "Failed to update question category",
      error,
    };
  }
}

export async function deleteCategory(categoryId) {
  try {
    if (!categoryId) throw new Error("categoryId is required");
    const resp = await http.delete(`/questionnaires/categories/${categoryId}`);
    return {
      success: resp?.data?.success === true,
      message: resp?.data?.message || "Question category deleted",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error?.response?.data?.message || "Failed to delete question category",
      error,
    };
  }
}

// 3) Questions
export async function listQuestions(categoryId) {
  try {
    if (!categoryId) throw new Error("categoryId is required");
    const resp = await http.get(
      `/questionnaires/categories/${categoryId}/questions`
    );
    return {
      success: resp?.data?.success === true,
      data: resp?.data?.data || [],
      message: resp?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: error?.response?.data?.message || "Failed to fetch questions",
      error,
    };
  }
}

export async function createQuestion(payload) {
  try {
    if (!payload?.categoryId) throw new Error("categoryId is required");
    if (!payload?.questionText) throw new Error("questionText is required");
    if (!payload?.questionType) throw new Error("questionType is required");
    const resp = await http.post("/questionnaires/questions", payload);
    return {
      success: resp?.data?.success === true,
      data: resp?.data?.data || null,
      message: resp?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      // Prefer backend 'message' then 'error' fields when available
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to create question",
      error,
    };
  }
}

export async function updateQuestion(questionId, payload) {
  try {
    if (!questionId) throw new Error("questionId is required");
    const resp = await http.patch(
      `/questionnaires/questions/${questionId}`,
      payload
    );
    return {
      success: resp?.data?.success === true,
      data: resp?.data?.data || null,
      message: resp?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      // Prefer backend 'message' then 'error' fields when available
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update question",
      error,
    };
  }
}

export async function getQuestion(questionId) {
  try {
    if (!questionId) throw new Error("questionId is required");
    const resp = await http.get(`/questionnaires/questions/${questionId}`);
    return {
      success: resp?.data?.success === true,
      data: resp?.data?.data || null,
      message: resp?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error?.response?.data?.message || "Failed to fetch question",
      error,
    };
  }
}

export async function deleteQuestion(questionId) {
  try {
    if (!questionId) throw new Error("questionId is required");
    const resp = await http.delete(`/questionnaires/questions/${questionId}`);
    return {
      success: resp?.data?.success === true,
      message: resp?.data?.message || "Question deleted",
    };
  } catch (error) {
    return {
      success: false,
      message: error?.response?.data?.error || "Failed to delete question",
      error,
    };
  }
}

// 4) Admin Responses (optional for list page; included for completeness)
export async function listQuestionnaireResponses(params = {}) {
  try {
    const apiParams = cleanParams({
      page: params.page ?? 1,
      size: params.limit ?? 20,
      keyword: params.keyword,
      status: params.status, // draft|submitted|...
    });
    const resp = await http.get("/questionnaires/responses", {
      params: apiParams,
    });
    return {
      success: resp?.data?.success === true,
      data: resp?.data?.data || [],
      metadata: resp?.data?.metadata || { page: 1, size: 20, total: 0 },
      message: resp?.data?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      metadata: { page: 1, size: 20, total: 0 },
      message:
        error?.response?.data?.message ||
        "Failed to fetch questionnaire responses",
      error,
    };
  }
}
