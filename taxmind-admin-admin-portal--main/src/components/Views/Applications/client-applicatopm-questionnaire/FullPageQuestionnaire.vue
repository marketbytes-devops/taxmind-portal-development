<template>
  <div class="full-page-questionnaire">
    <vue-element-loading
      :active="appLoading"
      spinner="bar-fade-scale"
      color="#1A73E9"
      size="60"
      is-full-screen
    />
    <!-- notifications are shown via global snackbar: this.$snackbar -->

    <div class="questionnaire-container">
      <!-- Inline Error Display -->
      <v-card v-if="ServerError" class="error-card mb-4" elevation="2">
        <v-card-text class="error-content">
          <v-layout align-center>
            <v-icon color="error" size="48" class="mr-4"
              >mdi-alert-circle</v-icon
            >
            <div>
              <div class="error-title">Error Loading Questionnaire</div>
              <div class="error-message">{{ msg }}</div>
              <v-btn
                color="primary"
                class="mt-3"
                small
                @click="$router.push('/application')"
              >
                <v-icon left small>mdi-arrow-left</v-icon>
                Back to Applications
              </v-btn>
            </div>
          </v-layout>
        </v-card-text>
      </v-card>

      <div v-else>
        <div class="progress-container">
          <v-card rounded="lg" flat class="pa-4">
            <div class="d-flex justify-space-between align-center mb-5">
              <div class="step-header text-body-1">
                Tax Credit Eligibility Questionnaire
              </div>
              <div class="text-caption step-progress font-weight-medium">
                <span class="text-blue">{{ completionPercentage }}%</span>
                Completed
              </div>
            </div>

            <v-progress-linear
              :color="completionPercentage === 100 ? 'success' : 'primary'"
              :value="completionPercentage"
              height="6"
              rounded
            ></v-progress-linear>
          </v-card>
        </div>

        <!-- <div class="questionnaire-header">
                    <v-btn icon @click="goBack" class="back-button">
                        <v-icon>mdi-arrow-left</v-icon>
                    </v-btn>
                    <h1 class="questionnaire-title">Questionnaire Preview</h1>
                    <span v-if="$route.query.id" class="application-id">Application ID: {{ $route.query.id }}</span>
                </div> -->

        <PreviewQuestionnaireDialog
          :categories="categories"
          :responseId="questionnaireResponseId"
          @show-snackbar="handleShowSnackbar"
          @fetch-questionnaire="handleFetchQuestionnaire"
          @submit-questionnaire="handleSubmitQuestionnaire"
        />
      </div>
    </div>
  </div>
</template>

<script>
import PreviewQuestionnaireDialog from "./PreviewQuestionnaireDialog.vue";
import ApplicationService from "@/services/application";
export default {
  name: "FullPageQuestionnaire",
  components: {
    PreviewQuestionnaireDialog,
  },
  data() {
    return {
      appLoading: false,
      ServerError: false,
      timeout: 5000,
      // msg and showSnackBar replaced by global snackbar
      categories: [],
      applicationId: null,
      questionnaireResponseId: null,
    };
  },
  computed: {
    completionPercentage() {
      if (!this.categories || this.categories.length === 0) {
        return 0;
      }

      const completedCount = this.categories.filter(
        (cat) => cat.isCompleted === true
      ).length;
      const totalCount = this.categories.length;

      return Math.round((completedCount / totalCount) * 100);
    },
  },
  mounted() {
    // Validate required query parameters
    const { id, responseId } = this.$route.query;

    if (!id || !responseId) {
      this.$snackbar.showError(
        "Missing required parameters. Please start a new application."
      );
      setTimeout(() => {
        this.$router.push("/application");
      }, 3000);
      return;
    }

    this.applicationId = id;
    this.questionnaireResponseId = responseId;

    console.log("📋 Loading questionnaire:", {
      applicationId: this.applicationId,
      questionnaireResponseId: this.questionnaireResponseId,
    });

    this.fetchQuestionnaireData(id);
  },
  created() {
    // If we have an application ID, we would typically fetch the questionnaire data
    // if (this.$route.query.id) {
    // }
  },
  methods: {
    goBack() {
      this.$router.push("/application");
    },
    async fetchQuestionnaireData() {
      this.appLoading = true;

      try {
        const response = await ApplicationService.getQuestionnaire(
          this.questionnaireResponseId
        );

        if (response.success) {
          this.categories = response.data.questionnaire.questionCategories;
        } else {
          throw new Error(response.message || "Failed to load questionnaire");
        }
      } catch (error) {
        console.error("Error fetching questionnaire data:", error);

        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to load questionnaire. Please try again.";

        this.$snackbar.showError(errorMessage);
        this.ServerError = true;

        // Optionally redirect back to application page after showing error
        setTimeout(() => {
          this.$router.push("/application");
        }, 3000);
      } finally {
        this.appLoading = false;
      }
    },
    handleShowSnackbar({ message }) {
      this.$snackbar.showSuccess(message || "");
    },
    async handleFetchQuestionnaire(onSuccessCallback, currentCategory) {
      this.appLoading = true;

      try {
        // Update progress before fetching new data
        if (currentCategory && currentCategory.id) {
          const progressData = {
            currentCategoryId: currentCategory.id,
            completionPercentage: this.completionPercentage,
          };

          await ApplicationService.updateQuestionnaireProgress(
            this.questionnaireResponseId,
            progressData
          );
        }

        const response = await ApplicationService.getQuestionnaire(
          this.questionnaireResponseId
        );

        if (response.success) {
          this.categories = response.data.questionnaire.questionCategories;

          // Call the success callback to navigate to next category
          if (onSuccessCallback && typeof onSuccessCallback === "function") {
            this.$nextTick(() => {
              onSuccessCallback();
            });
          }
        } else {
          throw new Error(response.message || "Failed to load questionnaire");
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to load next category. Please try again.";

        this.$snackbar.showError(errorMessage);
      } finally {
        this.appLoading = false;
      }
    },
    async handleSubmitQuestionnaire() {
      this.appLoading = true;

      try {
        // Get the last category
        const lastCategory = this.categories[this.categories.length - 1];

        // Update progress to 100% before submitting
        if (lastCategory && lastCategory.id) {
          const progressData = {
            currentCategoryId: lastCategory.id,
            completionPercentage: 100,
          };

          await ApplicationService.updateQuestionnaireProgress(
            this.questionnaireResponseId,
            progressData
          );
        }

        const payload = {
          responseId: this.questionnaireResponseId,
        };

        const response = await ApplicationService.submitQuestionnaireResponse(
          payload
        );

        if (response.success) {
          this.$snackbar.showSuccess("Questionnaire submitted successfully!");

          // Navigate to application upload page
          setTimeout(() => {
            this.$router.push({
              path: "/application-upload",
              query: { id: this.applicationId },
            });
          }, 500);
        } else {
          throw new Error(response.message || "Failed to submit questionnaire");
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to submit questionnaire. Please try again.";

        this.$snackbar.showError(errorMessage);
      } finally {
        this.appLoading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.progress-container {
  margin-bottom: 10px;
}

.full-page-questionnaire {
  width: 100%;
  min-height: 100vh;
  // background-color: #f8f9fa;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.questionnaire-container {
  width: 100%;
  max-width: 1200px;
  margin-top: 135px;
  //background-color: white;
  // border-radius: 8px;
  // box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.questionnaire-header {
  padding: 16px 24px;
  background-color: #1a73e9;
  color: white;
  display: flex;
  align-items: center;
}

.back-button {
  margin-right: 16px;
  color: white !important;
}

.questionnaire-title {
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.application-id {
  margin-left: auto;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.step-header {
  font-size: 20px !important;
}

/* reserved for future progress bar customizations */

.text-blue {
  color: #1a73e9;
}

/* Inline Error Styles */
.error-card {
  background-color: #fff;
  border-left: 4px solid #f44336;
  border-radius: 8px;
}

.error-content {
  padding: 24px !important;
}

.error-title {
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #f44336;
  margin-bottom: 8px;
}

.error-message {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  color: #5f5f5f;
  line-height: 1.5;
  margin-bottom: 8px;
}
</style>
