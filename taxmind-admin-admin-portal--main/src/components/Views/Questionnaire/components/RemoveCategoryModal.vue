<template>
  <v-dialog
    v-model="dialog"
    max-width="400px"
    persistent
    z-index="9999"
    overlay-opacity="0.5"
  >
    <v-card elevation="0" class="remove-category-modal">
      <!-- Modal Background -->
      <div class="modal-content">
        <!-- Warning Icon Circle -->
        <!-- <div class="warning-icon-circle"> -->
        <img
          src="@/assets/images/frame_11.png"
          alt="Delete"
          class="delete-icon"
        />
        <!-- </div> -->

        <!-- Title -->
        <div class="confirmation-title">Delete category ?</div>

        <!-- Description Text -->
        <div class="confirmation-description">
          Deleting this category also removes all related questions. Type DELETE
          to continue.
        </div>

        <!-- Confirmation Input -->
        <div class="confirmation-input-container">
          <v-text-field
            v-model="confirmationText"
            placeholder="Enter DELETE"
            solo
            flat
            outlined
            dense
            hide-details
            class="confirmation-input"
            background-color="white"
            @input="handleInputChange"
          />
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <!-- Cancel Button -->
          <v-btn class="cancel-btn" :ripple="false" @click="handleCancel">
            Cancel
          </v-btn>

          <!-- Delete Button -->
          <v-btn
            class="delete-btn"
            :loading="isDeleting"
            :disabled="isDeleting || !isDeleteConfirmed"
            :ripple="false"
            @click="handleDelete"
          >
            Delete
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import { questionnaire as questionnaireApi } from "@/api";

export default {
  name: "RemoveCategoryModal",
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    category: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      dialog: this.value,
      isDeleting: false,
      confirmationText: "",
    };
  },
  computed: {
    isDeleteConfirmed() {
      return this.confirmationText.trim().toUpperCase() === "DELETE";
    },
  },
  watch: {
    value(newVal) {
      this.dialog = newVal;
      if (newVal) {
        console.log(
          "🗑️ Remove category modal opened for:",
          this.category?.name
        );
        // Reset confirmation text when modal opens
        this.confirmationText = "";
      }
    },
    dialog(newVal) {
      this.$emit("input", newVal);
    },
  },
  methods: {
    handleCancel() {
      console.log("❌ Delete cancelled");
      this.confirmationText = "";
      this.dialog = false;
    },

    handleInputChange() {
      // Convert input to uppercase for better UX
      this.confirmationText = this.confirmationText.toUpperCase();
    },

    async handleDelete() {
      if (!this.category?.id || !this.isDeleteConfirmed) {
        console.error("❌ No category ID provided or confirmation not entered");
        return;
      }

      try {
        this.isDeleting = true;
        console.log("🔄 Deleting category:", this.category.id);

        const { success, message } = await questionnaireApi.deleteCategory(
          this.category.id
        );

        if (success) {
          console.log("✅ Category deleted successfully");
          this.$emit("categoryDeleted", this.category);
          this.confirmationText = "";
          this.dialog = false;
        } else {
          console.error("❌ Failed to delete category:", message);
          this.$emit("error", message || "Failed to delete category");
        }
      } catch (error) {
        console.error("❌ Error deleting category:", error);
        this.$emit("error", error.message || "Error deleting category");
      } finally {
        this.isDeleting = false;
      }
    },
  },
};
</script>

<style scoped>
/* Modal Styles - Pixel Perfect from Figma */
.remove-category-modal {
  width: 400px !important;
  max-width: 400px !important;
  height: 340px !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  background-color: white !important;
}

.modal-content {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-start !important;
  padding: 40px 32px 35px 32px !important;
  height: 100% !important;
  position: relative !important;
}

/* Warning Icon Circle */
.warning-icon-circle {
  width: 58px !important;
  height: 58px !important;
  border-radius: 50% !important;
  background-color: rgba(213, 62, 62, 0.1) !important;
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

/* Title */
.confirmation-title {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 600 !important;
  font-size: 16px !important;
  color: #000000 !important;
  line-height: normal !important;
  margin: 0 !important;
  margin-bottom: 14px !important;
  text-align: center !important;
}

/* Description Text */
.confirmation-description {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  color: #5f5f5f !important;
  line-height: normal !important;
  margin: 0 !important;
  margin-bottom: 40px !important;
  text-align: center !important;
  width: 285px !important;
}

/* Confirmation Input Container */
.confirmation-input-container {
  width: 314px !important;
  margin-bottom: 20px !important;
}

/* Confirmation Input Field */
::v-deep(.confirmation-input) {
  width: 100% !important;
}

::v-deep(.confirmation-input .v-input__control) {
  min-height: 42px !important;
}

::v-deep(.confirmation-input .v-input__slot) {
  background-color: white !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 4px !important;
  min-height: 42px !important;
}

::v-deep(.confirmation-input input) {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  color: rgba(95, 95, 95, 0.5) !important;
  text-align: center !important;
  padding: 0 16px !important;
}

::v-deep(.confirmation-input input::placeholder) {
  color: rgba(95, 95, 95, 0.5) !important;
  text-align: center !important;
  text-transform: uppercase !important;
}

/* Action Buttons */
.action-buttons {
  display: flex !important;
  gap: 10px !important;
  width: 314px !important;
  justify-content: space-between !important;
  margin-top: auto !important;
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

::v-deep(.delete-btn:hover:not(:disabled)) {
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