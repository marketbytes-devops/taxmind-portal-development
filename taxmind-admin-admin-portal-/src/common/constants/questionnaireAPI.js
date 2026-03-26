/**
 * Questionnaire Module - API Endpoints and Configuration
 * TaxMind Admin Portal
 */

export const QUESTIONNAIRE_API = {
  // Base endpoints
  BASE_URL: "/v1/admin/questionnaire",

  // Specific endpoints
  LIST: "/v1/admin/questionnaire/list",
  CREATE: "/v1/admin/questionnaire/create",
  UPDATE: "/v1/admin/questionnaire/update",
  DELETE: "/v1/admin/questionnaire/delete",
  GET_BY_ID: "/v1/admin/questionnaire",

  // HTTP Methods
  METHODS: {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    DELETE: "DELETE",
  },
};

// API Response timeout
export const API_TIMEOUT = 10000;

// Default headers factory
export const getDefaultHeaders = () => ({
  authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export default QUESTIONNAIRE_API;
