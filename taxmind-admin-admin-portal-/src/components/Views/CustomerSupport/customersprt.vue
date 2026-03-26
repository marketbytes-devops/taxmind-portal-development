<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <v-snackbar v-model="showSnackBar" color="#1A73E9" right :timeout="timeout">
      <v-layout wrap justify-center>
        <v-flex text-left class="align-self-center">
          <span style="color: #ffffff">
            {{ msg }}
          </span>
        </v-flex>
        <v-flex text-right>
          <v-btn small :ripple="false" text @click="showSnackBar = false">
            <v-icon style="color: #ffffff">mdi-close</v-icon>
          </v-btn>
        </v-flex>
      </v-layout>
    </v-snackbar>

    <v-layout wrap justify-center>
      <v-flex pt-5 xs11 sm11 md11 lg11 xl11 pb-5>
        <!-- Tabs for Customer Support and WhatsApp -->
        <v-tabs v-model="activeTab" background-color="transparent" color="#1A73E9" class="support-tabs mb-4">
          <v-tab>
            <v-icon left>mdi-message-text</v-icon>
            Customer Support
          </v-tab>
          <v-tab>
            <v-icon left>mdi-whatsapp</v-icon>
            WhatsApp Chat
          </v-tab>
        </v-tabs>

        <!-- Tab Items -->
        <v-tabs-items v-model="activeTab">
          <!-- Customer Support Tab -->
          <v-tab-item>



            <v-layout wrap justify-start>
              <v-flex xs12 sm4 text-start align-center pt-2 class="carousalhead">
                <!-- Users List -->
                <v-layout wrap justify-center>
                  <v-flex xs12>
                    <v-flex xs12 text-start align-center pt-2>
                      <v-card flat class="users-list-card">
                        <!-- Search Bar -->
                        <v-layout wrap justify-center>
                          <v-flex xs12>
                            <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" dense outlined
                              placeholder="Search users" class="mx-4 mt-4" hide-details></v-text-field>
                          </v-flex>
                        </v-layout>

                        <!-- Users List -->
                        <v-layout wrap justify-center style="height: calc(93vh - 205px);">
                          <v-flex xs12 pt-4>
                            <v-list class="chat-users-list">
                              <v-list-item v-if="filteredUsers.length === 0">
                                <v-list-item-content class="text-center">
                                  <v-icon large color="grey lighten-1">mdi-account-search</v-icon>
                                  <div class="no-results-text mt-2">
                                    No users found
                                  </div>
                                </v-list-item-content>
                              </v-list-item>
                              <template v-else>
                                <v-list-item v-for="user in filteredUsers" :key="user.userId" @click="selectUser(user)"
                                  :class="{
                                    'selected-user': selectedUserId === user.userId,
                                  }">
                                  <v-list-item-avatar>
                                    <v-avatar color="primary" size="40">
                                      <span class="white--text text-center">{{
                                        getUserInitials(user.fullName)
                                      }}</span>
                                    </v-avatar>
                                  </v-list-item-avatar>

                                  <v-list-item-content>
                                    <v-list-item-title class="user-name" style="text-transform: capitalize">{{
                                      user.fullName
                                    }}</v-list-item-title>
                                    <v-list-item-subtitle class="user-email">{{
                                      user.content
                                    }}</v-list-item-subtitle>
                                  </v-list-item-content>

                                  <v-list-item-action>
                                    <div class="d-flex flex-column align-end">
                                      <div class="timestamp-text">{{ formatMessageDate(user.createdAt) }}</div>
                                      <v-chip v-if="user.unreadCount > 0" small color="primary"
                                        class="unread-badge mt-1">
                                        {{ user.unreadCount }}
                                      </v-chip>
                                    </div>
                                  </v-list-item-action>
                                </v-list-item>
                              </template>
                              <!-- View More Chip -->
                              <!-- <v-layout wrap justify-center class="pa-2" v-if="hasMoreUsers && !searchQuery">
                                <v-chip outlined color="#1A73E9" class="view-more-chip" @click="loadMoreUsers"
                                  :disabled="loadingUsers">
                                  <v-progress-circular v-if="loadingUsers" indeterminate color="#1A73E9" size="16"
                                    class="mr-2"></v-progress-circular>
                                  {{ loadingUsers ? "Loading..." : "View More" }}
                                </v-chip>
                              </v-layout> -->
                            </v-list>
                          </v-flex>
                        </v-layout>
                      </v-card>
                    </v-flex>
                  </v-flex>
                </v-layout>
              </v-flex>
              <v-flex xs12 sm8 text-start align-center pt-2>
                <v-layout wrap justify-center>
                  <v-flex xs12 pt-2>
                    <v-card flat elevation="0" class="d-flex flex-column responsive-card" v-if="!selectedUserId">
                      <v-layout wrap justify-center align-center>
                        <v-flex xs12 text-center>
                          <v-icon size="64" color="grey lighten-1">mdi-message-outline</v-icon>
                          <h3 class="mt-4 grey--text text--darken-1">
                            Select a chat to start messaging
                          </h3>
                        </v-flex>
                      </v-layout>
                    </v-card>
                    <v-card flat elevation="0" class="d-flex flex-column responsive-card" v-else>
                      <v-layout wrap justify-center>
                        <v-flex xs12>
                          <v-card elevation="0">
                            <v-layout wrap justify-start pa-4>
                              <v-flex xs2 sm2 md1 text-start>
                                <v-avatar color="primary" size="40">
                                  <span class="white--text" v-if="selectedUser">{{
                                    getUserInitials(selectedUser.fullName)
                                  }}</span>
                                </v-avatar>
                              </v-flex>
                              <v-flex xs10 sm10 md11 text-start>
                                <span class="sprtitle" v-if="selectedUser" style="text-transform: capitalize">{{
                                  selectedUser.fullName
                                }}</span>
                                <br />
                                <span class="sprtitle2" v-if="selectedUser">{{
                                  selectedUser.ppsNumber
                                }}</span>
                              </v-flex>
                            </v-layout>
                            <v-divider></v-divider>
                          </v-card>
                        </v-flex>
                      </v-layout>
                      <!-- Chat Section -->


                      <v-layout wrap justify-center style="    height: calc(93vh - 353px);">
                        <v-flex xs12>
                          <v-layout wrap>
                            <v-flex xs12 class="chat-container" ref="chatContainer" @scroll="handleScroll">
                              <v-layout wrap justify-center class="pa-2" v-if="showLoadMoreChip && hasMoreMessages">
                                <v-chip outlined color="#1A73E9" class="load-more-chip" @click="loadMoreMessages"
                                  :disabled="isLoadingMore">
                                  <v-progress-circular v-if="isLoadingMore" indeterminate color="#1A73E9" size="16"
                                    class="mr-2"></v-progress-circular>
                                  {{
                                    isLoadingMore
                                      ? "Loading..."
                                      : "View older messages"
                                  }}
                                </v-chip>
                              </v-layout>
                              <!-- Group messages by date -->
                              <v-flex v-for="(group, date) in groupedMessages" :key="date">
                                <!-- Date header -->
                                <v-layout wrap justify-center class="date-header">
                                  <v-flex xs12 text-center>
                                    <v-chip small outlined class="date-chip">
                                      {{ formatDateHeader(date) }}
                                    </v-chip>
                                  </v-flex>
                                </v-layout>

                                <!-- Messages for this date -->
                                <v-layout wrap>
                                  <v-flex v-for="message in group" :key="message._id || message.id" xs12 :class="{
                                    'text-end':
                                      message.senderAdminId &&
                                      message.senderAdminId._id === adminId,
                                    'text-start':
                                      !message.senderAdminId ||
                                      message.senderAdminId._id !== adminId,
                                  }">
                                    <!-- Rest of your existing message template -->
                                    <v-layout wrap>
                                      <v-flex xs12>
                                        <v-layout class="message-container">
                                          <v-flex v-if="
                                            !message.senderAdminId ||
                                            message.senderAdminId._id !==
                                            adminId
                                          " class="admin-avatar">
                                            <v-avatar size="32" color="#1A73E9">
                                              <v-icon dark>mdi-account</v-icon>
                                            </v-avatar>
                                          </v-flex>

                                          <v-card rounded="lg" elevation="0" :class="[
                                            {
                                              'user-message':
                                                message.senderAdminId &&
                                                message.senderAdminId._id ===
                                                adminId,
                                              'admin-message':
                                                !message.senderAdminId ||
                                                message.senderAdminId._id !==
                                                adminId,
                                            },
                                            'message-wrapper',
                                          ]" class="pa-3 mb-2">
                                            <div class="message-content">
                                              <!-- Regular text message -->
                                              <div
                                                v-if="message.messageType === 'TEXT' || message.messageType === 'text'">
                                                {{ message.text || message.content }}
                                              </div>

                                              <!-- Image message -->
                                              <div
                                                v-else-if="message.messageType === 'IMAGE' || message.messageType === 'image'"
                                                class="file-message">
                                                <!-- Image preview with loading indicator -->
                                                <v-img
                                                  :src="message.file?.url || getFileUrl(message.file?.key || message.fileId)"
                                                  max-height="200" contain class="rounded-lg mb-2"
                                                  @click="openFile(message.file?.url || getFileUrl(message.file?.key || message.fileId))"
                                                  :lazy-src="require('@/assets/images/placeholder-image.png')">
                                                  <template v-slot:placeholder>
                                                    <v-layout fill-height align-center justify-center ma-0>
                                                      <v-progress-circular indeterminate
                                                        color="#1A73E9"></v-progress-circular>
                                                    </v-layout>
                                                  </template>
                                                </v-img>

                                                <!-- Message Text -->
                                                <div v-if="message.text || message.content" class="file-text mt-2">
                                                  {{ message.text || message.content }}
                                                </div>
                                              </div>

                                              <!-- Document message -->
                                              <div
                                                v-else-if="message.messageType === 'DOCUMENT' || message.messageType === 'document'"
                                                class="file-message">
                                                <!-- Clickable File Section -->
                                                <v-layout wrap justify-start class="file-container"
                                                  :class="{ clickable: true }"
                                                  @click="openFile(message.file?.url || getFileUrl(message.file?.key || message.fileId))">
                                                  <v-flex xs2 text-left class="file-icon-container">
                                                    <v-icon
                                                      :color="message.senderUserId && message.senderUserId._id === userId ? 'white' : '#1A73E9'"
                                                      size="24">
                                                      mdi-file-pdf-box
                                                    </v-icon>
                                                  </v-flex>
                                                  <v-flex xs10 text-left>
                                                    <div class="file-name">
                                                      {{ message.file?.fileName || message.originalFileName }}
                                                    </div>
                                                  </v-flex>
                                                </v-layout>

                                                <!-- Message Text -->
                                                <div v-if="message.text || message.content" class="file-text mt-2">
                                                  {{ message.text || message.content }}
                                                </div>
                                              </div>

                                              <!-- Other file types (video, audio, etc) -->
                                              <div
                                                v-else-if="message.messageType === 'FILE' || message.messageType === 'file' || message.messageType === 'VIDEO' || message.messageType === 'video' || message.messageType === 'AUDIO' || message.messageType === 'audio'"
                                                class="file-message">
                                                <!-- Clickable File Section -->
                                                <v-layout wrap justify-start class="file-container"
                                                  :class="{ clickable: true }"
                                                  @click="openFile(message.file?.url || getFileUrl(message.file?.key || message.fileId))">
                                                  <v-flex xs2 text-left class="file-icon-container">
                                                    <v-icon
                                                      :color="message.senderUserId && message.senderUserId._id === userId ? 'white' : '#1A73E9'"
                                                      size="24">
                                                      {{ getFileIcon(message.messageType) }}
                                                    </v-icon>
                                                  </v-flex>
                                                  <v-flex xs10 text-left>
                                                    <div class="file-name">
                                                      {{ message.file?.fileName || message.originalFileName }}
                                                    </div>
                                                  </v-flex>
                                                </v-layout>

                                                <!-- Message Text -->
                                                <div v-if="message.text || message.content" class="file-text mt-2">
                                                  {{ message.text || message.content }}
                                                </div>
                                              </div>

                                              <!-- Message timestamp -->
                                              <div class="message-time">
                                                {{
                                                  formatTime(
                                                    message.create_date
                                                  )
                                                }}
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
                      <!-- </v-flex> -->
                      <!-- </v-layout> -->
                      <v-layout justify-center class="message-input-section">
                        <v-flex xs12 align-self-center>
                          <!-- <v-divider></v-divider> -->
                          <v-layout justify-center class="pa-5">
                            <v-flex xs12 sm11>
                              <v-layout justify-center align-center>
                                <v-flex v-if="canEdit('customer_support')" shrink align-self-center class="pr-3">
                                  <v-btn icon large color="#1A73E9" @click="triggerFileInput" class="attachment-btn">
                                    <v-icon>mdi-paperclip</v-icon>
                                  </v-btn>
                                  <input ref="fileInput" v-show="false" type="file" accept="application/pdf,image/*"
                                    @change="uploadDoc" />
                                </v-flex>
                                <v-flex xs12 sm8 md9>
                                  <v-text-field v-model="message" hide-details="auto" outlined
                                    placeholder="Type your message..." class="message-input" solo flat
                                    :disabled="!canEdit('customer_support')" @keydown.enter.prevent="sendMessage">
                                    <template v-slot:append>
                                      <v-chip v-if="uploadedFileName" close small color="#e3f2fd" class="file-chip"
                                        @click:close="removeFile">
                                        <v-icon small left color="#1A73E9">mdi-file-pdf-box</v-icon>
                                        <span class="filename-text">{{ truncateFileName(uploadedFileName, 20) }}</span>
                                      </v-chip>
                                    </template>
                                  </v-text-field>
                                </v-flex>
                                <v-flex shrink align-self-center class="pl-3">
                                  <PermissionButton v-if="canEdit('customer_support')" module-name="customer_support"
                                    permission="edit" color="#1A73E9" rounded depressed elevation="2" height="48"
                                    class="send-btn px-6" @click="sendMessage">
                                    <v-icon left>mdi-send</v-icon>
                                    <span class="send-text">Send</span>
                                  </PermissionButton>
                                </v-flex>
                              </v-layout>
                            </v-flex>
                          </v-layout>
                        </v-flex>
                      </v-layout>
                    </v-card>
                  </v-flex>
                </v-layout>
              </v-flex>
            </v-layout>
          </v-tab-item>

          <!-- WhatsApp Chat Tab -->
          <v-tab-item>
            <WhatsAppChat />
          </v-tab-item>
        </v-tabs-items>
      </v-flex>
    </v-layout>
  </div>
</template>
<script>
import Socket from "@/Sockets/socket.js";
import { files } from "@/api";
import {
  getSupportConversations,
  getMessagesByUser,
  markChatsRead,
} from "@/api/modules/chat";
import permissionMixin from '@/mixins/permissionMixin';
import PermissionButton from '@/components/Common/PermissionButton.vue';
import WhatsAppChat from './whatsAppChat.vue';

export default {
  components: {
    PermissionButton,
    WhatsAppChat,
  },
  mixins: [permissionMixin],
  data() {
    return {
      activeTab: 0,
      appLoading: false,
      ServerError: false,
      showSnackBar: false,
      timeout: 5000,
      msg: null,
      message: null,
      uploadedFileName: "",
      chatData: [],
      profileData: {},
      adminId: null,
      socketConnected: false,
      chatType: 'support', // Filter to only show support chat messages
      file: null,
      uploadedFileInfo: null, // Store uploaded file information (key, url, type)
      currentPage: 1,
      limit: 20,
      fileSize: 5,
      hasMoreMessages: false,
      isLoadingMore: false,
      lastLoadedPage: 1,
      totalMessages: 0,
      isFirstLoad: true,
      welcomeMessages: [
        {
          id: "welcome-1",
          text: "Welcome to Customer Support!",
          timestamp: new Date(),
          isWelcomeMessage: true,
        },
        {
          id: "welcome-2",
          text: "How can we assist you today?",
          timestamp: new Date(),
          isWelcomeMessage: true,
        },
      ],
      showLoadMoreChip: false,
      lastScrollPosition: 0,
      scrollThreshold: 100, // Distance from top to trigger chip
      recentUsers: [],
      selectedUserId: null,
      searchQuery: "",
      usercurrentPage: 1,
      usersPerPage: 7,
      totalUsers: 0,
      loadingUsers: false,
      hasMoreUsers: false,
    };
  },
  beforeMount() {
    this.getRecentUsers();
    this.getprofileData();
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
    filteredUsers() {
      if (!this.searchQuery) return this.recentUsers;
      const query = this.searchQuery.toLowerCase();
      const filtered = this.recentUsers.filter(
        (user) =>
          user.fullName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
      return filtered;
    },
  },
  mounted() {
    // Handle filter parameter from route (e.g., from dashboard)
    const filterFromRoute = this.$route.query.filter;
    if (filterFromRoute === 'unregistered' || filterFromRoute === 'registered') {
      this.activeTab = 1; // Set to WhatsApp Chat tab (index 1)
    }

    this.socketData();
    // Preselect user from route if provided
    const userIdFromRoute = this.$route.query.userId;
    if (userIdFromRoute) {
      // Delay a tick to ensure users list load may start
      this.$nextTick(() => {
        this.preselectUser(userIdFromRoute);
      });
    }
  },
  beforeDestroy() {
    // Clean up socket listeners when component is destroyed
    Socket.cleanupSocket(this);
  },
  methods: {
    socketData() {
      // Initialize socket connection with our custom socket service
      Socket.initializeSocket(this);

      // Set up event listeners for component-specific events if needed
      const socket = Socket.getSocket();
      if (socket) {
        // You can add additional socket event listeners here if needed
      }
    },
    handleScroll(event) {
      const container = event.target;
      const scrollTop = container.scrollTop;

      // Only show chip if there are actually more messages to load
      this.showLoadMoreChip =
        scrollTop < this.scrollThreshold &&
        this.hasMoreMessages &&
        this.chatData.length < this.totalMessages;
    },
    async loadMoreMessages() {
      if (this.isLoadingMore || !this.hasMoreMessages) return;

      this.isLoadingMore = true;

      // Calculate next page based on lastLoadedPage
      const nextPage = this.lastLoadedPage + 1;

      try {
        const { success, data, metadata } = await getMessagesByUser({
          userId: this.selectedUserId,
          page: nextPage,
          size: this.limit,
        });
        const oldMessages = success ? data : [];
        if (metadata?.total) {
          this.totalMessages = metadata.total;
        }
        if (oldMessages.length > 0) {
          const container = this.$refs.chatContainer;
          const oldScrollHeight = container.scrollHeight;

          // Map the messages to the correct format
          const formattedMessages = oldMessages.map(message => ({
            _id: message.id,
            text: message.content,
            messageType: message.messageType?.toUpperCase() || 'TEXT',
            file: message.file,
            originalFileName: message.originalFileName || '',
            create_date: message.createdAt,
            senderType: message.senderType,
            senderUserId: message.senderType === 'user' ? { _id: this.selectedUserId } : null,
            senderAdminId: message.senderType === 'admin' ? { _id: this.adminId } : null
          }));

          // Reverse the older messages and add them to the beginning of the chat data
          // since we're displaying messages in reverse chronological order
          this.chatData = [...formattedMessages.reverse(), ...this.chatData];
          this.lastLoadedPage = nextPage;

          this.$nextTick(() => {
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - oldScrollHeight;
            container.scrollTop = scrollDiff;
          });
        }

        // Update whether we have more messages
        this.hasMoreMessages = this.chatData.length < this.totalMessages;

        // Hide chip if no more messages
        if (!this.hasMoreMessages) {
          this.showLoadMoreChip = false;
        }
      } catch (err) {
        this.appLoading = false;
        this.ServerError = true;
        this.msg = "Failed to load more messages";
        this.showSnackBar = true; // Show Snackbar for all error cases
        console.log(err);
      } finally {
        this.isLoadingMore = false;
      }
    },
    socketAuth() {
      Socket.authFunction(this); // <---read data
    },
    triggerFileInput() {
      this.$refs.fileInput.click(); // Programmatically trigger the file input
    },
    async uploadDoc(event) {
      const file = event.target.files[0]; // Get the uploaded file
      if (file) {
        // Check if same file is already selected (not sent yet)
        if (this.uploadedFileName === file.name && this.file &&
          this.file.size === file.size &&
          this.file.lastModified === file.lastModified) {
          this.msg = "This file is already selected for upload";
          this.showSnackBar = true;
          // Reset file input
          event.target.value = '';
          return;
        }

        // Validate file size (max 10MB)
        const maxSize = this.fileSize * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
          this.msg = "File size must be less than " + this.fileSize + "MB";
          this.showSnackBar = true;
          // Reset file input
          event.target.value = '';
          return;
        }

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          // 'image/gif',
          // 'video/mp4',
          // 'audio/mpeg',
          // 'audio/wav'
        ];

        if (!allowedTypes.includes(file.type)) {
          this.msg = "File type not supported. Please upload PDF, images, videos, or audio files.";
          this.showSnackBar = true;
          // Reset file input
          event.target.value = '';
          return;
        }

        // Allow duplicate files - removed the duplicate check to enable uploading the same file multiple times

        this.file = file; // Store the file in the component's data
        this.uploadedFileName = file.name; // Set the file name
        this.appLoading = true;
        try {
          const response = await files.uploadFile(this.selectedUserId, file, 'chat_attachment');
          this.appLoading = false;
          console.log(response);

          if (response && response.success) {
            // Store the file information for later use when sending the message
            this.uploadedFileInfo = {
              key: response.fileId,
              url: response.url,
              type: this.getFileMessageType(file.type),
              presignedExpiresIn: response.presignedExpiresIn
            };

            // Show success notification
            this.msg = "File uploaded successfully. Click Send to deliver the message.";
            this.showSnackBar = true;
          } else {
            this.msg = "File upload failed. Please try again.";
            this.showSnackBar = true;
            this.removeFile();
          }
        } catch (error) {
          this.appLoading = false;
          console.error('Error uploading file:', error);
          this.msg = "An error occurred while uploading the file";
          this.showSnackBar = true;
          this.removeFile();
        }
      }
    },
    getUserInitials(name) {
      return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    },
    selectUser(user) {
      this.selectedUserId = user.userId;
      this.selectedUser = user;
      // Reset unread count when selecting user
      const userIndex = this.recentUsers.findIndex(
        (u) => u.userId === user.userId
      );
      if (userIndex !== -1) {
        this.recentUsers[userIndex].unreadCount = 0;
      }
      this.loadUserMessages(user.userId);
      this.markReadForSelected();
    },
    async loadUserMessages() {
      this.appLoading = true;
      try {
        const { success, data, metadata } = await getMessagesByUser({
          userId: this.selectedUserId,
          page: 1,
          size: this.limit,
        });
        this.appLoading = false;
        // Format messages to match the expected structure
        if (success && data.length > 0) {
          const formattedMessages = data.map(message => ({
            _id: message.id,
            text: message.content,
            messageType: message.messageType?.toUpperCase() || 'TEXT',
            file: message.file,
            originalFileName: message.originalFileName || '',
            create_date: message.createdAt,
            senderType: message.senderType,
            senderUserId: message.senderType === 'user' ? { _id: this.selectedUserId } : null,
            senderAdminId: message.senderType === 'admin' ? { _id: this.adminId } : null
          }));
          // Reverse the messages to show them in the correct order
          this.chatData = formattedMessages.reverse();
        } else {
          this.chatData = [];
        }

        this.totalMessages = metadata?.total || this.chatData.length;
        this.hasMoreMessages = this.chatData.length < this.totalMessages;
        this.scrollToBottom();
      } catch (err) {
        this.appLoading = false;
        this.ServerError = true;
        this.msg = "Failed to fetch messages";
        this.showSnackBar = true;
        console.log(err);
      }
    },
    removeFile() {
      this.file = null;
      this.uploadedFileName = "";
      this.uploadedFileInfo = null; // Clear uploaded file info to switch back to text mode
      // Reset the file input to allow selecting the same file again
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    async sendMessage() {
      if (!this.message && !this.uploadedFileInfo) {
        this.msg = "Please enter a message or attach a file";
        this.showSnackBar = true;
        return;
      }

      if (!this.selectedUserId) {
        this.msg = "Please select a user to send message to";
        this.showSnackBar = true;
        return;
      }

      if (!this.socketConnected) {
        this.msg = "Not connected to chat server. Please refresh the page.";
        this.showSnackBar = true;
        return;
      }

      try {
        // this.appLoading = true;
        let messageData;

        // Check if we have an uploaded file to send
        if (this.uploadedFileInfo) {
          // Prepare message data with the file key and appropriate type
          messageData = {
            chatType: 'support',
            messageType: this.uploadedFileInfo.type, // 'image', 'document', 'video', 'audio', or 'file'
            content: this.message || ".",
            userId: this.selectedUserId,
            fileId: this.uploadedFileInfo.key, // Using the key from the upload response
            fileName: this.uploadedFileName
          };
        } else {
          // Regular text message
          messageData = {
            chatType: 'support',
            messageType: 'text',
            content: this.message,
            userId: this.selectedUserId
          };
        }

        // Send message through socket
        const success = await Socket.sendChatMessage(this, messageData);
        this.appLoading = false;

        if (success) {
          // Clear input fields
          this.message = '';
          this.removeFile();
          this.uploadedFileInfo = null;
        } else {
          this.msg = "Failed to send message. Please try again.";
          this.showSnackBar = true;
        }
      } catch (error) {
        console.error('Error sending message:', error);
        this.msg = "An error occurred while sending the message";
        this.showSnackBar = true;
        this.appLoading = false;
      }
    },
    getFileMessageType(mimeType) {
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.startsWith('audio/')) return 'audio';
      if (mimeType === 'application/pdf') return 'document';
      return 'file';
    },
    truncateFileName(fileName, maxLength) {
      if (!fileName) return '';
      if (fileName.length <= maxLength) return fileName;

      const extension = fileName.lastIndexOf('.') > -1 ? fileName.substring(fileName.lastIndexOf('.')) : '';
      const name = fileName.substring(0, fileName.length - extension.length);

      // Keep the extension and truncate the name part
      const truncatedName = name.substring(0, maxLength - extension.length - 3) + '...';
      return truncatedName + extension;
    },
    generateYears() {
      const currentYear = new Date().getFullYear();
      this.claimyearList = Array.from({ length: 5 }, (_, i) => currentYear - i); // Generate years from current year to 5 years back
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const chatContainer = this.$refs.chatContainer;
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });
    },
    formatTime(date) {
      if (!date) return "";
      const dt = new Date(date);
      return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
    getprofileData() {
      this.appLoading = true;
      // Profile endpoint migration unknown; keep legacy if available via interceptor, else ignore silently
      this.appLoading = false;
    },
    loadMoreUsers() {
      if (!this.loadingUsers && this.hasMoreUsers) {
        this.usercurrentPage += 1;
        this.getData(this.usercurrentPage);
      }
    },
    async getRecentUsers(page = 1) {
      this.appLoading = true;
      try {
        const { success, data, metadata } = await getSupportConversations({
          // page,
          // size: this.usersPerPage,
        });
        const conversations = success ? data : [];
        const mappedUsers = conversations.map((c) => ({
          userId: c.user?.id || c.userId,
          fullName: c.user?.name || c.user?.fullName || "User",
          email: c.user?.email || "",
          unreadCount: c.unreadCount || 0,
          content: c.content || "", // Include the message content from the conversation
          ppsNumber: c.user?.ppsNumber || "", // Include PPS number if available
          createdAt: c.createdAt || new Date().toISOString(), // Include timestamp for message
        }));

        if (page === 1) {
          this.recentUsers = mappedUsers;
        } else {
          this.recentUsers = [...this.recentUsers, ...mappedUsers];
        }
        this.totalUsers = metadata?.total || this.recentUsers.length;
        this.hasMoreUsers = this.recentUsers.length < this.totalUsers;
        this.loadingUsers = false;
        this.appLoading = false;
      } catch (err) {
        this.ServerError = true;
        this.msg = "Failed to fetch recent users";
        this.showSnackBar = true;
        this.appLoading = false;
        console.log(err);
      }
    },
    preselectUser(userId) {
      // Try to select if exists; otherwise, fetch first page and then select
      const existing = this.recentUsers.find((u) => u.userId === userId);
      if (existing) {
        this.selectUser(existing);
      } else {
        // Ensure the list is loaded, then select
        this.getRecentUsers(1).then(() => {
          const found = this.recentUsers.find((u) => u.userId === userId);
          if (found) this.selectUser(found);
        });
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
    formatMessageDate(date) {
      if (!date) return "";
      const messageDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const messageDay = new Date(messageDate);
      messageDay.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Format fay's messages
      if (messageDay.getTime() === today.getTime()) {
        return "Today";
      }
      // Format for yeserday's messages
      else if (messageDay.getTime() === yesterday.getTime()) {
        return "Yesterday";
      }
      // Format for olde messages - show date as DD/MM/YYYY
      else {
        const day = messageDate.getDate().toString().padStart(2, "0");
        const month = (messageDate.getMonth() + 1).toString().padStart(2, "0");
        const year = messageDate.getFullYear();
        return `${day}/${month}/${year}`;
      }
    },
    formatDateHeader(date) {
      return date; // Already formatted by formatDateOnly
    },
    openFile(url) {
      window.open(url, "_blank");
    },
    getFileUrl(key) {
      if (!key) return '';
      return files.getFileUrl(key);
    },
    getFileIcon(fileType) {
      const type = (fileType || '').toLowerCase();
      switch (type) {
        case 'video':
          return 'mdi-file-video';
        case 'audio':
          return 'mdi-file-music';
        case 'image':
          return 'mdi-file-image';
        case 'document':
          return 'mdi-file-pdf-box';
        default:
          return 'mdi-file-document-outline';
      }
    },
    async markReadForSelected() {
      try {
        if (!this.selectedUserId) return;
        await markChatsRead({
          chatType: "support",
          userId: this.selectedUserId,
        });
      } catch (e) {
        // non-fatal
      }
    },
  },
};
</script>
<style scoped>
.date-header {
  margin: 24px 0 12px 0;
}

.admin-message.welcome-message .message-content {
  background-color: #eaf3ff;
}

.date-chip {
  background-color: #ffffff !important;
  color: #757575 !important;
  font-size: 11px !important;
  font-family: DMSans;
  font-weight: 500;
  border: 1px solid #e0e0e0 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
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
  margin-bottom: 8px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-message {
  justify-content: flex-end;
}

.admin-message {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  line-height: 1.5;
}

.user-message .message-content {
  background: linear-gradient(135deg, #1A73E9 0%, #2c84f9 100%);
  margin-left: auto;
  color: #ffffff;
  font-family: DMSans;
  font-weight: 400;
  font-size: 14px;
  border-bottom-right-radius: 4px;
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

.file-chip {
  max-width: 100%;
  display: flex;
  align-items: center;
}

.filename-text {
  display: inline-block;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

.admin-message .message-content {
  background-color: #f5f5f5;
  margin-right: auto;
  color: #1c1c1c;
  font-family: DMSans;
  font-weight: 400;
  font-size: 14px;
  border-bottom-left-radius: 4px;
  border: 1px solid #e8e8e8;
}

.message-time {
  font-size: 10px;
  margin-top: 6px;
  opacity: 0.7;
  text-align: right;
  font-family: DMSans;
  font-weight: 400;
}

.chat-container {
  height: calc(93vh - 344px);

  overflow-y: auto;
  scroll-behavior: smooth;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: #fafafa;
}

.v-progress-circular {
  margin: 10px auto;
}

.responsive-card {
  height: calc(93vh - 150px);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

}

.grey--text.text--darken-1 {
  font-family: DMSans;
  font-weight: 500;
  font-size: 18px;
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
  transition: all 0.3s ease;
  position: sticky;
  top: 0;
  z-index: 1;
  font-family: DMSans;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  padding: 10px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.file-container.clickable {
  cursor: pointer;
}

.file-container.clickable:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.users-list-card {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

/* @media (max-width: 600px) {
  .users-list-card {
    height: 600px;
  }
} */

.chat-users-list {
  height: calc(95vh - 241px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.chat-users-list .v-list-item {
  transition: all 0.2s ease;
  border-bottom: 1px solid #f5f5f5;
}

.chat-users-list .v-list-item:hover {
  background-color: #f9f9f9;
}

@media (max-width: 600px) {
  .chat-users-list {
    max-height: 220px;
    /* Adjust this value as needed */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .users-list-card {
    height: 300px;
    margin-bottom: 16px;
  }
}

.selected-user {
  background-color: #e3f2fd !important;
  border-left: 3px solid #1A73E9;
}

.user-name {
  font-family: DMSans;
  font-weight: 600;
  font-size: 14px;
  color: #1c1c1c;
  margin-bottom: 2px;
}

.user-email {
  font-family: DMSans;
  font-size: 12px;
  color: #757575;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timestamp-text {
  font-family: DMSans;
  font-size: 11px;
  color: #4CAF50;
  font-weight: 500;
  white-space: nowrap;
}

.unread-badge {
  font-size: 11px;
  height: 22px !important;
  min-width: 22px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(26, 115, 233, 0.3);
}

/* Message Input Section Styling */
.message-input-section {
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.message-input {
  border-radius: 24px !important;
}

.message-input>>>.v-input__control {
  border-radius: 24px !important;
}

.message-input>>>.v-input__slot {
  padding: 8px 20px !important;
  min-height: 48px !important;
  border-radius: 24px !important;
  background-color: #f5f5f5 !important;
  border: 1px solid #e0e0e0 !important;
  transition: all 0.3s ease;
}

.message-input>>>.v-input__slot:hover {
  background-color: #eeeeee !important;
  border-color: #1A73E9 !important;
}

.message-input>>>.v-text-field__slot input {
  font-family: DMSans;
  font-size: 14px;
  color: #1c1c1c;
}

.message-input>>>.v-text-field__slot input::placeholder {
  color: #9e9e9e;
  font-family: DMSans;
}

.attachment-btn {
  transition: all 0.3s ease;
}

.attachment-btn:hover {
  background-color: #e3f2fd !important;
  transform: rotate(45deg);
}

.send-btn {
  font-family: DMSans;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(26, 115, 233, 0.3) !important;
}

.send-btn:hover {
  box-shadow: 0 4px 12px rgba(26, 115, 233, 0.4) !important;
  transform: translateY(-2px);
}

.send-text {
  font-family: DMSans;
  font-weight: 600;
  font-size: 15px;
  color: white;
}

.file-chip {
  font-family: DMSans;
  font-size: 12px;
  max-width: 200px;
  border: 1px solid #1A73E9;
}

/* @media (max-width: 600px) {
  .users-list-card {
    height: 300px;
    margin-bottom: 16px;
  }
} */
.view-more-chip {
  margin: 16px 0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.view-more-chip:hover {
  background-color: rgba(26, 115, 233, 0.1);
}

.no-results-text {
  font-family: DMSans;
  font-size: 14px;
  color: #666666;
  margin-top: 8px;
}

.connection-alert {
  font-family: DMSans;
  font-size: 13px;
  /* margin: 8px 16px; */
  border-radius: 8px;
}

.connection-alert .v-icon {
  font-size: 18px;
}

/* Tabs Styling */
.support-tabs {
  border-bottom: 1px solid #e0e0e0;
}

.support-tabs .v-tab {
  font-family: DMSans;
  font-weight: 500;
  font-size: 14px;
  text-transform: none;
  letter-spacing: 0.5px;
}

.support-tabs .v-tab--active {
  color: #1A73E9;
}
</style>