  <template>
    <v-card class="pa-4">
      <div class="questionnaire-grid-container">
        <div v-for="item in items" :key="item.id" class="questionnaire-grid-item">
          <QuestionnaireCard :item="item" :is-selected="selectedItem && selectedItem.id === item.id"
            :disabled="disabled" :LABELS="LABELS" :can-edit="canEdit" :can-delete="canDelete"
            @select="$emit('select', $event)" @view="$emit('view', $event)" @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)" />
        </div>
      </div>
    </v-card>
  </template>

<script>
import QuestionnaireCard from "./QuestionnaireCard.vue";

export default {
  name: "QuestionnaireGrid",
  components: {
    QuestionnaireCard,
  },
  props: {
    items: {
      type: Array,
      required: true,
    },
    selectedItem: {
      type: Object,
      default: null,
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
};
</script>

<style scoped>
/* Grid Container - Responsive card layout */
.questionnaire-grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  width: 100%;
}

.questionnaire-grid-item {
  display: flex;
  align-items: stretch;
}

/* Force cards to fill the grid cell */
::v-deep(.questionnaire-grid-item .v-card) {
  height: 100%;
  width: 100% !important;
  max-width: none !important;
  min-width: auto !important;
  flex: 1;
}

/* Responsive breakpoints */
/* Greater than 1305px: 4 cards per row */
@media (min-width: 1425px) {
  .questionnaire-grid-container {
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
}

/* At 1305px and below: 3 cards per row */
@media (max-width: 1405px) {
  .questionnaire-grid-container {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

@media (max-width: 1200px) {
  .questionnaire-grid-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .questionnaire-grid-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .questionnaire-grid-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
