<template>
  <div class="questionnaire-header">
    <div class="header-container">
      <!-- Left Section: Title -->
      <div class="title-section">
        <h1 class="page-title">{{ LABELS.QUESTIONNAIRE }}</h1>
      </div>

      <!-- Right Section: Actions -->
      <div class="actions-section">
        <!-- Published Dropdown -->
        <v-select
          v-model="selectedStatus"
          :items="statusOptions"
          item-text="label"
          item-value="value"
          class="published-dropdown"
          solo
          flat
          dense
          hide-details
          @change="$emit('statusChange', $event)"
        >
          <!-- <template v-slot:prepend-inner>
            <v-icon size="16" color="#6B7280">mdi-upload</v-icon>
          </template> -->
        </v-select>

        <!-- Create Questionnaire Button -->
        <v-btn
          v-if="canCreate"
          :ripple="false"
          depressed
          style="height: 36px !important"
          color="primary"
          class="create-btn"
          @click="$emit('create')"
        >
          <v-icon left size="13" color="white">mdi-plus</v-icon>
          {{ LABELS.CREATE_QUESTIONNAIRE }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "QuestionnaireHeader",
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    LABELS: {
      type: Object,
      required: true,
    },
    currentStatus: {
      type: String,
      default: "published",
      validator: (value) => ["published", "draft"].includes(value),
    },
    canCreate: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectedStatus: this.currentStatus,
      statusOptions: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
      ],
    };
  },
  watch: {
    // Sync selectedStatus when currentStatus prop changes
    currentStatus: {
      immediate: true,
      handler(newStatus) {
        if (newStatus && newStatus !== this.selectedStatus) {
          console.log(
            "📋 QuestionnaireHeader: Syncing selectedStatus with currentStatus:",
            newStatus
          );
          this.selectedStatus = newStatus;
        }
      },
    },
  },
};
</script>

<style scoped>
/* Questionnaire Header - Pixel Perfect Figma Design */
.questionnaire-header {
  background: #ffffff;
  /* box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.1); */
  box-shadow: 0px 4px 4px 0px #0000000d;

  /* position: relative; */
  /* z-index: 10; */
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
}

.page-title {
  font-family: "DM Sans", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #000000;
  line-height: 32px;
  margin: 0;
  padding: 0;
}

/* Actions Section */
.actions-section {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
}

/* Published Dropdown Styling */
.published-dropdown {
  width: 220px; /* increased to show full label */
  height: 36px;
}

::v-deep(.published-dropdown .v-input__control) {
  min-height: 36px;
  height: 36px;
}

::v-deep(.published-dropdown .v-input__slot) {
  background-color: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  height: 36px;
  min-height: 36px;
  padding: 0 12px;
  box-shadow: none;
}

::v-deep(.published-dropdown .v-select__selection) {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  line-height: 20px;
  margin: 0;
}

::v-deep(.published-dropdown .v-input__prepend-inner) {
  margin-top: 0;
  margin-right: 8px;
  align-self: center;
}

::v-deep(.published-dropdown .v-input__append-inner) {
  margin-top: 0;
  align-self: center;
}

::v-deep(.published-dropdown .v-select__slot) {
  display: flex;
  align-items: center;
}

::v-deep(.published-dropdown:hover .v-input__slot) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

::v-deep(.published-dropdown.v-input--is-focused .v-input__slot) {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px #2563eb;
}

/* Create Button Styling */
.create-btn {
  height: 36px;
  border-radius: 6px;
  background-color: #2563eb;
  color: white;
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  min-width: 215px;
  padding: 0 16px;
}

.create-btn:hover {
  background-color: #1d4ed8;
}

::v-deep(.create-btn .v-btn__content) {
  color: white;
}

::v-deep(.create-btn .v-icon) {
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
    font-size: 20px;
    line-height: 28px;
  }

  .actions-section {
    flex-direction: column;
    gap: 8px;
  }

  .published-dropdown {
    width: 100%;
  }

  .create-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 12px 16px;
  }

  .page-title {
    font-size: 18px;
    line-height: 24px;
  }

  .published-dropdown,
  .create-btn {
    height: 32px;
    font-size: 13px;
    width: auto; /* allow full width on very small screens */
    min-width: 120px;
  }

  ::v-deep(.published-dropdown .v-input__control) {
    min-height: 32px;
    height: 32px;
  }

  ::v-deep(.published-dropdown .v-input__slot) {
    height: 32px;
    min-height: 32px;
  }
}
</style>
