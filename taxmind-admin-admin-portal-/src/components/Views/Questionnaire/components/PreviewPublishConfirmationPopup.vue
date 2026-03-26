<template>
  <div v-if="visible" class="publish-overlay" @click="onOverlayClick">
    <div class="publish-modal" @click.stop>
      <div class="icon-wrap">
        <img src="@/assets/iconsets/publishIcon.svg" alt="publish" width="58" height="58" />
      </div>

      <div class="title">
        {{ title || "Are you sure you want to publish?" }}
      </div>
      <div class="description">
        {{
          description ||
          "Once published, the date cannot be edited.\nDo you still want to proceed?"
        }}
      </div>

      <div class="actions">
        <v-btn depressed outlined class="cancel" @click="onCancel">{{
          cancelLabel || "Cancel"
          }}</v-btn>
        <v-btn depressed class="proceed" color="#1A73E9" @click="onConfirm">{{
          proceedLabel || "Proceed"
          }}</v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { publishQuestionnaire } from "@/api/modules/questionnaire";
export default {
  name: "PreviewPublishConfirmationPopup",
  props: {
    visible: { type: Boolean, default: false },
    questionnaireId: { type: String, required: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    cancelLabel: { type: String, default: "" },
    proceedLabel: { type: String, default: "" },
  },
  methods: {
    onOverlayClick() {
      // Prevent closing by clicking overlay
    },
    onCancel() {
      this.$emit("cancel");
    },
    async onConfirm() {
      try {
        const id = this.questionnaireId;
        const { success, message } = await publishQuestionnaire(id);
        if (success) {
          console.log("Publish successful:", message);
          this.$emit("published", { message });
          // Redirect to questionnaire list (match header publish behavior)
          if (this.$router) {
            this.$router.push({ path: "/questionnaire?status=published" });
          }
        } else {
          // show error to user via toast and keep popup open
          this.$toast && this.$toast.error(message || "Publish failed");
          this.$emit("error", { message });
        }
      } catch (err) {
        console.error("Publish error:", err);
        this.$toast && this.$toast.error(err.message || "Publish failed");
        this.$emit("error", { message: err.message });
      }
    },
  },
};
</script>

<style scoped>
.publish-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10010;
  /* above other overlays */
}

.publish-modal {
  background: #ffffff;
  width: 360px;
  height: 270px;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  text-align: center;
  box-sizing: border-box;
}

.icon-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.title {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 8px;
}

.description {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #6b7280;
  white-space: pre-line;
  margin-bottom: 26px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.cancel {
  width: 152px;
  height: 42px;
  border-radius: 6px;
  color: #374151;
  border-color: rgba(59, 59, 59, 0.16) !important;
}

.proceed {
  width: 152px;
  height: 42px;
  border-radius: 6px;
  color: #fff;
}

::v-deep(.cancel .v-btn__content) {
  color: #374151;
}

::v-deep(.proceed .v-btn__content) {
  color: white;
}

@media (max-width: 480px) {
  .publish-modal {
    width: 90vw;
    padding: 20px;
  }

  .cancel,
  .proceed {
    width: 100%;
  }

  .actions {
    flex-direction: column;
  }
}
</style>