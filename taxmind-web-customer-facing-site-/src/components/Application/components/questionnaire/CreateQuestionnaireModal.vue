<template>
  <!-- Backdrop/Overlay -->
  <div v-if="visible" class="create-questionnaire-overlay" @click="handleCancel">
    <!-- Modal Container -->
    <v-card class="create-questionnaire-modal" @click.stop :ripple="false">
      <!-- Snackbar inside modal -->
      <v-snackbar v-model="showSnackbar" :color="snackbarColor" top :timeout="3000" class="modal-snackbar">
        {{ snackbarMessage }}
        <template v-slot:action="{ attrs }">
          <v-btn text v-bind="attrs" @click="showSnackbar = false" small>
            <v-icon small>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-snackbar>

      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">{{ LABELS.CREATE_QUESTIONNAIRE_MODAL }}</h2>
        <v-btn icon small @click="handleCancel" class="close-btn">
          <v-icon color="#FFFFFF" size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Financial Year Section -->
        <div class="form-section">
          <label class="field-label">{{ LABELS.FINANCIAL_YEAR }}</label>
          <v-select v-model="financialYear" :items="yearOptions" item-text="label" item-value="value"
            class="outlined-field" solo flat outlined dense hide-details append-icon="mdi-chevron-down"
            placeholder="Select financial year">
            <template v-slot:prepend-inner>
              <v-icon size="16" color="#6B7280">mdi-calendar</v-icon>
            </template>
          </v-select>
        </div>
      </div>

      <!-- Proceed Button -->
      <div class="button-section">
        <v-btn :ripple="false" depressed color="primary" class="proceed-btn" block @click="handleProceed"
          :disabled="isCreating">
          <span v-if="isCreating && !importQuestionnaire">Importing from {{ importFromYear }}...</span>
          <span v-else-if="isCreating && importQuestionnaire">Creating questionnaire...</span>
          <span v-else>{{ LABELS.PROCEED }}</span>
        </v-btn>
      </div>
    </v-card>

    <!-- Global snackbar used via this.$snackbar -->
  </div>
</template>

<script>
import ApplicationService from "@/services/application.js";

export default {
  name: "CreateQuestionnaireModal",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    LABELS: {
      type: Object,
      required: true,
    },
  },
  data() {
    const currentYear = new Date().getFullYear();
    const startYear = 2021;

    // Generate year options from next year down to 2021
    const yearOptions = [];
    for (let year = currentYear + 1; year >= startYear; year--) {
      yearOptions.push({ label: year.toString(), value: year });
    }

    return {
      financialYear: "",
      importQuestionnaire: true, // true = No, false = Yes
      importFromYear: "",
      questionnaireId: null,
      isCreating: false,
      yearOptions: yearOptions,
      importYearOptions: [
        { label: "2025", value: 2025 },
        { label: "2024", value: 2024 },
        { label: "2023", value: 2023 },
        { label: "2022", value: 2022 },
        { label: "2021", value: 2021 },
      ],
      errorMessage: null,
      importSuccess: false,
      showSnackbar: false,
      snackbarMessage: "",
      snackbarColor: "success",
    };
  },
  methods: {
    handleCancel() {
      this.$emit("cancel");
    },
    handleNoButtonClick() {
      // When "No" is clicked, just set the state - API call will happen on Proceed
      this.importQuestionnaire = true;
    },
    async handleProceed() {
      if (!this.financialYear) {
        this.showSnackbarMessage("Please select a financial year", "error");
        return;
      }

      this.isCreating = true;
      this.errorMessage = null;

      try {
        const payload = {
          year: this.financialYear,
          isAmendment: false,
          parentApplicationId: null,
        };

        console.log("📤 Starting application:", payload);
        const response = await ApplicationService.startApplication(payload);
        console.log("✅ Application started successfully:", response);

        // Show success message
        this.showSnackbarMessage("Application started successfully!", "success");

        // Navigate to questionnaire preview with the application ID and questionnaireResponseId
        this.$router.push({
          path: "/questionnaire-preview",
          query: {
            id: response.data.application.id,
            responseId: response.data.questionnaireResponseId,
          },
        });

        // Close modal and emit success
        this.$emit("success", response);
        this.$emit("cancel");
      } catch (error) {
        console.error("❌ Failed to start application:", error);

        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to start application. Please try again.";

        this.showSnackbarMessage(errorMessage, "error");
      } finally {
        this.isCreating = false;
      }
    },
    showSnackbarMessage(message, color = "success") {
      this.snackbarMessage = message;
      this.snackbarColor = color;
      this.showSnackbar = true;
    },
  },
};
</script>

<style scoped>
/* Create Questionnaire Modal - Pixel Perfect Design */
.create-questionnaire-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.create-questionnaire-modal {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.1);
  width: 460px;
  /* height: auto; */
  /* min-height: 314px;
  max-height: 90vh; */
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Snackbar inside modal */
::v-deep(.modal-snackbar.v-snack) {
  /* position: absolute !important;
  top: 0px !important; */
  z-index: 10000 !important;
}

::v-deep(.modal-snackbar .v-snack__wrapper) {
  min-width: 300px;
  max-width: 400px;
}

/* Header - Blue Background like Add Category Modal */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  background: #1a73e9;
  padding: 0 24px;
  flex-shrink: 0;
}

.modal-title {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  line-height: 24px;
  margin: 0;
}

.close-btn {
  background: transparent !important;
  box-shadow: none !important;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

/* Modal Content */
.modal-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  /* min-height: 200px; */
}

/* Form Sections */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #5f5f5f;
  line-height: 24px;
  margin-bottom: 4px;
  text-align: left;
}

/* Outlined Form Fields */
.outlined-field {
  width: 100%;
  height: 40px;
}

::v-deep(.outlined-field .v-input__control) {
  min-height: 40px;
  height: 40px;
}

::v-deep(.outlined-field .v-input__slot) {
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  height: 40px;
  min-height: 40px;
  padding: 0 12px;
  box-shadow: none;
}

::v-deep(.outlined-field.v-input--is-focused .v-input__slot) {
  border-color: #1a73e9;
  box-shadow: 0 0 0 3px rgba(26, 115, 233, 0.1);
}

::v-deep(.outlined-field .v-select__selection) {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #000000;
  line-height: 20px;
  margin: 0;
}

::v-deep(.outlined-field .v-input__prepend-inner) {
  margin-top: 0;
  margin-right: 8px;
  align-self: center;
}

::v-deep(.outlined-field .v-input__append-inner) {
  margin-top: 0;
  align-self: center;
}

::v-deep(.outlined-field .v-select__slot) {
  display: flex;
  align-items: center;
}

::v-deep(.outlined-field input::placeholder) {
  color: rgba(95, 95, 95, 0.5);
  font-size: 12px;
}

/* Radio Group */
.radio-group {
  display: flex;
  gap: 16px;
}

.radio-btn {
  width: 202px;
  height: 40px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  background-color: transparent;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #5f5f5f;
  text-transform: none;
  letter-spacing: normal;
  box-shadow: none;
  transition: all 0.2s ease;
}

.radio-btn.active {
  background-color: transparent !important;
  border: 2px solid #1a73e9 !important;
  color: #1a73e9 !important;
}

.radio-btn:hover {
  background-color: #f9fafb;
  border-color: #1a73e9;
}

.radio-btn.active:hover {
  background-color: rgba(26, 115, 233, 0.04) !important;
}

::v-deep(.radio-btn .v-btn__content) {
  color: inherit;
}

::v-deep(.radio-btn.active .v-btn__content) {
  color: #1a73e9 !important;
}

/* Proceed Button */
.button-section {
  padding: 0;
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb;
}

.proceed-btn {
  height: 50px !important;
  border-radius: 0;
  background-color: #1a73e9;
  color: white;
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  width: 100%;
  box-shadow: none;
}

.proceed-btn:hover {
  background-color: #1557b7;
}

.proceed-btn:disabled {
  background-color: #d1d5db;
  color: #9ca3af;
}

::v-deep(.proceed-btn .v-btn__content) {
  color: white;
}

::v-deep(.proceed-btn:disabled .v-btn__content) {
  color: #9ca3af;
}

/* Responsive Design */
@media (max-width: 768px) {
  .create-questionnaire-modal {
    width: 90vw;
    max-width: 500px;
    margin: 20px;
    min-height: 280px;
  }

  .modal-content {
    padding: 20px;
    gap: 16px;
    min-height: 160px;
  }

  .modal-header {
    height: 44px;
    padding: 0 20px;
  }

  .modal-title {
    font-size: 15px;
  }

  .field-label {
    font-size: 13px;
  }

  .radio-group {
    flex-direction: column;
    gap: 8px;
  }

  .radio-btn {
    width: 100%;
    height: 36px;
    font-size: 13px;
  }

  .proceed-btn {
    height: 44px !important;
    font-size: 15px;
  }

  .outlined-field {
    height: 36px;
  }

  ::v-deep(.outlined-field .v-input__control),
  ::v-deep(.outlined-field .v-input__slot) {
    min-height: 36px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .create-questionnaire-modal {
    width: 95vw;
    margin: 10px;
  }

  .modal-header {
    padding: 0 16px;
    height: 40px;
  }

  .modal-content {
    padding: 16px;
  }
}
</style>
