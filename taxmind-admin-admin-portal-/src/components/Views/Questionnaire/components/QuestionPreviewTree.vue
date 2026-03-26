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
                    <v-icon smalla class="ml-2" v-bind="attrs" color="#1A73E9" v-on="on" role="img"
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
              <div class="option-pill" :class="{ selected: isSelected(q, opt) }" @click.stop="handleOptionClick(q, opt)"
                role="button" :aria-pressed="isSelected(q, opt)" tabindex="0"
                @keydown.enter.prevent="selectOption(q, opt)" @keydown.space.prevent="selectOption(q, opt)">
                <span class="option-text">{{ opt.label }}</span>
              </div>
            </v-col>

            <!-- Show nested only for currently selected option (single-choice) -->
            <v-col cols="12" class="pa-0">
              <transition name="fade" :key="'nested-' + q.id + '-' + (responses[q.id] || 'none')">
                <div v-if="
                  nestedQuestionsData[q.id] &&
                  nestedQuestionsData[q.id].hasSubQuestions
                " class="option-children">
                  <QuestionPreviewTree :questions="nestedQuestionsData[q.id].subQuestions" :depth="depth + 1"
                    :responses="responses" />
                </div>
              </transition>
            </v-col>
          </v-row>

          <!-- Date: Date Picker with Menu (disabled) -->
          <v-row v-else-if="q.questionType === 'date'" class="ma-0">
            <v-col cols="12" sm="6" md="4" class="pa-2">
              <v-menu :value="false" :close-on-content-click="false" :nudge-right="40" transition="scale-transition"
                offset-y min-width="auto" disabled>
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field :value="responses[q.id] || ''" placeholder="Select date" solo flat outlined dense
                    hide-details class="question-input date-field-preview" background-color="white" readonly disabled
                    prepend-inner-icon="mdi-calendar" v-bind="attrs" v-on="on"></v-text-field>
                </template>
                <v-date-picker :value="responses[q.id]" @input="false" no-title></v-date-picker>
              </v-menu>
            </v-col>
          </v-row>

          <!-- Text: Text Field (disabled) -->
          <v-row v-else-if="q.questionType === 'text'" class="ma-0">
            <v-col cols="12" sm="8" md="6" class="pa-2">
              <v-text-field :value="responses[q.id] || ''" placeholder="Enter text" solo flat outlined dense
                hide-details class="question-input text-field-preview" background-color="white" readonly
                disabled></v-text-field>
            </v-col>
          </v-row>

          <!-- Fallback: Legacy options or unsupported types -->
          <v-row v-else-if="q.options && q.options.length" class="options-wrapper ma-0">
            <v-col v-for="(opt, oi) in q.options" :key="'opt-' + oi" cols="12" sm="6" md="4" lg="3" xl="2" class="pa-1">
              <div class="option-pill" :class="{ selected: isSelected(q, opt) }" @click.stop="handleOptionClick(q, opt)"
                role="button" :aria-pressed="isSelected(q, opt)" tabindex="0"
                @keydown.enter.prevent="selectOption(q, opt)" @keydown.space.prevent="selectOption(q, opt)">
                <span class="option-text">{{ opt.label }}</span>
              </div>
            </v-col>

            <!-- Show nested only for currently selected option (single-choice) -->
            <v-col cols="12" class="pa-0">
              <transition name="fade" :key="'nested-' + q.id + '-' + (responses[q.id] || 'none')">
                <div v-if="
                  nestedQuestionsData[q.id] &&
                  nestedQuestionsData[q.id].hasSubQuestions
                " class="option-children">
                  <QuestionPreviewTree :questions="nestedQuestionsData[q.id].subQuestions" :depth="depth + 1"
                    :responses="responses" />
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
export default {
  name: "QuestionPreviewTree",
  props: {
    questions: { type: Array, default: () => [] },
    depth: { type: Number, default: 0 },
    responses: { type: Object, default: () => ({}) },
  },
  computed: {
    indentStyle() {
      return {};
    },
    childIndentStyle() {
      return {};
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
    // Component initialization
  },
  methods: {
    handleOptionClick(question, option) {
      this.selectOption(question, option);
    },
    isSelected(question, option) {
      const val = this.responses[question.id];
      return val === option.value;
    },
    selectedOption(question) {
      const val = this.responses[question.id];
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
    selectOption(question, option) {
      console.log("👉 selectOption called - ENTRY POINT!");
      const current = this.responses[question.id];
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

      // Clear subtree only when switching to a different option
      if (current && current !== option.value) {
        console.log(
          "🧹 Clearing child responses for previous option:",
          current
        );
        this.clearChildResponses(question, current);
      }

      this.$set(this.responses, question.id, next);
      this.$emit("update:responses", this.responses);
      console.log("✅ Updated responses:", { ...this.responses });
    },
    clearChildResponses(question, previousValue) {
      if (!question.options) return;
      const prevOpt = question.options.find((o) => o.value === previousValue);
      if (!prevOpt || !prevOpt.questions) return;
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
      prevOpt.questions.forEach(collect);
      idsToClear.forEach((id) => {
        if (this.responses[id] !== undefined) this.$delete(this.responses, id);
      });
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