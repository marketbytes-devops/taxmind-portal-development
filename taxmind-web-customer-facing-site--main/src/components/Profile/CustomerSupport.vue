<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading
      :active="appLoading"
      spinner="bar-fade-scale"
      color="#1A73E9"
      size="60"
      is-full-screen
    />
    <!-- notifications shown via global this.$snackbar -->
    <v-layout wrap justify-center pt-lg-3 pt-sm-0 pt-md-0>
      <v-flex xs12>
        <v-layout wrap justify-center style="background-color: #f1f7ff">
          <v-flex xs12 lg11 pa-1 pa-sm-5>
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-card flat class="d-flex flex-column responsive-card">
                  <v-layout wrap justify-center>
                    <v-flex xs12>
                      <v-card elevation="0">
                        <v-layout wrap justify-start pa-4>
                          <v-flex xs3 sm1 text-start>
                            <v-avatar color="#959DA533">
                              <v-icon dark large color="#1A73E9"
                                >mdi-headset</v-icon
                              >
                            </v-avatar>
                          </v-flex>
                          <v-flex xs9 sm10 text-start>
                            <span class="sprtitle">Customer Support</span
                            ><br /><span class="sprtitle2"
                              >We’re here to help</span
                            >
                          </v-flex>
                        </v-layout>
                      </v-card>
                      <v-divider></v-divider>
                    </v-flex>
                  </v-layout>
                  <!-- Chat Section -->
                  <v-layout wrap justify-center pt-10>
                    <v-flex xs12 lg10>
                      <v-layout wrap justify-center>
                        <v-flex xs12>
                          <v-layout wrap>
                            <v-flex
                              xs12
                              class="chat-container"
                              ref="chatContainer"
                              @scroll="handleScroll"
                            >
                              <v-layout
                                wrap
                                justify-center
                                class="pa-2"
                                v-if="showLoadMoreChip && hasMoreMessages"
                              >
                                <v-chip
                                  outlined
                                  color="#1A73E9"
                                  class="load-more-chip"
                                  @click="loadMoreMessages"
                                  :disabled="isLoadingMore"
                                >
                                  <v-progress-circular
                                    v-if="isLoadingMore"
                                    indeterminate
                                    color="#1A73E9"
                                    size="16"
                                    class="mr-2"
                                  ></v-progress-circular>
                                  {{
                                    isLoadingMore
                                      ? "Loading..."
                                      : "View older messages"
                                  }}
                                </v-chip>
                              </v-layout>
                              <!-- Group messages by date -->
                              <v-flex
                                v-for="(group, date) in groupedMessages"
                                :key="date"
                              >
                                <!-- Date header -->
                                <v-layout
                                  wrap
                                  justify-center
                                  class="date-header"
                                >
                                  <v-flex xs12 text-center>
                                    <v-chip small outlined class="date-chip">
                                      {{ formatDateHeader(date) }}
                                    </v-chip>
                                  </v-flex>
                                </v-layout>

                                <!-- Messages for this date -->
                                <v-layout wrap>
                                  <v-flex
                                    v-for="message in group"
                                    :key="message._id || message.id"
                                    xs12
                                    :class="{
                                      'text-end': message.senderType === 'user',
                                      'text-start':
                                        message.senderType !== 'user',
                                    }"
                                  >
                                    <!-- Rest of your existing message template -->
                                    <v-layout wrap>
                                      <v-flex xs12>
                                        <v-layout class="message-container">
                                          <v-flex
                                            v-if="message.senderType !== 'user'"
                                            class="admin-avatar"
                                          >
                                            <v-avatar size="32" color="#1A73E9">
                                              <v-icon dark>mdi-headset</v-icon>
                                            </v-avatar>
                                          </v-flex>

                                          <v-card
                                            rounded="lg"
                                            elevation="0"
                                            :class="[
                                              {
                                                'user-message':
                                                  message.senderType === 'user',
                                                'admin-message':
                                                  message.senderType !== 'user',
                                              },
                                              'message-wrapper',
                                            ]"
                                            class="pa-3 mb-2"
                                          >
                                            <div class="message-content">
                                              <!-- Regular text message -->
                                              <div
                                                v-if="
                                                  message.messageType ===
                                                    'TEXT' ||
                                                  message.messageType === 'text'
                                                "
                                              >
                                                {{
                                                  message.text ||
                                                  message.content
                                                }}
                                              </div>

                                              <!-- Image message -->
                                              <div
                                                v-else-if="
                                                  message.messageType ===
                                                    'IMAGE' ||
                                                  message.messageType ===
                                                    'image'
                                                "
                                                class="file-message"
                                              >
                                                <!-- Check if it's a PDF file by mimeType or fileName -->
                                                <div
                                                  v-if="
                                                    message.file?.mimeType ===
                                                      'application/pdf' ||
                                                    (message.file?.fileName &&
                                                      message.file.fileName
                                                        .toLowerCase()
                                                        .endsWith('.pdf'))
                                                  "
                                                >
                                                  <v-layout
                                                    wrap
                                                    justify-start
                                                    class="file-container"
                                                    :class="{ clickable: true }"
                                                    @click="
                                                      openFileAttachment(
                                                        message.file
                                                      )
                                                    "
                                                  >
                                                    <v-flex
                                                      xs2
                                                      text-left
                                                      class="file-icon-container"
                                                    >
                                                      <v-icon
                                                        :color="
                                                          message.senderType ===
                                                          'user'
                                                            ? 'white'
                                                            : '#1A73E9'
                                                        "
                                                        size="24"
                                                      >
                                                        mdi-file-pdf-box
                                                      </v-icon>
                                                    </v-flex>
                                                    <v-flex xs10 text-left>
                                                      <div class="file-name">
                                                        {{
                                                          message.file
                                                            ?.fileName ||
                                                          "PDF Document"
                                                        }}
                                                      </div>
                                                    </v-flex>
                                                  </v-layout>
                                                </div>

                                                <!-- Image Preview for actual images -->
                                                <div
                                                  v-else
                                                  class="image-preview-message"
                                                >
                                                  <v-img
                                                    :src="
                                                      message.file?.url ||
                                                      message.file
                                                    "
                                                    max-height="200"
                                                    max-width="300"
                                                    contain
                                                    class="message-image clickable"
                                                    @click="
                                                      openFileAttachment(
                                                        message.file
                                                      )
                                                    "
                                                  ></v-img>

                                                  <!-- Display message ID for debugging -->
                                                </div>

                                                <!-- Message Text -->
                                                <div
                                                  v-if="
                                                    message.text ||
                                                    message.content
                                                  "
                                                  class="file-text mt-2"
                                                >
                                                  {{
                                                    message.text ||
                                                    message.content
                                                  }}
                                                </div>
                                              </div>

                                              <!-- File message with enhanced display -->
                                              <div
                                                v-else-if="
                                                  message.messageType ===
                                                    'FILE' ||
                                                  message.messageType ===
                                                    'file' ||
                                                  message.messageType ===
                                                    'document' ||
                                                  message.messageType ===
                                                    'DOCUMENT'
                                                "
                                                class="file-message"
                                              >
                                                <!-- Image Preview -->
                                                <div
                                                  v-if="
                                                    isImageFile(message.file)
                                                  "
                                                  class="image-preview-message"
                                                >
                                                  <v-img
                                                    :src="
                                                      message.file?.url ||
                                                      message.file
                                                    "
                                                    max-height="200"
                                                    max-width="300"
                                                    contain
                                                    class="message-image clickable"
                                                    @click="
                                                      openFileAttachment(
                                                        message.file
                                                      )
                                                    "
                                                  ></v-img>
                                                </div>

                                                <!-- PDF/Other File Section -->
                                                <v-layout
                                                  v-else
                                                  wrap
                                                  justify-start
                                                  class="file-container"
                                                  :class="{ clickable: true }"
                                                  @click="
                                                    openFileAttachment(
                                                      message.file
                                                    )
                                                  "
                                                >
                                                  <v-flex
                                                    xs2
                                                    text-left
                                                    class="file-icon-container"
                                                  >
                                                    <v-icon
                                                      :color="
                                                        message.senderType ===
                                                        'user'
                                                          ? 'white'
                                                          : '#1A73E9'
                                                      "
                                                      size="24"
                                                    >
                                                      {{
                                                        message.file
                                                          ?.mimeType ===
                                                        "application/pdf"
                                                          ? "mdi-file-pdf-box"
                                                          : "mdi-file-document-outline"
                                                      }}
                                                    </v-icon>
                                                  </v-flex>
                                                  <v-flex xs10 text-left>
                                                    <div class="file-name">
                                                      {{
                                                        message.file
                                                          ?.fileName ||
                                                        message.originalFileName ||
                                                        "File"
                                                      }}
                                                    </div>
                                                  </v-flex>
                                                </v-layout>

                                                <!-- Message Text -->
                                                <div
                                                  v-if="
                                                    message.text ||
                                                    message.content
                                                  "
                                                  class="file-text mt-2"
                                                >
                                                  {{
                                                    message.text ||
                                                    message.content
                                                  }}
                                                </div>
                                              </div>

                                              <!-- Message timestamp and sender name -->
                                              <div class="message-footer">
                                                <div
                                                  v-if="
                                                    message.senderType ===
                                                    'user'
                                                  "
                                                  class="sender-name"
                                                >
                                                  <!-- {{ profileData.firstName || 'You' }} -->
                                                </div>
                                                <div class="message-time">
                                                  {{
                                                    formatTime(
                                                      message.create_date ||
                                                        message.createdAt
                                                    )
                                                  }}
                                                </div>
                                              </div>
                                            </div>
                                          </v-card>
                                        </v-layout>
                                      </v-flex>
                                    </v-layout>
                                  </v-flex>
                                </v-layout>
                              </v-flex>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                  <v-layout wrap justify-center fill-height>
                    <v-flex xs12 align-self-center>
                      <v-flex xs12>
                        <v-divider></v-divider>
                      </v-flex>
                      <v-layout wrap justify-center pt-4>
                        <v-flex
                          xs1
                          sm1
                          align-self-center
                          style="cursor: pointer"
                          @click="triggerFileInput"
                        >
                          <span><v-icon>mdi-paperclip</v-icon></span>
                          <input
                            ref="fileInput"
                            v-show="false"
                            type="file"
                            accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            @change="uploadDoc"
                          />
                        </v-flex>
                        <v-flex xs11 sm8 pr-2 pr-sm-0>
                          <v-text-field
                            rounded
                            v-model="message"
                            dense
                            hide-details="auto"
                            outlined
                            placeholder="Message"
                            class="rounded-lg"
                            @keyup.enter="sendMessage"
                            ><template v-slot:append>
                              <v-chip
                                v-if="uploadedFileName"
                                close
                                small
                                @click:close="removeFile"
                              >
                                {{ uploadedFileName }}
                              </v-chip>
                            </template>
                          </v-text-field>
                        </v-flex>
                        <v-flex xs12 sm3 pt-2 pt-sm-0>
                          <v-btn color="#1A73E9" rounded @click="sendMessage"
                            ><span
                              style="
                                font-family: DMSans;
                                font-weight: 600;
                                font-size: 16px;
                                color: white;
                              "
                              >Send</span
                            ></v-btn
                          >
                        </v-flex>
                      </v-layout>
                    </v-flex>
                  </v-layout>
                </v-card>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>
<script>
import socketService from "../../services/socket.js";
import profileService from "../../services/profile.js";
export default {
  metaInfo: {
    title: "Customer Support - Get Assistance with TaxMind",
    meta: [
      {
        name: "description",
        content:
          "Need help? Connect with TaxMind's customer support team via chat, share documents, and get expert assistance for all your tax-related queries.",
      },
      {
        name: "keywords",
        content:
          "TaxMind customer support, tax help, live chat support, document sharing, tax assistance, tax queries, online tax support, expert guidance",
      },
      {
        property: "og:title",
        content: "Customer Support - Chat & Document Sharing with TaxMind",
      },
      {
        property: "og:description",
        content:
          "Chat with TaxMind's support team, share documents, and get professional tax assistance. Quick, secure, and reliable customer service.",
      },
      {
        property: "og:url",
        content: "https://www.taxmind.ie/customer-support", // Replace with the actual Customer Support page URL
      },
      {
        property: "og:type",
        content: "website",
      },
      { name: "robots", content: "index, follow" },
    ],
  },

  data() {
    return {
      appLoading: false,
      ServerError: false,
      message: null,
      uploadedFileName: "",
      uploadedFileId: null,
      uploadedFileKey: null,
      imagePreview: null,
      chatData: [],
      profileData: {},
      userId: null,
      selectedUserId: null,
      adminId: null,
      socketConnected: false,
      authentication: false,
      response: null,
      file: null,
      fileURL: process.env.VUE_APP_FILE_BASE_URL || "",
      currentPage: 1,
      limit: 20,
      hasMoreMessages: true,
      isLoadingMore: false,
      lastLoadedPage: 1,
      isFirstLoad: true,
      welcomeMessages: [
        {
          id: "welcome-1",
          text: "Welcome to Customer Support!",
          create_date: new Date(), // Changed from timestamp to create_date to match chat message format
          isWelcomeMessage: true,
          messageType: "TEXT", // Add messageType to match chat message format
          senderUserId: null, // This will make it appear as an admin message
        },
        {
          id: "welcome-2",
          text: "How can we assist you today?",
          create_date: new Date(),
          isWelcomeMessage: true,
          messageType: "TEXT",
          senderUserId: null,
        },
      ],
      showLoadMoreChip: false,
      lastScrollPosition: 0,
      scrollThreshold: 100, // Distance from top to trigger chip
    };
  },
  beforeMount() {
    this.getprofileData();
    this.initializeChatData();
  },
  // updated() {
  //   this.scrollToBottom();
  // },
  watch: {},
  computed: {
    allMessages() {
      // Combine welcome messages with chat messages if chat is empty
      if (this.chatData.length === 0) {
        return this.welcomeMessages;
      }
      return this.chatData;
    },

    groupedMessages() {
      const groups = {};

      this.allMessages.forEach((message) => {
        const date = this.formatDateOnly(
          message.create_date || message.timestamp
        );
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(message);
      });

      return groups;
    },
  },
  mounted() {
    this.initializeSocket();
  },
  beforeDestroy() {
    this.cleanupSocket();
  },
  methods: {
    initializeSocket() {
      // Initialize socket connection and set up event listeners for support chat only
      socketService.initializeSocket(this, "support");
    },
    cleanupSocket() {
      // Clean up socket listeners when component is destroyed
      socketService.cleanupSocket();
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const chatContainer = this.$refs.chatContainer;
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });
    },
    markReadForSelected() {
      // Placeholder for marking messages as read
      console.log("Marking messages as read for selected user");
    },
    handleScroll(event) {
      const container = event.target;
      const scrollTop = container.scrollTop;
      // Show chip when scrolled near top and there are more messages
      this.showLoadMoreChip =
        scrollTop < this.scrollThreshold && this.hasMoreMessages;
    },
    async loadMoreMessages() {
      if (this.isLoadingMore || !this.hasMoreMessages) return;

      this.isLoadingMore = true;

      // Calculate next page based on lastLoadedPage
      const nextPage = this.lastLoadedPage + 1;

      try {
        const response = await profileService.getChatMessages({
          limit: this.limit,
          page: nextPage,
        });

        // Handle response structure: data is an array of messages
        const oldMessages = Array.isArray(response.data)
          ? response.data
          : response.data?.messages || [];

        if (oldMessages.length > 0) {
          // Store the current scroll height
          const container = this.$refs.chatContainer;
          const oldScrollHeight = container.scrollHeight;

          // Prepend older messages
          this.chatData = [...oldMessages, ...this.chatData];
          this.lastLoadedPage = nextPage;

          // Maintain scroll position
          this.$nextTick(() => {
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - oldScrollHeight;
            container.scrollTop = scrollDiff;
          });
        }

        // Update whether we have more messages
        this.hasMoreMessages = oldMessages.length === this.limit;

        // Hide chip if no more messages
        if (!this.hasMoreMessages) {
          this.showLoadMoreChip = false;
        }
      } catch (err) {
        this.appLoading = false;
        if (err.response) {
          if (err.response.status === 500) {
            // Handle server error
            this.ServerError = true;
            this.$snackbar.showError(
              "A server error occurred. Please try again later."
            );
          } else {
            // Handle other errors (e.g., 422 validation error)
            this.ServerError = false;
            try {
              if (
                this.$snackbar &&
                typeof this.$snackbar.showApiError === "function"
              ) {
                this.$snackbar.showApiError(err);
              } else {
                this.$snackbar.showError(err.response?.data?.message || "");
              }
            } catch (e) {
              this.$snackbar.showError(err.response?.data?.message || "");
            }
          }
        } else {
          // Fallback for cases where err.response is undefined
          this.ServerError = true;
          this.$snackbar.showError(
            "An unexpected error occurred. Please try again."
          );
        }
      } finally {
        this.isLoadingMore = false;
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click(); // Programmatically trigger the file input
    },
    async uploadDoc(event) {
      const file = event.target.files[0]; // Get the uploaded file
      if (!file) return;

      // File size validation (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.$snackbar.showError("File size must be less than 5MB");
        event.target.value = ""; // Clear the input
        return;
      }

      // File type validation
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        this.$snackbar.showError(
          "Only PDF and image files (JPEG, PNG, GIF, WEBP) are allowed"
        );
        event.target.value = ""; // Clear the input
        return;
      }

      try {
        this.appLoading = true;

        // Import the uploadFile function
        const { uploadFile } = await import("../../services/files.js");

        // Get userId from localStorage or component data
        const userId = localStorage.getItem("userId") || this.userId;

        if (!userId) {
          this.$snackbar.showError("User ID not found. Please log in again.");
          this.appLoading = false;
          return;
        }

        // Upload the file using the same pattern as admin
        const result = await uploadFile(
          {
            entityId: userId,
            type: "chat_attachment",
          },
          file
        );

        // Store the file data
        this.file = file;
        this.uploadedFileName = file.name;
        this.uploadedFileId = result.fileId;
        this.uploadedFileKey = result.key;

        // Generate image preview if it's an image
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.imagePreview = e.target.result;
          };
          reader.readAsDataURL(file);
        } else {
          this.imagePreview = null;
        }

        this.appLoading = false;
        this.$snackbar.showSuccess("File attached successfully");
      } catch (error) {
        this.appLoading = false;
        this.$snackbar.showError(
          "Failed to attach file: " + (error.message || "Unknown error")
        );
        console.error("File upload error:", error);
        event.target.value = ""; // Clear the input on error
      }
    },
    removeFile() {
      this.file = null;
      this.uploadedFileName = "";
      this.uploadedFileId = null;
      this.uploadedFileKey = null;
      this.imagePreview = null;
      // Clear the file input
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = "";
      }
    },
    async sendMessage() {
      if (!this.message && !this.file) {
        this.$snackbar.showError("Please enter a message or select a file");
        return;
      }

      // Check if socket is connected
      if (!socketService.getConnectionStatus()) {
        this.$snackbar.showError(
          "Not connected to chat server. Please wait..."
        );
        return;
      }

      // Set selectedUserId to current user's ID from localStorage for customer support chat
      if (!this.selectedUserId) {
        this.selectedUserId = localStorage.getItem("userId") || this.userId;
      }

      const messageData = {
        content: this.message || "",
        messageType: this.file ? "file" : "text",
        fileName: this.file?.name || "",
        fileId: this.uploadedFileId || null,
      };

      try {
        // Send via socket only
        const result = await socketService.sendChatMessage(
          this,
          messageData,
          "support"
        );

        if (result && result.success) {
          // Message sent successfully via socket
          this.message = "";
          this.file = null;
          this.uploadedFileName = "";
          this.uploadedFileId = null;
          this.uploadedFileKey = null;
          this.imagePreview = null;
          // Clear the file input
          if (this.$refs.fileInput) {
            this.$refs.fileInput.value = "";
          }
        } else {
          this.$snackbar.showError("Failed to send message");
        }
      } catch (err) {
        this.appLoading = false;
        this.$snackbar.showError(
          "Failed to send message: " + (err.message || "Unknown error")
        );
      }
    },
    generateYears() {
      const currentYear = new Date().getFullYear();
      this.claimyearList = Array.from({ length: 5 }, (_, i) => currentYear - i); // Generate years from current year to 5 years back
    },
    formatTime(date) {
      if (!date) return "";
      const dt = new Date(date);
      return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
    async getprofileData() {
      try {
        this.appLoading = true;
        const response = await profileService.getProfileData();
        this.appLoading = false;
        this.profileData = response.data;
        this.userId = response.data._id;
      } catch (err) {
        this.appLoading = false;
        this.handleError(err);
      }
    },
    async initializeChatData() {
      try {
        // Use the new /chats/messages endpoint
        const response = await profileService.getChatMessages({
          limit: this.limit,
          page: 1,
        });

        // Handle response structure: data is an array of messages
        const messages = Array.isArray(response.data)
          ? response.data
          : response.data?.messages || [];

        if (this.currentPage === 1) {
          // For first page, replace all messages (reverse to show newest at bottom)
          this.chatData = messages.reverse();
          this.lastLoadedPage = 1;

          // Scroll to bottom on initial load
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        } else {
          // For subsequent pages, prepend messages
          this.chatData = [...messages.reverse(), ...this.chatData];
          this.lastLoadedPage = this.currentPage;
        }

        // Check if we have more messages to load based on metadata or message count
        const metadata = response.metadata;
        if (metadata) {
          const totalPages = Math.ceil(metadata.total / metadata.size);
          this.hasMoreMessages = this.currentPage < totalPages;
        } else {
          this.hasMoreMessages = messages.length === this.limit;
        }
      } catch (err) {
        this.handleError(err);
      }
    },
    handleError(err) {
      if (err.response) {
        if (err.response.status === 500) {
          this.ServerError = true;
          this.msg = "A server error occurred. Please try again later.";
          this.$snackbar.showError(this.msg);
          return;
        } else {
          this.ServerError = false;
          this.msg = err.response?.data?.message || "";
        }
      } else {
        this.ServerError = true;
        this.msg = "An unexpected error occurred. Please try again.";
        this.$snackbar.showError(this.msg);
        return;
      }
      try {
        if (
          this.$snackbar &&
          typeof this.$snackbar.showApiError === "function"
        ) {
          this.$snackbar.showApiError(err);
        } else {
          this.$snackbar.showError(this.msg || "");
        }
      } catch (e) {
        this.$snackbar.showError(this.msg || "");
      }
    },
    formatDateOnly(date) {
      if (!date) return "Today"; // For welcome messages without date

      const messageDate = new Date(date);
      messageDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (messageDate.getTime() === today.getTime()) {
        return "Today";
      } else if (messageDate.getTime() === yesterday.getTime()) {
        return "Yesterday";
      } else {
        const day = messageDate.getDate().toString().padStart(2, "0");
        const month = messageDate.toLocaleString("default", { month: "short" });
        const year = messageDate.getFullYear();
        return `${day} ${month} ${year}`;
      }
    },
    formatDateHeader(date) {
      return date; // Already formatted by formatDateOnly
    },
    openFile(url) {
      window.open(url, "_blank");
    },
    openFileAttachment(fileObj) {
      if (!fileObj) {
        console.warn("No file object provided");
        return;
      }

      // If fileObj is a string, use it directly
      if (typeof fileObj === "string") {
        window.open(fileObj, "_blank");
        return;
      }

      // If fileObj is an object, extract the URL
      const fileUrl =
        fileObj.url || fileObj.presignedUrl || fileObj.downloadUrl;

      if (fileUrl) {
        window.open(fileUrl, "_blank");
      } else {
        console.error("No valid URL found in file object:", fileObj);
        this.$snackbar.showError("Unable to open file");
      }
    },
    isImageFile(fileObj) {
      if (!fileObj) return false;

      // Check mimeType if available
      if (fileObj.mimeType) {
        return fileObj.mimeType.startsWith("image/");
      }

      // Check fileName extension
      if (fileObj.fileName) {
        const imageExtensions = [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".webp",
          ".bmp",
          ".svg",
        ];
        const fileName = fileObj.fileName.toLowerCase();
        return imageExtensions.some((ext) => fileName.endsWith(ext));
      }

      // Check if it's a string URL with image extension
      if (typeof fileObj === "string") {
        const imageExtensions = [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".webp",
          ".bmp",
          ".svg",
        ];
        const url = fileObj.toLowerCase();
        return imageExtensions.some((ext) => url.includes(ext));
      }

      return false;
    },
  },
};
</script>
<style scoped>
.date-header {
  margin: 20px 0 10px 0;
}

.admin-message.welcome-message .message-content {
  background-color: #eaf3ff;
}

.date-chip {
  background-color: #f2f2f2 !important;
  color: #666666 !important;
  font-size: 12px !important;
  font-family: DMSans;
  font-weight: 500;
}

.sprtitle {
  font-family: DMSans;
  font-weight: 500;
  font-size: 18px;
  color: #000000;
}

.sprtitle2 {
  font-family: DMSans;
  font-weight: 400;
  font-size: 16px;
  color: #000000;
}

.message-wrapper {
  display: flex;
  width: 100%;
  background-color: transparent !important;
}

.user-message {
  justify-content: flex-end;
}

.admin-message {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 8px;
  word-wrap: break-word;
}

.user-message .message-content {
  background-color: #2c84f9;
  margin-left: auto;
  color: #ffffff;
  font-family: DMSans;
  font-weight: 500;
  font-size: 12px;
}

.user-message .file-container {
  background-color: rgba(255, 255, 255, 0.15);
}

.admin-message .file-container {
  background-color: rgba(26, 115, 233, 0.1);
}

.admin-message .file-container.clickable:hover {
  background-color: rgba(26, 115, 233, 0.15);
}

.admin-message .message-content {
  background-color: #eaf3ff;
  margin-right: auto;
  color: #000e08;
  font-family: DMSans;
  font-weight: 500;
  font-size: 12px;
}

.message-footer {
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.sender-name {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.9;
}

.message-time {
  font-size: 8px;
  opacity: 0.8;
  text-align: right;
  margin-left: auto;
}

.chat-container {
  height: 300px !important;
  overflow-y: auto;
  scroll-behavior: smooth;
  display: flex;
  flex-direction: column;
}

.v-progress-circular {
  margin: 10px auto;
}

.responsive-card {
  height: 500px;
}

@media (max-width: 600px) {
  .responsive-card {
    height: 600px;
  }
}

.message-file-link {
  color: inherit;
  /* This will inherit the color from the parent element */
  text-decoration: none;
  /* Optional: Remove underline if needed */
}

.load-more-chip {
  cursor: pointer;
  margin: 8px 0;
  transition: background-color 0.3s;
  position: sticky;
  top: 0;
  z-index: 1;
}

.file-message {
  min-width: 200px;
  max-width: 300px;
}

@media (max-width: 600px) {
  .file-message {
    min-width: 120px;
    max-width: 200px;
  }
}

.file-container {
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s;
}

.file-container.clickable {
  cursor: pointer;
}

.file-container.clickable:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.file-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-details {
  overflow: hidden;
}

.file-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-text {
  word-break: break-word;
  opacity: 0.9;
}

.file-action-btn {
  border: 1px solid currentColor !important;
  opacity: 0.9;
  transition: opacity 0.2s;
}

.file-action-btn:hover {
  opacity: 1;
}

.load-more-chip:hover {
  background-color: #f5f5f5;
}

.image-preview-card {
  border-radius: 8px;
  overflow: hidden;
}

.image-preview-card .v-card__actions {
  padding: 8px 12px;
}

.image-preview-message {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.message-image {
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.2s;
}

.message-image:hover {
  opacity: 0.9;
}

.image-preview-message .file-name {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 4px;
}
</style>
