<template>
  <div class="create-questionnaire-header">
    <div class="header-container">
      <!-- Left Section: Back Button (all modes) + Title and Subtitle -->
      <div class="title-section">
        <v-btn
          icon
          class="back-button mr-3"
          @click="$emit('back')"
          :ripple="false"
        >
          <v-icon size="20" color="#5F5F5F">mdi-chevron-left</v-icon>
        </v-btn>
        <div class="title-content">
          <span class="Head1">{{ LABELS.CREATE_QUESTIONNAIRE_TITLE }}</span>
          <span v-if="dynamicImportedFrom" class="text6">{{
            dynamicImportedFrom
          }}</span>
        </div>
      </div>

      <!-- Right Section: Action Buttons (create and edit modes) -->
      <div v-if="mode !== 'view'" class="actions-section">
        <!-- Add Category Button -->
        <GhostButton
          :text="LABELS.ADD_CATEGORY"
          :onClick="() => $emit('addCategory')"
          icon="mdi-plus"
          size="medium"
          class="add-category-btn"
        />

        <!-- Preview Button -->
        <v-btn
          :ripple="false"
          depressed
          outlined
          class="action-btn preview-btn"
          @click="$emit('preview')"
        >
          <v-icon left size="16" color="#5F5F5F">mdi-eye-outline</v-icon>
          {{ LABELS.PREVIEW }}
        </v-btn>

        <!-- Publish Button -->
        <v-btn
          :ripple="false"
          depressed
          color="primary"
          class="action-btn publish-btn"
          @click="$emit('publish')"
          :disabled="isPublished"
        >
          <v-icon left size="16" color="white">mdi-upload</v-icon>
          {{ LABELS.PUBLISH }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import GhostButton from "@/components/utilities/GhostButton.vue";

export default {
  name: "CreateQuestionnaireHeader",
  components: {
    GhostButton,
  },
  props: {
    LABELS: {
      type: Object,
      required: true,
    },
    mode: {
      type: String,
      default: "create",
      validator: (value) => ["create", "view", "edit"].includes(value),
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    dynamicImportedFrom() {
      const { importFrom, status } = this.$route.query;

      // Hide "Imported from" if the page is in edit/view mode and status indicates imported or published
      if (
        (this.mode === "edit" || this.mode === "view") &&
        (status === "imported_for_edit" || status === "published")
      ) {
        return null;
      }

      // Only show the imported year when importFrom query param has a non-empty value
      if (importFrom && importFrom !== "" && importFrom !== "undefined") {
        return `Imported from - ${importFrom}`;
      }

      return null;
    },
  },
};
</script>

<style scoped>
/* Create Questionnaire Header - Pixel Perfect Figma Design */
.create-questionnaire-header {
  background: #ffffff;
  box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 24px;
  max-width: 100%;
  height: 66px;
  box-sizing: border-box;
}

/* Title Section */
.title-section {
  flex: 1;
  line-height: 20px;
  display: flex;
  align-items: center;
}

.title-content {
  display: flex;
  flex-direction: column;
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

.page-title {
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  line-height: 24px;
  margin: 0;
  padding: 0;
}

.subtitle {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #5f5f5f;
  line-height: 24px;
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

/* Add Category Button - Using Common Component with Fixed Figma Dimensions */
::v-deep(.add-category-btn .outlined-btn) {
  width: 150px !important;
  min-width: 150px !important;
  height: 36px !important;
  border-radius: 6px !important;
  font-size: 14px !important;
}

/* Preview Button */
.preview-btn {
  width: 114px;
  background-color: transparent;
  border: 1px solid #d1d5db;
  color: #5f5f5f;
}

.preview-btn:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

::v-deep(.preview-btn .v-btn__content) {
  color: #5f5f5f;
}

::v-deep(.preview-btn .v-icon) {
  color: #5f5f5f !important;
}

/* Publish Button */
.publish-btn {
  width: 137px;
  background-color: #1a73e9;
  color: white;
}

.publish-btn:hover {
  background-color: #1557b7;
}

::v-deep(.publish-btn .v-btn__content) {
  color: white;
}

::v-deep(.publish-btn .v-icon) {
  color: white !important;
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
    text-align: center;
  }

  .page-title {
    font-size: 16px;
    line-height: 20px;
  }

  .subtitle {
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

  .add-category-btn {
    width: auto;
  }

  ::v-deep(.add-category-btn .outlined-btn) {
    width: auto;
    flex: 1;
    min-width: 100px;
  }

  .preview-btn {
    width: auto;
  }

  .publish-btn {
    width: auto;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 12px 16px;
  }

  .page-title {
    font-size: 15px;
    line-height: 20px;
  }

  .subtitle {
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

  ::v-deep(.add-category-btn .outlined-btn) {
    height: 32px;
    font-size: 13px;
    width: 100%;
  }
}
</style>
