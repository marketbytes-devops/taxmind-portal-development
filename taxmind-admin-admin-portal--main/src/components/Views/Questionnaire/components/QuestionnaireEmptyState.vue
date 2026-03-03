<template>
  <div class="empty-state">
    <div class="empty-state-content">
      <v-icon size="48" color="#D1D5DB">mdi-clipboard-text-outline</v-icon>
      <h3 class="empty-state-title">{{ LABELS.NO_DATA }}</h3>
      <p class="empty-state-description">{{ description || LABELS.NO_DATA_DESCRIPTION }}</p>
      <v-btn
        v-if="showCreateButton"
        color="primary"
        :ripple="false"
        depressed
        class="create-btn mt-4"
        :disabled="disabled"
        @click="$emit('create')"
      >
        {{ LABELS.CREATE_QUESTIONNAIRE }}
      </v-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: "QuestionnaireEmptyState",
  props: {
    description: {
      type: String,
      default: "Get started by creating your first questionnaire"
    },
    showCreateButton: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    LABELS: {
      type: Object,
      required: true
    }
  }
};
</script>

<style scoped>
/* Empty state */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 64px 24px;
}

.empty-state-content {
  text-align: center;
  max-width: 320px;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 16px 0 8px 0;
}

.empty-state-description {
  font-size: 14px;
  font-weight: 400;
  color: #6B7280;
  margin: 0;
}

.create-btn {
  height: 40px !important;
  border-radius: 6px !important;
  text-transform: none !important;
  font-weight: 500 !important;
  font-size: 14px !important;
}
</style>
