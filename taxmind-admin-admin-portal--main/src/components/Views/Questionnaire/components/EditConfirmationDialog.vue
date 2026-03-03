<template>
  <v-dialog
    v-model="showDialog"
    max-width="400"
    persistent
    content-class="edit-confirmation-dialog"
  >
    <div class="dialog-backdrop">
      <div class="dialog-container">
        <!-- Edit Confirmation Icon -->
        <!-- <div class="warning-icon-container">
          <div class="warning-icon-circle"> -->
            <img
              src="@/assets/iconsets/editConfirm.svg"
              alt="Edit Confirmation"
              class="edit-confirm-icon"
            />
          <!-- </div> -->
        <!-- </div> -->

        <!-- Title -->
        <h2 class="dialog-title">
          This questionnaire has already been published.
        </h2>

        <!-- Description -->
        <p class="dialog-description">
          Are you sure you want to edit the published questionnaire?
        </p>

        <!-- Action Buttons -->
        <div class="dialog-actions">
          <v-btn class="cancel-btn" text @click="handleCancel"> Cancel </v-btn>

          <v-btn class="edit-btn" @click="handleConfirm"> Yes, Edit </v-btn>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script>
export default {
  name: "EditConfirmationDialog",
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    questionnaire: {
      type: Object,
      default: null,
    },
  },
  computed: {
    showDialog: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("input", value);
      },
    },
  },
  methods: {
    handleCancel() {
      console.log("❌ Edit confirmation cancelled");
      this.showDialog = false;
      this.$emit("cancel");
    },

    handleConfirm() {
      console.log("✅ Edit confirmed for questionnaire:", this.questionnaire);
      this.showDialog = false;
      this.$emit("confirm", this.questionnaire);
    },
  },
};
</script>

<style scoped>
/* Dialog Backdrop - matches Figma design */
.dialog-backdrop {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Dialog Container */
.dialog-container {
  background: white;
  border-radius: 8px;
  padding: 32px 24px 24px 24px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.12);
}

/* Warning Icon Container */
.warning-icon-container {
  margin-bottom: 20px;
}

.warning-icon-circle {
  width: 56px;
  height: 56px;
  background-color: #ffebee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.edit-confirm-icon {
  width: 58px;
  height: 58px;
  object-fit: contain;
}

/* Dialog Title */
.dialog-title {
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #d32f2f;
  line-height: 24px;
  margin: 0 0 12px 0;
  text-align: center;
}

/* Dialog Description */
.dialog-description {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #5f5f5f;
  line-height: 20px;
  margin: 0 0 32px 0;
  text-align: center;
}

/* Action Buttons */
.dialog-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

/* Cancel Button */
.cancel-btn {
  flex: 1;
  height: 40px !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #5f5f5f !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  background-color: transparent !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 6px !important;
  box-shadow: none !important;
}

.cancel-btn:hover {
  background-color: rgba(95, 95, 95, 0.08) !important;
  border-color: #bdbdbd !important;
}

.cancel-btn:before {
  display: none !important;
}

/* Edit Button - Red/Primary Style */
.edit-btn {
  flex: 1;
  height: 40px !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: white !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  background-color: #d32f2f !important;
  border: none !important;
  border-radius: 6px !important;
  box-shadow: 0 2px 4px rgba(211, 47, 47, 0.2) !important;
}

.edit-btn:hover {
  background-color: #b71c1c !important;
  box-shadow: 0 4px 8px rgba(211, 47, 47, 0.3) !important;
}

.edit-btn:before {
  display: none !important;
}

/* Remove default Vuetify button styles */
.cancel-btn .v-btn__content,
.edit-btn .v-btn__content {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Responsive Design */
@media (max-width: 480px) {
  .dialog-container {
    padding: 24px 20px 20px 20px;
    margin: 16px;
  }

  .warning-icon-circle {
    width: 48px;
    height: 48px;
  }

  .edit-confirm-icon {
    width: 20px;
    height: 20px;
  }

  .dialog-title {
    font-size: 16px;
    line-height: 22px;
  }

  .dialog-description {
    font-size: 13px;
    line-height: 18px;
    margin-bottom: 24px;
  }

  .dialog-actions {
    flex-direction: column;
  }

  .cancel-btn,
  .edit-btn {
    width: 100% !important;
  }
}

/* Animation */
.dialog-container {
  animation: fadeInScale 0.3s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>