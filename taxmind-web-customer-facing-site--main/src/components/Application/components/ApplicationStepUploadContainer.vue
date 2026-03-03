<template>
  <div class="application-step-upload-container">
    <!-- Back Button -->
    <div class="back-button-container">
      <button class="back-button" @click="navigateBack">
        <v-icon small>mdi-chevron-left</v-icon>
        <span>Back to Applications</span>
      </button>
    </div>

    <vue-element-loading
      :active="appLoading"
      spinner="bar-fade-scale"
      color="#1A73E9"
      size="60"
      is-full-screen
    />
    <!-- Global snackbar used via this.$snackbar -->

    <!-- Error Display Section -->
    <v-alert
      v-if="ServerError"
      type="error"
      dismissible
      @input="ServerError = false"
      class="mb-4"
    >
      <div class="d-flex align-items-center">
        <!-- <v-icon left>mdi-alert-circle</v-icon> -->
        <span>{{ msg }}</span>
      </div>
    </v-alert>

    <Timeline
      v-if="!ServerError"
      :isApplicationView="false"
      :applicantData="applicationData"
    />

    <div v-if="!ServerError" class="step-container">
      <!-- Dynamic Header Section -->
      <div v-if="currentStepConfig?.showHeader" class="review-section">
        <div class="header">
          <div v-if="currentStepConfig?.showIcons" class="icon">
            <v-icon size="40" color="white">{{
              currentStepConfig?.icon
            }}</v-icon>
          </div>
          <h2>{{ currentStepConfig?.title }}</h2>
          <p>{{ currentStepConfig?.description }}</p>
        </div>
      </div>

      <!-- Dynamic Content Based on Step -->
      <DocumentUpload
        :applicationData="applicationData"
        v-if="currentStepConfig?.showDocumentUpload"
        :documentsData="documentsStepData"
        @file-uploaded="handleFileUploaded"
        @file-removed="handleFileRemoved"
        @all-files-uploaded="handleAllFilesUploaded"
        @submit-documents="handleSubmitDocuments"
        @documents-submitted-success="handleDocumentsSubmittedSuccess"
        @show-error="handleShowError"
        @show-success="handleShowSuccess"
      />

      <RefundAmoundStep
        v-if="currentStepConfig?.showRefundStep"
        :applicationData="applicationData"
        :currentStepData="currentStepData"
        @pay-now="handlePayNow"
        @reload-application-data="loadApplicationData"
      />
    </div>
  </div>
</template>

<script>
import Timeline from "./Timeline.vue";
import RefundAmoundStep from "./RefundAmoundStep.vue";
import DocumentUpload from "./DocumentUpload.vue";
import ApplicationService from "../../../services/application";
// import PreviewQuestionnaireDialog from "./questionnaire/PreviewQuestionnaireDialog.vue"
export default {
  name: "ApplicationStep",
  components: {
    Timeline,
    RefundAmoundStep,
    DocumentUpload,
    // PreviewQuestionnaireDialog
  },

  data() {
    return {
      appLoading: false,
      ServerError: false,
      snackbarColor: "#1A73E9",
      timeout: 5000,
      msg: null,
      applicationId: this.$route.query.id,
      applicationData: {},
      isLoading: false,
      currentStepData: null, // Will hold data for the current step
      documentsStepData: {
        additionalApplicationDocumentsGrouped: [],
        applicationDocumentsGrouped: [],
      },
      currentStep: "documents_upload", // Can be: 'documents', 'review', 'refund', 'processing', etc.
      stepConfigurations: {
        documents_upload: {
          showHeader: true,
          showDocumentUpload: true,
          showIcons: false,
          showRefundStep: false,
          icon: "mdi-file-upload",
          title: "Upload Required Documents",
          description:
            "Upload necessary files for income documents. PDFs are accepted for claims or other tax-related documentation.",
        },
        review: {
          showHeader: true,
          showDocumentUpload: false,
          showIcons: true,
          showRefundStep: false,
          icon: "mdi-timer-sand",
          title: "Your application is currently under review.",
          description:
            "Our team is processing your request, and you will be notified once the review is complete.Thank you for your patience.",
        },
        refund_completed: {
          showHeader: false,
          showDocumentUpload: false,
          showIcons: true,
          showRefundStep: true,
          icon: "mdi-cash-multiple",
          title: "Refund Amount",
          description:
            "Review your estimated refund amount and proceed with payment.",
        },
        processing: {
          showHeader: true,
          showDocumentUpload: false,
          showIcons: true,
          showRefundStep: false,
          icon: "mdi-timer-sand",
          title: "Your application is under processing",
          description:
            "Review completed. Your refund request is being processed.",
        },
        agent_activation: {
          showHeader: true,
          showDocumentUpload: false,
          showIcons: true,
          showRefundStep: false,
          icon: "mdi-timer-sand",
          title: "Agent Not Yet Active",
          description:
            "Waiting for agent approval. Please log in to the ROS portal to approve your agent.",
        },
        documents_upload_review: {
          showHeader: true,
          showDocumentUpload: true,
          showIcons: true,
          showRefundStep: false,
          icon: "mdi-timer-sand",
          title: "Upload & Review Documents",
          description:
            "Upload your documents and review them before submission.",
        },
      },
    };
  },

  computed: {
    currentStepConfig() {
      // Return the configuration for the current step with dynamic description
      const config =
        this.stepConfigurations[this.currentStep] ||
        this.stepConfigurations.documents;

      // Add dynamic year to documents description if applicationData has year
      if (
        (this.currentStep === "documents_upload" ||
          this.currentStep === "documents_upload_review") &&
        this.applicationData?.year
      ) {
        return {
          ...config,
          description: `Upload necessary files for income documents. PDFs are accepted for claims or other tax-related documentation for the year ${this.applicationData.year}.`,
        };
      }

      return config;
    },
  },

  methods: {
    handleContinue() {
      console.log("Continue application clicked");
      // Handle continue logic here
      this.$emit("continue-application", this.applicationData);
    },
    async loadApplicationData() {
      // Check if application ID exists
      if (!this.applicationId) {
        this.ServerError = true;
        this.$snackbar.showError(
          "Application ID is missing. Please provide a valid application ID."
        );
        return;
      }

      console.log("Loading application data for ID:", this.applicationId);
      this.appLoading = true;
      this.ServerError = false;

      try {
        // Fetch application data from API
        const applicationResponse = await ApplicationService.getApplicationById(
          this.applicationId
        );

        if (applicationResponse && applicationResponse.data) {
          this.applicationData = applicationResponse.data;
          // console.log('Application data loaded:', this.applicationData);

          // Determine current step and load its data
          await this.determineCurrentStep(
            this.applicationData?.currentStep || "documents_upload"
          );
        } else {
          throw new Error("No application data returned");
        }
      } catch (error) {
        console.error("Error loading application data:", error);
        this.appLoading = false;

        // Handle different error scenarios
        if (error.response) {
          if (error.response.status === 404) {
            this.ServerError = true;
            this.msg =
              "Application not found. Please check the application ID and try again.";
          } else if (error.response.status === 401) {
            this.ServerError = true;
            this.msg = "Unauthorized. Please login again.";
          } else if (error.response.status === 403) {
            this.ServerError = true;
            this.msg =
              "Access denied. You do not have permission to view this application.";
          } else if (error.response.status === 500) {
            this.ServerError = true;
            this.msg = "A server error occurred. Please try again later.";
          } else {
            this.ServerError = false;
            this.msg = error.response?.data?.message || "";
          }
        } else if (error.request) {
          this.ServerError = true;
          this.msg =
            "Network error. Please check your internet connection and try again.";
        } else {
          this.ServerError = true;
          this.msg =
            error.message || "An unexpected error occurred. Please try again.";
        }

        this.$snackbar.showError(this.msg);
        return;
      } finally {
        this.appLoading = false;
      }
    },

    async handleFileUploaded(data) {
      console.log("File uploaded:", data);
      this.handleShowError(
        `${data.file.fileName} uploaded successfully!`,
        "success"
      );
    },

    async handleAllFilesUploaded(data) {
      console.log("handleAllFilesUploaded called with:", data);

      // Reload application data only after all files are uploaded
      console.log("Calling loadApplicationData...");
      await this.loadApplicationData();
      console.log("loadApplicationData completed");
    },

    async handleFileRemoved(data) {
      console.log("File removed:", data);
      await this.loadApplicationData();
      // Here you would typically remove the file from your server
      // For now, we'll just log it

      // You can add API call here to remove the file
      // this.removeFileFromServer(data.file, data.category);
    },

    handleSubmitDocuments(documentsData) {
      console.log("Documents submitted:", documentsData);
      // Here you would typically submit all documents to your server

      // Show success message
      this.handleShowError("Documents submitted successfully!", "success");

      // You can add API call here to submit documents
      // this.submitDocumentsToServer(documentsData);
    },

    async handleDocumentsSubmittedSuccess() {
      console.log(
        "Documents submitted successfully, reloading application data..."
      );
      await this.loadApplicationData();
    },

    handleShowError(message, type = "error") {
      if (type === "success") {
        this.$snackbar.showSuccess(message);
      } else {
        this.$snackbar.showError(message);
      }
    },

    handleShowSuccess(message) {
      this.$snackbar.showSuccess(message);
    },

    handlePayNow(paymentData) {
      console.log("Payment initiated:", paymentData);
      // Handle payment logic here
      // You can integrate with payment gateway
      // this.processPayment(paymentData);
      // Emit to parent component
      this.$emit("payment-initiated", paymentData);
    },

    navigateBack() {
      this.$router.push("/application");
    },

    async determineCurrentStep(currentStep) {
      // Determine which step to show based on application data and load its data
      if (!this.applicationData || !this.applicationData.steps) {
        this.currentStep = currentStep;
        await this.loadStepData(currentStep);
        return;
      }

      const steps = this.applicationData.steps;

      // Find the current active step
      const activeStep = steps.find(
        (step) => step.status === true && step.data.status !== "completed"
      );

      // Determine step key from active step or default to documents
      let stepKey = currentStep;
      if (activeStep) {
        stepKey =
          activeStep.key === "initial_review_and_enquiry"
            ? "documents_upload"
            : activeStep.key;
      }

      // Set current step and load its data
      this.currentStep = stepKey;
      await this.loadStepData(stepKey);

      console.log("Current step determined:", this.currentStep);
    },

    async setStep(stepKey) {
      // Method to manually set the current step and load its data
      if (this.stepConfigurations[stepKey]) {
        this.currentStep = stepKey;
        await this.loadStepData(stepKey);
        console.log("Step changed to:", stepKey);
      } else {
        console.warn("Invalid step key:", stepKey);
      }
    },

    async loadStepData(stepKey) {
      // Load data for the specified step
      if (!stepKey || !this.applicationId) {
        console.warn("Cannot load step data: missing stepKey or applicationId");
        return;
      }

      try {
        console.log(`Loading data for step: ${stepKey}`);
        let stepResponse = null;

        // Call the appropriate API based on step key
        switch (stepKey) {
          case "documents_upload":
          case "documents_upload_review":
            stepResponse = await ApplicationService.getDocumentsStepData(
              this.applicationId
            );
            if (stepResponse && stepResponse.data) {
              this.documentsStepData = stepResponse.data.stepData;
              this.currentStepData = stepResponse.data;
              console.log(
                "Documents step data loaded:",
                this.documentsStepData
              );
              // this.stepConfigurations['documents_with_review'] = true;
            }
            break;

          case "agent_activation":
            stepResponse = await ApplicationService.getAgentActivationStepData(
              this.applicationId
            );
            if (stepResponse && stepResponse.data) {
              this.currentStepData = stepResponse.data;
              console.log(
                "Agent activation step data loaded:",
                this.currentStepData
              );
            }
            break;

          case "review":
            stepResponse = await ApplicationService.getReviewStepData(
              this.applicationId
            );
            if (stepResponse && stepResponse.data) {
              this.currentStepData = stepResponse.data;
              console.log("Review step data loaded:", this.currentStepData);
            }
            break;

          case "processing":
            stepResponse = await ApplicationService.getProcessingStepData(
              this.applicationId
            );
            if (stepResponse && stepResponse.data) {
              this.currentStepData = stepResponse.data;
              console.log("Processing step data loaded:", this.currentStepData);
            }
            break;

          case "refund_completed":
            stepResponse = await ApplicationService.getRefundStepData(
              this.applicationId
            );
            if (stepResponse && stepResponse.data) {
              this.currentStepData = stepResponse.data;
              console.log("Refund step data loaded:", this.currentStepData);
            }
            break;

          case "initial_review_and_enquiry":
            setTimeout(() => {
              this.$router.push({
                path: "/questionnaire-preview",
                query: {
                  id: this.applicationData.id,
                  responseId: this.applicationData.questionnaireResponse.id,
                },
              });
            }, 100);
            // Questionnaire step doesn't have a separate API, redirect to documents
            console.log("Questionnaire step, loading documents data instead");
            await this.loadStepData("documents_upload");
            break;

          default:
            console.warn(`No API endpoint configured for step: ${stepKey}`);
        }
      } catch (error) {
        console.error(`Error loading ${stepKey} step data:`, error);

        // Show error message but don't block the UI
        this.$snackbar.showError(
          `Failed to load ${stepKey} data. Some information may be unavailable.`
        );
      }
    },
  },

  handleFileRemoved() {
    // Here you would typically remove the file from your server
    // For now, we'll just log it
    // You can add API call here to remove the file
    // this.removeFileFromServer(data.file, data.category);
  },

  handleSubmitDocuments() {
    // Here you would typically submit all documents to your server

    // Show success message
    this.handleShowError("Documents submitted successfully!", "success");

    // You can add API call here to submit documents
    // this.submitDocumentsToServer(documentsData);
  },

  handleShowError(message, type = "error") {
    // You can integrate this with your notification system

    // Example: Show toast notification
    // this.$toast.show(message, { type });

    // Or emit to parent component
    this.$emit("show-notification", { message, type });
  },

  handlePayNow(paymentData) {
    // Handle payment logic here
    // You can integrate with payment gateway
    // this.processPayment(paymentData);

    // Emit to parent component
    this.$emit("payment-initiated", paymentData);
  },
  created() {
    // Load application data when component is created
    this.loadApplicationData();
  },
};
</script>

<style lang="scss" scoped>
.step-container {
  background: white;
  border-top: 1px dotted #ccc;
}

.application-step-upload-container {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
  font-family: "DM Sans", sans-serif;
  position: relative;

  h2 {
    margin-bottom: 20px;
    color: #333;
  }
}

.back-button-container {
  position: absolute;
  top: 0;
  right: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.back-button {
  position: relative;
  bottom: 23px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 20px;
  background: white;
  border: 2px solid #3073f8;
  border-radius: 4px;
  color: #3073f8;
  font-size: 14px;
  font-weight: 500;
  font-family: "DM Sans", sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #3073f8;
    color: white;

    .v-icon {
      color: white !important;
    }
  }

  &:active {
    transform: scale(0.98);
  }

  .v-icon {
    color: #3073f8;
    transition: color 0.3s ease;
  }

  span {
    line-height: 1;
  }
}

.header {
  text-align: center;
  margin: 40px;
  padding-bottom: 40px;
  font-family: "DM Sans", sans-serif;
  //padding-bottom: 60px;

  .icon {
    width: 60px;
    height: 60px;
    background: #ff9800;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;

    v-icon {
      color: white;
      font-size: 24px;
    }
  }

  h2 {
    color: #333;
    margin-bottom: 10px;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    color: #666;
    font-size: 14px;
    max-width: 600px;
    margin: 0 auto;
  }
}

.under-review {
  padding-bottom: 40px;
}
</style>
