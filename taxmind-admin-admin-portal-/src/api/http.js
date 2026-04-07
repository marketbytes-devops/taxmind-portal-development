// Shared Axios instance with token handling and refresh logic (no fallback flags)
import axios from "axios";
import { API_BASE_URL } from "@/config/api";

const TOKEN_HEADER_NAME = process.env.VUE_APP_TOKEN_HEADER || "authorization";

// In-memory token/email holders (source of truth lives in localStorage to match current app)
let accessToken = localStorage.getItem("token") || null;
let refreshToken = localStorage.getItem("refresh_token") || null;
let adminEmail = localStorage.getItem("admin_email") || null;

export function setToken(token) {
  accessToken = token;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export function setRefreshToken(token) {
  refreshToken = token;
  if (token) localStorage.setItem("refresh_token", token);
  else localStorage.removeItem("refresh_token");
}

export function setAdminEmail(email) {
  adminEmail = email;
  if (email) localStorage.setItem("admin_email", email);
  else localStorage.removeItem("admin_email");
}

export function setAdminData(data) {
  if (data) localStorage.setItem("admin_data", JSON.stringify(data));
  else localStorage.removeItem("admin_data");
}

export function getAdminData() {
  const data = localStorage.getItem("admin_data");
  return data ? JSON.parse(data) : null;
}

export function getToken() {
  return accessToken;
}
export function getRefreshToken() {
  return refreshToken;
}
export function getAdminEmail() {
  return adminEmail;
}

// Clear all auth-related data (token, refreshToken, email) without touching other app keys
export function clearAuth() {
  accessToken = null;
  refreshToken = null;
  adminEmail = null;
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("admin_email");
  localStorage.removeItem("admin_data");
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// Attach token header (always send standard Authorization: Bearer <token>)
http.interceptors.request.use((config) => {
  // Always read fresh token from localStorage to ensure latest value
  const currentToken = localStorage.getItem("token") || accessToken;
  if (currentToken) {
    config.headers["Authorization"] = `Bearer ${currentToken}`;
    // Also add the custom header if it's different from authorization
    if (
      TOKEN_HEADER_NAME &&
      TOKEN_HEADER_NAME.toLowerCase() !== "authorization"
    ) {
      config.headers[TOKEN_HEADER_NAME] = `Bearer ${currentToken}`;
    }
  }

  // Platform identifier required by TAXMIND APIs
  if (!config.headers["x-origin"]) {
    config.headers["x-origin"] = "web";
  }
  return config;
});

// Single-flight refresh
let isRefreshing = false;
let pendingQueue = [];
let isLoggingOutOn498 = false;

function enqueueRequest(cb) {
  return new Promise((resolve, reject) => {
    pendingQueue.push({ resolve, reject, cb });
  });
}

function flushQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject, cb }) => {
    if (error) reject(error);
    else resolve(cb(token));
  });
  pendingQueue = [];
}

async function refreshTokenCall() {
  if (isRefreshing) {
    return enqueueRequest(() => accessToken);
  }
  if (!refreshToken) throw new Error("No refresh token available for refresh");

  try {
    isRefreshing = true;
    // Create a separate axios instance to avoid interceptor loops
    const refreshHttp = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000,
    });

    // Send refresh token in Authorization header with required platform header
    const resp = await refreshHttp.post(
      "/admins/auth/token/refresh",
      { email: adminEmail },
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          "x-origin": "web", // Required platform identifier per TAXMIND.json spec
        },
      }
    );

    // Validate response structure per TAXMIND.json specification
    if (!resp.data.success || !resp.data.data) {
      throw new Error("Invalid refresh response structure");
    }

    // Extract tokens from standardized response structure
    const newAccessToken = resp.data.data.accessToken;
    const newRefreshToken = resp.data.data.refreshToken;

    if (!newAccessToken) throw new Error("No access token in refresh response");

    // Update tokens
    setToken(newAccessToken);
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
    }

    // Update user data from refresh response
    if (resp.data.data.name || resp.data.data.email || resp.data.data.role) {
      setAdminData({
        name: resp.data.data.name,
        email: resp.data.data.email,
        role: resp.data.data.role,
      });
    }

    flushQueue(null, newAccessToken);
    return newAccessToken;
  } catch (err) {
    console.error("Token refresh failed:", err.message || err);
    flushQueue(err);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { config, response } = error || {};
    if (!response) return Promise.reject(error);

    // Do not log out on 403 Forbidden; bubble up so specific actions can handle RBAC errors without losing the session
    if (response.status === 403) {
      return Promise.reject(error);
    }

    // Immediate logout on 498 (custom token-expired / invalid token code)
    if (response.status === 498) {
      if (!isLoggingOutOn498) {
        isLoggingOutOn498 = true;
        try {
          clearAuth();
          if (typeof localStorage !== "undefined") {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("role");
          }
        } finally {
          if (typeof window !== "undefined" && window.location) {
            // Use replace so back button doesn't return to protected route
            window.location.replace("/Login");
          }
        }
      }
      return Promise.reject(error);
    }

    // Avoid infinite loop
    if (response.status === 401 && !config.__isRetryRequest) {
      try {
        const token = await refreshTokenCall();
        config.__isRetryRequest = true;
        config.headers["Authorization"] = `Bearer ${token}`;
        if (
          TOKEN_HEADER_NAME &&
          TOKEN_HEADER_NAME.toLowerCase() !== "authorization"
        ) {
          config.headers[TOKEN_HEADER_NAME] = `Bearer ${token}`;
        }
        return http(config);
      } catch (e) {
        // If refresh fails, log out globally
        if (!isLoggingOutOn498) {
          isLoggingOutOn498 = true;
          try {
            clearAuth();
            if (typeof localStorage !== "undefined") {
              localStorage.removeItem("isLoggedIn");
              localStorage.removeItem("role");
            }
          } finally {
            if (typeof window !== "undefined" && window.location) {
              window.location.replace("/Login");
            }
          }
        }
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default http;
