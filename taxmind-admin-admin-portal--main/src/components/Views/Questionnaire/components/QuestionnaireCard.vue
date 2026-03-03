<template>
  <div class="card-wrapper">
    <v-card elevation="0" rounded="lg" outlined style="overflow: hidden; width: 100%"
      :class="{ 'selected-card': isSelected }" @click="$emit('select', item)">
      <!-- Card Header Section - Pixel Perfect Figma Design -->
      <div class="card-header-section">
        <div class="header-content">
          <!-- Left Section: Document Icon + Year Text -->
          <div class="left-section">
            <v-img :src="require('@/assets/images/file.svg')" width="64" height="64" contain
              class="document-icon"></v-img>
            <div class="text-section">
              <div class="questionnaire-label">
                {{ LABELS.QUESTIONNAIRE_YEAR }}
              </div>
              <div class="year-number">{{ item.year }}</div>
            </div>
          </div>

          <!-- Right Section: 3-Dot Menu -->
          <div class="right-section">
            <v-menu offset-y left :close-on-content-click="true">
              <template v-slot:activator="{ on, attrs }">
                <v-btn icon small v-bind="attrs" v-on="on" @click.stop class="menu-button">
                  <v-icon size="20" color="#5F5F5F">mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <div class="menu-container">
                <v-btn v-if="canEdit" @click="handleEditClick" class="menu-button-item edit-button" depressed
                  :ripple="false">
                  <v-icon size="18" class="menu-icon" left>mdi-pencil-outline</v-icon>
                  <span class="menu-button-text">Edit</span>
                </v-btn>
                <v-btn v-if="canDelete && item.status !== 'published'" @click="handleDeleteClick"
                  class="menu-button-item delete-button" depressed :ripple="false">
                  <v-icon size="18" class="menu-icon" left>mdi-delete-outline</v-icon>
                  <span class="menu-button-text">Delete</span>
                </v-btn>
              </div>
            </v-menu>
          </div>
        </div>
      </div>

      <!-- Card Content with Statistics -->
      <div class="card-content">
        <!-- Statistics Section -->
        <div class="stats-section">
          <div class="stat-row">
            <span class="stat-label">{{ LABELS.TOTAL_QUESTIONS }}</span>
            <div class="stat-value">{{ item.questionCount ?? 0 }}</div>
          </div>
          <div class="stat-row">
            <span class="stat-label">{{ LABELS.TOTAL_APPLICATIONS }}</span>
            <div class="stat-value">{{ item.totalApplications ?? 0 }}</div>
          </div>
          <div class="stat-row">
            <span class="stat-label">{{ LABELS.APPLICATIONS_IN_REVIEW }}</span>
            <div class="stat-value">{{ item.applicationsInReview ?? 0 }}</div>
          </div>
          <div class="stat-row">
            <span class="stat-label">{{ LABELS.COMPLETED }}</span>
            <div class="stat-value">{{ item.applicationsCompleted ?? 0 }}</div>
          </div>
        </div>
      </div>
      <v-btn tile class="view-btn" color="primary" block @click.stop="handleViewClick">
        <span class="Head2">{{ LABELS.VIEW_QUESTIONNAIRE }}</span>
      </v-btn>
    </v-card>

    <!-- Edit Confirmation Dialog -->
    <EditConfirmationDialog v-model="showEditConfirmationDialog" :questionnaire="item" @confirm="handleEditConfirmed"
      @cancel="handleEditCancelled" />
  </div>
</template>

<script>
import EditConfirmationDialog from "./EditConfirmationDialog.vue";

export default {
  name: "QuestionnaireCard",
  components: {
    EditConfirmationDialog,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    LABELS: {
      type: Object,
      required: true,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
    canDelete: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      showEditConfirmationDialog: false,
    };
  },
  methods: {
    // Handle edit icon click - shows confirmation for published questionnaires
    handleEditClick() {
      console.log(
        "✏️ QuestionnaireCard: Edit icon clicked for item:",
        this.item
      );

      // For published questionnaires, show confirmation dialog first
      if (this.item.status === "published") {
        console.log(
          "📝 Published questionnaire - showing edit confirmation dialog"
        );
        this.showEditConfirmationDialog = true;
        return;
      }

      // For non-published questionnaires, redirect directly
      // Emit edit event to parent component which will handle navigation with proper returnStatus
      console.log("✏️ Emitting edit event for item:", this.item);
      this.$emit("edit", this.item);
    },

    // Handle edit confirmation - user confirmed they want to edit published questionnaire
    handleEditConfirmed(questionnaire) {
      console.log(
        "✅ Edit confirmed for published questionnaire:",
        questionnaire
      );

      // Emit edit event to parent component which will handle navigation with proper returnStatus
      this.$emit("edit", questionnaire);
    },

    // Handle edit cancellation
    handleEditCancelled() {
      console.log("❌ Edit cancelled for published questionnaire");
      // No action needed, dialog is already closed
    },

    // Handle view button click - always goes to view mode
    handleViewClick() {
      console.log(
        "👁️ QuestionnaireCard: View button clicked for item:",
        this.item
      );

      // Emit view event for parent component to handle navigation with proper returnStatus
      this.$emit("view", this.item);
    },

    // Handle delete option click
    handleDeleteClick() {
      console.log("🗑️ QuestionnaireCard: Delete clicked for item:", this.item);

      // Emit delete event for parent component to handle
      this.$emit("delete", this.item);
    },
  },
};
</script>

<style scoped>
/* Card Wrapper - Fixed Width for 3-card layout in 1305px container */
.card-wrapper {
  width: 100%;
  height: 100%;
  flex-shrink: 0;
}

.card-wrapper .v-card {
  width: 100% !important;
}

/* Card styling to match Figma */
.questionnaire-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0px 16px 16px 0px #0000000d;

  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  width: 100% !important;
  min-width: 280px;
  display: flex;
  flex-direction: column;
}

.questionnaire-card:hover {
  box-shadow: 0px 4px 4px 0px #0000000d, 0 2px 8px rgba(0, 0, 0, 0.1);
}

.selected-card {
  border-color: #1a73e9;
  box-shadow: 0px 4px 4px 0px #0000000d, 0 0 0 1px #1a73e9;
}

/* Card Header Section - Pixel Perfect Figma Design */
.card-header-section {
  padding: 20px;
  background: transparent;
  border-bottom: 1px solid #e0e0e0;
  height: 102px;
  box-sizing: border-box;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  width: 100%;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.right-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.document-icon {
  flex-shrink: 0;
}

.text-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.questionnaire-label {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #5f5f5f;
  line-height: 18px;
  margin: 0;
  padding: 0;
}

.year-number {
  font-family: "DM Sans", sans-serif;
  font-size: 30px;
  font-weight: 700;
  color: #000000;
  line-height: 36px;
  margin: 0;
  padding: 0;
}

.menu-button {
  flex-shrink: 0;
}

/* Menu Styling - Pixel Perfect from Figma */
.menu-container {
  padding: 4px;
  min-width: 120px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-button-item {
  width: 112px;
  height: 30px;
  border-radius: 5px;
  transition: all 0.15s ease;
  background-color: transparent !important;
  border: none;
  box-shadow: none;
  text-transform: none;
  justify-content: flex-start;
  padding: 0 8px;
  min-width: 112px;
}

.menu-button-item:hover {
  background-color: rgba(26, 115, 233, 0.1) !important;
}

.menu-button-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #5f5f5f;
  line-height: 20px;
  transition: color 0.15s ease;
  margin-left: 4px;
}

.menu-icon {
  color: #5f5f5f !important;
  transition: color 0.15s ease;
}

/* Hover states */
.menu-button-item:hover .menu-button-text {
  color: #1a73e9;
}

.menu-button-item:hover .menu-icon {
  color: #1a73e9 !important;
}

/* Remove default v-btn styling */
.menu-button-item::before {
  background-color: transparent !important;
}

/* Card Content */
.card-content {
  padding: 16px 26px 20px 26px;
  background: white;
  flex: 1;
}

/* Statistics Section */
.stats-section {
  margin-bottom: 0;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 0;
}

.stat-label {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #5f5f5f;
  line-height: 18px;
}

.stat-value {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  background-color: #f1f7ff;
  padding: 6px 10px;
  border-radius: 28px;
  min-width: 60px;
  height: 28px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Button styling */
.view-btn {
  margin: 0;
  border-radius: 0 !important;
  /* button is square */
  box-shadow: none !important;
  /* kill default shadow */
  transition: none;
  height: 42px;
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
  margin-top: auto;
  flex-shrink: 0;
}

::v-deep(.view-btn) {
  border-radius: 0 !important;
  box-shadow: none !important;
}

::v-deep(.view-btn .v-btn__content) {
  color: white;
}

/* Responsive Design */
@media (max-width: 1264px) {
  .questionnaire-card {
    max-width: 300px;
  }

  .card-header-section {
    padding: 16px;
    height: 96px;
  }

  .left-section {
    gap: 16px;
  }

  .document-icon {
    width: 56px !important;
    height: 56px !important;
  }

  .year-number {
    font-size: 26px;
    line-height: 32px;
  }
}

@media (max-width: 960px) {
  .questionnaire-card {
    max-width: 280px;
  }

  .card-header-section {
    padding: 14px;
    height: 88px;
  }

  .left-section {
    gap: 14px;
  }

  .document-icon {
    width: 48px !important;
    height: 48px !important;
  }

  .year-number {
    font-size: 24px;
    line-height: 28px;
  }

  .questionnaire-label {
    font-size: 12px;
  }

  .card-content {
    padding: 14px 20px 16px 20px;
  }
}

@media (max-width: 600px) {
  .questionnaire-card {
    max-width: 100%;
    min-width: 260px;
  }

  .card-header-section {
    padding: 12px;
    height: 80px;
  }

  .left-section {
    gap: 12px;
  }

  .document-icon {
    width: 40px !important;
    height: 40px !important;
  }

  .menu-button {
    width: 32px !important;
    height: 32px !important;
  }

  .menu-button .v-icon {
    font-size: 18px !important;
  }

  .menu-button-item {
    width: 100px !important;
    height: 28px !important;
    font-size: 13px !important;
  }

  .year-number {
    font-size: 20px;
    line-height: 24px;
  }

  .questionnaire-label {
    font-size: 11px;
  }

  .card-content {
    padding: 12px 16px 14px 16px;
  }

  .stat-row {
    padding: 6px 0;
  }

  .stat-label {
    font-size: 13px;
  }

  .stat-value {
    font-size: 13px;
    padding: 4px 8px;
    min-width: 50px;
    height: 24px;
  }

  .view-btn {
    height: 38px;
    font-size: 14px;
  }
}
</style>
