<template>
  <div>
    <!-- Error Snackbar -->
    <v-snackbar v-model="showErrorSnackbar" color="red" right :timeout="timeout">
      <v-layout wrap justify-center>
        <v-flex text-left class="align-self-center">
          <span style="color: #ffffff">{{ errorMessage }}</span>
        </v-flex>
        <v-flex text-right>
          <v-btn small :ripple="false" text @click="showErrorSnackbar = false">
            <v-icon style="color: #ffffff">mdi-close</v-icon>
          </v-btn>
        </v-flex>
      </v-layout>
    </v-snackbar>

    <v-dialog v-model="dialog" max-width="400px" persistent z-index="9999" overlay-opacity="0.5">
      <v-card elevation="0" class="remove-question-modal">
        <!-- Modal Background -->
        <div class="modal-content">
          <!-- Warning Icon Circle -->
          <!-- <div > -->
          <img src="@/assets/images/frame_11.png" alt="Delete" class="delete-icon" />
          <!-- </div> -->

          <!-- Confirmation Text -->
          <div class="confirmation-text">
            <p class="confirmation-title">Are you sure you want to remove</p>
            <p class="confirmation-subtitle">this question ?</p>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <!-- Cancel Button -->
            <v-btn class="cancel-btn" :ripple="false" @click="handleCancel">
              Cancel
            </v-btn>

            <!-- Delete Button -->
            <v-btn class="delete-btn" :loading="isDeleting" :disabled="isDeleting" :ripple="false"
              @click="handleDelete">
              Delete
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { questionnaire as questionnaireApi } from "@/api";

export default {
  name: "RemoveQuestionModal",
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    question: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      dialog: this.value,
      isDeleting: false,
      showErrorSnackbar: false,
      errorMessage: '',
      timeout: 5000,
    };
  },
  watch: {
    value(newVal) {
      this.dialog = newVal;
      if (newVal) {
        console.log(
          "🗑️ Remove question modal opened for:",
          this.question?.questionText
        );
      }
    },
    dialog(newVal) {
      this.$emit("input", newVal);
    },
  },
  methods: {
    handleCancel() {
      console.log("❌ Delete cancelled");
      this.dialog = false;
    },

    async handleDelete() {
      if (!this.question?.id) {
        console.error("❌ No question ID provided for deletion");
        return;
      }

      try {
        this.isDeleting = true;
        console.log("🔄 Deleting question:", this.question.id);

        const { success, message } = await questionnaireApi.deleteQuestion(
          this.question.id
        );

        if (success) {
          console.log("✅ Question deleted successfully");
          this.$emit("questionDeleted", this.question);
          this.dialog = false;
        } else {
          this.dialog = false;
          this.showError(message || "Failed to delete question");
          console.error("❌ Failed to delete question:", message);

        }
      } catch (error) {
        console.error("❌ Error deleting question:", error);
        this.showError(error.message || "Error deleting question");
      } finally {
        this.isDeleting = false;
      }
    },

    showError(message) {
      this.errorMessage = message;
      this.showErrorSnackbar = true;
    },
  },
};
</script>

<style scoped>
/* Modal Styles - Pixel Perfect from Figma */
.remove-question-modal {
  width: 400px !important;
  max-width: 400px !important;
  height: 250px !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  background-color: white !important;
}

.modal-content {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 35px 32px 35px 32px !important;
  height: 100% !important;
  position: relative !important;
}

/* Warning Icon Circle */
.warning-icon-circle {
  width: 58px !important;
  height: 58px !important;
  border-radius: 50% !important;
  /* background-color: rgba(213, 62, 62, 0.1) !important; */
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-bottom: 24px !important;
}

.delete-icon {
  width: 58px !important;
  height: 58px !important;
  object-fit: contain !important;
}

/* Confirmation Text */
.confirmation-text {
  text-align: center !important;
  margin-bottom: 40px !important;
}

.confirmation-title {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 600 !important;
  font-size: 16px !important;
  color: #000000 !important;
  line-height: normal !important;
  margin: 0 !important;
  margin-bottom: 2px !important;
}

.confirmation-subtitle {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 600 !important;
  font-size: 16px !important;
  color: #000000 !important;
  line-height: normal !important;
  margin: 0 !important;
}

/* Action Buttons */
.action-buttons {
  display: flex !important;
  gap: 10px !important;
  width: 100% !important;
  justify-content: center !important;
}

/* Cancel Button */
::v-deep(.cancel-btn) {
  width: 152px !important;
  height: 42px !important;
  border-radius: 4px !important;
  background-color: #f5f5f5 !important;
  border: none !important;
  box-shadow: none !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

::v-deep(.cancel-btn .v-btn__content) {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  font-size: 16px !important;
  color: #5f5f5f !important;
  line-height: normal !important;
}

::v-deep(.cancel-btn:hover) {
  background-color: #eeeeee !important;
}

::v-deep(.cancel-btn:before) {
  background-color: transparent !important;
}

/* Delete Button */
::v-deep(.delete-btn) {
  width: 152px !important;
  height: 42px !important;
  border-radius: 4px !important;
  background-color: #d53e3e !important;
  border: none !important;
  box-shadow: none !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

::v-deep(.delete-btn .v-btn__content) {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  font-size: 16px !important;
  color: white !important;
  line-height: normal !important;
}

::v-deep(.delete-btn:hover) {
  background-color: #c03535 !important;
}

::v-deep(.delete-btn:before) {
  background-color: transparent !important;
}

::v-deep(.delete-btn:disabled) {
  background-color: #cccccc !important;
}

::v-deep(.delete-btn:disabled .v-btn__content) {
  color: #666666 !important;
}
</style>