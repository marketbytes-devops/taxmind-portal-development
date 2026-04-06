// Central API configuration
// Single source of truth for base endpoints.

// production base url
// const RAW_BASE = 'https:api.taxmind.ie';

// dev base url
const RAW_BASE = process.env.VUE_APP_API_BASE_URL || "";

const RAW_SOCKET = process.env.VUE_APP_SOCKET_URL || "";
// Normalize: remove trailing slash
export const API_BASE_URL = RAW_BASE.replace(/\/$/, "");
export const SOCKET_URL = RAW_SOCKET.replace(/\/$/, "");
export const MEDIA_BASE_URL = API_BASE_URL; // adjust if media served elsewhere later

export function buildFileUrl(key) {
  return `${API_BASE_URL}/file/get?key=${encodeURIComponent(key)}`;
}

export function buildMediaUrl(key) {
  return `${MEDIA_BASE_URL}/wp?key=${encodeURIComponent(key)}`;
}
