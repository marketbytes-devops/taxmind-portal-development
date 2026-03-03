// Chat API helpers - standardized return shape
import http from "@/api/http";

function ok(result, fallback = []) {
  return {
    success: result?.data?.success === true,
    data: result?.data?.data ?? fallback,
    metadata: result?.data?.metadata ?? { page: 1, size: 20, total: 0 },
    message: result?.data?.message || "",
  };
}

function fail(error, fallbackMessage) {
  return {
    success: false,
    data: [],
    metadata: { page: 1, size: 20, total: 0 },
    message: error?.response?.data?.message || fallbackMessage,
  };
}

// GET /chats/admins/support-conversations
export async function getSupportConversations(params = { page: 1, size: 10 }) {
  try {
    const response = await http.get("/chats/admins/support-conversations", {
      params,
    });
    return ok(response, []);
  } catch (error) {
    return fail(error, "Failed to fetch support conversations");
  }
}

// GET /chats/admins/support-conversations
export async function getContactUs(params = { page: 1, size: 10 }) {
  try {
    const response = await http.get("/users/queries", {
      params,
    });
    return ok(response, []);
  } catch (error) {
    return fail(error, "Failed to fetch support conversations");
  }
}

// GET /chats/messages (admin) with userId
export async function getMessagesByUser({ userId, page = 1, size = 20 }) {
  try {
    const response = await http.get("/chats/messages", {
      params: { userId, page, size },
    });
    return ok(response, []);
  } catch (error) {
    return fail(error, "Failed to fetch messages");
  }
}

// GET /chats/admins/application-conversations
export async function getApplicationConversations(
  params = { page: 1, size: 10 }
) {
  try {
    const response = await http.get("/chats/admins/application-conversations", {
      params,
    });
    return ok(response, []);
  } catch (error) {
    return fail(error, "Failed to fetch application conversations");
  }
}

// GET /chats/messages with applicationId
export async function getApplicationMessages({
  applicationId,
  page = 1,
  size = 20,
}) {
  try {
    const response = await http.get("/chats/messages", {
      params: { applicationId, page, size },
    });
    return ok(response, []);
  } catch (error) {
    return fail(error, "Failed to fetch application messages");
  }
}

// POST /chats/read
export async function markChatsRead({ chatType, userId, applicationId }) {
  try {
    const payload = { chatType };
    if (userId) payload.userId = userId;
    if (applicationId) payload.applicationId = applicationId;
    const response = await http.post("/chats/read", payload);
    return ok(response, null);
  } catch (error) {
    return fail(error, "Failed to mark chats as read");
  }
}

// WhatsApp API endpoints

// GET /whatsapp-chats/conversations - Get WhatsApp chat listing
export async function getWhatsAppConversations(params = { page: 1, size: 10 }) {
  try {
    const response = await http.get("/whatsapp-chats/conversations", {
      params,
    });
    return ok(response, []);
  } catch (error) {
    return fail(error, "Failed to fetch WhatsApp conversations");
  }
}

// GET /whatsapp-chats/messages - Get WhatsApp messages by phone
export async function getWhatsAppMessages({ phone, page = 1, size = 10 }) {
  try {
    const response = await http.get("/whatsapp-chats/messages", {
      params: { phone, page, size },
    });
    return ok(response, []);
  } catch (error) {
    return fail(error, "Failed to fetch WhatsApp messages");
  }
}

// POST /whatsapp-chats/read - Mark WhatsApp messages as read
export async function markWhatsAppRead({ phone }) {
  try {
    const payload = { phone };
    const response = await http.post("/whatsapp-chats/read", payload);
    return ok(response, null);
  } catch (error) {
    return fail(error, "Failed to mark WhatsApp messages as read");
  }
}

// POST /whatsapp-chats/send - Send WhatsApp message
export async function sendWhatsAppMessage({
  phone,
  messageType,
  content,
  mediaId = null,
  fileName = null,
}) {
  try {
    const payload = { phone, messageType, content };
    if (mediaId) payload.mediaId = mediaId;
    if (fileName) payload.fileName = fileName;
    const response = await http.post("/whatsapp-chats/send", payload);
    return ok(response, null);
  } catch (error) {
    return fail(error, "Failed to send WhatsApp message");
  }
}

// Upload media to WhatsApp (Facebook Graph API)
export async function uploadWhatsAppMedia(file) {
  const whatsappPhoneNumberId = process.env.VUE_APP_WHATSAPP_PHONE_NUMBER_ID;
  const whatsappAccessToken = process.env.VUE_APP_WHATSAPP_ACCESS_TOKEN;
  try {
    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("file", file);

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${whatsappPhoneNumberId}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whatsappAccessToken}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (data.id) {
      return {
        success: true,
        data: { mediaId: data.id },
        message: "Media uploaded successfully",
      };
    } else {
      return {
        success: false,
        data: null,
        message: data.error?.message || "Failed to upload media",
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.message || "Failed to upload media to WhatsApp",
    };
  }
}

// POST /whatsapp-chats/download-media - Download WhatsApp media
export async function downloadWhatsAppMedia({ messageId }) {
  try {
    const response = await http.post(
      "/whatsapp-chats/download-media",
      { messageId },
      {
        responseType: "blob", // Handle binary data
      }
    );

    // Create a blob URL for the image
    if (response.data) {
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "image/jpeg",
      });
      const url = URL.createObjectURL(blob);
      return {
        success: true,
        data: { url, blob, contentType: response.headers["content-type"] },
        message: "Media downloaded successfully",
      };
    }
    return ok(response, null);
  } catch (error) {
    return fail(error, "Failed to download WhatsApp media");
  }
}

export default {
  getSupportConversations,
  getMessagesByUser,
  getApplicationConversations,
  getApplicationMessages,
  markChatsRead,
  getWhatsAppConversations,
  getWhatsAppMessages,
  markWhatsAppRead,
  sendWhatsAppMessage,
  uploadWhatsAppMedia,
  downloadWhatsAppMedia,
};
