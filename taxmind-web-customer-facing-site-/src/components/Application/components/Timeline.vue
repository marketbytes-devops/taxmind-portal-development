<template>
  <div class="timeline-container">
    <!-- Timeline Header -->
    <div class="p-12 time-container">
      <div class="header-application">
        <div class="header-main-row">
          <div class="application-info">
            <span class="notes-application-number">Application No:
              {{ applicantData.applicationNo || "TXM00116" }}</span>
            <span class="application-status" :class="getApplicationStatusClass(applicantData.status)">{{
              getApplicationStatusText(applicantData.status) }}</span>
            <!-- <span v-if="applicantData.isAmendment" class="amendment-badge">
              <v-icon size="12" color="orange">mdi-pencil</v-icon> Amendment
            </span> -->
          </div>
          <div class="header-actions">
            <v-btn outlined small class="action-btn questionnaire-btn" @click="openQuestionnaireDialog">
              <v-icon size="16" left>mdi-clipboard-list-outline</v-icon>
              Questionnaire
            </v-btn>
            <v-btn outlined small class="action-btn comments-btn" @click="openCommentsDialog">
              <v-icon size="16" left>mdi-message-outline</v-icon> Chat
              <div v-if="
                applicantData.hasUnreadMessages &&
                applicantData.unreadMessagesCount > 0
              " class="msg-chip">
                {{ applicantData.unreadMessagesCount }}
              </div>
            </v-btn>
            <v-btn v-if="applicantData.status === 'refund_completed'" color="primary" :ripple="false" depressed dark
              small class="action-btn amendment-btn" @click="showAmendmentConfirmDialog = true">
              <v-icon size="16" left>mdi-pencil</v-icon> Amendment
            </v-btn>
          </div>
        </div>
        <div class="year-info">
          Year: {{ applicantData.year || "2023" }}
          <span v-if="applicantData.isAmendment" class="amendment-year-badge">
            <v-icon size="14" color="orange">mdi-file-edit-outline</v-icon>
            Amendment Application
          </span>
        </div>
      </div>
      <!-- Timeline Steps -->
      <div class="timeline-scroll-container" ref="timelineScrollContainer">
        <div class="timeline-wrapper">
          <!-- Connecting Lines -->
          <div class="timeline-lines">
            <!-- Full gray line -->
            <div class="line-full"></div>
            <!-- Individual green segments for completed steps -->
            <div v-for="(status, index) in allStatuses" :key="'line-' + index" class="line-segment"
              :class="{ 'line-segment-completed': isStepActive(status) }" :style="getLineSegmentStyle(index)"></div>
          </div>

          <!-- Steps -->
          <div class="timeline-steps">
            <div v-for="(status, index) in allStatuses" :key="index" class="timeline-step" :class="{
              'step-active': isStepActive(status),
              'step-inactive': !isStepActive(status),
            }">
              <!-- Step Circle -->
              <div class="step-circle" :class="{ active: isStepActive(status) }">
                <!-- Checkmark icon inside circle -->
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>

              <!-- Step Info -->
              <div class="step-info">
                <div class="step-label">Step {{ index + 1 }}</div>
                <div class="step-title">{{ status }}</div>
                <div class="step-status" v-if="getStepStatus(status)"
                  :class="getStatusColorClass(getStepStatus(status))">
                  {{ formatStepStatus(getStepStatus(status)) }}
                </div>
                <div class="step-progress" v-if="getStepProgress(status)">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: getStepProgress(status) + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ getStepProgress(status) }}%</span>
                </div>
                <div class="step-date" v-if="getStepDate(status)">
                  {{ formatDate(getStepDate(status)) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- <v-divider></v-divider> -->
      </div>
    </div>
    <div v-if="isApplicationView">
      <v-divider></v-divider>
      <div @click="handleContinue(applicantData)" class="timeline-footer">
        <span v-if="applicantData.status === 'refund_completed'">View Details</span>
        <span v-else>Continue Application</span>
        <v-icon>mdi-chevron-right</v-icon>
      </div>
    </div>

    <!-- Comments Dialog -->
    <CommentsMessage :visible="showCommentsDialog" :applicant-data="applicantData"
      @close="showCommentsDialog = false" />

    <!-- Questionnaire Dialog -->
    <v-dialog v-model="showQuestionnaireDialog" max-width="900px" persistent scrollable>
      <v-card>
        <v-card-title class="questionnaire-dialog-header">
          <div class="dialog-title">
            <v-icon left color="primary">mdi-clipboard-account-outline</v-icon>
            <span>Questionnaire Review</span>
          </div>
          <v-btn icon @click="closeQuestionnaireDialog" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="questionnaire-dialog-content">
          <InitialReview v-if="showQuestionnaireDialog" :application-id="applicantData.id" :is-dialog="true" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Amendment Confirmation Dialog -->
    <v-dialog v-model="showAmendmentConfirmDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="amendment-dialog-header">
          <div class="dialog-title">
            <v-icon left color="orange">mdi-pencil</v-icon>
            <span>Start Amendment</span>
          </div>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="amendment-dialog-content">
          <div class="amendment-explanation">
            <h3>What is an Amendment?</h3>
            <p>
              An amendment allows you to make corrections or updates to your
              already completed tax return for the year
              {{ applicantData.year }}. This is useful when:
            </p>
            <ul style="text-align: left">
              <li>You need to correct information in your original return</li>
              <li>You have additional income or deductions to report</li>
              <li>You want to claim missed tax credits or refunds</li>
              <li>There were errors in your original submission</li>
            </ul>
            <p>
              <strong>Note:</strong> Starting an amendment will create a new
              application linked to your original return.
            </p>
          </div>
        </v-card-text>
        <v-card-actions class="amendment-dialog-actions">
          <v-spacer></v-spacer>
          <v-btn text @click="showAmendmentConfirmDialog = false" :disabled="isAmendmentLoading">
            Cancel
          </v-btn>
          <v-btn color="primary" @click="confirmAmendment" :loading="isAmendmentLoading" :disabled="isAmendmentLoading">
            Start Amendment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Global snackbar used via this.$snackbar -->
  </div>
</template>

<script>
import CommentsMessage from "./CommentsMessage.vue";
import InitialReview from "./questionnaire/InitialReview.vue";
import ApplicationService from "../../../services/application";

export default {
  name: "Timeline",
  components: {
    CommentsMessage,
    InitialReview,
  },
  props: {
    applicantData: {
      type: Object,
      required: true,
    },
    isApplicationView: {
      type: Boolean,
      default: false,
    },
  },
  mounted() {
    // Scroll to the end of timeline on mount
    this.$nextTick(() => {
      this.scrollToEnd();
    });
  },
  data() {
    return {
      // Default statuses if steps are not available from API
      defaultStatuses: [
        "Initial Review & Enquiry",
        "Document Upload",
        "Agent Activation",
        "Review",
        "Processing",
        "Refund Amount",
      ],
      showCommentsDialog: false,
      showQuestionnaireDialog: false,
      showAmendmentConfirmDialog: false,
      isAmendmentLoading: false,
      // notifications are shown via the global snackbar: this.$snackbar.showSuccess/showError
    };
  },
  computed: {
    // Get steps from applicantData or use default statuses
    allStatuses() {
      if (
        this.applicantData &&
        this.applicantData.steps &&
        this.applicantData.steps.length > 0
      ) {
        // Sort steps by stageIndex if available
        const sortedSteps = [...this.applicantData.steps].sort(
          (a, b) => a.stageIndex - b.stageIndex
        );
        return sortedSteps.map((step) => step.title);
      }
      return this.defaultStatuses;
    },
  },
  methods: {
    isStepActive(status) {
      // Check if applicantData exists and has steps
      if (!this.applicantData || !this.applicantData.steps) {
        return false;
      }

      // Find the step with matching title and check its status
      const step = this.applicantData.steps.find(
        (step) => step.title === status
      );
      return step ? step.status : false;
    },
    getStepDate(status) {
      // Check if applicantData exists and has steps
      if (!this.applicantData || !this.applicantData.steps) {
        return null;
      }

      // Find the step with matching title
      const step = this.applicantData.steps.find(
        (step) => step.title === status
      );

      if (!step || !step.data) {
        return null;
      }

      // Return the appropriate date based on the step key
      switch (step.key) {
        case "questionnaire":
          return step.data.submittedAt || step.data.createdAt;
        case "documents":
          // Return some date related to documents if available
          return null;
        case "agent_activation":
          return step.data.taxAgentVerificationCompletedAt;
        default:
          // For other steps, try to find any date field in the data
          return null;
      }
    },
    formatDate(date) {
      if (!date) return "";

      const dateObj = new Date(date);
      return dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    getStepStatus(status) {
      // Check if applicantData exists and has steps
      if (!this.applicantData || !this.applicantData.steps) {
        return null;
      }

      // Find the step with matching title
      const step = this.applicantData.steps.find(
        (step) => step.title === status
      );

      if (!step || !step.data) {
        return null;
      }

      return step.data.status;
    },

    formatStepStatus(status) {
      if (!status) return "";

      // Convert snake_case to Title Case with spaces
      return status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },

    formatApplicationStatus(status) {
      if (!status) return "";

      // Convert status to Title Case
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    },

    getApplicationStatusText(status) {
      if (!status) return "In Progress";

      // If refund_completed, show "Approved", otherwise show "In Progress"
      if (status.toLowerCase() === "refund_completed") {
        return "Approved";
      } else {
        return "In Progress";
      }
    },

    getApplicationStatusClass(status) {
      if (!status) return "status-in-progress";

      // If refund_completed, use approved class, otherwise use in-progress class
      if (status.toLowerCase() === "refund_completed") {
        return "status-approved";
      } else {
        return "status-in_progress";
      }
    },

    getStatusColorClass(status) {
      if (!status) return "";

      // Return appropriate CSS class based on status
      switch (status.toLowerCase()) {
        case "draft":
          return "status-draft";
        case "submitted":
          return "status-submitted";
        case "documents_uploaded":
          return "status-documents-uploaded";
        case "reviewed":
          return "status-reviewed";
        case "processing":
          return "status-processing";
        case "refund_completed":
        case "completed":
        case "complete":
        case "approved":
        case "success":
          return "status-completed";
        case "pending":
        case "waiting":
          return "status-pending";
        case "in_progress":
          return "status-in_progress";
        case "not_started":
        case "new":
          return "status-not-started";
        case "rejected":
        case "failed":
        case "error":
          return "status-rejected";
        default:
          return "status-default";
      }
    },

    getStepProgress(status) {
      // Check if applicantData exists and has steps
      if (!this.applicantData || !this.applicantData.steps) {
        return null;
      }

      // Find the step with matching title
      const step = this.applicantData.steps.find(
        (step) => step.title === status
      );

      if (!step || !step.data) {
        return null;
      }

      // Return progress if available
      return step.data.progress;
    },

    getActiveLineWidth() {
      // Count how many steps are active
      const activeStepsCount = this.allStatuses.filter((status) =>
        this.isStepActive(status)
      ).length;

      if (activeStepsCount <= 1) return "0%";

      // Calculate percentage: (activeSteps - 1) / (totalSteps - 1) * 100
      // We subtract 1 because the line doesn't extend beyond the last active step
      const percentage =
        ((activeStepsCount - 1) / (this.allStatuses.length - 1)) * 100;
      return `${Math.min(percentage, 100)}%`;
    },

    getLineSegmentStyle(index) {
      const totalSteps = this.allStatuses.length;
      if (totalSteps <= 1) return { display: "none" };

      // Get the step name for this index
      const stepName = this.allStatuses[index];

      // Custom positioning for each step
      const stepPositions = {
        'Questionnaire Submitted': {
          left: '1%',
          width: '22.3%'
        },
        'Document Upload': {
          left: '23%',
          width: '20%'
        },
        'Agent Activation': {
          left: '40%',
          width: '20%'
        },
        'Review by Tax Agent': {
          left: '60%',
          width: '16%'
        },
        'Revenue Processing Tax Filing': {
          left: '77.9%',
          width: '21%'
        },

      };

      // Return custom position if defined for this step
      if (stepPositions[stepName]) {
        return {
          ...stepPositions[stepName],
          display: "block",
        };
      }

      // Fallback to calculated positions for any other steps
      const segmentWidth = 100 / (totalSteps - 1);
      const leftPosition = (index / (totalSteps - 1)) * 100;

      return {
        left: `${leftPosition}%`,
        width: `${segmentWidth}%`,
        display: index < totalSteps - 1 ? "block" : "none",
      };
    },

    async openCommentsDialog() {
      console.log("Opening comments dialog");
      console.log("Application Data:", this.applicantData);
      this.showCommentsDialog = true;
      console.log("showCommentsDialog:", this.showCommentsDialog);

      // Call mark as read API
      if (this.applicantData && this.applicantData.id) {
        try {
          const markAsReadData = {
            chatType: "application",
            applicationId: this.applicantData.id,
          };

          const response = await ApplicationService.markChatAsRead(
            markAsReadData
          );
          console.log("Mark as read response:", response);

          // Manually update the unread count to 0 on success
          if (response && response.success) {
            this.applicantData.hasUnreadMessages = false;
            this.applicantData.unreadMessagesCount = 0;
          }
        } catch (error) {
          console.error("Error marking chat as read:", error);
          // Still update UI even if API fails
          // this.applicantData.hasUnreadMessages = false;
          // this.applicantData.unreadMessagesCount = 0;
        }
      }
    },

    handleContinue(applicantData) {
      console.log("handleContinue", applicantData);

      // Check if currentStep is initial_review_and_enquiry
      if (applicantData.currentStep === "initial_review_and_enquiry") {
        // Find the questionnaire step to get the responseId
        const questionnaireStep = applicantData.steps.find(
          (step) => step.key === "questionnaire"
        );

        // if (questionnaireStep && questionnaireStep.data && questionnaireStep.data.questionnaireResponseId) {
        this.$router.push({
          path: "/questionnaire-preview",
          query: {
            id: applicantData.id,
            responseId: questionnaireStep.data.questionnaireResponseId,
          },
        });
        // }
      } else {
        // For all other steps, navigate to application-upload
        this.$router.push({
          path: "/application-upload",
          query: { id: applicantData.id },
        });
      }

      this.$emit("continue-application", applicantData);
    },

    openQuestionnaireDialog() {
      console.log("Opening questionnaire dialog");
      this.showQuestionnaireDialog = true;
    },

    closeQuestionnaireDialog() {
      console.log("Closing questionnaire dialog");
      this.showQuestionnaireDialog = false;
    },

    async handleAmendment() {
      this.isAmendmentLoading = true;

      try {
        console.log("Starting amendment for application:", this.applicantData);

        const payload = {
          year: this.applicantData.year,
          isAmendment: true,
          parentApplicationId: this.applicantData.id,
        };

        console.log("Amendment payload:", payload);

        const response = await ApplicationService.startApplication(payload);
        console.log("Amendment application started:", response);

        // Show success message via global snackbar
        this.$snackbar.showSuccess(
          "Amendment application started successfully!"
        );

        // Navigate to the new amendment application questionnaire
        const responseData = response?.data;
        const applicationData = responseData?.application;

        if (applicationData?.id && responseData?.questionnaireResponseId) {
          this.$router.push({
            path: "/questionnaire-preview",
            query: {
              id: applicationData.id,
              responseId: responseData.questionnaireResponseId,
            },
          });
        }

        // Emit event to parent component if needed
        this.$emit("amendment-started", response.data);
      } catch (error) {
        console.error("Error starting amendment:", error);

        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to start amendment. Please try again.";

        this.$snackbar.showError(errorMessage);
      } finally {
        this.isAmendmentLoading = false;
        this.showAmendmentConfirmDialog = false;
      }
    },

    showSnackbar(message, color) {
      this.snackbar.message = message;
      this.snackbar.color = color;
      this.snackbar.show = true;
    },

    confirmAmendment() {
      this.handleAmendment();
    },

    scrollToEnd() {
      if (this.$refs.timelineScrollContainer) {
        const container = this.$refs.timelineScrollContainer;
        container.scrollLeft = container.scrollWidth;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$green: green;
$yellow: #e4af0f;
$blue: #1a73e9;
$red: #f44336;
$gray: #757575;
$blue: #3073f8;

.timeline-container {
  background: #ffffff;
  // padding: 24px 40px 8px 38px;
  border-radius: 10px;
  font-family: "DM Sans", sans-serif;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
}

.timeline-header {
  margin-bottom: 32px;
}

.timeline-title {
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #000000;
  margin: 0;
  line-height: 24px;
}

.timeline-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  width: 100%;
  scrollbar-width: auto;
  padding-bottom: 8px;
  scroll-behavior: smooth;
}

.timeline-scroll-container::-webkit-scrollbar {
  height: 10px;
}

.timeline-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
  margin: 0 10px;
}

.timeline-scroll-container::-webkit-scrollbar-thumb {
  background-color: #3073f8;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.timeline-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: #2563eb;
}

.timeline-wrapper {
  position: relative;
  padding: 16px 0;
  min-width: max-content;
}

/* Timeline Lines */
.timeline-lines {
  position: absolute;
  top: 28px;
  left: 12px;
  right: 12px;
  height: 2px;
  z-index: 1;
}

.line-full {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #e5e7eb;
  border-radius: 1px;
}

.time-container {
  padding: 15px 17px;
}

.line-active {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  background: green;
  border-radius: 1px;
  transition: width 0.4s ease-in-out;
  z-index: 2;
}

/* Individual line segments for each step */
.line-segment {
  position: absolute;
  top: 0;
  height: 2px;
  background: #e5e7eb;
  border-radius: 1px;
  transition: background-color 0.4s ease-in-out;
  z-index: 2;
}

.line-segment-completed {
  background: #10b981;
  /* Green color for completed segments */
}

/* Timeline Steps */
.timeline-steps {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 3;
}

.timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 120px;
  max-width: 140px;
}

/* First step - left aligned */
.timeline-step:first-child {
  align-items: flex-start;
}

/* Last step - right aligned */
.timeline-step:last-child {
  align-items: flex-end;
}

.msg-chip {
  background: red;
  padding: 2px 7px;
  color: white;
  margin: 1px 5px 1px 12px;
  border-radius: 5px;
}

/* Step Circle */
.step-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-bottom: 12px;
  position: relative;
  z-index: 4;
  background: #e5e7eb;
  color: #9ca3af;
  transition: all 0.3s ease;
}

.step-circle.active {
  background: green;
  color: #ffffff;
}

.step-circle svg {
  width: 14px;
  height: 14px;
}

/* Step Info */
.step-info {
  text-align: center;
  width: 100%;
}

/* Status color classes */
//

$status-map: (
  completed: $green,
  approved: $green,
  pending: $yellow,
  not-started: $blue,
  rejected: $red,
  default: $gray,
  in_progress: #2196f3,
);

@each $status, $color in $status-map {
  .status-#{$status} {
    color: $color;
    background-color: rgba(red($color), green($color), blue($color), 0.1);
    border: 1px solid rgba(red($color), green($color), blue($color), 0.2);
    padding: 2px 6px;
    border-radius: 4px;

    font-weight: bold !important;
    display: inline-block;
  }
}

/* First step info - left aligned */
.timeline-step:first-child .step-info {
  text-align: left;
}

/* Last step info - right aligned */
.timeline-step:last-child .step-info {
  text-align: right;
}

.step-label {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
  margin-bottom: 4px;
  line-height: 16px;
}

.header-application {
  margin-bottom: 10px;
}

.header-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  // margin-bottom: 8px;
}

.timeline-footer {
  background: white;
  padding: 15px 10px 15px 10px;

  color: $blue;
  // font-weight: bold;
  font-family: "DM Sans", sans-serif;
  cursor: pointer;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;

  .v-icon {
    color: $blue;
  }
}

.application-info {
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-btn {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  border-radius: 8px !important;
  height: 40px !important;
  padding: 0 16px !important;
  font-size: 14px !important;
  min-width: auto !important;
  box-shadow: none !important;

  .v-icon {
    margin-right: 8px !important;
    margin-left: 0 !important;
  }
}

.questionnaire-btn {
  border-color: #d1d5db !important;
  color: #374151 !important;
  background-color: #ffffff !important;

  &:hover {
    background-color: #f9fafb !important;
    border-color: #9ca3af !important;
  }

  &:before {
    display: none !important;
  }

  .v-icon {
    color: #6b7280 !important;
  }
}

.comments-btn {
  border: none;
  color: #3b82f6 !important;
  background-color: #f1f7ff !important;
  position: relative;

  &:hover {
    background-color: #eff6ff !important;
    border-color: #2563eb !important;
  }

  &:before {
    display: none !important;
  }

  .v-icon {
    color: #3b82f6 !important;
  }
}

.amendment-btn {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: white !important;

  &:hover {
    background-color: #2563eb !important;
    border-color: #2563eb !important;
  }

  &:before {
    display: none !important;
  }

  .v-icon {
    color: white !important;
  }
}

.btn-icon {
  margin-right: 6px;
  width: 16px;
  height: 16px;
}

.step-title {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
  line-height: 20px;
  word-wrap: break-word;
  hyphens: auto;
}

.step-status {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  margin-bottom: 4px;
}

.step-progress {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-right: 8px;
}

.progress-fill {
  height: 100%;
  background-color: green;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-family: "DM Sans", sans-serif;
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
}

.step-date {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
  line-height: 16px;
}

/* Active step styling */
.step-active .step-title {
  color: #111827;
  font-weight: 600;
}

.step-active .step-label {
  color: #6b7280;
}

.year-info {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: bolder;
  color: $blue;

  text-align: start;
}

.step-active .step-date {
  color: #6b7280;
}

/* Inactive step styling */
.step-inactive .step-title {
  color: #9ca3af;
  font-weight: 500;
}

.step-inactive .step-label {
  color: #d1d5db;
}

.step-inactive .step-date {
  color: #d1d5db;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .timeline-container {
    padding: 20px 24px;
  }

  .timeline-steps {
    flex-wrap: nowrap;
  }

  .timeline-step {
    min-width: 100px;
    max-width: 120px;
  }

  .step-title {
    font-size: 13px;
    line-height: 18px;
  }
}

.notes-application-number {
  font-family: "DM Sans", sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  // line-height: 18px;
  margin-right: 12px;
}

.application-status {
  //margin-left: 10px;
  padding: 3px 8px;
  font-size: 12px;
  border-radius: 4px;
  font-weight: 500;
}

.amendment-badge {
  margin-left: 8px;
  padding: 3px 8px;
  font-size: 12px;
  border-radius: 4px;
  font-weight: 500;
  background-color: rgba(255, 152, 0, 0.1);
  color: #ff9800;
  border: 1px solid rgba(255, 152, 0, 0.2);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.amendment-year-badge {
  margin-left: 16px;
  padding: 4px 10px;
  font-size: 13px;
  border-radius: 6px;
  font-weight: 600;
  background-color: rgba(255, 152, 0, 0.15);
  color: #ff9800;
  border: 1px solid rgba(255, 152, 0, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: "DM Sans", sans-serif;
}

@media (max-width: 768px) {
  .timeline-container {
    padding: 16px 12px;
  }

  .timeline-title {
    font-size: 16px;
  }

  .header-main-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    margin-top: 12px;
    width: 100%;
    justify-content: space-between;
  }

  .action-btn {
    margin-right: 4px;
  }

  .notes-application-number {
    display: block;
    margin-bottom: 8px;
  }

  .year-info {
    margin-top: 12px;
  }

  .timeline-steps {
    gap: 8px;
  }

  .timeline-step {
    min-width: 90px;
    max-width: 110px;
  }

  .step-title {
    font-size: 12px;
    line-height: 16px;
  }

  .step-label,
  .step-date {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .timeline-container {
    padding: 12px 8px;
  }

  .timeline-wrapper {
    padding: 12px 4px;
    margin-bottom: 10px;
    width: 100%;
    min-width: 600px;
  }

  .timeline-scroll-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 10px;
  }

  .timeline-steps {
    justify-content: space-between;
    gap: 8px;
  }

  .timeline-step {
    flex: none;
    min-width: 80px;
  }

  .timeline-lines {
    left: 8px;
    right: 8px;
  }

  .header-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .action-btn {
    margin-bottom: 4px;
    font-size: 11px;
    padding: 0 8px !important;
  }

  .timeline-footer {
    padding: 10px;
    font-size: 14px;
    text-align: center;
  }

  .application-status {
    margin-left: 0;
    margin-top: 4px;
    display: inline-block;
  }

  .amendment-badge {
    margin-left: 0;
    margin-top: 4px;
    display: block;
    width: fit-content;
  }

  .amendment-year-badge {
    margin-left: 0;
    margin-top: 8px;
    display: block;
    width: fit-content;
  }
}

/* Questionnaire Dialog Styles */
.questionnaire-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px 24px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  font-family: "DM Sans", sans-serif;
}

.dialog-title .v-icon {
  margin-right: 8px;
  color: $blue !important;
}

.close-btn {
  color: #666 !important;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.questionnaire-dialog-content {
  padding: 0 !important;
  max-height: 70vh;
  overflow-y: auto;
}

/* Override InitialReview styles when in dialog */
.questionnaire-dialog-content .v-card {
  box-shadow: none !important;
  border: none !important;
}

.questionnaire-dialog-content .pa-6 {
  padding: 16px !important;
}

/* Amendment Dialog Styles */
.amendment-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px 24px;
  background-color: #fff8e1;
  border-bottom: 1px solid #ffcc02;
}

.amendment-dialog-content {
  padding: 24px !important;
}

.amendment-explanation {
  font-family: "DM Sans", sans-serif;
}

.amendment-explanation h3 {
  color: #ff9800;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.amendment-explanation p {
  color: #333;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.amendment-explanation ul {
  margin: 16px 0;
  padding-left: 20px;
}

.amendment-explanation li {
  color: #555;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;
}

.amendment-dialog-actions {
  padding: 16px 24px 20px 24px;
  background-color: #f9f9f9;
}
</style>
