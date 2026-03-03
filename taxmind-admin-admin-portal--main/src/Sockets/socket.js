// Socket service for TaxMind Admin Portal
// Handles authentication and chat messaging functionality
import io from "socket.io-client";

// Global socket instance
let socket = null;

/**
 * Initialize socket connection
 * @param {Object} that - Vue component instance
 */
let initializeConnection = (that) => {
  const token = localStorage.getItem("token");
  const socketUrl = process.env.VUE_APP_SOCKET_URL;

  if (!token) {
    console.error("No authentication token found");
    that.msg = "Authentication required";
    that.showSnackBar = true;
    return false;
  }

  if (socket && socket.connected) {
    socket.disconnect();
  }

  socket = io(socketUrl, {
    auth: { token: `Bearer ${token}` },
    transports: ["websocket"],
  });

  return socket;
};

/**
 * Authentication function for socket connection
 * @param {Object} that - Vue component instance
 */
let authFunction = (that) => {
  console.log("Authenticating socket connection...");

  if (!socket) {
    socket = initializeConnection(that);
    if (!socket) return;
  }

  socket.on("connect", () => {
    console.log("Socket connected successfully:", socket.id);
    that.socketConnected = true;

    // Emit authentication
    const token = localStorage.getItem("token");
    socket.emit("auth", {
      token: `Bearer ${token}`,
      role: "ADMIN",
    });
  });

  socket.on("auth", (response) => {
    if (response) {
      console.log("Socket authentication successful:", response);
      that.response = response;
      that.authentication = response.authentication;

      if (that.$store) {
        that.$store.commit("authValue", response.authentication);
      }

      // Store admin ID for message identification
      if (response.user && response.user.id) {
        that.adminId = response.user.id;
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
    that.socketConnected = false;
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    that.msg = "Connection failed: " + error.message;
    that.showSnackBar = true;
  });
};

/**
 * Handle incoming chat messages
 * @param {Object} that - Vue component instance
 */
let handleNewChatMessage = (that) => {
  console.log("Setting up chat message listener...");

  if (!socket) return;

  // Listen for incoming messages
  socket.on("chat:message", (response) => {
    console.log("Received chat message:", response);

    if (response && that.selectedUserId) {
      // Filter messages based on chatType
      // Support view should only show chatType: "support"
      // Application view should only show chatType: "application"
      // Check if component has a chatType property, otherwise default to 'support' for customer support
      const expectedChatType = that.chatType || "support";

      if (response.chatType && response.chatType !== expectedChatType) {
        console.log(
          `Message chatType "${response.chatType}" does not match expected "${expectedChatType}", ignoring`
        );
        return;
      }

      // Format the incoming message to match component structure
      const formattedMessage = {
        _id: response.id,
        text: response.content,
        messageType: response.messageType?.toUpperCase() || "TEXT",
        file: response.file,
        chatType: response.chatType,
        originalFileName: response.file?.fileName || "",
        create_date: response.createdAt || new Date().toISOString(),
        senderType: response.senderType,
        user: JSON.parse(localStorage.getItem("admin_data"))?.name || "Admin",
        senderUserId:
          response.senderType === "user" ? { _id: response.userId } : null,
        senderAdminId:
          response.senderType === "admin" ? { _id: that.adminId } : null,
      };

      // Check if message belongs to current chat
      if (response.userId === that.selectedUserId) {
        formattedMessage.chatType !== "application" &&
          that.chatData.push(formattedMessage);
        that.scrollToBottom();

        // Mark as read if it's from the selected user
        if (response.senderType === "user") {
          if (that.markReadForSelected) {
            // that.markReadForSelected();
          }
        }
      } else {
        // Update unread count for other users
        const userIndex = that.recentUsers.findIndex(
          (user) => user.userId === response.userId
        );
        if (userIndex !== -1) {
          that.recentUsers[userIndex].unreadCount =
            (that.recentUsers[userIndex].unreadCount || 0) + 1;
        }
      }
    }
  });
};

/**
 * Upload chat attachment using the file upload API
 * @param {Object} that - Vue component instance
 * @param {File} file - File to upload
 */
let uploadChatAttachment = async (that, file) => {
  const apiBase = process.env.VUE_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  try {
    // 1. Request presigned URL
    const reqBody = {
      type: "chat_attachment",
      filename: file.name,
      entityId: that.selectedUserId,
    };

    const res1 = await fetch(apiBase + "/v1/files/request-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(reqBody),
    });

    if (!res1.ok) throw new Error("Failed to get presigned URL");
    const data1 = await res1.json();
    const { key, presignedUrl } = data1.data;

    // 2. Upload to S3
    const putRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!putRes.ok) throw new Error("S3 upload failed");

    // 3. Confirm upload
    const res2 = await fetch(apiBase + "/v1/files/confirm-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ keys: [key] }),
    });

    if (!res2.ok) throw new Error("Confirm upload failed");
    const data2 = await res2.json();
    const fileResult = data2.data.results.find(
      (r) => r.key === key && r.status === "active"
    );

    if (!fileResult) throw new Error("File not active after confirm");
    return fileResult.fileId;
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
};

/**
 * Send a chat message through socket
 * @param {Object} that - Vue component instance
 * @param {Object} messageData - Message data to send
 */
let sendChatMessage = async (that, messageData, chatType = "support") => {
  console.log("Sending chat message:", messageData);

  if (!socket || !socket.connected) {
    console.error("Socket not connected");
    that.msg = "Not connected to chat server";
    that.showSnackBar = true;
    return false;
  }

  // Validate required fields
  if (!messageData.content && !messageData.fileId && !that.file) {
    console.error("Message content or file is required");
    return false;
  }

  if (!that.selectedUserId) {
    console.error("No user selected for chat");
    return false;
  }

  try {
    let fileId = messageData.fileId;

    // Handle file upload if file exists
    if (that.file && !fileId) {
      that.appLoading = true;
      fileId = await uploadChatAttachment(that, that.file);
      that.appLoading = false;
    }

    // Prepare message payload
    const payload = {
      chatType,
      messageType: messageData.messageType || "text",
      content: messageData.content || "",
      ...(messageData?.applicationId
        ? { applicationId: messageData.applicationId }
        : {}),
      ...(that.selectedUserId ? { userId: that.selectedUserId } : {}),
      ...(fileId ? { fileId } : {}),
    };

    // Return a promise that resolves with the message data
    return new Promise((resolve, reject) => {
      try {
        // Emit the message with acknowledgment
        socket.emit("chat:send", payload, (ack) => {
          if (!ack) {
            reject(new Error("No acknowledgment received"));
            return;
          }

          if (ack.success) {
            console.log("Message sent successfully:", ack.message);
            // Format the confirmed message for chat
            const confirmedMessage = {
              _id: ack.message.id || "temp_" + Date.now(),
              text: ack.message.content,
              messageType: ack.message.messageType?.toUpperCase() || "TEXT",
              file: ack.message.file,
              chatType: ack.message.chatType,
              originalFileName: messageData.fileName || that.file?.name || "",
              create_date: ack.message.createdAt || new Date().toISOString(),
              senderType: "admin",
              senderUserId: null,
              senderAdminId: { _id: that.adminId },
              // Format for application view
              user:
                JSON.parse(localStorage.getItem("admin_data"))?.name || "Admin",
              date: ack.message.createdAt || new Date().toISOString(),
              content: ack.message.content,
            };

            // confirmedMessage.chatType !== "application" &&
            that.chatData.push(confirmedMessage);
            that.scrollToBottom();
            // Resolve with the confirmed message data
            resolve({
              success: true,
              message: confirmedMessage,
            });
          } else {
            console.error("Send failed:", ack.error);
            that.msg = "Send failed: " + ack.error;
            that.showSnackBar = true;
            reject(new Error(ack.error || "Failed to send message"));
          }
        });
      } catch (error) {
        console.error("Error in socket emit:", error);
        reject(error);
      }
    });
  } catch (error) {
    console.error("Error sending message:", error);
    that.msg = "Attachment upload failed: " + error.message;
    that.showSnackBar = true;
    that.appLoading = false;
    return false;
  }
};

/**
 * Initialize socket connection and event listeners
 * @param {Object} that - Vue component instance
 */
let initializeSocket = (that) => {
  console.log("Initializing socket connection...");

  // Initialize socket connection
  socket = initializeConnection(that);
  if (!socket) return;

  // Set up authentication
  authFunction(that);

  // Set up message handling
  handleNewChatMessage(that);
};

/**
 * Get socket connection status
 */
let getConnectionStatus = () => {
  return socket ? socket.connected : false;
};

/**
 * Get socket instance
 */
let getSocket = () => {
  return socket;
};

/**
 * Clean up socket listeners
 * @param {Object} that - Vue component instance
 */
let cleanupSocket = () => {
  console.log("Cleaning up socket listeners...");

  if (socket) {
    socket.off("auth");
    socket.off("chat:message");
    socket.off("connect");
    socket.off("disconnect");
    socket.off("connect_error");
    socket.disconnect();
    socket = null;
  }
};

// Export socket service functions
var socketService = {
  authFunction,
  handleNewChatMessage,
  sendChatMessage,
  initializeSocket,
  cleanupSocket,
  uploadChatAttachment,
  getConnectionStatus,
  getSocket,
  initializeConnection,
};

export default socketService;
