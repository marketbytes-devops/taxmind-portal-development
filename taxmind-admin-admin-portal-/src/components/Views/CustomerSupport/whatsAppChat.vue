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

        <div wrap justify-center>
            <v-flex xs11 sm11 md11 lg11 xl11 pb-5>
                <!-- Header Section -->
                <!-- <v-layout wrap justify-start class="my-3">
            <v-flex
              xs12
              sm12
              md12
              lg12
              text-start
              align-center
              pt-2
              class="carousalhead"
              >Customer Support
            </v-flex>
          </v-layout> -->

                <!-- Connection Status Indicator -->
                <!-- <v-layout wrap justify-center>
            <v-flex xs12>
              <v-alert v-if="!socketConnected" type="warning" dense outlined class="connection-alert">
                <v-icon left>mdi-wifi-off</v-icon>
                Not connected to chat server. Messages may not be delivered.
              </v-alert>
              <v-alert v-else type="success" dense outlined class="connection-alert">
                <v-icon left>mdi-wifi</v-icon>
                Connected to chat server
              </v-alert>
            </v-flex>
          </v-layout> -->

                <v-layout wrap justify-start>
                    <v-flex xs12 sm4 text-start align-center pt-2 class="carousalhead">
                        <!-- Users List -->
                        <div>
                            <v-flex xs12>
                                <v-flex xs12 text-start align-center pt-2>
                                    <v-card flat class="users-list-card">
                                        <!-- Search Bar -->
                                        <v-layout wrap justify-center>
                                            <v-flex xs12 style="
    padding: 10px;
">
                                                <v-text-field v-model="searchQuery" placeholder="Search users..."
                                                    prepend-inner-icon="mdi-magnify" outlined dense hide-details
                                                    class="search-field"></v-text-field>
                                            </v-flex>
                                            <v-flex xs12 pt-2>
                                                <v-tabs v-model="activeTab" background-color="transparent"
                                                    color="#1A73E9" slider-color="#1A73E9">
                                                    <v-tab key="all">All</v-tab>
                                                    <v-tab key="registered">Registered</v-tab>
                                                    <v-tab key="unregistered">Unregistered</v-tab>
                                                </v-tabs>
                                            </v-flex>
                                        </v-layout>

                                        <!-- Users List -->
                                        <v-layout wrap justify-center style="height: calc(93vh - 205px);">
                                            <v-flex xs12 pt-4>
                                                <v-list class="chat-users-list">
                                                    <v-list-item v-if="filteredUsers.length === 0">
                                                        <v-list-item-content class="text-center">
                                                            <v-icon large
                                                                color="grey lighten-1">mdi-account-search</v-icon>
                                                            <div class="no-results-text mt-2">
                                                                No users found
                                                            </div>
                                                        </v-list-item-content>
                                                    </v-list-item>
                                                    <template v-else>
                                                        <v-list-item v-for="user in filteredUsers" :key="user.userId"
                                                            @click="selectUser(user)" :class="{
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
                                                                <v-list-item-title class="user-name"
                                                                    style="text-transform: capitalize">
                                                                    <span v-if="user.isRegistered">{{ user.userName
                                                                        }}</span>
                                                                    <span v-else>{{ user.phone }}</span>
                                                                </v-list-item-title>
                                                                <v-list-item-subtitle class="user-email">
                                                                    <span v-if="user.isRegistered">{{ user.phone
                                                                        }}</span>
                                                                    <span v-else>{{ user.content }}</span>
                                                                </v-list-item-subtitle>
                                                            </v-list-item-content>

                                                            <v-list-item-action>
                                                                <div class="d-flex flex-column align-end">
                                                                    <div class="timestamp-text">{{
                                                                        formatMessageDate(user.createdAt) }}</div>
                                                                    <v-chip v-if="user.unreadCount > 0" small
                                                                        color="primary" class="unread-badge mt-1">
                                                                        {{ user.unreadCount }}
                                                                    </v-chip>
                                                                </div>
                                                            </v-list-item-action>
                                                        </v-list-item>
                                                    </template>
                                                    <!-- View More Chip -->
                                                    <!-- <v-layout wrap justify-center class="pa-2"
                                                        v-if="hasMoreUsers && !searchQuery">
                                                        <v-chip outlined color="#1A73E9" class="view-more-chip"
                                                            @click="loadMoreUsers" :disabled="loadingUsers">
                                                            <v-progress-circular v-if="loadingUsers" indeterminate
                                                                color="#1A73E9" size="16"
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
                        </div>
                    </v-flex>
                    <v-flex xs12 sm8 text-start align-center pt-2>
                        <v-layout wrap justify-center>
                            <v-flex xs12 pt-2>
                                <v-card flat elevation="0" class="d-flex flex-column responsive-card"
                                    v-if="!selectedUserId">
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
                                                    <v-flex xs8 sm8 md9 text-start>
                                                        <span class="sprtitle" v-if="selectedUser"
                                                            style="text-transform: capitalize">
                                                            <span v-if="selectedUser.isRegistered">{{
                                                                selectedUser.userName }}</span>
                                                            <span v-else>{{ selectedUser.phone }}</span>
                                                        </span>
                                                        <br />
                                                        <span class="sprtitle2" v-if="selectedUser">
                                                            <span v-if="selectedUser.isRegistered">{{ selectedUser.phone
                                                                }}</span>
                                                            <span v-else>Unregistered User</span>
                                                        </span>
                                                    </v-flex>
                                                    <v-flex xs2 sm2 md2 text-end align-self-center>
                                                        <v-btn icon color="#1A73E9" @click="refreshChat"
                                                            :loading="refreshing">
                                                            <v-icon>mdi-refresh</v-icon>
                                                        </v-btn>
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
                                                <v-flex xs12 class="chat-container" ref="chatContainer"
                                                    @scroll="handleScroll">
                                                    <v-layout wrap justify-center class="pa-2"
                                                        v-if="showLoadMoreChip && hasMoreMessages">
                                                        <v-chip outlined color="#1A73E9" class="load-more-chip"
                                                            @click="loadMoreMessages" :disabled="isLoadingMore">
                                                            <v-progress-circular v-if="isLoadingMore" indeterminate
                                                                color="#1A73E9" size="16"
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
                                                            <v-flex v-for="message in group"
                                                                :key="message._id || message.id" xs12 :class="{
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
                                                                                        {{ message.text ||
                                                                                            message.content }}
                                                                                    </div>

                                                                                    <!-- Image message -->
                                                                                    <div v-else-if="message.messageType === 'IMAGE' || message.messageType === 'image'"
                                                                                        class="file-message">
                                                                                        <!-- Image preview with download -->
                                                                                        <div
                                                                                            class="whatsapp-image-container">
                                                                                            <v-img
                                                                                                v-if="message.mediaUrl"
                                                                                                :src="message.mediaUrl"
                                                                                                max-height="200" contain
                                                                                                class="rounded-lg mb-2 clickable-image"
                                                                                                @click="openFile(message._id)">
                                                                                            </v-img>
                                                                                            <div v-else
                                                                                                class="image-placeholder"
                                                                                                @click="loadAndShowImage(message)">
                                                                                                <v-icon size="64"
                                                                                                    color="#1A73E9">mdi-image</v-icon>
                                                                                                <div class="mt-2">Click
                                                                                                    to load image</div>
                                                                                            </div>
                                                                                        </div>

                                                                                        <!-- Message Text -->
                                                                                        <div v-if="message.text || message.content"
                                                                                            class="file-text mt-2">
                                                                                            {{ message.text ||
                                                                                                message.content }}
                                                                                        </div>
                                                                                    </div>

                                                                                    <!-- Document message -->
                                                                                    <div v-else-if="message.messageType === 'DOCUMENT' || message.messageType === 'document'"
                                                                                        class="file-message">
                                                                                        <!-- PDF Preview or Download -->
                                                                                        <div v-if="message.mediaUrl"
                                                                                            class="pdf-preview-container">
                                                                                            <iframe
                                                                                                :src="message.mediaUrl"
                                                                                                width="100%"
                                                                                                height="400px"
                                                                                                class="pdf-iframe">
                                                                                            </iframe>
                                                                                            <v-btn small color="#1A73E9"
                                                                                                dark class="mt-2"
                                                                                                @click="openFile(message._id)">
                                                                                                <v-icon left
                                                                                                    small>mdi-download</v-icon>
                                                                                                Download PDF
                                                                                            </v-btn>
                                                                                        </div>
                                                                                        <!-- Clickable File Section -->
                                                                                        <v-layout v-else wrap
                                                                                            justify-start
                                                                                            class="file-container"
                                                                                            :class="{ clickable: true }"
                                                                                            @click="loadAndShowDocument(message)">
                                                                                            <v-flex xs2 text-left
                                                                                                class="file-icon-container">
                                                                                                <v-icon
                                                                                                    :color="message.senderUserId && message.senderUserId._id === userId ? 'white' : '#1A73E9'"
                                                                                                    size="24">
                                                                                                    mdi-file-pdf-box
                                                                                                </v-icon>
                                                                                            </v-flex>
                                                                                            <v-flex xs10 text-left>
                                                                                                <div class="file-name">
                                                                                                    {{
                                                                                                        message.file?.fileName
                                                                                                        ||
                                                                                                        message.originalFileName
                                                                                                        || 'Document'
                                                                                                    }}
                                                                                                </div>
                                                                                                <div class="file-hint">
                                                                                                    Click to preview
                                                                                                </div>
                                                                                            </v-flex>
                                                                                        </v-layout>

                                                                                        <!-- Message Text -->
                                                                                        <div v-if="message.text || message.content"
                                                                                            class="file-text mt-2">
                                                                                            {{ message.text ||
                                                                                                message.content }}
                                                                                        </div>
                                                                                    </div>

                                                                                    <!-- Other file types (video, audio, etc) -->
                                                                                    <div v-else-if="message.messageType === 'FILE' || message.messageType === 'file' || message.messageType === 'VIDEO' || message.messageType === 'video' || message.messageType === 'AUDIO' || message.messageType === 'audio'"
                                                                                        class="file-message">
                                                                                        <!-- Clickable File Section -->
                                                                                        <v-layout wrap justify-start
                                                                                            class="file-container"
                                                                                            :class="{ clickable: true }"
                                                                                            @click="openFile(message._id)">
                                                                                            <v-flex xs2 text-left
                                                                                                class="file-icon-container">
                                                                                                <v-icon
                                                                                                    :color="message.senderUserId && message.senderUserId._id === userId ? 'white' : '#1A73E9'"
                                                                                                    size="24">
                                                                                                    {{
                                                                                                        getFileIcon(message.messageType)
                                                                                                    }}
                                                                                                </v-icon>
                                                                                            </v-flex>
                                                                                            <v-flex xs10 text-left>
                                                                                                <div class="file-name">
                                                                                                    {{
                                                                                                        message.file?.fileName
                                                                                                        ||
                                                                                                        message.originalFileName
                                                                                                    }}
                                                                                                </div>
                                                                                            </v-flex>
                                                                                        </v-layout>

                                                                                        <!-- Message Text -->
                                                                                        <div v-if="message.text || message.content"
                                                                                            class="file-text mt-2">
                                                                                            {{ message.text ||
                                                                                                message.content }}
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
                                                        <v-flex v-if="canEdit('customer_support')" shrink
                                                            align-self-center class="pr-3">
                                                            <v-btn icon large color="#1A73E9" @click="triggerFileInput"
                                                                class="attachment-btn">
                                                                <v-icon>mdi-paperclip</v-icon>
                                                            </v-btn>
                                                            <input ref="fileInput" v-show="false" type="file"
                                                                accept="application/pdf,image/*" @change="uploadDoc" />
                                                        </v-flex>
                                                        <v-flex xs12 sm8 md9>
                                                            <v-text-field v-model="message" hide-details="auto" outlined
                                                                placeholder="Type your message..." class="message-input"
                                                                solo flat :disabled="!canEdit('customer_support')"
                                                                @keydown.enter.prevent="sendMessage">
                                                                <template v-slot:append>
                                                                    <v-chip v-if="uploadedFileName" close small
                                                                        color="#e3f2fd" class="file-chip"
                                                                        @click:close="removeFile">
                                                                        <v-icon small left
                                                                            color="#1A73E9">mdi-file-pdf-box</v-icon>
                                                                        <span class="filename-text">{{
                                                                            truncateFileName(uploadedFileName, 20)
                                                                        }}</span>
                                                                    </v-chip>
                                                                </template>
                                                            </v-text-field>
                                                        </v-flex>
                                                        <v-flex shrink align-self-center class="pl-3">
                                                            <PermissionButton v-if="canEdit('customer_support')"
                                                                module-name="customer_support" permission="edit"
                                                                color="#1A73E9" rounded depressed elevation="2"
                                                                height="48" class="send-btn px-6" @click="sendMessage">
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
            </v-flex>
        </div>
    </div>
</template>
<script>

import {
    getWhatsAppConversations,
    getWhatsAppMessages,
    markWhatsAppRead,
    sendWhatsAppMessage,
    uploadWhatsAppMedia,
    downloadWhatsAppMedia,
} from "@/api/modules/chat";
import permissionMixin from '@/mixins/permissionMixin';
import PermissionButton from '@/components/Common/PermissionButton.vue';

export default {
    components: {
        PermissionButton,
    },
    mixins: [permissionMixin],
    data() {
        return {
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
            socketConnected: true, // Always true for WhatsApp (no socket needed)
            file: null,
            uploadedFileInfo: null,
            uploadedMediaId: null, // WhatsApp media ID
            currentPage: 1,
            limit: 20,
            fileSize: 5,
            hasMoreMessages: false,
            isLoadingMore: false,
            lastLoadedPage: 1,
            totalMessages: 0,
            isFirstLoad: true,
            showLoadMoreChip: false,
            lastScrollPosition: 0,
            scrollThreshold: 100,
            recentUsers: [],
            selectedUserId: null,
            selectedPhone: null, // WhatsApp phone number
            searchQuery: "",
            usercurrentPage: 1,
            usersPerPage: 10,
            totalUsers: 0,
            loadingUsers: false,
            hasMoreUsers: false,
            refreshing: false,
            activeTab: 0, // 0: All, 1: Registered, 2: Unregistered
            // WhatsApp configuration

        };
    },
    beforeMount() {
        this.getWhatsAppUsers();
    },
    watch: {},
    computed: {
        allMessages() {
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
            const query = this.searchQuery.toLowerCase();
            let filtered = this.recentUsers.filter(
                (user) =>
                    (user.fullName.toLowerCase().includes(query) ||
                    user.phone.toLowerCase().includes(query)) &&
                    user.senderType !== "admin"
            );

            // Filter by tab
            if (this.activeTab === 1) {
                // Registered users (have name property)
                filtered = filtered.filter(user => user.isRegistered);
            } else if (this.activeTab === 2) {
                // Unregistered users (no name property)
                filtered = filtered.filter(user => !user.isRegistered);
            }

            return filtered;
        },
    },
    mounted() {
        // Handle filter parameter from route (e.g., from dashboard)
        const filterFromRoute = this.$route.query.filter;
        if (filterFromRoute === 'unregistered') {
            this.activeTab = 2; // Set to Unregistered tab
        } else if (filterFromRoute === 'registered') {
            this.activeTab = 1; // Set to Registered tab
        }

        // Preselect user from route if provided
        const phoneFromRoute = this.$route.query.phone;
        if (phoneFromRoute) {
            this.$nextTick(() => {
                this.preselectUser(phoneFromRoute);
            });
        }
    },
    methods: {
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
            if (this.isLoadingMore || !this.hasMoreMessages || !this.selectedPhone) return;

            this.isLoadingMore = true;
            const nextPage = this.lastLoadedPage + 1;

            try {
                const { success, data, metadata } = await getWhatsAppMessages({
                    phone: this.selectedPhone,
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

                    this.chatData = [...formattedMessages.reverse(), ...this.chatData];
                    this.lastLoadedPage = nextPage;

                    this.$nextTick(() => {
                        const newScrollHeight = container.scrollHeight;
                        const scrollDiff = newScrollHeight - oldScrollHeight;
                        container.scrollTop = scrollDiff;
                    });
                }

                this.hasMoreMessages = this.chatData.length < this.totalMessages;
                if (!this.hasMoreMessages) {
                    this.showLoadMoreChip = false;
                }
            } catch (err) {
                this.appLoading = false;
                this.ServerError = true;
                this.msg = "Failed to load more messages";
                this.showSnackBar = true;
                console.log(err);
            } finally {
                this.isLoadingMore = false;
            }
        },
        triggerFileInput() {
            this.$refs.fileInput.click(); // Programmatically trigger the file input
        },
        async uploadDoc(event) {
            const file = event.target.files[0];
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

                // Validate file size (max 16MB for WhatsApp)
                const maxSize = this.fileSize * 1024 * 1024;
                if (file.size > maxSize) {
                    this.msg = "File size must be less than " + this.fileSize + "MB for WhatsApp";
                    this.showSnackBar = true;
                    // Reset file input
                    event.target.value = '';
                    return;
                }

                // Validate file type for WhatsApp
                const allowedTypes = [
                    'application/pdf',
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                ];

                if (!allowedTypes.includes(file.type)) {
                    this.msg = "File type not supported. WhatsApp supports PDF and images (JPEG, PNG, WEBP).";
                    this.showSnackBar = true;
                    // Reset file input
                    event.target.value = '';
                    return;
                }

                this.file = file;
                this.uploadedFileName = file.name;
                this.appLoading = true;

                try {
                    // Upload to WhatsApp (Facebook Graph API)
                    const response = await uploadWhatsAppMedia(
                        file,
                    );

                    this.appLoading = false;

                    if (response && response.success) {
                        this.uploadedMediaId = response.data.mediaId;
                        this.uploadedFileInfo = {
                            mediaId: response.data.mediaId,
                            type: this.getFileMessageType(file.type),
                        };

                        this.msg = "Media uploaded successfully. Click Send to deliver the message.";
                        this.showSnackBar = true;
                    } else {
                        this.msg = response.message || "Media upload failed. Please try again.";
                        this.showSnackBar = true;
                        this.removeFile();
                    }
                } catch (error) {
                    this.appLoading = false;
                    console.error('Error uploading media:', error);
                    this.msg = "An error occurred while uploading the media";
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
            this.selectedPhone = user.phone;
            this.selectedUser = user;
            const userIndex = this.recentUsers.findIndex(
                (u) => u.userId === user.userId
            );
            if (userIndex !== -1) {
                this.recentUsers[userIndex].unreadCount = 0;
            }
            this.loadUserMessages(user.phone);
            this.markReadForSelected();
        },
        async loadUserMessages(phone) {
            this.appLoading = true;
            this.lastLoadedPage = 1;
            try {
                const { success, data, metadata } = await getWhatsAppMessages({
                    phone: phone,
                    page: 1,
                    size: this.limit,
                });
                this.appLoading = false;

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
                this.msg = "Failed to fetch WhatsApp messages";
                this.showSnackBar = true;
                console.log(err);
            }
        },
        removeFile() {
            this.file = null;
            this.uploadedFileName = "";
            this.uploadedFileInfo = null;
            this.uploadedMediaId = null;
            // Reset the file input to allow selecting the same file again
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },
        async sendMessage() {
            if (!this.message && !this.uploadedMediaId) {
                this.msg = "Please enter a message or attach a media file";
                this.showSnackBar = true;
                return;
            }

            if (!this.selectedPhone) {
                this.msg = "Please select a contact to send message to";
                this.showSnackBar = true;
                return;
            }

            try {
                this.appLoading = true;
                let messageData;

                if (this.uploadedMediaId) {
                    messageData = {
                        phone: this.selectedPhone,
                        messageType: this.uploadedFileInfo.type,
                        content: this.message || "",
                        mediaId: this.uploadedMediaId,
                        fileName: this.uploadedFileName
                    };
                } else {
                    messageData = {
                        phone: this.selectedPhone,
                        messageType: 'text',
                        content: this.message,
                    };
                }

                const { success, message: responseMsg } = await sendWhatsAppMessage(messageData);
                this.appLoading = false;

                if (success) {
                    this.message = '';
                    this.removeFile();
                    await this.loadUserMessages(this.selectedPhone);
                } else {
                    this.msg = responseMsg || "Failed to send WhatsApp message. Please try again.";
                    this.showSnackBar = true;
                }
            } catch (error) {
                console.error('Error sending WhatsApp message:', error);
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
        loadMoreUsers() {
            if (!this.loadingUsers && this.hasMoreUsers) {
                this.usercurrentPage += 1;
                this.getData(this.usercurrentPage);
            }
        },
        async getWhatsAppUsers(page = 1) {
            this.loadingUsers = true;
            try {
                const { success, data, metadata } = await getWhatsAppConversations({

                });
                const conversations = success ? data : [];
                const mappedUsers = conversations.map((c) => ({
                    userId: c.id || c.phone,
                    phone: c.phone || "",
                    fullName: c.user?.name || c.phone || "WhatsApp User",
                    userName: c.user?.name || null,
                    isRegistered: !!c.user?.name,
                    email: "",
                    unreadCount: c.unreadCount || 0,
                    content: c.content || "",
                    ppsNumber: c.phone || "",
                    createdAt: c.createdAt || new Date().toISOString(),
                    senderType: c.senderType || "",
                }));

                if (page === 1) {
                    this.recentUsers = mappedUsers;
                } else {
                    this.recentUsers = [...this.recentUsers, ...mappedUsers];
                }
                this.totalUsers = metadata?.total || this.recentUsers.length;
                this.hasMoreUsers = this.recentUsers.length < this.totalUsers;
                this.loadingUsers = false;
            } catch (err) {
                this.ServerError = true;
                this.msg = "Failed to fetch WhatsApp conversations";
                this.showSnackBar = true;
                this.loadingUsers = false;
                console.log(err);
            }
        },
        preselectUser(phone) {
            const existing = this.recentUsers.find((u) => u.phone === phone);
            if (existing) {
                this.selectUser(existing);
            } else {
                this.getWhatsAppUsers(1).then(() => {
                    const found = this.recentUsers.find((u) => u.phone === phone);
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
        async loadAndShowImage(message) {
            if (!message._id) return;
            try {
                this.appLoading = true;
                const { success, data } = await downloadWhatsAppMedia({ messageId: message._id });
                this.appLoading = false;

                if (success && data?.url) {
                    // Update the message object with the media URL
                    this.$set(message, 'mediaUrl', data.url);
                } else {
                    this.msg = "Failed to load image";
                    this.showSnackBar = true;
                }
            } catch (error) {
                this.appLoading = false;
                console.error('Error loading image:', error);
                this.msg = "An error occurred while loading image";
                this.showSnackBar = true;
            }
        },
        async loadAndShowDocument(message) {
            if (!message._id) return;
            try {
                this.appLoading = true;
                const { success, data } = await downloadWhatsAppMedia({ messageId: message._id });
                this.appLoading = false;

                if (success && data?.url) {
                    // Update the message object with the media URL
                    this.$set(message, 'mediaUrl', data.url);
                } else {
                    this.msg = "Failed to load document";
                    this.showSnackBar = true;
                }
            } catch (error) {
                this.appLoading = false;
                console.error('Error loading document:', error);
                this.msg = "An error occurred while loading document";
                this.showSnackBar = true;
            }
        },
        async openFile(messageId) {
            if (!messageId) return;
            try {
                this.appLoading = true;
                const { success, data } = await downloadWhatsAppMedia({ messageId });
                this.appLoading = false;

                if (success && data?.url) {
                    // Create a temporary link to download the file
                    const link = document.createElement('a');
                    link.href = data.url;
                    link.download = `whatsapp-media-${messageId}`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    this.msg = "Failed to download media";
                    this.showSnackBar = true;
                }
            } catch (error) {
                this.appLoading = false;
                console.error('Error downloading media:', error);
                this.msg = "An error occurred while downloading media";
                this.showSnackBar = true;
            }
        },
        getFileUrl() {
            // For WhatsApp, we don't have direct URLs, need to download via API
            return null;
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
                if (!this.selectedPhone) return;
                await markWhatsAppRead({
                    phone: this.selectedPhone,
                    userId: this.selectedUserId,
                });
            } catch (e) {
                // non-fatal
            }
        },
        async refreshChat() {
            if (!this.selectedPhone) {
                // Refresh user list only
                this.refreshing = true;
                await this.getWhatsAppUsers(1);
                this.refreshing = false;
                this.msg = "Chat list refreshed";
                this.showSnackBar = true;
                return;
            }

            // Refresh both user list and current chat messages
            this.refreshing = true;
            try {
                // Refresh user list
                await this.getWhatsAppUsers(1);
                // Refresh current chat messages
                await this.loadUserMessages(this.selectedPhone);
                this.msg = "Chat refreshed successfully";
                this.showSnackBar = true;
            } catch (error) {
                console.error('Error refreshing chat:', error);
                this.msg = "Failed to refresh chat";
                this.showSnackBar = true;
            } finally {
                this.refreshing = false;
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

/* WhatsApp Image Placeholder */
.image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    background-color: #f5f5f5;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 150px;
}

.image-placeholder:hover {
    background-color: #e8f4fd;
    transform: scale(1.02);
}

.image-placeholder div {
    font-family: DMSans;
    font-size: 14px;
    color: #1A73E9;
    font-weight: 500;
}

.whatsapp-image-container {
    position: relative;
}

.clickable-image {
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.clickable-image:hover {
    opacity: 0.9;
}

/* PDF Preview */
.pdf-preview-container {
    width: 100%;
}

.pdf-iframe {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
}

.file-hint {
    font-family: DMSans;
    font-size: 12px;
    color: #666;
    margin-top: 4px;
}
</style>