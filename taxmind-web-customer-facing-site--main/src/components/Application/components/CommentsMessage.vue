<template>
    <v-dialog v-model="dialogVisible" :max-width="$vuetify.breakpoint.mdAndUp ? '50%' : '100%'" max-height="852px"
        overlay-color="rgba(0,0,0,0.4)" overlay-opacity="0.4" content-class="notes-dialog-positioned"
        @input="val => val && scrollToBottom()">
        <template v-if="dialogVisible">
            <v-card class="pa-0 dialog-card white" elevation="0">
                <!-- Dialog Header -->
                <v-card-title class="notes-dialog-header px-4 py-2">
                    <v-layout wrap class="notes-header-content">
                        <v-flex xs10 class="notes-title-section" align-self-center>
                            <span class="notes-title">
                                Application No:
                                {{ applicantData.applicationNo || "TXM00116" }}</span>

                        </v-flex>
                        <v-flex shrink align-self-center>
                            <v-btn icon class="notes-close-btn" @click="closeDialog">
                                <v-icon size="20" color="#5F5F5F">mdi-close</v-icon>
                            </v-btn></v-flex>
                    </v-layout>
                </v-card-title>

                <!-- Comments List -->
                <v-card-text ref="commentsScroll" class="px-5 py-4 comments-scroll">
                    <v-layout v-if="commentsLoading" justify-center align-center class="pa-4">
                        <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
                    </v-layout>
                    <div v-else-if="chatData.length === 0" class="text-center pa-4 grey--text">
                        No comments available
                    </div>
                    <template v-else v-for="(comment, index) in chatData">
                        <v-card :key="index" class="comment-card" elevation="0" :outlined="index % 2 !== 0"
                            :color="index % 2 === 0 ? 'backgroundOne' : undefined">
                            <v-layout wrap>
                                <v-avatar size="24" :color="comment.senderType === 'admin' ? '#1A73E9' : '#E0E0E0'"
                                    class="mr-3">
                                    <v-icon size="16" :color="comment.senderType === 'admin' ? 'white' : '#757575'">
                                        {{ comment.senderType === 'admin' ? 'mdi-shield-account' : 'mdi-account' }}
                                    </v-icon>
                                </v-avatar>
                                <div>
                                    <p class="text2 mb-0"
                                        :style="comment.senderType === 'admin' ? 'color: #1A73E9; font-weight: 600;' : ''">
                                        {{ comment.user }}
                                    </p>
                                    <p class="text1 mb-2">{{ formatDate(comment.date) }}</p>
                                </div>
                            </v-layout>
                            <p class="comment-text pl-9 mb-0">{{ comment.text }}</p>
                        </v-card>
                    </template>
                </v-card-text>

                <!-- Comment Input -->
                <v-card-actions class="notes-input-section pa-0">
                    <div class="notes-input-container">
                        <v-text-field v-model="newComment" placeholder="Write comments..." solo flat hide-details
                            class="notes-input-field" @keyup.enter="addComment"
                            :disabled="commentsLoading"></v-text-field>
                        <v-btn class="notes-send-btn" icon color="primary"
                            :disabled="!newComment.trim() || commentsLoading" @click="addComment">
                            <v-progress-circular v-if="commentsLoading" indeterminate size="20"
                                width="2"></v-progress-circular>
                            <v-icon v-else color="white">mdi-send</v-icon>
                        </v-btn>
                    </div>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>

<script>
import ApplicationService from "../../../services/application";
import socketService from "../../../services/socket";

export default {
    name: "CommentsMessage",
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        applicantData: {
            type: Object,
            required: true
        }
    },
    data() {
        return {

            chatData: [],
            newComment: "",
            commentsLoading: false,
            socketConnected: false,
            adminId: null,
            selectedUserId: localStorage.getItem('userId')
        };
    },
    computed: {
        dialogVisible: {
            get() {
                return this.visible;
            },
            set(value) {
                if (!value) {
                    this.$emit('close');
                }
            }
        }
    },
    watch: {
        visible(newVal) {
            console.log('CommentsMessage visible changed:', newVal);
            console.log('Applicant data:', this.applicantData);
            if (newVal) {
                this.initializeSocketForApplication();
                this.fetchComments();
            } else {
                this.cleanupSocketListeners();
            }
        }
    },
    mounted() {
        // Initialize socket connection when component mounts
        if (this.visible) {
            this.initializeSocketForApplication();
        }
    },
    beforeDestroy() {
        // Clean up socket listeners when component is destroyed
        this.cleanupSocketListeners();
    },
    methods: {
        initializeSocketForApplication() {
            console.log('Initializing socket for application comments...');

            // Set the selected user ID from applicant data
            if (this.applicantData && this.applicantData.userId) {
                this.selectedUserId = this.applicantData.userId;
            }

            // Initialize socket connection with 'application' chat type filter
            if (!socketService.getConnectionStatus()) {
                socketService.initializeSocket(this, 'application');
            } else {
                // If already connected, just set up message listener
                this.setupCommentListener();
            }
        },

        setupCommentListener() {
            console.log('Setting up comment listener for application...');
            const socket = socketService.getSocket();

            if (!socket) return;

            // Listen for new comments/messages for this application
            socket.on('chat:message', (response) => {
                console.log('Received new comment:', response);

                // Filter by chatType - only process 'application' messages
                if (response.chatType !== 'application') {
                    console.log(`Ignoring message with chatType: ${response.chatType}, expected: application`);
                    return;
                }

                if (response && this.applicantData) {
                    // Check if the message is for this application
                    const isForThisApplication =
                        response.applicationId === this.applicantData.id ||
                        response.userId === this.applicantData.userId;

                    if (isForThisApplication) {
                        // Format the incoming message
                        const newComment = {
                            user: response.senderType === 'admin'
                                ? (JSON.parse(localStorage.getItem('role'))?.roleName || 'Admin')
                                : (localStorage.getItem('userName') || this.applicantData.user?.name || 'User'),
                            date: response.createdAt || new Date().toISOString(),
                            text: response.content || '',
                            senderType: response.senderType
                        };

                        // Add to chat data if not already present
                        const exists = this.chatData.some(comment =>
                            comment.text === newComment.text &&
                            comment.date === newComment.date
                        );

                        if (!exists) {
                            this.chatData.push(newComment);
                            this.$nextTick(() => {
                                this.scrollToBottom();
                            });
                        }
                    }
                }
            });
        },

        cleanupSocketListeners() {
            console.log('Cleaning up socket listeners...');
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('chat:message');
            }
        },

        async fetchComments() {
            if (!this.applicantData || !this.applicantData.id) {
                return;
            }

            this.commentsLoading = true;
            try {
                const response = await ApplicationService.getComments(this.applicantData.id);
                if (response && response.data) {
                    // Map the response to match the template structure
                    this.chatData = response.data.map(comment => ({
                        user: comment.senderType === 'user'
                            ? (localStorage.getItem('userName') || this.applicantData.user?.name || "User")
                            : (comment.senderType || "Admin"),
                        date: comment.createdAt || comment.createdAt,
                        text: comment.content || comment.content || "",
                        senderType: comment.senderType
                    }));
                }
                this.chatData.sort((a, b) => new Date(a.date) - new Date(b.date));
                this.commentsLoading = false;
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            } catch (error) {
                this.commentsLoading = false;
                console.error("Error fetching comments:", error);
                // Optionally show error message to user
            }
        },

        async addComment() {
            if (!this.newComment.trim()) {
                return;
            }

            // this.commentsLoading = true;
            try {
                // Prepare message data
                const messageData = {
                    content: this.newComment,
                    messageType: 'text',
                    applicationId: this.applicantData.id
                };

                // Send through socket if connected
                if (socketService.getConnectionStatus()) {
                    const result = await socketService.sendChatMessage(
                        this,
                        messageData,
                        'application' // chat type for application comments
                    );

                    if (result && result.success) {
                        console.log('Comment sent successfully via socket');
                        // Message is already added to chatData by sendChatMessage
                    } else {
                        throw new Error('Failed to send comment via socket');
                    }
                } else {
                    // Fallback: Add comment locally if socket not connected
                    console.warn('Socket not connected, adding comment locally');
                    this.chatData.push({
                        user: JSON.parse(localStorage.getItem('role'))?.roleName || "You",
                        date: new Date().toISOString(),
                        text: this.newComment
                    });

                    this.$nextTick(() => {
                        this.scrollToBottom();
                    });
                }

                this.newComment = "";
                this.commentsLoading = false;
            } catch (error) {
                this.commentsLoading = false;
                console.error("Error adding comment:", error);
                // Optionally show error to user
                if (this.$store) {
                    this.$store.commit('setSnackbar', {
                        show: true,
                        message: 'Failed to send comment: ' + error.message,
                        color: 'error'
                    });
                }
            }
        },
        formatDate(item) {
            if (this.isToday(new Date(item))) {
                return "Today, " + this.formatTime(new Date(item));
            }

            var dt = new Date(item);
            var day = String(dt.getDate()).padStart(2, "0");
            var month = String(dt.getMonth() + 1).padStart(2, "0");
            var year = dt.getFullYear();
            return `${day}/${month}/${year}, ${this.formatTime(dt)}`;
        },

        scrollToBottom() {
            setTimeout(() => {
                const container = this.$refs.commentsScroll;
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            }, 1000);
        },

        isToday(date) {
            const today = new Date();
            return (
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()
            );
        },

        formatTime(date) {
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, "0");
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            const formattedHours = String(hours).padStart(2, "0");
            return `${formattedHours}:${minutes} ${ampm}`;
        },

        closeDialog() {
            this.$emit('close');
        }
    }
};
</script>

<style scoped>
.dialog-card {
    border-radius: 8px;
    background: #ffffff;
    /* Figma-like shadow */
    box-shadow: 0px 12px 32px rgba(0, 0, 0, 0.18), 0px 2px 8px rgba(0, 0, 0, 0.06);
}

.Head2 {
    font-family: "DM Sans", sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #000000;
    line-height: normal;
}

.subHead1 {
    font-family: "DM Sans", sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: normal;
}

.text1 {
    font-family: "DM Sans", sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #5f5f5f;
    line-height: normal;
}

.text2 {
    font-family: "DM Sans", sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: #000000;
    line-height: normal;
}

/* Header + Footer separators per Figma */
.dialog-header {
    border-bottom: 1px solid rgba(95, 95, 95, 0.16);
    background: #ffffff;
    padding-left: 20px !important;
    padding-right: 20px !important;
}

.dialog-footer {
    border-top: 1px solid rgba(95, 95, 95, 0.16);
    background: #ffffff;
    padding-left: 20px !important;
    padding-right: 20px !important;
}

/* Scroll region height tuned for design */
.comments-scroll {
    max-height: 60vh;
    overflow-y: auto;
    padding-left: 20px !important;
    padding-right: 20px !important;
}

.v-card-text {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.v-card-text::-webkit-scrollbar {
    width: 6px;
}

.v-card-text::-webkit-scrollbar-track {
    background: transparent;
}

.v-card-text::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
}

/* Comments input styling */
.v-text-field.v-text-field--solo.v-input--dense>.v-input__control {
    min-height: 40px;
}

.v-text-field--solo .v-input__slot {
    border: 1px solid rgba(95, 95, 95, 0.16) !important;
    border-radius: 4px;
}

.v-text-field--solo.v-input--dense .v-label {
    top: 50%;
    transform: translateY(-50%);
}

.v-text-field.v-text-field--enclosed .v-text-field__details {
    margin-bottom: 0;
}

/* Comment card visual from Figma */
.comment-card {
    border: 1px solid rgba(95, 95, 95, 0.16);
    border-radius: 8px;
    background: #ffffff;
    padding: 12px;
    text-align: start;
    margin-bottom: 16px;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.06);
}

.comment-text {
    font-family: "DM Sans", sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #000000;
    line-height: 20px;
}

/* Placeholder styling to match spec */
.comment-input input::placeholder {
    color: rgba(95, 95, 95, 0.6);
    font-size: 14px;
}

/* Deep selectors for Vuetify internals - ensure white background on solo text-field */
::v-deep .v-text-field--solo .v-input__slot {
    background: #ffffff !important;
}

::v-deep .v-dialog__content .v-dialog {
    border-radius: 8px;
}

/* Notes Dialog - Pixel Perfect Figma Design */
>>>.notes-dialog-positioned {
    position: absolute;
    bottom: 0;
    right: 0;
    margin: 0;
}

.notes-dialog-card {
    width: 800px !important;
    max-height: 600px;
    border-radius: 8px !important;
    background: #ffffff !important;
    box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.15) !important;
    margin: 0 !important;
    position: relative;
    z-index: 1001 !important;
}

/* Notes Dialog Header */
.notes-dialog-header {
    text-align: left;
    /* padding: 16px 16px 0 16px !important; */
    border-bottom: 1px solid rgba(95, 95, 95, 0.16) !important;
}

.notes-header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    /* padding-bottom: 16px; */
}

.notes-title-section {
    flex: 1;
}

.notes-title {
    font-family: "DM Sans", sans-serif;
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 21px;
    color: #000000;
    display: block;
}

.notes-application-number {
    font-family: "DM Sans", sans-serif;
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 18px;
    color: #1a73e9;
    display: block;
}

.notes-close-btn {
    margin: 0 !important;
    padding: 4px !important;
    width: 28px !important;
    height: 28px !important;
}

/* Notes Content */
.notes-content {
    max-height: 400px;
    overflow-y: auto;
}

.notes-scroll-container {
    padding: 16px;
}

/* Individual Comment Item */
.notes-comment-item {
    margin-bottom: 24px;
}

.notes-comment-item:last-child {
    margin-bottom: 0;
}

.notes-comment-header {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
}

.notes-user-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(95, 95, 95, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.notes-user-details {
    flex: 1;
}

.notes-user-name {
    font-family: "DM Sans", sans-serif;
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: #000000;
    margin-bottom: 2px;
}

.notes-comment-date {
    font-family: "DM Sans", sans-serif;
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 16px;
    color: #5f5f5f;
}

.notes-comment-text {
    font-family: "DM Sans", sans-serif;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: #000000;
    margin-left: 32px;
}

/* Notes Input Section */
.notes-input-section {
    border-top: 1px solid rgba(95, 95, 95, 0.16) !important;
    /* padding: 12px 16px 16px 16px !important; */
}

.notes-input-container {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 60px !important;
}

.notes-input-field {
    flex: 1;
}

.notes-input-field .v-input__control {
    min-height: 40px !important;
}

.notes-input-field .v-input__slot {
    background-color: #ffffff !important;
    border: 1px solid rgba(95, 95, 95, 0.16) !important;
    border-radius: 4px !important;
    padding: 0 12px !important;
    min-height: 40px !important;
}

.notes-input-field .v-text-field__slot input {
    font-family: "DM Sans", sans-serif !important;
    font-size: 14px !important;
    color: #000000 !important;
    padding: 0 !important;
}

.notes-input-field .v-text-field__slot input::placeholder {
    color: rgba(95, 95, 95, 0.6) !important;
    font-family: "DM Sans", sans-serif !important;
}

.notes-send-btn {
    width: 66px !important;
    height: fill !important;
    background: #1a73e9 !important;
    border-radius: 4px !important;
    flex-shrink: 0;
}

.notes-send-btn:disabled {
    background: rgba(95, 95, 95, 0.2) !important;
}

.notes-send-btn .v-icon {
    color: #ffffff !important;
}

.notes-send-btn:disabled .v-icon {
    color: rgba(95, 95, 95, 0.5) !important;
}

/* Custom scrollbar for notes content */
.notes-content::-webkit-scrollbar {
    width: 4px;
}

.notes-content::-webkit-scrollbar-track {
    background: transparent;
}

.notes-content::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
}

/* Dialog overlay styling specific to notes */
::v-deep .v-overlay--active {
    backdrop-filter: blur(5px);
}

/* Responsive positioning for mobile */
@media (max-width: 768px) {
    .notes-dialog-positioned {
        bottom: 16px !important;
        right: 16px !important;
        left: 16px !important;
        width: calc(100vw - 32px) !important;
        max-width: calc(100vw - 32px) !important;
    }

    .notes-dialog-card {
        width: 100% !important;
    }
}

@media (max-width: 440px) {
    .notes-dialog-positioned {
        bottom: 8px !important;
        right: 8px !important;
        left: 8px !important;
        width: calc(100vw - 16px) !important;
        max-width: calc(100vw - 16px) !important;
    }
}
</style>