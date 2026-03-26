<template>
  <v-layout column class="view-category-expansion-panel">
    <v-expansion-panels v-model="expansionModel" multiple flat>
      <v-expansion-panel
        v-for="category in categories"
        :key="category.id"
        class="view-expansion-panel"
      >
        <v-expansion-panel-header class="view-expansion-header">
          <!-- Header Layout using Vuetify Grid -->
          <v-layout wrap justify-space-between align-center>
            <!-- Left side: Collapse icon and category name -->
            <v-flex d-flex align-center>
              <v-icon
                size="20"
                color="#1A73E9"
                class="collapse-icon mr-3"
                :class="{ expanded: isExpanded(category.id) }"
              >
                mdi-chevron-down
              </v-icon>
              <span class="category-title">{{ category.name }}</span>
            </v-flex>
          </v-layout>
        </v-expansion-panel-header>

        <v-expansion-panel-content class="view-expansion-content">
          <!-- Questions Section -->
          <div class="questions-container">
            <div
              v-for="question in getQuestionsForCategory(category.id)"
              :key="question.id"
              class="question-item"
            >
              <!-- Question Text -->
              <div class="question-text">{{ question.questionText }}</div>

              <!-- Question Input based on type -->
              <div class="question-input-container">
                <!-- Dropdown/Select -->
                <div
                  v-if="
                    question.questionType === 'dropdown' ||
                    question.questionType === 'select'
                  "
                >
                  <v-select
                    :value="getResponseValue(question.id)"
                    :items="getQuestionOptions(question)"
                    item-text="label"
                    item-value="value"
                    outlined
                    dense
                    class="question-select"
                    placeholder="Options"
                    @input="updateResponse(question.id, $event)"
                  >
                    <template v-slot:append>
                      <v-icon size="20" color="#5F5F5F"
                        >mdi-chevron-down</v-icon
                      >
                    </template>
                  </v-select>
                </div>

                <!-- Radio Buttons -->
                <div v-else-if="question.questionType === 'radio'">
                  <v-radio-group
                    :value="getResponseValue(question.id)"
                    @change="updateResponse(question.id, $event)"
                    class="question-radio-group"
                  >
                    <v-radio
                      v-for="option in getQuestionOptions(question)"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                      class="question-radio"
                    ></v-radio>
                  </v-radio-group>
                </div>

                <!-- Text Input -->
                <div v-else-if="question.questionType === 'text'">
                  <v-text-field
                    :value="getResponseValue(question.id)"
                    outlined
                    dense
                    placeholder="Place holder"
                    class="question-text-field"
                    @input="updateResponse(question.id, $event)"
                  ></v-text-field>
                </div>

                <!-- Number Input -->
                <div v-else-if="question.questionType === 'number'">
                  <v-text-field
                    :value="getResponseValue(question.id)"
                    type="number"
                    outlined
                    dense
                    placeholder="Enter number"
                    class="question-text-field"
                    @input="updateResponse(question.id, $event)"
                  ></v-text-field>
                </div>

                <!-- Date Input -->
                <div v-else-if="question.questionType === 'date'">
                  <v-text-field
                    :value="getResponseValue(question.id)"
                    type="date"
                    outlined
                    dense
                    class="question-text-field"
                    @input="updateResponse(question.id, $event)"
                  ></v-text-field>
                </div>

                <!-- Checkbox -->
                <div v-else-if="question.questionType === 'checkbox'">
                  <v-checkbox
                    :input-value="getResponseValue(question.id)"
                    :label="question.questionText"
                    class="question-checkbox"
                    @change="updateResponse(question.id, $event)"
                  ></v-checkbox>
                </div>
              </div>

              <!-- Child Questions (Conditional) -->
              <div
                v-if="
                  question.children &&
                  question.children.length > 0 &&
                  shouldShowChildQuestions(question)
                "
                class="child-questions"
              >
                <div
                  v-for="childQuestion in question.children"
                  :key="childQuestion.id"
                  class="child-question-item"
                >
                  <div class="question-text child-question-text">
                    {{ childQuestion.questionText }}
                  </div>
                  <div class="question-input-container">
                    <!-- Child question inputs (same logic as parent) -->
                    <v-text-field
                      v-if="childQuestion.questionType === 'text'"
                      :value="getResponseValue(childQuestion.id)"
                      outlined
                      dense
                      placeholder="Placeholder"
                      class="question-text-field"
                      @input="updateResponse(childQuestion.id, $event)"
                    ></v-text-field>

                    <v-text-field
                      v-else-if="childQuestion.questionType === 'number'"
                      :value="getResponseValue(childQuestion.id)"
                      type="number"
                      outlined
                      dense
                      placeholder="Enter number"
                      class="question-text-field"
                      @input="updateResponse(childQuestion.id, $event)"
                    ></v-text-field>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-layout>
</template>

<script>
export default {
  name: "ViewCategoryExpansionPanel",
  props: {
    categories: {
      type: Array,
      default: () => [],
    },
    LABELS: {
      type: Object,
      required: true,
    },
    questionnaireId: {
      type: String,
      default: null,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      expansionModel: [], // Tracks which panels are expanded
      responses: {}, // Store user responses
    };
  },
  mounted() {
    // Expand all panels by default
    this.expansionModel = this.categories.map((_, index) => index);
  },
  methods: {
    isExpanded(categoryId) {
      const categoryIndex = this.categories.findIndex(
        (cat) => cat.id === categoryId
      );
      return this.expansionModel.includes(categoryIndex);
    },

    getQuestionsForCategory(categoryId) {
      const category = this.categories.find((cat) => cat.id === categoryId);
      return category ? category.questions || [] : [];
    },

    getQuestionOptions(question) {
      if (!question.options) return [];

      return question.options.map((option) => ({
        label: option.label,
        value: option.value,
      }));
    },

    getResponseValue(questionId) {
      return this.responses[questionId] || null;
    },

    updateResponse(questionId, value) {
      this.$set(this.responses, questionId, value);
      this.$emit("questionAnswered", questionId, value);
    },

    shouldShowChildQuestions(parentQuestion) {
      if (!parentQuestion.children || parentQuestion.children.length === 0) {
        return false;
      }

      const parentResponse = this.getResponseValue(parentQuestion.id);

      // Check if any child should be shown based on parent response
      return parentQuestion.children.some((child) => {
        return child.showIfParentOptionValue === parentResponse;
      });
    },
  },
};
</script>

<style scoped>
/* View Category Expansion Panel - Figma Design */
.view-category-expansion-panel {
  background: #ffffff;
  border-radius: 8px;
}

/* Expansion Panel Styling */
.view-expansion-panel {
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
  border-bottom: 1px solid #e5e7eb;
}

.view-expansion-panel:last-child {
  border-bottom: none;
}

/* Header Styling */
.view-expansion-header {
  background: #f8f9fa;
  border-radius: 0;
  padding: 15px 20px;
  min-height: 50px;
}

.view-expansion-header:hover {
  background: #f1f3f4;
}

/* Category Title */
.category-title {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1a73e9;
  line-height: 24px;
}

/* Collapse Icon */
.collapse-icon {
  transition: transform 0.2s;
}

.collapse-icon.expanded {
  transform: rotate(180deg);
}

/* Content Styling */
.view-expansion-content {
  padding: 20px;
  background: #ffffff;
}

/* Questions Container */
.questions-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Question Item */
.question-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Question Text */
.question-text {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  line-height: normal;
  margin-bottom: 8px;
}

.child-question-text {
  font-size: 16px;
  color: #000000;
  margin-left: 0;
}

/* Question Input Container */
.question-input-container {
  width: 100%;
  max-width: 964px;
}

/* Select Field Styling */
::v-deep(.question-select .v-select__selection) {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #5f5f5f;
  line-height: 24px;
}

::v-deep(.question-select .v-input__control) {
  min-height: 40px;
}

::v-deep(.question-select .v-input__slot) {
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0 16px;
  min-height: 40px;
}

::v-deep(.question-select .v-select__slot) {
  height: 40px;
  align-items: center;
}

/* Radio Group Styling */
.question-radio-group {
  margin: 0;
  padding: 0;
}

::v-deep(.question-radio-group .v-input--selection-controls) {
  margin: 0;
  padding: 0;
}

.question-radio {
  margin-bottom: 10px;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 964px;
}

::v-deep(.question-radio .v-input--selection-controls__input) {
  margin-right: 16px;
}

::v-deep(.question-radio .v-label) {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #5f5f5f;
  line-height: 24px;
  margin-left: 0;
}

/* Text Field Styling */
::v-deep(.question-text-field .v-input__control) {
  min-height: 40px;
}

::v-deep(.question-text-field .v-input__slot) {
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0 16px;
  min-height: 40px;
}

::v-deep(.question-text-field input) {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #000000;
  line-height: normal;
}

::v-deep(.question-text-field input::placeholder) {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: rgba(95, 95, 95, 0.5);
  line-height: normal;
}

/* Child Questions */
.child-questions {
  margin-left: 0;
  padding-left: 0;
  margin-top: 16px;
}

.child-question-item {
  margin-bottom: 20px;
}

/* Checkbox Styling */
::v-deep(.question-checkbox .v-input--selection-controls__input) {
  margin-right: 12px;
}

::v-deep(.question-checkbox .v-label) {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  color: #000000;
  line-height: normal;
}

/* Responsive Design */
@media (max-width: 768px) {
  .view-expansion-content {
    padding: 16px;
  }

  .questions-container {
    gap: 20px;
  }

  .question-text {
    font-size: 15px;
  }

  .child-question-text {
    font-size: 15px;
  }

  .question-input-container {
    max-width: 100%;
  }

  .question-radio {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .view-expansion-content {
    padding: 12px;
  }

  .questions-container {
    gap: 16px;
  }

  .question-text {
    font-size: 14px;
  }

  .child-question-text {
    font-size: 14px;
  }

  .view-expansion-header {
    padding: 12px 16px;
  }

  .category-title {
    font-size: 13px;
  }
}
</style>