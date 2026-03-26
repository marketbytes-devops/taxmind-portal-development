<template>
  <!-- Backdrop/Overlay -->
  <div v-if="visible" class="confirmation-overlay" @click="handleCancel">
    <!-- Modal Container -->
    <div class="confirmation-modal" @click.stop>
      <!-- Warning Icon -->
      <!-- <div class="warning-icon-container"> -->
        <v-img
          :src="require('@/assets/iconsets/warning.svg')"
          width="58"
          height="58"
          contain
          class="warning-icon"
        ></v-img>
      <!-- </div> -->

      <!-- Title -->
      <div class="modal-title">
        {{ LABELS.PUBLISHED_QUESTIONNAIRE_WARNING }}
      </div>

      <!-- Description -->
      <div class="modal-description">
        {{ LABELS.EDIT_PUBLISHED_CONFIRMATION }}
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

        <!-- Confirm Edit Button -->
        <v-btn
          :ripple="false"
          depressed
          color="#D53E3E"
          class="confirm-btn"
          @click="handleConfirm"
        >
          {{ LABELS.YES_EDIT }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EditConfirmationPopup",
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
  methods: {
    handleCancel() {
      this.$emit("cancel");
    },
    handleConfirm() {
      this.$emit("confirm", this.item);
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

/* Warning Icon */
.warning-icon-container {
  background: rgba(213, 62, 62, 0.1);
  border-radius: 72px;
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* Confirm Edit Button */
.confirm-btn {
  width: 152px;
  height: 42px;
  border-radius: 6px;
  background-color: #d53e3e;
  color: white;
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
}

.confirm-btn:hover {
  background-color: #b91c1c;
}

::v-deep(.cancel-btn .v-btn__content) {
  color: #5f5f5f;
}

::v-deep(.confirm-btn .v-btn__content) {
  color: white;
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
  .confirm-btn {
    width: 100%;
    height: 38px;
    font-size: 14px;
  }
}
</style>
