<template>
  <div class="view-questionnaire-header">
    <div class="header-container">
      <!-- Left Section: Back Button and Title -->
      <div class="title-section">
        <v-btn
          icon
          class="back-button mr-3"
          @click="$emit('back')"
          :ripple="false"
        >
          <v-icon size="20" color="#5F5F5F">mdi-arrow-left</v-icon>
        </v-btn>
        <div class="title-content">
          <span class="Head1">{{ questionnaireTitle }}</span>
          <span class="text6">{{ questionnaireSubtitle }}</span>
        </div>
      </div>

      <!-- Right Section: Action Buttons -->
      <div class="actions-section">
        <!-- Edit Button -->
        <v-btn
          :ripple="false"
          depressed
          outlined
          class="action-btn edit-btn"
          @click="$emit('edit')"
        >
          <v-icon left size="16" color="#5F5F5F">mdi-pencil</v-icon>
          {{ LABELS.EDIT }}
        </v-btn>

        <!-- Duplicate Button -->
        <v-btn
          :ripple="false"
          depressed
          outlined
          class="action-btn duplicate-btn"
          @click="$emit('duplicate')"
        >
          <v-icon left size="16" color="#5F5F5F">mdi-content-copy</v-icon>
          {{ LABELS.DUPLICATE }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ViewQuestionnaireHeader",
  props: {
    LABELS: {
      type: Object,
      required: true,
    },
    questionnaire: {
      type: Object,
      default: null,
    },
  },
  computed: {
    questionnaireTitle() {
      if (this.questionnaire && this.questionnaire.title) {
        return this.questionnaire.title;
      }
      return "View Questionnaire";
    },
    questionnaireSubtitle() {
      if (this.questionnaire && this.questionnaire.financialYear) {
        return `Financial Year: ${this.questionnaire.financialYear}`;
      }
      return "Questionnaire Details";
    },
  },
};
</script>

<style scoped>
/* View Questionnaire Header - Based on Figma Design */
.view-questionnaire-header {
  background: #ffffff;
  box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 24px;
  max-width: 100%;
  height: 66px;
  box-sizing: border-box;
}

/* Title Section */
.title-section {
  flex: 1;
  display: flex;
  align-items: center;
}

.back-button {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background-color: transparent;
}

.back-button:hover {
  background-color: #f5f5f5;
}

.title-content {
  display: flex;
  flex-direction: column;
  line-height: 20px;
}

.Head1 {
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  line-height: 24px;
  margin: 0;
  padding: 0;
}

.text6 {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #5f5f5f;
  line-height: 20px;
  margin: 0;
  padding: 0;
}

/* Actions Section */
.actions-section {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}

/* Action Buttons Base Styling */
.action-btn {
  height: 36px;
  border-radius: 6px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  padding: 0 16px;
  min-width: auto;
}

/* Edit Button */
.edit-btn {
  width: 80px;
  background-color: transparent;
  border: 1px solid #d1d5db;
  color: #5f5f5f;
}

.edit-btn:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

::v-deep(.edit-btn .v-btn__content) {
  color: #5f5f5f;
}

::v-deep(.edit-btn .v-icon) {
  color: #5f5f5f !important;
}

/* Duplicate Button */
.duplicate-btn {
  width: 110px;
  background-color: transparent;
  border: 1px solid #d1d5db;
  color: #5f5f5f;
}

.duplicate-btn:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

::v-deep(.duplicate-btn .v-btn__content) {
  color: #5f5f5f;
}

::v-deep(.duplicate-btn .v-icon) {
  color: #5f5f5f !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 16px 20px;
    height: auto;
  }

  .title-section {
    justify-content: center;
    text-align: center;
  }

  .Head1 {
    font-size: 16px;
    line-height: 20px;
  }

  .text6 {
    font-size: 13px;
    line-height: 18px;
  }

  .actions-section {
    flex-direction: row;
    gap: 8px;
    justify-content: center;
  }

  .action-btn {
    flex: 1;
    min-width: 100px;
  }

  .edit-btn {
    width: auto;
  }

  .duplicate-btn {
    width: auto;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 12px 16px;
  }

  .Head1 {
    font-size: 15px;
    line-height: 20px;
  }

  .text6 {
    font-size: 12px;
    line-height: 18px;
  }

  .actions-section {
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    height: 32px;
    font-size: 13px;
    width: 100%;
  }
}
</style>