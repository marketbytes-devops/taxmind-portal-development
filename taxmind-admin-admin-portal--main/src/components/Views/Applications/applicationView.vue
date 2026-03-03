<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <v-snackbar v-model="showSnackBar" color="primary" right :timeout="timeout">
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

    <v-layout wrap justify-center pb-16>
      <v-flex pt-5 xs11 sm11 md11 lg11 xl11>
        <!-- Connection Status Indicator -->
        <!-- <v-layout wrap justify-center mb-2>
          <v-flex xs12>
            <v-alert v-if="!socketConnected" type="warning" dense outlined class="connection-alert mb-0">
              <v-icon left>mdi-wifi-off</v-icon>
              Not connected to chat server. Messages may not be delivered.
            </v-alert>
            <v-alert v-else type="success" dense outlined class="connection-alert mb-0">
              <v-icon left>mdi-wifi</v-icon>
              Connected to chat server
            </v-alert>
          </v-flex>
        </v-layout> -->

        <!-- Header Section -->
        <v-layout wrap justify-start class="my-3">
          <v-flex shrink align-self-center>
            <v-btn icon @click="$router.push('/application-list')"><v-icon>mdi-chevron-left</v-icon></v-btn></v-flex>
          <v-flex xs12 sm6 text-start align-self-center pt-2 class="carousalhead">Application Details
          </v-flex>
          <v-spacer></v-spacer>
          <v-flex v-if="applicantdata.status === 'draft'" shrink align-self-center pl-2>
            <v-btn color="primary" :ripple="false" depressed dark @click="openQuestionnaireDialog()">
              <v-icon left>mdi-file-document-outline</v-icon>
              Complete Questionnaire
            </v-btn>
          </v-flex>
          <v-flex shrink align-self-center pl-2>
            <v-btn color="primary" :ripple="false" depressed dark @click="openCommentDialog()">
              <v-icon left>mdi-comment-text-outline</v-icon>
              Chat
            </v-btn>
          </v-flex>

          <v-flex shrink align-self-center pl-2>
            <v-btn text class="px-0" :ripple="false" outlined height="37px" width="37px"
              @click="showNotesDialog = true; this.scrollToBottoms();">
              <v-img :src="require('@/assets/iconsets/notes.svg')" width="20" height="20" contain></v-img>
            </v-btn>
          </v-flex>
        </v-layout>

        <!-- Comments Dialog -->
        <v-dialog v-model="showCommentsDialog" :max-width="$vuetify.breakpoint.mdAndUp ? '50%' : '100%'"
          max-height="852px" overlay-color="rgba(0,0,0,0.4)" overlay-opacity="0.4"
          content-class="notes-dialog-positioned" @input="val => val && scrollToBottom()">
          <v-card class="pa-0 dialog-card white" elevation="0">
            <!-- Dialog Header -->
            <v-card-title class="notes-dialog-header px-4 py-2">
              <v-layout wrap class="notes-header-content">
                <v-flex xs10 class="notes-title-section" align-self-center>
                  <span class="notes-title">
                    Application No:
                    {{ applicantdata.applicationNo || "TXM00116" }}</span>
                  <span class="notes-application-number"> {{ applicantdata.user.name || "TXM00116" }} </span>
                </v-flex>
                <v-flex shrink align-self-center>
                  <v-btn icon class="notes-close-btn" @click="showCommentsDialog = false">
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
                <v-card :key="index" class="comment-card" elevation="0" :outlined="comment.senderType !== 'user'"
                  :color="comment.senderType === 'user' ? '#E3F2FD' : undefined">
                  <v-layout wrap>
                    <v-avatar size="32" :color="comment.senderType === 'user' ? '#1A73E9' : '#4CAF50'" class="mr-3">
                      <v-icon size="20" color="white">
                        {{ comment.senderType === 'user' ? 'mdi-account' : 'mdi-shield-account' }}
                      </v-icon>
                    </v-avatar>
                    <div>
                      <p class="text2 mb-0"
                        :style="{ color: comment.senderType === 'user' ? '#1A73E9' : '#4CAF50', fontWeight: '500' }">
                        {{ comment.senderType === 'user' ? (comment.userName || applicantdata.user?.name || 'User') :
                          (isCurrentUser(comment.user) ? 'You' : comment.user) }}
                      </p>
                      <p class="text1 mb-2">{{ formatDate(comment.date) }}</p>
                    </div>
                  </v-layout>
                  <p class="comment-text pl-11 mb-0">{{ comment.text }}</p>
                </v-card>
              </template>
            </v-card-text>

            <!-- Comment Input -->
            <v-card-actions class="notes-input-section pa-0">
              <div v-if="canEdit('applications') || canCreate('applications')" class="notes-input-container">
                <v-text-field v-model="newComment" placeholder="Write comments..." solo flat hide-details
                  class="notes-input-field" @keyup.enter="addComment" :disabled="commentsLoading"></v-text-field>
                <v-btn class="notes-send-btn" icon color="primary" :disabled="!newComment.trim() || commentsLoading"
                  @click="addComment">
                  <v-progress-circular v-if="commentsLoading" indeterminate size="20" width="2"></v-progress-circular>
                  <v-img v-else :src="require('@/assets/iconsets/send.svg')" width="24" height="24" contain></v-img>
                </v-btn>
              </div>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Notes Dialog - Pixel Perfect Figma Design -->
        <v-dialog v-model="showNotesDialog" max-width="800" overlay-color="rgba(0,0,0,0.2)" overlay-opacity="0.2"
          persistent attach content-class="notes-dialog-positioned" @input="val => val && scrollToBottoms()">
          <v-card class="notes-dialog-card" elevation="0">
            <!-- Dialog Header -->
            <v-card-title class="notes-dialog-header px-4 py-2">
              <v-layout wrap class="notes-header-content">
                <v-flex xs10 class="notes-title-section" align-self-center>
                  <span class="notes-title">Notes</span>
                  <span class="notes-application-number">
                    Application No:
                    {{ applicantdata.applicationNo || "TXM00116" }}
                  </span>
                </v-flex>
                <v-flex shrink align-self-center>
                  <v-btn icon class="notes-close-btn" @click="showNotesDialog = false">
                    <v-icon size="20" color="#5F5F5F">mdi-close</v-icon>
                  </v-btn></v-flex>
              </v-layout>
            </v-card-title>

            <!-- Comments Section -->
            <v-card-text ref="notesScroll" class="notes-content pa-0">
              <div class="notes-scroll-container" style="background-color: #f1f7ff">
                <v-layout v-if="notesLoading" justify-center align-center class="pa-4">
                  <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
                </v-layout>
                <div v-else-if="notesComments.length === 0" class="text-center pa-4 grey--text">
                  No notes available
                </div>
                <template v-else v-for="(comment, index) in notesComments">
                  <v-card :key="index" class="notes-comment-item pa-2" flat>
                    <!-- User Avatar and Info -->
                    <div class="notes-comment-header">
                      <div class="notes-user-avatar">
                        <v-img :src="require('@/assets/iconsets/user_blue.svg')" width="24" height="24"></v-img>
                      </div>
                      <div class="notes-user-details">
                        <div class="notes-user-name">{{ isCurrentUser(comment.user) ? 'You' : comment.user }}</div>
                        <div class="notes-comment-date">
                          {{ formatNotesDate(comment.date) }}
                        </div>
                      </div>
                    </div>
                    <!-- Comment Text -->
                    <div class="notes-comment-text">
                      {{ comment.text }}
                    </div>
                  </v-card>
                </template>
              </div>
            </v-card-text>

            <!-- Comment Input Footer -->
            <v-card-actions class="notes-input-section pa-0">
              <div v-if="canEdit('applications') || canCreate('applications')" class="notes-input-container">
                <v-text-field v-model="newNotesComment" placeholder="Write note..." solo flat hide-details
                  class="notes-input-field" @keyup.enter="addNotesComment" :disabled="notesLoading"></v-text-field>
                <v-btn class="notes-send-btn" icon color="primary" :disabled="!newNotesComment.trim() || notesLoading"
                  @click="addNotesComment">
                  <v-progress-circular v-if="notesLoading" indeterminate size="20" width="2"></v-progress-circular>
                  <v-img v-else :src="require('@/assets/iconsets/send.svg')" width="24" height="24" contain></v-img>
                </v-btn>
              </div>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Questionnaire Preview Dialog -->
        <PreviewQuestionnaireDialog closeable v-model="showQuestionnairePreviewDialog"
          :categories="questionnaireCategories" :responseId="questionnaireResponseId"
          @fetch-questionnaire="handleFetchQuestionnaire" @submit-questionnaire="handleSubmitQuestionnaire"
          @show-snackbar="handleQuestionnaireSnackbar" />

        <v-layout column>
          <v-flex class="white" mb-2>
            <Details :applicantdata="applicantdata" :userData="userData" :spouseData="spouseData" />
          </v-flex>
          <v-flex class="white" mb-2>
            <Timeline :applicantdata="applicantdata" :userData="userData" />
          </v-flex>
          <v-flex class="white" mb-2>
            <ExpansionPanel :applicantdata="applicantdata" :userData="userData" @status-updated="getData" />
            <!-- @documents-completed="getData"
              @review-completed="getData" -->
          </v-flex>
          <v-flex class="white" mb-2>
            <UpdateStatus :applicantdata="applicantdata" :userData="userData" @status-updated="handleStatusUpdated" />
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
    <v-dialog v-model="showQuestionnaireDialog" max-width="800px">
      <v-card>
        <v-card-title>
          <span class="headline">Questionnaire</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row v-for="category in questionData.allQuestionAnswers" :key="category.id">
              <v-col cols="12">
                <h3>{{ category.category }}</h3>
                <v-list dense>
                  <v-list-item v-for="question in category.questions" :key="question.id">
                    <v-list-item-content>
                      <v-list-item-title>{{
                        question.question
                        }}</v-list-item-title>
                      <v-list-item-subtitle>
                        <span v-if="question.answer">
                          <span v-if="question.answerType === 'Date'">
                            {{ formatQuestionDate(question.answer) }}
                          </span>
                          <span v-else>
                            {{ question.answer }}
                          </span>
                        </span>
                        <span v-else>_____________</span>
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="showQuestionnaireDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import http from "@/api/http";
import { applications } from "@/api";
import Socket from "@/Sockets/socket.js";
import Details from "./Details.vue";
import Timeline from "./Timeline.vue";
import ExpansionPanel from "./ExpansionPanel.vue";
import UpdateStatus from "./UpdateStatus.vue";
import permissionMixin from '@/mixins/permissionMixin';
import PreviewQuestionnaireDialog from "./client-applicatopm-questionnaire/PreviewQuestionnaireDialog.vue";

export default {
  components: {
    Details,
    Timeline,
    ExpansionPanel,
    UpdateStatus,
    PreviewQuestionnaireDialog,
  },
  mixins: [permissionMixin],
  data() {
    return {
      ServerError: false,
      deletedialog: false,
      keyword: "",
      usersList: [],
      selectedStatus: null,
      showSnackBar: false,
      timeout: 5000,
      files: [],
      userData: {},
      spouseData: {},
      calculationData: {},
      selectedUserId: null,
      msg: "",
      appLoading: false,
      itemToDelete: null,
      statusItems: ["PROCESSING", "APPROVED"],
      status: null,
      page: 1,
      currentPage: 1,
      refundamount: null,
      pages: 0,
      accesstokenpdf: localStorage.getItem("token"),
      limit: 10,
      applicantdata: {},
      applicationreview: {},
      discount: 0,
      showQuestionnaireDialog: false,
      questionData: {},
      showCommentsDialog: false,
      newComment: "",
      showNotesDialog: false,
      newNotesComment: "",
      notesComments: [],
      notesLoading: false,
      commentsLoading: false,
      chatData: [],
      socketConnected: false,
      chatType: 'application',
      adminId: null,
      showQuestionnairePreviewDialog: false,
      questionnaireCategories: [],
      questionnaireResponseId: null,
      questionnaireLoading: false,
    };
  },
  mounted() {
    this.getData();
    // this.getquestionData();
    this.initializeSocket();
  },

  beforeDestroy() {
    // Clean up socket listeners when component is destroyed
    Socket.cleanupSocket();
  },


  computed: {
    formattedDateOfBirth() {
      if (!this.userData.dob) return "_____________";
      const date = new Date(this.userData.dob);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
    finalAmount() {
      const totalCommissionAmount =
        this.calculationData.totalCommissionAmount || 0;
      const discount = this.discount || 0;
      return totalCommissionAmount - discount;
    },
    formattedspouseDateOfBirth() {
      if (!this.spouseData.dob) return "_____________";
      const date = new Date(this.spouseData.dob);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
  },
  watch: {
    discount(newDiscount) {
      const totalCommissionAmount =
        this.calculationData.totalCommissionAmount || 0;
      if (newDiscount > totalCommissionAmount) {
        this.msg =
          "Discount amount cannot be greater than the total commission amount.";
        this.showSnackBar = true;
        this.discount = totalCommissionAmount; // Reset discount to maximum allowable value
      }
    },
    '$route.query.id': {
      immediate: true,
      handler(newId) {
        if (newId) {
          this.fetchNotes(newId);
          this.fetchComments(newId);
        }
      }
    },
  },
  methods: {
    initializeSocket() {
      try {
        // Initialize socket connection with our custom socket service
        Socket.initializeSocket(this);

        // Set up event listeners for component-specific events
        const socket = Socket.getSocket();
        if (socket) {
          // Listen for incoming messages
          socket.on('chat:message', this.handleIncomingMessage);

          // Listen for connection status changes
          socket.on('connect', () => {
            console.log('Socket connected successfully');
            this.socketConnected = true;
          });

          socket.on('disconnect', () => {
            console.log('Socket disconnected');
            this.socketConnected = false;
          });

          socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.socketConnected = false;
            this.msg = "Connection to chat server failed";
            this.showSnackBar = true;
          });
        }
      } catch (error) {
        console.error('Error initializing socket:', error);
        this.socketConnected = false;
      }
    },

    handleIncomingMessage(response) {
      console.log('Received chat message:', JSON.stringify(response));

      try {
        // Handle different socket response formats
        let messageData;
        let applicationId;

        // Case 1: Direct message object
        if (response.applicationId) {
          messageData = response;
          applicationId = response.applicationId;
        }
        // Case 2: Message wrapped in success response
        else if (response.success && response.message) {
          messageData = response.message;
          applicationId = response.message.applicationId;
        }
        // Case 3: Message in another format
        else {
          messageData = response;
          // Try to find applicationId in any possible location
          applicationId = response.applicationId ||
            (response.message && response.message.applicationId) ||
            this.$route.query.id; // Fallback to current application
        }

        console.log('Parsed message data:', messageData);
        console.log('Current route ID:', this.$route.query.id);
        console.log('Message application ID:', applicationId);
        console.log('Message chatType:', messageData.chatType);

        // Filter: Only show messages with chatType "application" in application view
        if (messageData.chatType !== 'application') {
          console.log('Message chatType is not "application", ignoring in application view');
          return;
        }

        // Only add message if it's for this application
        if (applicationId && (applicationId === this.$route.query.id || !applicationId)) {
          // Check if message already exists (prevent duplicates by checking content and timestamp)
          const isDuplicate = this.chatData.some(msg =>
            msg.text === (messageData.content || '') &&
            Math.abs(new Date(msg.date) - new Date(messageData.createdAt || new Date())) < 1000
          );

          if (!isDuplicate) {
            // Format the incoming message to match component structure
            const formattedMessage = {
              user: messageData.senderType === 'admin' ?
                (messageData.admin?.name ||
                  JSON.parse(localStorage.getItem("admin_data"))?.name ||
                  'Admin') : 'User',
              userName: messageData.user?.name || messageData.userName || null,
              date: messageData.createdAt || new Date().toISOString(),
              text: messageData.content || '',
              senderType: messageData.senderType
            };

            console.log('Adding formatted message to chat:', formattedMessage);

            // Add message to comments list
            this.chatData.push(formattedMessage);

            // Sort messages by date
            this.chatData.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Scroll to bottom to show new message
            this.$nextTick(() => {
              this.scrollToBottom();
            });
          } else {
            console.log('Duplicate message detected, ignoring');
          }
        } else {
          console.log('Message not for this application, ignoring');
        }
      } catch (error) {
        console.error('Error processing incoming message:', error);
      }
    },

    updateStatusOptions() {
      if (this.backendStatus === "DOCUMENTS_UPLOADED") {
        this.statusOptions = ["PROCESSING"];
      } else if (this.backendStatus === "PROCESSING") {
        this.statusOptions = ["APPROVED"];
      } else {
        this.statusOptions = ["PROCESSING", "APPROVED"];
      }
    },
    getData() {
      console.log('applicationView: getData() called');
      this.appLoading = true;
      http
        .get(`applications/${this.$route.query.id}`, {
          // params: {
          //   id: this.$route.query.id,
          // },
        })
        .then((response) => {
          this.appLoading = false;
          const applications = response.data.data;
          this.applicantdata = {
            ...applications,
            applicationNumber: applications.applicationNo,
            status: applications.status
          };
          this.selectedUserId = applications.user.id;
          this.backendStatus = applications.status;
          this.updateStatusOptions();
          this.userData = applications.user;
          this.spouseData = this.userData.spouse || {};
          this.files = applications.documents || [];

          // Map steps data from the API response
          if (applications.steps && Array.isArray(applications.steps)) {
            this.applicantdata.steps = applications.steps.map(step => ({
              key: step.key,
              title: step.title,
              status: step.status,
              data: step.data,
              stageIndex: step.stageIndex
            }));
          }

          // Check if questionnaire is submitted
          const questionnaireStep = applications.steps?.find(step => step.key === 'questionnaire');
          if (questionnaireStep && questionnaireStep.data && questionnaireStep.data.status !== 'not_started') {
            // this.getquestionData();
          }
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.msg = "A server error occurred. Please try again later.";
            } else {
              // Handle other errors (e.g., 422 validation error)
              this.ServerError = false;
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
        });
    },
    getquestionData() {
      this.appLoading = true;
      http
        .get(`/questionnaires/applications/${this.$route.query.id}`, {
          params: {
            id: this.$route.query.id,
          },
        })
        .then((response) => {
          this.appLoading = false;
          this.questionData = response.data.data;
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.msg = "A server error occurred. Please try again later.";
            } else {
              // Handle other errors (e.g., 422 validation error)
              this.ServerError = false;
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
        });
    },
    validateUpdate() {
      if (!this.selectedStatus) {
        this.msg = "Please Select Status";
        this.showSnackBar = true;
        return;
      } else if (this.selectedStatus === "APPROVED" && !this.refundamount) {
        this.msg = "Please Enter Refund Amount";
        this.showSnackBar = true;
        return;
      } else {
        this.updateStatus();
      }
    },
    validatecalculate() {
      if (!this.selectedStatus) {
        this.msg = "Please Select Status";
        this.showSnackBar = true;
        return;
      } else if (this.selectedStatus === "APPROVED" && !this.refundamount) {
        this.msg = "Please Enter Refund Amount";
        this.showSnackBar = true;
        return;
      } else {
        this.updatecalculation();
      }
    },
    updatecalculation() {
      this.appLoading = true;
      http
        .post("/v1/admin/application/commission-summary", {
          // status: this.selectedStatus,
          id: this.$route.query.id,
          refundAmount: this.refundamount,
        })
        .then((response) => {
          this.appLoading = false;
          if (response.data.status) {
            this.calculationData = response.data.data;
            this.msg = response.data.message;
            this.showSnackBar = true;
            this.getData();
          } else {
            this.msg = response.data.message;
            this.showSnackBar = true;
          }
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.msg = "A server error occurred. Please try again later.";
            } else {
              // Handle other errors (e.g., 422 validation error)
              this.ServerError = false;
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
        });
    },
    updateStatus() {
      this.appLoading = true;
      http
        .post("/v1/admin/application/update-status", {
          status: this.selectedStatus,
          id: this.$route.query.id,
          refundAmount: this.refundamount,
          discountAmount: this.discount,
        })
        .then((response) => {
          this.appLoading = false;
          if (response.data.status) {
            this.msg = response.data.message;
            this.showSnackBar = true;
            this.getData();
          } else {
            this.msg = response.data.message;
            this.showSnackBar = true;
          }
        })
        .catch((err) => {
          this.appLoading = false;
          if (err.response) {
            if (err.response.status === 500) {
              // Handle server error
              this.ServerError = true;
              this.msg = "A server error occurred. Please try again later.";
            } else {
              // Handle other errors (e.g., 422 validation error)
              this.ServerError = false;
              this.msg = err.response.data.message || "An error occurred.";
            }
          } else {
            // Fallback for cases where err.response is undefined
            this.ServerError = true;
            this.msg = "An unexpected error occurred. Please try again.";
          }
          this.showSnackBar = true; // Show Snackbar for all error cases
          console.log(err);
        });
    },
    downloadPdf(pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.setAttribute("download", "file.pdf"); // Replace 'file.pdf' with your desired file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    formatQuestionDate(item) {
      const date = new Date(item);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
    fetchComments(applicationId) {
      this.commentsLoading = true;
      applications.getComments(applicationId)
        .then(response => {
          this.commentsLoading = false;
          if (response.data && response.data.data) {
            // Map API response to the format expected by the UI
            this.chatData = response.data.data.map(comment => {
              // Handle different message formats from API
              return {
                user: comment.senderType === 'admin' ?
                  (comment.admin?.name ||
                    JSON.parse(localStorage.getItem("admin_data"))?.name ||
                    'Admin') : 'User',
                userName: comment.user?.name || comment.userName || null,
                date: comment.createdAt,
                text: comment.content || comment.message || '',
                senderType: comment.senderType
              };
            });

            // Sort comments by date (oldest first, newest last)
            this.chatData.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Scroll to bottom after loading comments
            this.$nextTick(() => {
              this.scrollToBottom();
            });
          }
        })
        .catch(error => {
          this.commentsLoading = false;
          console.error('Error fetching comments:', error);
          this.msg = 'Failed to load comments. Please try again.';
          this.showSnackBar = true;
        });
    },
    openCommentDialog() {
      this.showCommentsDialog = true;
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },

    scrollToBottom() {
      console.log("Scrolling to bottom...");
      setTimeout(() => {
        const container = this.$refs.commentsScroll;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 1000);
    },

    async addComment() {
      if (!this.newComment.trim()) return;

      // this.commentsLoading = true;
      const messageText = this.newComment.trim();

      try {
        // Check if socket is properly initialized and connected
        const socket = Socket.getSocket();
        const isConnected = socket && socket.connected;

        if (isConnected) {
          // Prepare message data for socket
          const messageData = {
            content: messageText,
            messageType: 'text',
            applicationId: this.$route.query.id
          };

          try {
            // Send message through socket and get the response
            const response = await Socket.sendChatMessage(this, messageData, "application");
            this.commentsLoading = false;

            if (response && response.success && response.message) {
              console.log('Message sent successfully via socket:', response.message);

              // DON'T push to chatData here - let the socket listener handle it
              // This prevents duplicates since the socket will broadcast the message back

              // Clear the input field
              this.newComment = "";

              // Scroll to bottom to show new message
              this.$nextTick(() => {
                this.scrollToBottom();
              });
            } else {
              // Fallback to API if socket response is invalid
              console.log('Invalid socket response, using API fallback');
              this.sendCommentViaAPI(messageText);
            }
          } catch (socketError) {
            console.error('Socket send error:', socketError);
            this.commentsLoading = false;
            // Fallback to API if socket throws error
            this.sendCommentViaAPI(messageText);
          }
        } else {
          // Socket not connected, use API directly
          console.log('Socket not connected, using API fallback');
          this.sendCommentViaAPI(messageText);
        }
      } catch (error) {
        console.error('Error in addComment:', error);
        this.commentsLoading = false;
        this.msg = "Error sending message. Please try again.";
        this.showSnackBar = true;
      }
    },

    sendCommentViaAPI(messageText) {
      const commentData = {
        applicationId: this.$route.query.id,
        message: messageText
      };

      this.commentsLoading = true;
      applications.addComment(commentData)
        .then(response => {
          this.commentsLoading = false;
          if (response.data && response.data.status) {
            // Add the new comment to the list
            this.chatData.push({
              user: JSON.parse(localStorage.getItem("admin_data")).name || "Admin",
              date: new Date().toISOString(),
              text: messageText,
            });

            // Sort so oldest first → latest last
            this.chatData.sort((a, b) => new Date(a.date) - new Date(b.date));
            this.newComment = "";

            // Scroll to bottom after adding comment
            this.$nextTick(() => {
              this.scrollToBottom();
            });
          }
        })
        .catch(error => {
          this.commentsLoading = false;
          console.error('Error adding comment via API:', error);
          this.msg = error.response?.data?.error || 'Failed to add comment. Please try again.';
          this.showSnackBar = true;
        });
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
    formatTime(dt) {
      var hours = dt.getHours();
      var minutes = dt.getMinutes();
      var ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = String(minutes).padStart(2, "0");
      return `${hours}:${minutes} ${ampm}`;
    },
    isToday(date) {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    },
    fetchNotes(applicationId) {
      this.notesLoading = true;
      applications.getNotes(applicationId)
        .then(response => {
          this.notesLoading = false;
          if (response.data && response.data.data) {
            // Map API response to the format expected by the UI
            this.notesComments = response.data.data.map(note => ({
              user: note.admin?.name,
              date: note.createdAt,
              text: note.note
            }));

            // Sort notes by date (oldest first, newest last)
            this.notesComments.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Scroll to bottom after loading notes
            this.$nextTick(() => {
              this.scrollToBottoms();
            });
          }
        })
        .catch(error => {
          this.notesLoading = false;
          console.error('Error fetching notes:', error);
          this.msg = 'Failed to load notes. Please try again.';
          this.showSnackBar = true;
        });
    },

    scrollToBottoms() {
      setTimeout(() => {
        const container = this.$refs.notesScroll;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 1000);
    },

    addNotesComment() {
      if (!this.newNotesComment.trim()) return;

      const noteData = {
        applicationId: this.$route.query.id,
        note: this.newNotesComment.trim()
      };

      this.notesLoading = true;
      applications.addNote(noteData)
        .then(response => {
          this.notesLoading = false;
          if (response.data && response.data.status) {
            // Add the new note to the list


            this.notesComments.push({
              user: JSON.parse(localStorage.getItem("admin_data")).name || "Admin",
              date: new Date().toISOString(),
              text: this.newNotesComment.trim(),
            });

            // Sort so oldest first → latest last
            this.notesComments.sort((a, b) => new Date(a.date) - new Date(b.date));
            this.newNotesComment = "";
            // this.msg = 'Note added successfully';
            // this.showSnackBar = true;

            // Scroll to bottom after adding note
            this.$nextTick(() => {
              this.scrollToBottoms();
            });
          }
        })
        .catch(error => {
          this.notesLoading = false;
          console.error('Error adding note:', error);
          this.msg = error.response?.data?.error || 'Failed to add note. Please try again.';
          this.showSnackBar = true;
        });
    },
    formatNotesDate(dateStr) {
      // Handle both formatted strings and ISO dates
      if (dateStr.includes("Today")) {
        return dateStr;
      }
      if (dateStr.includes("/")) {
        return dateStr;
      }

      // Handle ISO date format
      const date = new Date(dateStr);
      if (this.isToday(date)) {
        return "Today, " + this.formatTime(date);
      }

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}, ${this.formatTime(date)}`;
    },

    handleStatusUpdated(data) {
      // Refresh application data when status is updated
      this.msg = `Status updated successfully to ${data.status}`;
      this.showSnackBar = true;
      this.getData();
    },

    isCurrentUser(userName) {
      // Get current user's name from localStorage
      const currentUser = JSON.parse(localStorage.getItem("admin_data"));
      const currentUserName = currentUser?.roleName || currentUser?.name;
      return userName === currentUserName;
    },

    openQuestionnaireDialog() {
      this.fetchQuestionnaireData();
    },

    fetchQuestionnaireData() {
      console.log('🔄 Fetching questionnaire data for application:', this.$route.query.id);
      this.questionnaireLoading = true;
      console.log(this.applicantdata?.questionnaireResponse.id + '453534535345345');
      const appID = this.applicantdata?.questionnaireResponse.id
      applications.getQuestionnaireByApplicationId(appID)
        .then(response => {
          this.questionnaireLoading = false;
          console.log('✅ Questionnaire API response:', response);
          console.log('Response data:', response.data);
          if (response.data) {
            const apiData = response.data.data;
            console.log('📊 Full API data:', apiData);

            // Extract and transform categories from questionnaire.questionCategories
            const rawCategories = apiData.questionnaire?.questionCategories || [];
            // Extract responseId from response.id
            const responseId = apiData.response?.id || null;

            console.log('Raw categories:', rawCategories);
            console.log('Categories count:', rawCategories.length);
            console.log('Response ID:', responseId);


            console.log('Transformed categories:', rawCategories);

            this.questionnaireCategories = rawCategories;
            this.questionnaireResponseId = appID;
            console.log('✅ Setting dialog to true with categories:', this.questionnaireCategories.length);
            this.showQuestionnairePreviewDialog = true;
          } else {
            console.warn('⚠️ No questionnaire data in response');
            this.msg = 'No questionnaire data available for this application.';
            this.showSnackBar = true;
          }
        })
        .catch(error => {
          this.questionnaireLoading = false;
          console.error('❌ Error fetching questionnaire:', error);
          console.error('Error response:', error.response);
          this.msg = error.response?.data?.message || 'Failed to load questionnaire. Please try again.';
          this.showSnackBar = true;
        });
    },

    handleFetchQuestionnaire(callback, currentCategory) {
      if (!this.questionnaireResponseId) {
        this.msg = 'No response ID available for updating progress.';
        this.showSnackBar = true;
        return;
      }

      // Calculate completion percentage
      const completedCategories = this.questionnaireCategories.filter(cat => cat.isCompleted).length;
      const totalCategories = this.questionnaireCategories.length;
      const completionPercentage = totalCategories > 0 ? Math.round((completedCategories / totalCategories) * 100) : 0;

      const progressData = {
        currentCategoryId: currentCategory.id,
        completionPercentage: completionPercentage,

      };

      console.log('📤 Sending progress update:', progressData);

      applications.updateQuestionnaireProgress(this.questionnaireResponseId, progressData)
        .then(response => {
          console.log('✅ Progress updated successfully:', response.data);
          if (response.data) {
            this.fetchQuestionnaireData();
            if (callback && typeof callback === 'function') {
              this.$nextTick(() => {
                callback();
              });
            }
          }
        })
        .catch(error => {
          console.error('❌ Error updating questionnaire progress:', error);
          this.msg = error.response?.error || 'Failed to update progress. Please try again.';
          this.showSnackBar = true;
        });
    },

    handleSubmitQuestionnaire() {
      if (!this.questionnaireResponseId) {
        this.msg = 'No response ID available for submission.';
        this.showSnackBar = true;
        return;
      }

      const completedCategories = this.questionnaireCategories.filter(cat => cat.isCompleted).length;
      const totalCategories = this.questionnaireCategories.length;
      const completionPercentage = totalCategories > 0 ? Math.round((completedCategories / totalCategories) * 100) : 0;

      const currentCategory = this.questionnaireCategories.find(cat => !cat.isCompleted) || this.questionnaireCategories[this.questionnaireCategories.length - 1];

      const progressData = {
        currentCategoryId: currentCategory?.id,
        completionPercentage: completionPercentage,
      };

      applications.updateQuestionnaireProgress(this.questionnaireResponseId, progressData)
        .then(response => {
          console.log('✅ Progress updated successfully before submission:', response.data);

          const payload = {
            responseId: this.questionnaireResponseId,
          };

          return applications.submitQuestionnaireResponse(payload);
        })
        .then(response => {
          console.log('✅ Questionnaire submitted successfully:', response.data);
          this.msg = 'Questionnaire submitted successfully!';
          this.showSnackBar = true;
          this.showQuestionnairePreviewDialog = false;
          this.getData();
        })
        .catch(error => {
          console.error('❌ Error submitting questionnaire:', error);
          this.msg = error.response?.data?.message || 'Failed to submit questionnaire. Please try again.';
          this.showSnackBar = true;
        });
    },

    handleQuestionnaireSnackbar(payload) {
      this.msg = payload.message || payload;
      this.showSnackBar = true;
    },
  },
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
::v-deep .notes-dialog-positioned {
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
  height: 50px !important;
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