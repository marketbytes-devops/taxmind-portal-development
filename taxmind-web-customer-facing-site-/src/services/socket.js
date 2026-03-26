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
  const token = localStorage.getItem("accesstoken");
  const socketUrl = process.env.VUE_APP_SOCKET_URL;

  if (!token) {
    console.error("No authentication token found");
    try {
      if (that.$snackbar && typeof that.$snackbar.showApiError === "function") {
        that.$snackbar.showApiError({ error: "Authentication required" });
      } else if (
        that.$snackbar &&
        typeof that.$snackbar.showError === "function"
      ) {
        that.$snackbar.showError("Authentication required");
      }
    } catch (e) {
      /* no-op */
    }
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
    const token = localStorage.getItem("accesstoken");
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
    try {
      if (that.$snackbar && typeof that.$snackbar.showApiError === "function") {
        that.$snackbar.showApiError({
          error: `Connection failed: ${error.message}`,
        });
      } else if (
        that.$snackbar &&
        typeof that.$snackbar.showError === "function"
      ) {
        that.$snackbar.showError(`Connection failed: ${error.message}`);
      }
    } catch (e) {
      /* no-op */
    }
  });
};

/**
 * Handle incoming chat messages
 * @param {Object} that - Vue component instance
 * @param {String} expectedChatType - Expected chat type ('support' or 'application')
 */
let handleNewChatMessage = (that, expectedChatType = null) => {
  console.log("Setting up chat message listener...", expectedChatType);

  if (!socket) return;

  // Listen for incoming messages
  socket.on("chat:message", (response) => {
    console.log("Received chat message:", response);

    // Filter by chatType if expectedChatType is provided
    if (expectedChatType && response.chatType !== expectedChatType) {
      console.log(
        `Ignoring message with chatType: ${response.chatType}, expected: ${expectedChatType}`
      );
      return;
    }

    if (response && that.selectedUserId) {
      // Format the incoming message to match component structure
      const formattedMessage = {
        _id: response.id,
        text: response.content,
        messageType: response.messageType?.toUpperCase() || "TEXT",
        file: response.file,
        originalFileName: response.file?.fileName || "",
        createdAt: response.createdAt || new Date().toISOString(),
        date: response.createdAt || new Date().toISOString(),
        user:
          response.senderType === "admin"
            ? JSON.parse(localStorage.getItem("role"))?.roleName || "Admin"
            : localStorage.getItem("userName") ||
              this.applicantData.user?.name ||
              "User",
        senderType: response.senderType,
        senderUserId:
          response.senderType === "user" ? { _id: response.userId } : null,
        senderAdminId:
          response.senderType === "admin" ? { _id: that.adminId } : null,
      };

      // Check if message belongs to current chat
      if (response.userId === that.selectedUserId) {
        that.chatData.push(formattedMessage);
        that.scrollToBottom();

        // Mark as read if it's from the selected user
        if (response.senderType === "user") {
          // that.markReadForSelected();
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
  const token = localStorage.getItem("accesstoken");

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
    try {
      if (that.$snackbar && typeof that.$snackbar.showApiError === "function") {
        that.$snackbar.showApiError({ error: "Not connected to chat server" });
      } else if (
        that.$snackbar &&
        typeof that.$snackbar.showError === "function"
      ) {
        that.$snackbar.showError("Not connected to chat server");
      }
    } catch (e) {
      /* no-op */
    }
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
              originalFileName: messageData.fileName || that.file?.name || "",
              create_date: ack.message.createdAt || new Date().toISOString(),
              senderType: ack.message.senderType || "admin",
              senderUserId:
                ack.message.senderType === "user"
                  ? { _id: ack.message.userId }
                  : null,
              senderAdminId:
                ack.message.senderType === "admin"
                  ? { _id: that.adminId }
                  : null,
              // Format for application view
              user:
                ack.message.senderType === "user"
                  ? localStorage.getItem("userName") || "User"
                  : JSON.parse(localStorage.getItem("role"))?.roleName ||
                    "Admin",
              date: ack.message.createdAt || new Date().toISOString(),
              content: ack.message.content,
            };
            that.chatData.push(confirmedMessage);
            that.scrollToBottom();
            // Resolve with the confirmed message data
            resolve({
              success: true,
              message: confirmedMessage,
            });
          } else {
            console.error("Send failed:", ack.error);
            try {
              if (
                that.$snackbar &&
                typeof that.$snackbar.showApiError === "function"
              ) {
                that.$snackbar.showApiError({
                  error: `Send failed: ${ack.error}`,
                });
              } else if (
                that.$snackbar &&
                typeof that.$snackbar.showError === "function"
              ) {
                that.$snackbar.showError(`Send failed: ${ack.error}`);
              }
            } catch (e) {
              /* no-op */
            }
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
    try {
      if (that.$snackbar && typeof that.$snackbar.showApiError === "function") {
        that.$snackbar.showApiError({
          error: `Attachment upload failed: ${error.message}`,
        });
      } else if (
        that.$snackbar &&
        typeof that.$snackbar.showError === "function"
      ) {
        that.$snackbar.showError(`Attachment upload failed: ${error.message}`);
      }
    } catch (e) {
      /* no-op */
    }
    that.appLoading = false;
    return false;
  }
};

/**
 * Initialize socket connection and event listeners
 * @param {Object} that - Vue component instance
 * @param {String} chatType - Chat type filter ('support' or 'application')
 */
let initializeSocket = (that, chatType = null) => {
  console.log("Initializing socket connection...", chatType);

  // Initialize socket connection
  socket = initializeConnection(that);
  if (!socket) return;

  // Set up authentication
  authFunction(that);

  // Set up message handling with chat type filter
  handleNewChatMessage(that, chatType);
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
