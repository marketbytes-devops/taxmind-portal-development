<template>
  <div class="question-preview-tree">
    <v-container fluid class="pa-0">
      <v-row v-for="q in questions" :key="q.id || q.questionText" class="question-block ma-0" :style="indentStyle">
        <v-col cols="12" class="pa-0">
          <!-- Question Text / Meta -->
          <v-row class="ma-0">
            <v-col cols="12" class="question-text-container pa-2">
              <div class="question-text">
                <span>{{ q.questionText }}</span>
                <span v-if="q.isRequired" class="required">*</span>
                <v-tooltip v-if="q.helpText" bottom max-width="300">
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon small class="ml-2" v-bind="attrs" color="#1A73E9" v-on="on" role="img"
                      aria-label="More information">mdi-information-outline</v-icon>
                  </template>
                  <span class="tooltip-text">{{ q.helpText }}</span>
                </v-tooltip>
              </div>
            </v-col>
          </v-row>

          <!-- Render based on question type -->

          <!-- Radio/Dropdown: Option Pills (interactive) - Responsive Grid -->
          <v-row v-if="
            (q.questionType === 'radio' || q.questionType === 'dropdown') &&
            q.options &&
            q.options.length
          " class="options-wrapper ma-0">
            <v-col v-for="(opt, oi) in q.options" :key="'opt-' + oi" cols="12" sm="6" md="4" lg="3" xl="2" class="pa-1">
              <div class="option-pill" :class="{
                selected: isSelected(q, opt),
                'error-border': q.isRequired && (validationErrors[q.id] || computedValidationErrors[q.id])
              }" @click.stop="handleOptionClick(q, opt)" role="button" :aria-pressed="isSelected(q, opt)" tabindex="0"
                @keydown.enter.prevent="selectOption(q, opt)" @keydown.space.prevent="selectOption(q, opt)">
                <span class="option-text">{{ opt.label }}</span>
              </div>
            </v-col>

            <!-- Required field validation message for radio/dropdown options -->
            <v-col v-if="q.isRequired && (validationErrors[q.id] || computedValidationErrors[q.id])" cols="12"
              class="pa-0">
              <div class="validation-error">
                <span class="error-text">{{ validationErrors[q.id] || computedValidationErrors[q.id] }}</span>
              </div>
            </v-col>

            <!-- Show nested only for currently selected option (single-choice) -->
            <v-col cols="12" class="pa-0">
              <transition name="fade" :key="'nested-' + q.id + '-' + (activeResponses[q.id] || 'none')">
                <div v-if="
                  nestedQuestionsData[q.id] &&
                  nestedQuestionsData[q.id].hasSubQuestions
                " class="option-children">
                  <QuestionPreviewTree :ref="'nested-' + q.id" :questions="nestedQuestionsData[q.id].subQuestions"
                    :depth="depth + 1" :responses="activeResponses" v-model="internalResponses"
                    :responseId="responseId" />
                </div>
              </transition>
            </v-col>
          </v-row>

          <!-- Date: Date Picker with Menu (disabled) -->
          <v-row v-else-if="q.questionType === 'date'" class="ma-0">
            <v-col cols="12" sm="6" md="4" class="pa-2">
              <v-menu v-model="dateMenus[q.id]" :close-on-content-click="false" :nudge-right="40"
                transition="scale-transition" offset-y min-width="auto"
                @input="(val) => handleDateMenuChange(q.id, val)">
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field :value="activeResponses[q.id] || ''" placeholder="Select date" solo flat outlined dense
                    hide-details class="question-input date-field-preview" background-color="white"
                    prepend-inner-icon="mdi-calendar" v-bind="attrs" v-on="on" readonly
                    :append-icon="activeResponses[q.id] && !q.isRequired ? 'mdi-close' : ''"
                    @click:append="clearDate(q.id)"
                    :error="q.isRequired && (validationErrors[q.id] || computedValidationErrors[q.id])"></v-text-field>
                </template>
                <v-date-picker :value="activeResponses[q.id]" @input="(date) => selectDate(q.id, date)"
                  no-title></v-date-picker>
              </v-menu>
              <!-- Required field validation message for date -->
              <div v-if="q.isRequired && (validationErrors[q.id] || computedValidationErrors[q.id])"
                class="validation-error">
                <span class="error-text">{{ validationErrors[q.id] || computedValidationErrors[q.id] }}</span>
              </div>
            </v-col>
          </v-row>

          <!-- Text: Text Field (disabled) -->
          <v-row v-else-if="q.questionType === 'text'" class="ma-0">
            <v-col cols="12" sm="8" md="6" class="pa-2">
              <v-text-field :value="activeResponses[q.id] || ''" @input="(val) => handleTextInput(q.id, val)"
                @blur="() => handleTextBlur(q.id)" placeholder="Enter text" solo flat outlined dense hide-details
                class="question-input text-field-preview" background-color="white"
                :error="q.isRequired && (validationErrors[q.id] || computedValidationErrors[q.id])"></v-text-field>
              <!-- Required field validation message for text -->
              <div v-if="q.isRequired && (validationErrors[q.id] || computedValidationErrors[q.id])"
                class="validation-error">
                <span class="error-text">{{ validationErrors[q.id] || computedValidationErrors[q.id] }}</span>
              </div>
            </v-col>
          </v-row>

          <!-- Fallback: Legacy options or unsupported types -->
          <v-row v-else-if="q.options && q.options.length" class="options-wrapper ma-0">
            <v-col v-for="(opt, oi) in q.options" :key="'opt-' + oi" cols="12" sm="6" md="4" lg="3" xl="2" class="pa-1">
              <div class="option-pill" :class="{
                selected: isSelected(q, opt),
                'error-border': q.isRequired && (validationErrors[q.id] || computedValidationErrors[q.id])
              }" @click.stop="handleOptionClick(q, opt)" role="button" :aria-pressed="isSelected(q, opt)" tabindex="0"
                @keydown.enter.prevent="selectOption(q, opt)" @keydown.space.prevent="selectOption(q, opt)">
                <span class="option-text">{{ opt.label }}</span>
              </div>
            </v-col>

            <!-- Required field validation message for fallback options -->
            <v-col v-if="q.isRequired && (validationErrors[q.id] || computedValidationErrors[q.id])" cols="12"
              class="pa-0">
              <div class="validation-error">
                <span class="error-text">{{ validationErrors[q.id] || computedValidationErrors[q.id] }}</span>
              </div>
            </v-col>

            <!-- Show nested only for currently selected option (single-choice) -->
            <v-col cols="12" class="pa-0">
              <transition name="fade" :key="'nested-' + q.id + '-' + (activeResponses[q.id] || 'none')">
                <div v-if="
                  nestedQuestionsData[q.id] &&
                  nestedQuestionsData[q.id].hasSubQuestions
                " class="option-children">
                  <QuestionPreviewTree :ref="'nested-' + q.id" :questions="nestedQuestionsData[q.id].subQuestions"
                    :depth="depth + 1" :responses="activeResponses" v-model="internalResponses"
                    :responseId="responseId" />
                </div>
              </transition>
            </v-col>
          </v-row>

          <!-- No options or unsupported types -->
          <v-row v-else class="ma-0">
            <v-col cols="12" class="no-options-spacer pa-2">
              <!-- Empty space for questions without options or unsupported types -->
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { applications } from "@/api";

export default {
  name: "QuestionPreviewTree",
  props: {
    questions: { type: Array, default: () => [] },
    depth: { type: Number, default: 0 },
    responses: { type: Object, default: () => ({}) },
    value: { type: Object, default: () => ({}) },
    responseId: { type: String, default: null },
  },
  data() {
    return {
      internalResponses: {},
      dateMenus: {},
      textDebounceTimers: {},
      apiCallQueue: new Set(),
      validationErrors: {}, // Track validation errors for required fields
      touchedFields: {}, // Track which fields have been interacted with
      showValidationOnSubmit: false, // Flag to show validation when submit/next is clicked
      isUpdatingFromWatch: false, // Flag to prevent infinite loops
    };
  },
  watch: {
    value: {
      handler(newVal) {
        this.isUpdatingFromWatch = true;
        // Deep clone to avoid reference issues with nested objects
        this.internalResponses = JSON.parse(JSON.stringify(newVal || {}));
        this.$nextTick(() => {
          this.isUpdatingFromWatch = false;
        });
      },
      immediate: true,
      deep: true,
    },
    responses: {
      handler(newVal) {
        if (!this.value || Object.keys(this.value).length === 0) {
          this.isUpdatingFromWatch = true;
          // Deep clone to avoid reference issues with nested objects
          this.internalResponses = JSON.parse(JSON.stringify(newVal || {}));
          this.$nextTick(() => {
            this.isUpdatingFromWatch = false;
          });
        }
      },
      immediate: true,
      deep: true,
    },
    internalResponses: {
      handler(newVal) {
        // Prevent infinite loop when updating from watchers
        if (this.isUpdatingFromWatch) return;

        // Emit changes to parent to ensure sync
        this.$emit('input', { ...newVal });
        this.$emit('update:responses', { ...newVal });
      },
      deep: true,
    },
  },
  computed: {
    indentStyle() {
      return {};
    },
    childIndentStyle() {
      return {};
    },
    // Get the active responses object (v-model takes precedence)
    activeResponses() {
      return Object.keys(this.value).length > 0 ? this.internalResponses : this.responses;
    },
    // Computed property to show validation errors only when fields are touched or submit is clicked
    computedValidationErrors() {
      const errors = {};
      const checkQuestions = (questions) => {
        questions.forEach(q => {
          if (q.isRequired) {
            // Check both internal responses and active responses
            const value = this.internalResponses[q.id] || this.activeResponses[q.id];
            const shouldShowError = this.touchedFields[q.id] || this.showValidationOnSubmit;

            // Only show error if field has been interacted with AND value is empty
            // Don't show errors initially when page loads
            if (shouldShowError && (!value || (typeof value === 'string' && value.trim() === ''))) {
              errors[q.id] = 'This field is required';
            }
          }
          // Check nested questions if they are visible
          if (this.nestedQuestionsData[q.id] && this.nestedQuestionsData[q.id].hasSubQuestions) {
            checkQuestions(this.nestedQuestionsData[q.id].subQuestions);
          }
        });
      };

      checkQuestions(this.questions);
      return errors;
    },
    // Force reactivity for nested questions
    nestedQuestionsData() {
      const result = {};
      this.questions.forEach((q) => {
        const selected = this.selectedOption(q);
        let subQuestions = [];

        if (selected) {
          // Check for nested questions in option.questions (new format)
          if (selected.questions && selected.questions.length) {
            subQuestions = selected.questions;
          }
          // Also check for children field (legacy format)
          else if (q.children && q.children.length) {
            // Filter children by showIfParentOptionValue
            subQuestions = q.children.filter(
              (child) => child.showIfParentOptionValue === selected.value
            );
          }
        }

        result[q.id] = {
          hasSelected: !!selected,
          selectedLabel: selected ? selected.label : null,
          hasSubQuestions: subQuestions.length > 0,
          subQuestions: subQuestions,
        };
      });
      return result;
    },
  },
  mounted() {
    // Component initialization - no initial validation
  },
  methods: {
    handleOptionClick(question, option) {
      this.selectOption(question, option);
    },
    isSelected(question, option) {
      const val = this.activeResponses[question.id];
      return val === option.value;
    },
    selectedOption(question) {
      const val = this.activeResponses[question.id];
      if (!question.options) return null;
      const selected = question.options.find((o) => o.value === val) || null;

      if (selected) {
        console.log("🎯 selectedOption found:", {
          questionId: question.id,
          selectedValue: val,
          selectedLabel: selected.label,
          hasSubQuestions: !!(selected.questions && selected.questions.length),
          subQuestionCount: selected.questions ? selected.questions.length : 0,
        });
      }


      return selected;
    },
    async submitAnswer(questionId, answer, isDeselection = false) {
      if (!this.responseId) {
        console.warn("No responseId provided, skipping API call");
        return;
      }

      const apiKey = `${questionId}-${answer}-${isDeselection}`;
      console.log("apiKey", apiKey)
      if (this.apiCallQueue.has(apiKey)) {
        console.log("API call already in progress for", apiKey, ", skipping duplicate call");
        return;
      }

      this.apiCallQueue.add(apiKey);

      try {
        const payload = {
          responseId: this.responseId,
          questionId: questionId,
          answer: answer,
        };

        // Add deselection flag for non-mandatory option deselection
        if (isDeselection) {
          payload.isDeselected = true;
          payload.answer = null;
        }

        console.log("📤 Submitting answer:", payload);
        await applications.submitQuestionnaireAnswer(payload);
        console.log("✅ Answer submitted successfully");
      } catch (error) {
        console.error("❌ Failed to submit answer:", error);

        const errorMessage = error.response?.data?.message ||
          error.message ||
          'Failed to submit answer. Please try again.';

        this.$emit('answer-error', {
          questionId,
          error,
          message: errorMessage
        });

        this.$emit('show-snackbar', {
          message: errorMessage,
          color: 'error'
        });
      } finally {
        this.apiCallQueue.delete(apiKey);
      }
    },
    updateValue(questionId, value) {
      this.$set(this.internalResponses, questionId, value);
      // Create a new object reference to trigger reactivity
      const updatedResponses = { ...this.internalResponses };
      this.$emit('input', updatedResponses);
      this.$emit('update:responses', updatedResponses);
    },
    handleTextInput(questionId, value) {
      // Mark field as touched
      this.$set(this.touchedFields, questionId, true);
      // Clear validation error when user starts typing
      if (this.validationErrors[questionId]) {
        this.$delete(this.validationErrors, questionId);
      }
      this.updateValue(questionId, value);
    },
    handleTextBlur(questionId) {
      const value = this.activeResponses[questionId];

      // Find the question object to check if it's required
      const question = this.questions.find(q => q.id === questionId);

      // Mark field as touched on blur
      this.$set(this.touchedFields, questionId, true);

      if (value && value.trim() !== '') {
        this.submitAnswer(questionId, value);
      } else if (question && !question.isRequired && this.touchedFields[questionId]) {
        this.submitAnswer(questionId, null, true);
      }
    },
    selectDate(questionId, date) {
      // Mark field as touched
      this.$set(this.touchedFields, questionId, true);
      // Clear validation error when user selects a date
      if (this.validationErrors[questionId]) {
        this.$delete(this.validationErrors, questionId);
      }
      this.updateValue(questionId, date);
      this.$set(this.dateMenus, questionId, false);
      if (date) {
        this.submitAnswer(questionId, date);
      }
    },
    handleDateMenuChange(questionId, isOpen) {
      // When menu closes (isOpen becomes false), mark field as touched
      if (!isOpen) {
        this.$set(this.touchedFields, questionId, true);
      }
    },
    clearDate(questionId) {
      // Clear the date value
      this.updateValue(questionId, null);
      this.$set(this.dateMenus, questionId, false);
      // Submit the cleared value
      this.submitAnswer(questionId, null, true);
    },
    selectOption(question, option) {
      console.log("👉 selectOption called - ENTRY POINT!");
      const current = this.activeResponses[question.id];
      const next = current === option.value ? null : option.value;

      console.log("🔍 selectOption details:", {
        questionId: question.id,
        questionText: question.questionText,
        optionValue: option.value,
        optionLabel: option.label,
        current,
        next,
        hasSubQuestions: !!(option.questions && option.questions.length),
      });

      // Mark field as touched
      this.$set(this.touchedFields, question.id, true);
      // Clear validation error when user selects an option
      if (this.validationErrors[question.id]) {
        this.$delete(this.validationErrors, question.id);
      }

      // Clear subtree only when switching to a different option (not when selecting the same option again)
      // Only clear children of THIS specific question, not unrelated questions
      if (current && current !== option.value) {
        console.log(
          "🧹 Clearing child responses for previous option:",
          current
        );
        this.clearChildResponsesForQuestion(question, current);
      }

      this.$set(this.internalResponses, question.id, next);
      // Create a new object reference to trigger reactivity
      const updatedResponses = { ...this.internalResponses };
      this.$emit('input', updatedResponses);
      this.$emit("update:responses", updatedResponses);
      console.log("✅ Updated responses:", updatedResponses);

      // Submit answer for dropdown/chip (radio) selections
      if (next) {
        // Regular selection - submit the answer
        this.submitAnswer(question.id, next);
      } else if (current && !question.isRequired) {
        // Deselection of non-mandatory option - submit with deselection flag
        console.log("🔄 Deselecting non-mandatory option:", question.id);
        this.submitAnswer(question.id, current, true);
      }
    },
    clearChildResponsesForQuestion(question, previousValue) {
      if (!question.options) return;
      const prevOpt = question.options.find((o) => o.value === previousValue);
      if (!prevOpt) return;

      const idsToClear = [];
      const collect = (q) => {
        idsToClear.push(q.id);
        if (q.options) {
          q.options.forEach((o) => (o.questions || []).forEach(collect));
        }
        if (q.children) {
          q.children.forEach(collect);
        }
      };

      // Only collect IDs from the previous option's questions
      if (prevOpt.questions && prevOpt.questions.length > 0) {
        prevOpt.questions.forEach(collect);
      }

      console.log("🧹 IDs to clear:", idsToClear);

      idsToClear.forEach((id) => {
        if (this.internalResponses[id] !== undefined) {
          console.log("🗑️ Clearing response for:", id);
          this.$delete(this.internalResponses, id);
        }
        // Also clear validation errors and touched state for child questions
        if (this.validationErrors[id]) this.$delete(this.validationErrors, id);
        if (this.touchedFields[id]) this.$delete(this.touchedFields, id);
      });
    },
    validateRequiredFields() {
      // Clear previous validation errors
      this.validationErrors = {};

      // Validate all required fields in current questions and nested questions
      const validateQuestions = (questions) => {
        questions.forEach(q => {
          if (q.isRequired) {
            // Check both internal responses and active responses
            const value = this.internalResponses[q.id] || this.activeResponses[q.id];
            console.log(`🔍 Validating question ${q.id}:`, {
              questionText: q.questionText,
              internalValue: this.internalResponses[q.id],
              activeValue: this.activeResponses[q.id],
              finalValue: value,
              isEmpty: !value || (typeof value === 'string' && value.trim() === '')
            });

            if (!value || (typeof value === 'string' && value.trim() === '')) {
              this.$set(this.validationErrors, q.id, 'This field is required');
            }
          }

          // Validate nested questions if they are visible
          if (this.nestedQuestionsData[q.id] && this.nestedQuestionsData[q.id].hasSubQuestions) {
            validateQuestions(this.nestedQuestionsData[q.id].subQuestions);
          }
        });
      };

      validateQuestions(this.questions);

      // Also check validation results from nested components
      let nestedValidationResults = true;
      this.questions.forEach(q => {
        if (this.nestedQuestionsData[q.id] && this.nestedQuestionsData[q.id].hasSubQuestions) {
          const nestedRef = this.$refs['nested-' + q.id];
          if (nestedRef && nestedRef[0] && nestedRef[0].validateRequiredFields) {
            const nestedIsValid = nestedRef[0].validateRequiredFields();
            if (!nestedIsValid) {
              nestedValidationResults = false;
            }
          }
        }
      });

      // Return validation result
      const hasErrors = Object.keys(this.validationErrors).length > 0;
      return !hasErrors && nestedValidationResults;
    },
    showValidationForEmptyRequiredFields() {
      // Show validation errors for empty required fields
      const showErrors = (questions) => {
        questions.forEach(q => {
          if (q.isRequired) {
            const value = this.activeResponses[q.id];
            if (!value || (typeof value === 'string' && value.trim() === '')) {
              this.$set(this.validationErrors, q.id, 'This field is required');
            }
          }

          // Check nested questey are visible
          if (this.nestedQuestionsData[q.id] && this.nestedQuestionsData[q.id].hasSubQuestions) {
            showErrors(this.nestedQuestionsData[q.id].subQuestions);
          }
        });
      };

      showErrors(this.questions);
    },
    triggerValidationOnSubmit() {
      // Trigger validation display for all fields when submit/next is clicked
      console.log('🔥 triggerValidationOnSubmit called');
      console.log('🔥 Current questions:', this.questions);
      console.log('🔥 internalResponses:', this.internalResponses);
      console.log('🔥 activeResponses:', this.activeResponses);
      console.log('🔥 responses prop:', this.responses);

      this.showValidationOnSubmit = true;
      this.markAllRequiredFieldsAsTouched();

      // Also trigger validation on all nested components
      this.triggerNestedValidation();

      const isValid = this.validateRequiredFields();
      console.log('🔥 Validation result:', isValid);
      console.log('🔥 touchedFields:', this.touchedFields);
      console.log('🔥 validationErrors:', this.validationErrors);
      console.log('🔥 computedValidationErrors:', this.computedValidationErrors);
      return isValid;
    },
    markAllRequiredFieldsAsTouched() {
      // Mark all required fields as touched to show validation errors
      const markTouched = (questions) => {
        questions.forEach(q => {
          if (q.isRequired) {
            this.$set(this.touchedFields, q.id, true);
          }

          // Mark nested questions as touched if they are visible
          if (this.nestedQuestionsData[q.id] && this.nestedQuestionsData[q.id].hasSubQuestions) {
            markTouched(this.nestedQuestionsData[q.id].subQuestions);
          }
        });
      };

      markTouched(this.questions);
    },
    triggerNestedValidation() {
      // Trigger validation on all nested QuestionPreviewTree components
      this.questions.forEach(q => {
        if (this.nestedQuestionsData[q.id] && this.nestedQuestionsData[q.id].hasSubQuestions) {
          const nestedRef = this.$refs['nested-' + q.id];
          if (nestedRef && nestedRef[0] && nestedRef[0].triggerValidationOnSubmit) {
            nestedRef[0].triggerValidationOnSubmit();
          }
        }
      });
    },
    resetValidationState() {
      // Reset validation state (useful when moving between steps)
      this.showValidationOnSubmit = false;
      this.touchedFields = {};
      this.validationErrors = {};
    },
  },
};
</script>

<style scoped>
.question-preview-tree {
  width: 100%;
}

.question-block {
  margin-bottom: 24px;
}

.question-text-container {
  padding: 8px 12px !important;
  text-align: left;
}

.question-text {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #000;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  line-height: 1.4;
  text-align: left;
  display: inline-block;
  margin-top: 15px
}

.required {
  color: #d53e3e;
  margin-left: 4px;
}

.validation-error {
  /* margin-top: 4px; */
  padding: 0 12px;
  text-align: left;
}

.error-text {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  color: #d53e3e;
  font-weight: 400;
}

.options-wrapper {
  margin-bottom: 8px;
}

.option-pill {
  height: 40px;
  width: 100%;
  border: 0.95px solid rgba(230, 230, 230, 1);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background: #fff;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, border-color 0.15s;
  pointer-events: auto;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  text-align: left;
}

.option-pill:hover {
  background: #f5f9ff;
}

.option-pill.selected {
  border: 1px solid #1a73e9;
  background: #f1f7ff;
}

.option-pill.error-border {
  border: 1px solid #d53e3e !important;
  background: #ffffff;
}

.option-pill.error-border:hover {
  background: #f1f7ff;
}

.option-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #000;
  text-align: left;
  word-wrap: break-word;
  line-height: 1.3;
}

.option-children {
  margin-top: 16px;
  padding: 0;
}

.option-child-header {
  font-size: 12px;
  color: #1a73e9;
  font-family: "DM Sans", sans-serif;
  margin-bottom: 8px;
}

.child-of-label {
  background: #f1f7ff;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.no-options-spacer {
  min-height: 20px;
  padding: 8px 12px !important;
}

/* Question Type Specific Styles */
.question-input {
  font-family: "DM Sans", sans-serif;
}

.date-field-preview {
  max-width: 300px;
}

.text-field-preview {
  font-family: "DM Sans", sans-serif;
}

.question-input .v-input__control {
  min-height: 40px;
}

.question-input .v-text-field__details {
  display: none !important;
}

.question-input .v-input__prepend-inner {
  margin-top: 0;
  margin-right: 8px;
  align-self: center;
}

.question-input .v-input__prepend-inner .v-icon {
  color: rgba(0, 0, 0, 0.54);
}

/* Responsive Design for Different Screen Sizes */

/* Extra Small (xs) - Mobile Portrait: 0-599px */
@media (max-width: 599px) {
  .question-text {
    font-size: 15px;
  }

  .option-pill {
    text-align: left;
    height: 44px;
    min-height: fit-content;
    padding: 8px 12px;
  }

  .option-text {
    font-size: 13px;
  }

  .question-block {
    margin-bottom: 20px;
  }

  .option-children {
    margin-top: 12px;
    padding: 0;
  }
}

/* Small (sm) - Mobile Landscape/Small Tablet: 600-959px */
@media (min-width: 600px) and (max-width: 959px) {
  .question-text {
    font-size: 15px;
  }

  .option-pill {
    text-align: left;
    height: 42px;
    min-height: fit-content;
    padding: 10px;
  }

  .option-text {
    font-size: 13px;
  }
}

/* Medium (md) - Tablet: 960-1263px */
@media (min-width: 960px) and (max-width: 1263px) {
  .option-pill {
    text-align: left;
    height: 40px;
    min-height: fit-content;
    padding: 10px;
  }
}

/* Large (lg) and Extra Large (xl) - Desktop: 1264px+ */
@media (min-width: 1264px) {
  .option-pill {
    text-align: left;
    height: 40px;
    min-height: fit-content;
    padding: 10px;
  }
}

/* Transition Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* Accessibility Improvements */
.option-pill:focus {
  /* outline: 2px solid #1a73e9; */
  outline-offset: 2px;
}

.option-pill.selected:focus {
  outline: none;
}

/* Touch-friendly interactions for mobile */
@media (hover: none) and (pointer: coarse) {
  .option-pill {
    text-align: left;
    height: 48px;
    min-height: fit-content;
    padding: 10px;
  }
}

/* Tooltip text wrapping styles */
.tooltip-text {
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.4;
  text-align: left;
}
</style>