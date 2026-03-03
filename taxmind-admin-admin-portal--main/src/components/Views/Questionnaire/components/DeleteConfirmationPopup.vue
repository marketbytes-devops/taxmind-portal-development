<template>
  <!-- Backdrop/Overlay -->
  <div v-if="visible" class="confirmation-overlay" @click="handleCancel">
    <!-- Modal Container -->
    <div class="confirmation-modal" @click.stop>
      <!-- Warning Icon -->
      <v-img
        :src="require('@/assets/iconsets/warning.svg')"
        width="58"
        height="58"
        contain
        class="warning-icon"
      ></v-img>

      <!-- Title -->
      <div class="modal-title">
        {{ modalTitle }}
      </div>

      <!-- Description -->
      <div class="modal-description">
        {{ modalDescription }}
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <!-- Cancel Button -->
        <v-btn
          :ripple="false"
          depressed
          outlined
          color="#5F5F5F"
          class="cancel-btn"
          @click="handleCancel"
        >
          {{ LABELS.CANCEL }}
        </v-btn>

        <!-- Confirm Delete Button -->
        <FilledButton
          :text="LABELS.YES_DELETE || 'Delete'"
          :onClick="handleConfirmClick"
          :loading="loading"
          :disabled="isPublished"
          color="#D53E3E"
          size="medium"
          class="confirm-filled-btn"
        />
      </div>
    </div>
  </div>
</template>

<script>
import FilledButton from "@/components/utilities/FilledButton.vue";
import http from "@/api/http";

export default {
  name: "DeleteConfirmationPopup",
  components: {
    FilledButton,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    item: {
      type: Object,
      default: null,
    },
    LABELS: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    isPublished() {
      return this.item?.status === "published";
    },
    modalTitle() {
      if (this.isPublished) {
        return "Cannot Delete Published Questionnaire";
      }
      return "Delete Draft Questionnaire";
    },
    modalDescription() {
      if (this.isPublished) {
        return "Published questionnaires cannot be deleted. You can only edit them.";
      }
      return "Are you sure you want to delete this questionnaire?";
    },
  },
  methods: {
    handleCancel() {
      this.$emit("cancel");
    },
    handleConfirmClick() {
      console.log("🖱️ FilledButton onClick called - handleConfirmClick");
      this.handleConfirm();
    },
    async handleConfirm() {
      console.log("🗑️ Delete button clicked - handleConfirm called");
      console.log("Item:", this.item);
      console.log("Is published:", this.isPublished);

      if (this.isPublished) {
        console.log("❌ Cannot delete published questionnaire");
        return;
      }

      try {
        this.loading = true;
        console.log("📡 Starting delete API call...");

        // Call delete API
        console.log(`🌐 Calling DELETE /questionnaires/${this.item.id}`);
        const response = await http.delete(`/questionnaires/${this.item.id}`);

        console.log("📥 Delete API response:", response);
        console.log("📊 Response status:", response.status);

        if (response.status === 200 || response.status === 204) {
          console.log("✅ Delete successful, emitting confirm event");
          this.$emit("confirm", this.item);

          // Show success message
          this.$toast.success("Questionnaire deleted successfully");
        } else {
          console.log("⚠️ Unexpected response status:", response.status);
        }
      } catch (error) {
        console.error("Error deleting questionnaire:", error);
        this.$toast.error("Failed to delete questionnaire. Please try again.");
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
/* Confirmation Popup - Pixel Perfect Figma Design */
.confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.confirmation-modal {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  width: 400px;
  height: 290px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
}

.warning-icon {
  margin-bottom: 24px;
}

/* Modal Title */
.modal-title {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #d53e3e;
  line-height: 20px;
  margin-bottom: 16px;
  text-align: center;
  max-width: 285px;
}

/* Modal Description */
.modal-description {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #5f5f5f;
  line-height: 18px;
  margin-bottom: 32px;
  text-align: center;
  max-width: 285px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 16px;
  width: 100%;
  justify-content: center;
}

/* Cancel Button */
.cancel-btn {
  width: 152px;
  height: 42px;
  border-radius: 6px;
  border: 1px solid #5f5f5f29;
  background-color: transparent;
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #5f5f5f;
  text-transform: none;
  letter-spacing: normal;
}

.cancel-btn:hover {
  background-color: #f9fafb;
  border-color: #374151;
}

/* Confirm Delete FilledButton */
.confirm-filled-btn {
  width: 152px !important;
  height: 42px !important;
}

/* Ensure delete button text is visible */
::v-deep(.confirm-filled-btn) {
  background-color: #d53e3e !important;
  color: white !important;
}

::v-deep(.confirm-filled-btn .v-btn__content) {
  color: white !important;
  font-weight: 500 !important;
  font-size: 16px !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: flex !important;
}

::v-deep(.confirm-filled-btn:not(:disabled)) {
  background-color: #d53e3e !important;
  color: white !important;
}

::v-deep(.confirm-filled-btn:not(:disabled) .v-btn__content) {
  color: white !important;
}

::v-deep(.confirm-filled-btn:disabled) {
  background-color: #9ca3af !important;
  color: white !important;
}

::v-deep(.confirm-filled-btn:disabled .v-btn__content) {
  color: white !important;
}

/* Force text visibility with additional selectors */
::v-deep(.confirm-filled-btn .filled-btn) {
  color: white !important;
}

::v-deep(.confirm-filled-btn .filled-btn .v-btn__content) {
  color: white !important;
}

::v-deep(.cancel-btn .v-btn__content) {
  color: #5f5f5f;
}

/* Responsive Design */
@media (max-width: 480px) {
  .confirmation-modal {
    width: 350px;
    height: 280px;
    padding: 24px;
  }

  .modal-title {
    font-size: 15px;
    line-height: 18px;
  }

  .modal-description {
    font-size: 13px;
    line-height: 16px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 12px;
  }

  .cancel-btn,
  .confirm-filled-btn {
    width: 100% !important;
    height: 38px !important;
    font-size: 14px !important;
  }
}
</style>