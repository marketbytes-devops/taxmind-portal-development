<template>
  <div class="agent-tax-filing">
    <server-error v-if="serverError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="primary" size="60" is-full-screen />

    <v-snackbar v-model="showSnackBar" color="primary" right :timeout="timeout">
      <span style="color: white">{{ msg }}</span>
      <v-btn small text @click="showSnackBar = false">
        <v-icon color="white">mdi-close</v-icon>
      </v-btn>
    </v-snackbar>
    <v-layout wrap justify-center>
      <v-flex xs12 sm12 md12 lg12 xl12>
        <v-card flat>

          <basic-details :applicantdata="applicantdata" :spouseData="userData.spouse" :userData="userData"
            :showCopyButtons="showCopyButtons" :showViewButton="showViewButton" @show-message="handleMessage" />
          <v-divider class="my-4"></v-divider>
          <questionnaire-overview :questionnaireData="questionnaireData" @show-message="handleMessage" />
          <v-divider class="my-4"></v-divider>
          <documents :applicantdata="applicantdata" @show-message="handleMessage"
            @completion-changed="handleCompletionChange" />

          <v-divider class=""></v-divider>
          <v-card-actions>
            <v-switch v-model="reviewCompleted" class="ml-6" label="Mark as Completed"
              :disabled="applicantdata.isApplicationReviewCompleted || !canEdit('applications')"
              @change="showCompletionConfirmation"></v-switch>
          </v-card-actions>

          <!-- Review Completion Confirmation Dialog -->
          <v-dialog v-model="showCompletionDialog" max-width="400" persistent>
            <div class="completion-popup-container">
              <div class="completion-popup-content-wrapper">
                <v-layout wrap justify-center>
                  <v-flex shrink py-1>
                    <v-icon size="58" color="#FF9800">mdi-alert-circle-outline</v-icon>
                  </v-flex>
                  <v-flex xs11 class="completion-popup-title">Mark Review as Completed?</v-flex>

                  <!-- Warning Message -->
                  <v-flex xs11 class="completion-popup-subtitle">
                    <strong>Warning:</strong> Once the review is marked as completed, it cannot be edited further. This
                    action cannot be undone.
                  </v-flex>

                  <!-- Action Buttons -->
                  <v-flex xs11>
                    <div class="completion-popup-buttons">
                      <v-btn class="completion-cancel-btn" depressed :ripple="false" @click="cancelCompletion">
                        Cancel
                      </v-btn>
                      <v-btn class="completion-confirm-btn" color="primary" depressed :ripple="false"
                        @click="confirmCompletion" :loading="completionLoading">
                        Confirm
                      </v-btn>
                    </div>
                  </v-flex>
                </v-layout>
              </div>
            </div>
          </v-dialog>
        </v-card>

      </v-flex>

    </v-layout>

  </div>
</template>

<script>
import http from "@/api/http";
import BasicDetails from "./agentTaxFilingComponents/BasicDetails.vue";
import QuestionnaireOverview from "./agentTaxFilingComponents/QuestionnaireOverview.vue";
import Documents from "./agentTaxFilingComponents/Documents.vue";
import { updateApplicationDocumentsUploaded, updateApplicationReview } from "@/api/modules/applications.js";
import permissionMixin from '@/mixins/permissionMixin';

export default {
  name: "AgentTaxFiling",
  mixins: [permissionMixin],
  props: {
    applicantdata: {
      type: Object,
      required: true,
    },
    userData: {
      type: Object,
      required: true,
    },
    showCopyButtons: {
      type: Boolean,
      default: false
    },
    showViewButton: {
      type: Boolean,
      default: true
    },
  },
  components: {
    BasicDetails,
    QuestionnaireOverview,
    Documents,
  },

  data() {
    return {
      appLoading: false,
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      serverError: false,
      documentsCompleted: false,
      reviewCompleted: false,
      showCompletionDialog: false,
      completionLoading: false,

      // Application Data
      applicationData: {},
      questionnaireData: [],
      documentCategories: [],

      // Application ID from route
      applicationId: null,
    };
  },

  mounted() {
    this.applicationId = this.$route.query.id || this.applicantdata?.id;
    if (this.applicationId) {
      // this.loadApplicationData();
    } else {
      this.msg = "Application ID not found";
      this.showSnackBar = true;
    }

    // Set initial state based on applicantdata
    if (this.applicantdata.isApplicationReviewCompleted) {
      this.reviewCompleted = true;
    }
  },

  methods: {
    // Review completion confirmation methods
    showCompletionConfirmation(value) {
      if (value) {
        // Only show confirmation when turning ON the switch
        this.showCompletionDialog = true;
      } else {
        // When turning OFF, just update the value
        this.reviewCompleted = false;
      }
    },

    cancelCompletion() {
      // Reset the switch and close dialog
      this.reviewCompleted = false;
      this.showCompletionDialog = false;
    },

    confirmCompletion() {
      this.completionLoading = true;

      console.log('AgentTaxFiling: Confirming completion for application ID:', this.applicationId || this.applicantdata.id);

      // Call the API to update review status
      updateApplicationReview(this.applicationId || this.applicantdata.id)
        .then(() => {
          this.completionLoading = false;
          this.showCompletionDialog = false;

          // Show success message
          this.msg = "Review marked as completed successfully";
          this.showSnackBar = true;

          console.log('AgentTaxFiling: Emitting status-updated event');
          // Emit event to parent component to refresh data
          this.$emit('review-completed');
          // Emit status-updated event to trigger getData() in applicationView
          this.$emit('status-updated');
        })
        .catch(error => {
          this.completionLoading = false;
          this.reviewCompleted = false;
          this.showCompletionDialog = false;

          // Show error message
          this.msg = error.response?.data?.error || "Failed to mark review as completed";
          this.showSnackBar = true;
        });
    },
    async loadApplicationData() {
      try {
        this.appLoading = true;

        const response = await http.get(
          `/v1/admin/application/get?id=${this.applicationId}`
        );

        this.appLoading = false;

        if (response.data.status) {
          const data = response.data.data;

          // Map API data to component structure using configuration
          this.applicationData = this.mapApplicationData(data);

          // Map questionnaire data
          this.questionnaireData = this.mapQuestionnaireData(
            data.questionnaire || data.answers
          );

          // Map documents data
          this.documentCategories = this.mapDocumentsData(
            data.documents || data.files
          );
        } else {
          this.serverError = false;
          this.msg = response.data.message || "Failed to load application data";
          this.showSnackBar = true;
        }
      } catch (err) {
        this.appLoading = false;

        if (err.response) {
          if (err.response.status === 500) {
            this.serverError = true;
            this.msg = "A server error occurred. Please try again later.";
          } else {
            this.serverError = false;
            this.msg =
              err.response.data.message ||
              "An error occurred while loading data.";
          }
        } else {
          this.serverError = true;
          this.msg = "An unexpected error occurred. Please try again.";
        }

        this.showSnackBar = true;
      }
    },

    mapApplicationData(data) {
      // Application data field mapping configuration
      const fieldMappings = [
        {
          key: "applicationNumber",
          apiFields: ["applicationNumber", "id"],
          fallback: "TXM00127",
        },
        {
          key: "agentActivationNumber",
          apiFields: ["agentActivationNumber", "agentNumber"],
          fallback: "AGN-8734-XY92",
        },
        {
          key: "name",
          apiFields: ["name", "fullName"],
          fallback: "Manu Sunny",
        },
        {
          key: "email",
          apiFields: ["email"],
          fallback: "manusunny123@yopmail.com",
        },
        {
          key: "phone",
          apiFields: ["phone", "phoneNumber"],
          fallback: "9876543210",
        },
        {
          key: "dateOfBirth",
          apiFields: ["dateOfBirth", "dob"],
          fallback: "10-06-2025",
        },
        {
          key: "profession",
          apiFields: ["profession", "occupation"],
          fallback: "Quality analyst",
        },
        {
          key: "ppsNumber",
          apiFields: ["ppsNumber", "pps"],
          fallback: "8765432A",
        },
        {
          key: "eircode",
          apiFields: ["eircode", "postCode"],
          fallback: "A65F4E2",
        },
        {
          key: "maritalStatus",
          apiFields: ["maritalStatus", "status"],
          fallback: "Married",
        },
      ];

      const mappedData = {};

      // Map each field using configuration
      fieldMappings.forEach((field) => {
        mappedData[field.key] = this.getFieldValue(
          data,
          field.apiFields,
          field.fallback
        );
      });

      // Handle address separately (special formatting)
      mappedData.address = data.address || this.formatDefaultAddress();

      return mappedData;
    },

    getFieldValue(data, apiFields, fallback) {
      // Try each API field in order until we find a non-empty value
      for (const field of apiFields) {
        const value = data[field];
        if (value !== null && value !== undefined && value !== "") {
          return value;
        }
      }

      // Return fallback if no valid value found
      return fallback;
    },

    mapQuestionnaireData(questionnaireData) {
      if (!questionnaireData || !Array.isArray(questionnaireData)) {
        return this.getDefaultQuestionnaireData();
      }

      return questionnaireData.map((section) => ({
        id: section.id,
        title: section.title || section.sectionName,
        questions: (section.questions || section.qa || []).map((qa) => ({
          question: qa.question || qa.q,
          answer: qa.answer || qa.a || "-",
        })),
      }));
    },

    mapDocumentsData(documentsData) {
      if (!documentsData || !Array.isArray(documentsData)) {
        return this.getDefaultDocumentsData();
      }

      // Group documents by category
      const categorizedDocs = {};

      documentsData.forEach((doc) => {
        const category = doc.category || "Other Documents";
        if (!categorizedDocs[category]) {
          categorizedDocs[category] = [];
        }

        categorizedDocs[category].push({
          id: doc.id,
          name: doc.name || doc.fileName,
          url: doc.url || doc.fileUrl || `/documents/${doc.id}`,
        });
      });

      return Object.keys(categorizedDocs).map((categoryName) => ({
        name: categoryName,
        documents: categorizedDocs[categoryName],
      }));
    },

    formatDefaultAddress() {
      return "12 Main Street, Rathmines,\nDublin 6, D06 X5F3,\nIreland";
    },

    getDefaultQuestionnaireData() {
      return [
        {
          id: 1,
          title: "Home Carer Tax Credit",
          questions: [
            { question: "Marital Status", answer: "Married" },
            {
              question: "Does your spouse earn less than €10,400 per year?",
              answer: "Yes",
            },
            {
              question:
                "Do you care for a dependent child, elderly person, or disabled individual?",
              answer: "Yes",
            },
            {
              question: "Enter the PPS Number of the dependent child",
              answer: "-",
            },
            {
              question: "Select the Date of Birth of the dependent child",
              answer: "01-01-1970",
            },
          ],
        },
        {
          id: 2,
          title: "Medical Expenses Tax Credit",
          questions: [
            {
              question:
                "Have you incurred medical or dental expenses not covered by insurance?",
              answer: "Yes",
            },
            {
              question: "Do you have receipts for these expenses?",
              answer: "Yes",
            },
            {
              question:
                "Enter the total amount of medical expenses incurred (€)",
              answer: "-",
            },
          ],
        },
        {
          id: 3,
          title: "Dependent Relative Tax Credit",
          questions: [
            {
              question:
                "Do you financially support a relative who is unable to support themselves?",
              answer: "Yes",
            },
            {
              question: "Select the dependent relative's relation",
              answer: "Yes",
            },
            {
              question: "Does their annual income fall below €16,000?",
              answer: "-",
            },
          ],
        },
      ];
    },

    getDefaultDocumentsData() {
      return [
        {
          name: "Medical Expenses Tax Credit",
          documents: [
            {
              id: 1,
              name: "Medical Expenses Tax Credit.pdf",
              url: "/documents/medical-expenses-1.pdf",
            },
            {
              id: 2,
              name: "Medical Expenses Tax Credit2.pdf",
              url: "/documents/medical-expenses-2.pdf",
            },
            {
              id: 3,
              name: "Medical Expenses Tax Credit3.pdf",
              url: "/documents/medical-expenses-3.pdf",
            },
            {
              id: 4,
              name: "Medical Expenses Tax Credit4.pdf",
              url: "/documents/medical-expenses-4.pdf",
            },
          ],
        },
        {
          name: "Dependent Relative Tax Credit",
          documents: [
            {
              id: 5,
              name: "Dependent relative form 1.Pdf",
              url: "/documents/dependent-relative-1.pdf",
            },
            {
              id: 6,
              name: "Dependent relative form 2.Pdf",
              url: "/documents/dependent-relative-2.pdf",
            },
            {
              id: 7,
              name: "Dependent relative form 3.Pdf",
              url: "/documents/dependent-relative-3.pdf",
            },
          ],
        },
        {
          name: "Home Carer Tax Credit",
          documents: [
            {
              id: 8,
              name: "Home Carer Tax Credit.pdf",
              url: "/documents/home-carer.pdf",
            },
          ],
        },
      ];
    },

    handleMessage(msg) {
      this.msg = msg;
      this.showSnackBar = true;
    },

    handleCompletionChange(isCompleted) {
      if (isCompleted) {
        this.handleMessage("Documents section marked as completed");
      } else {
        this.handleMessage("Documents section marked as incomplete");
      }
    },

    async updateDocumentsStatus(value) {
      if (!this.applicationId) {
        this.msg = "Application ID not found";
        this.showSnackBar = true;
        this.documentsCompleted = false;
        return;
      }

      if (value) {
        try {
          this.appLoading = true;
          await updateApplicationDocumentsUploaded(this.applicationId);
          this.appLoading = false;
          this.handleMessage("Application status updated successfully");
        } catch (error) {
          this.appLoading = false;
          this.documentsCompleted = false;

          if (error.response) {
            this.msg = error.response.data.error || "Failed to update application status";
          } else {
            this.msg = "An error occurred while updating application status";
          }

          this.showSnackBar = true;
        }
      }
    },
  },
};
</script>

<style scoped>
/* Review Completion Confirmation Dialog Styles */
.completion-popup-container {
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.completion-popup-content-wrapper {
  padding: 24px;
}

.completion-popup-title {
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  color: #000000;
  text-align: center;
  margin-top: 16px;
  margin-bottom: 8px;
}

.completion-popup-subtitle {
  font-family: "DM Sans", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #5F5F5F;
  text-align: center;
  margin-bottom: 24px;
}

.completion-popup-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
}

.completion-cancel-btn {
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #5F5F5F;
  background-color: transparent;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  height: 40px;
  min-width: 100px;
}

.completion-confirm-btn {
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #FFFFFF;
  background-color: #1A73E9;
  border-radius: 4px;
  height: 40px;
  min-width: 100px;
}

.agent-tax-filing {
  font-family: "DM Sans", sans-serif;
  background-color: #f1f7ff;
  min-height: 100vh;
}

/* Responsive Design */
@media (max-width: 768px) {
  .agent-tax-filing {
    padding: 0;
  }
}

/* Completion Section */
/* .completion-section {
  padding-top: 32px;
  margin-top: 32px;
} */

.completion-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 12px;
}

.toggle-switch {
  width: 25px;
  height: 14px;
  background-color: #1a73e9;
  border-radius: 10px;
  position: relative;
  transition: background-color 0.3s;
  cursor: pointer;
}

.toggle-switch:not(.active) {
  background-color: #e5e7eb;
}

.toggle-slider {
  width: 12px;
  height: 12px;
  background-color: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: 1px;
  left: 12px;
  transition: transform 0.3s;
}

.toggle-switch:not(.active) .toggle-slider {
  left: 1px;
}

.checkbox-label {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 24px;
  color: #1a73e9;
  cursor: pointer;
  font-variation-settings: "opsz" 14;
}

/* Responsive Design - Maintain Figma Proportions */
@media (max-width: 600px) {
  .documents-container {
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 14px;
    margin-bottom: 12px;
  }

  /* .document-category {
    margin-bottom: 24px;
  } */

  .documents-grid {
    margin-bottom: 20px;
  }

  /* Slightly smaller on mobile but maintain proportions */
  .document-card {
    width: 160px;
    height: 130px;
  }

  .document-preview {
    height: 62px;
  }

  .document-type-icon {
    width: 28px;
    height: 28px;
  }

  .icon-text {
    font-size: 7px;
  }

  .document-name-section {
    min-height: 42px;
    padding: 6px 10px;
  }

  .document-name-text {
    font-size: 11px;
    line-height: 14px;
  }

  .download-link-section {
    height: 22px;
    padding: 0 10px 6px 10px;
  }

  .download-link {
    font-size: 11px;
  }

  .view-icon-container {
    width: 28px;
    height: 28px;
  }

  .view-overlay-text {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .completion-section {
    padding-top: 20px;
    margin-top: 20px;
  }

  /* Even smaller on very small screens */
  .document-card {
    width: 140px;
    height: 115px;
  }

  .document-preview {
    height: 50px;
  }

  .document-type-icon {
    width: 24px;
    height: 24px;
  }

  .icon-text {
    font-size: 6px;
  }

  .document-name-section {
    min-height: 38px;
    padding: 5px 8px;
  }

  .document-name-text {
    font-size: 10px;
    line-height: 13px;
  }

  .download-link-section {
    height: 20px;
    padding: 0 8px 5px 8px;
  }

  .download-link {
    font-size: 10px;
  }

  .view-icon-container {
    width: 24px;
    height: 24px;
  }

  .view-overlay-text {
    font-size: 8px;
  }
}
</style>