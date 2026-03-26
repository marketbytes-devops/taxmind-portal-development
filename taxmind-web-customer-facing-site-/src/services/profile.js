// Profile service for TaxMind Client WebApp
// Handles profile-related API calls including chat messages

import axios from "axios";

/**
 * Get initial chat messages list
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of messages to fetch
 * @param {number} params.page - Page number
 * @returns {Promise} API response
 */
export const getChatMessages = async (params = {}) => {
  try {
    const token = localStorage.getItem("accesstoken");
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios({
      url: "/chats/messages",
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      params: {
        limit: params.limit || 20,
        page: params.page || 1,
        ...params
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    throw error;
  }
};

/**
 * Get user profile data
 * @returns {Promise} API response
 */
export const getProfileData = async () => {
  try {
    const token = localStorage.getItem("accesstoken");
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios({
      method: "GET",
      url: "/users/profile",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  }
};

/**
 * Send chat message via API (fallback when socket is not available)
 * @param {Object} messageData - Message data
 * @param {string} messageData.text - Message text
 * @param {File} messageData.file - File attachment (optional)
 * @param {string} messageData.messageType - Message type (TEXT/FILE)
 * @returns {Promise} API response
 */
export const sendChatMessage = async (messageData) => {
  try {
    const token = localStorage.getItem("accesstoken");
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    const formData = new FormData();
    formData.append("text", messageData.text || "");
    
    if (messageData.file) {
      formData.append("file", messageData.file);
    }
    
    formData.append("messageType", messageData.messageType || "TEXT");

    const response = await axios({
      url: "/user/chat/send",
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

// Default export with all profile-related functions
const profileService = {
  getChatMessages,
  getProfileData,
  sendChatMessage,
};

export default profileService;
