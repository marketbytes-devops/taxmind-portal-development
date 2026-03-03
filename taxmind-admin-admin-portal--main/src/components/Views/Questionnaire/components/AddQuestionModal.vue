<template>
  <v-dialog v-model="dialog" max-width="750px" persistent z-index="9999">
    <v-card elevation="0" class="add-question-modal" style="z-index: 10000">
      <!-- Header -->
      <div class="modal-header">
        <span class="header-title">{{
          isEditMode ? "Edit Question" : "Add Question"
          }}</span>
        <v-btn icon small @click="closeModal" class="close-btn" :ripple="false">
          <v-icon color="white" size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- Category -->
        <div class="category-card">
          <span class="category-name">{{ getCategoryName() }}</span>
        </div>

        <!-- Title -->
        <div class="form-section">
          <label class="field-label">Add question title</label>
          <v-textarea v-model="questionData.title" placeholder="Add question" outlined dense counter="300"
            :rules="[rules.titleMaxLength]" rows="1" auto-grow no-resize maxlength="300" />
        </div>

        <!-- Required / Tooltip toggles -->
        <div class="toggle-section">
          <v-switch v-model="questionData.isRequired" color="#1A73E9" inset dense class="required-switch mt-0"
            hide-details />
          <span class="toggle-label">Required ?</span>
        </div>

        <div class="toggle-section">
          <v-switch v-model="questionData.isTooltipNeeded" color="#1A73E9" inset dense class="tooltip-switch mt-0"
            hide-details />
          <span class="toggle-label">Is tooltip needed ?</span>
        </div>

        <div class="form-section" v-if="questionData.isTooltipNeeded">
          <label class="field-label">Tooltip description</label>
          <v-textarea v-model="questionData.helpText" placeholder="Enter tooltip description" outlined dense
            counter="200" :rules="[rules.tooltipMaxLength]" rows="3" auto-grow no-resize maxlength="200" />
        </div>

        <!-- Answer type -->
        <div class="form-section">
          <label class="field-label">Select answer type</label>
          <v-select v-model="questionData.answerType" :items="answerTypes" item-text="text" item-value="value" solo flat
            outlined dense hide-details class="answer-type-select" background-color="white"
            @change="onAnswerTypeChange" />
        </div>

        <!-- Options (only for option-based types: dropdown, radio, boolean) -->
        <div class="form-section" v-if="
          ['dropdown', 'radio', 'boolean'].includes(questionData.answerType)
        ">
          <div class="answers-header">
            <label class="field-label">Add answer</label>
            <span class="add-options-btn" v-if="shouldShowAddOptions" @click="addOption">Add options</span>
          </div>
          <div :class="questionData.answerType === 'text'
            ? 'answers-single'
            : 'answers-grid'
            ">
            <div v-for="(option, index) in questionData.options" :key="index" class="answer-option"
              :class="{ 'has-close-icon': index >= minOptionsCount }">
              <v-textarea :value="option.text" @input="onOptionTextChange(index, $event)"
                :placeholder="getOptionPlaceholder(index)" solo counter="150" maxlength="150" auto-grow no-resize
                rows="1" outlined dense clearable />
              <!-- Close icon for additional options -->
              <v-btn v-if="index >= minOptionsCount" icon x-small class="remove-option-btn"
                @click="removeOption(index)">
                <v-icon size="16" color="#9E9E9E">mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>
          <!-- Validation messages removed - using snackbar only -->
        </div>

        <!-- Date picker (hidden per UX: for 'date' type we don't show additional controls here) -->
        <div class="form-section" v-if="false">
          <label class="field-label">Select date format</label>
          <div class="date-picker-container">
            <v-menu v-model="datePickerMenu" :close-on-content-click="false" :nudge-right="40"
              transition="scale-transition" offset-y min-width="auto">
              <template v-slot:activator="{ on, attrs }">
                <v-text-field v-model="questionData.dateValue" placeholder="Select date format" solo flat outlined dense
                  hide-details readonly v-bind="attrs" v-on="on" background-color="white" append-icon="mdi-calendar" />
              </template>
              <v-date-picker v-model="questionData.dateValue" @input="datePickerMenu = false" />
            </v-menu>
          </div>
        </div>

        <!-- Document settings: per-doc mandatory and add -->
        <div v-if="!['date', 'text'].includes(questionData.answerType)" class="document-section mt-2">
          <div class="toggle-section">
            <!-- Show tooltip when the switch is disabled because docAnswerList has items -->
            <v-tooltip bottom v-if="docAnswerList && docAnswerList.length > 0">
              <template v-slot:activator="{ on, attrs }">
                <div v-bind="attrs" v-on="on">
                  <v-switch v-model="documentNeededComputed" :disabled="true" color="#1A73E9" inset dense
                    class="document-switch mt-0" hide-details />
                </div>
              </template>
              <span>Cannot disable while document-answer links exist. Delete all
                document links first.</span>
            </v-tooltip>

            <!-- Normal switch when no document links exist -->
            <div v-else>
              <v-switch v-model="documentNeededComputed" :disabled="false" color="#1A73E9" inset dense
                class="document-switch mt-0" hide-details />
            </div>

            <span class="toggle-label">Is document needed ?</span>
          </div>

          <v-layout wrap v-if="questionData.isDocumentNeeded || docAnswerList.length > 0" class="document-fields">
            <v-flex xs5 pr-4 class="form-section">
              <label class="field-label">Select document category</label>
              <div class="document-input-row">
                <v-select v-model="questionData.documentCategory" :items="documentCategories" item-text="text"
                  item-value="value" solo flat outlined dense hide-details clearable class="document-category-select"
                  :class="{ 'error--text': documentCategoryValidationMessage }" background-color="white" style="flex: 1"
                  @change="onDocumentCategoryChange" />
              </div>
              <div v-if="documentCategoryValidationMessage" class="validation-message">
                {{ documentCategoryValidationMessage }}
              </div>
            </v-flex>

            <v-flex xs5 class="form-section" v-if="
              questionData.answerType === 'radio' ||
              questionData.answerType === 'dropdown'
            ">
              <label class="field-label">Choose the answer</label>
              <div class="document-input-row">
                <v-select v-model="questionData.documentAnswer" :items="availableDocumentAnswers" item-text="text"
                  item-value="text" solo flat outlined dense hide-details class="document-answer-select"
                  :class="{ 'error--text': documentAnswerValidationMessage }" background-color="white"
                  style="flex: 1; margin-right: 8px" />
              </div>
              <div v-if="documentAnswerValidationMessage" class="validation-message">
                {{ documentAnswerValidationMessage }}
              </div>
            </v-flex>

            <v-flex xs2 class="form-section">
              <label class="field-label">Mandatory</label>
              <div class="document-input-row" style="justify-content: flex-start">
                <v-switch v-model="newDocIsMandatory" color="#1A73E9" inset dense class="mandatory-switch mt-0 ml-4"
                  hide-details />
                <v-btn v-if="canAddDocAnswer" text small class="add-inline-btn" @click="addDocAnswer">
                  <span class="add-options-btn" style="color: #1a73e9">Add</span>
                </v-btn>
              </div>
            </v-flex>
            <!-- <v-flex
              xs1
              class="form-section"
              style="display: flex; align-items: flex-center"
            >
              <div style="width: 100%; text-align: right">

              </div>
            </v-flex> -->

            <v-flex xs12 v-if="docAnswerList.length > 0" class="doc-answer-list-section">
              <label class="field-label">Document-Answer Links ({{ docAnswerList.length }}/{{
                validOptions.length
              }})</label>
              <div class="doc-answer-list">
                <div v-for="(docAnswer, index) in docAnswerList" :key="index" class="doc-answer-item">
                  <div class="doc-answer-content">
                    <div class="doc-answer-category">
                      <v-icon size="16" color="#1A73E9" class="mr-2">mdi-file-document</v-icon><span
                        class="doc-category-name">{{
                          getDocumentCategoryName(docAnswer.documentCategory)
                        }}</span>
                    </div>
                    <v-icon size="12" color="#9E9E9E" class="mx-2">mdi-arrow-right</v-icon>
                    <div class="doc-answer-answer">
                      <v-icon size="16" color="#4CAF50" class="mr-2">mdi-check-circle</v-icon><span
                        class="doc-answer-name">{{
                          docAnswer.documentAnswer
                        }}</span>
                    </div>
                    <!-- Show per-document mandatory indicator -->
                    <div v-if="docAnswer.isDocumentRequired" class="doc-mandatory-indicator">
                      <v-chip small color="red" dark class="ml-2">Mandatory</v-chip>
                    </div>
                  </div>
                  <v-btn icon x-small color="error" @click="removeDocAnswer(index)" class="delete-doc-btn"><v-icon
                      size="16">mdi-delete</v-icon></v-btn>
                </div>
              </div>
            </v-flex>
          </v-layout>
        </div>

        <!-- Connection to other questions -->
        <div class="connection-section">
          <div class="toggle-section">
            <v-switch v-model="questionData.isConnected" color="#1A73E9" inset dense class="connection-switch mt-0"
              hide-details />
            <span class="toggle-label">Is this connected to any other question ?</span>
          </div>

          <div v-if="questionData.isConnected" class="connection-dropdowns">
            <div class="connection-row">
              <div class="form-section connection-field">
                <label class="field-label">Choose parent question</label>
                <div class="select-with-clear" style="display: flex; align-items: center">
                  <select v-model="questionData.parentQuestion" :disabled="parentQuestionsLoading"
                    class="parent-question-select native-select" :class="{
                      'error--text': parentQuestionValidationMessage,
                      'placeholder-selected': !questionData.parentQuestion,
                    }" @change="onParentQuestionChange" :title="parentQuestionsLoading
                      ? 'Loading questions...'
                      : 'Select parent question'
                      ">
                    <option value="" disabled>
                      {{
                        parentQuestionsLoading
                          ? "Loading questions..."
                          : "Select parent question"
                      }}
                    </option>
                    <option v-for="item in parentQuestions" :key="item.value" :value="item.value" :title="item.text">
                      {{
                        item.text.length > 50
                          ? item.text
                          : item.text
                      }}
                    </option>
                  </select>

                  <!-- Clear button (shows when a parent is selected and not loading) -->
                  <v-btn v-if="
                    questionData.parentQuestion && !parentQuestionsLoading
                  " icon x-small class="clear-select-btn" :ripple="false" @click.prevent="clearParentQuestion"
                    title="Clear selection">
                    <v-icon size="16">mdi-close</v-icon>
                  </v-btn>
                </div>

                <div v-if="parentQuestionValidationMessage" class="validation-message">
                  {{ parentQuestionValidationMessage }}
                </div>
              </div>

              <div class="form-section connection-field">
                <label class="field-label">Choose answer</label>
                <div class="select-with-clear" style="display: flex; align-items: center">
                  <select v-model="questionData.showIfParentOptionValue" :disabled="!questionData.parentQuestion ||
                    parentQuestionAnswers.length === 0
                    " class="parent-question-select native-select" :class="{
                      'error--text': parentAnswerValidationMessage,
                      'placeholder-selected': !questionData.showIfParentOptionValue,
                    }" @change="onParentAnswerChange" :title="!questionData.parentQuestion
                      ? 'Select parent question first'
                      : 'Select answer option'
                      ">
                    <option value="" disabled>
                      {{
                        !questionData.parentQuestion
                          ? "Select parent question first"
                          : "Select answer option"
                      }}
                    </option>
                    <option v-for="item in parentQuestionAnswers" :key="item.value" :value="item.value"
                      :title="item.text">
                      {{
                        item.text.length > 50
                          ? item.text
                          : item.text
                      }}
                    </option>
                  </select>

                  <!-- Clear button (shows when an answer is selected) -->
                  <v-btn v-if="
                    questionData.showIfParentOptionValue && questionData.parentQuestion
                  " icon x-small class="clear-select-btn" :ripple="false" @click.prevent="clearParentAnswer"
                    title="Clear selection">
                    <v-icon size="16">mdi-close</v-icon>
                  </v-btn>
                </div>

                <div v-if="parentAnswerValidationMessage" class="validation-message">
                  {{ parentAnswerValidationMessage }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <span class="cancel-btn" @click="closeModal">Cancel</span>
        <div class="action-buttons">
          <GhostButton v-if="!isEditMode" text="Save & add new" :onClick="saveAndAddNew" :disabled="!isFormValid"
            size="medium" />
          <FilledButton :text="isEditMode ? 'Update' : 'Save'" :onClick="saveQuestion" :disabled="!isFormValid"
            size="medium" />
        </div>
      </div>

      <!-- Snackbar -->
      <v-snackbar v-model="showSnackBar" color="primary" right :timeout="timeout">
        <v-layout wrap justify-center>
          <v-flex text-left class="align-self-center"><span style="color: white">{{ msg }}</span></v-flex>
          <v-flex text-right><v-btn small :ripple="false" text @click="showSnackBar = false"><v-icon
                color="white">mdi-close</v-icon></v-btn></v-flex>
        </v-layout>
      </v-snackbar>
    </v-card>
  </v-dialog>
</template>

<script>
import { questionnaire as questionnaireApi, siteContent } from "@/api";
import FilledButton from "../../../utilities/FilledButton.vue";
import GhostButton from "../../../utilities/GhostButton.vue";

export default {
  name: "AddQuestionModal",
  components: {
    FilledButton,
    GhostButton,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    selectedCategory: {
      type: [String, Object],
      default: null,
    },
    mode: {
      type: String,
      default: "add",
      validator: (value) => ["add", "edit"].includes(value),
    },
    id: {
      type: [String, Number],
      default: null,
    },
    questionnaireId: {
      type: String,
      default: null,
    },
    editQuestionData: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      dialog: this.value,
      appLoading: false,
      showSnackBar: false,
      msg: "",
      timeout: 4000,
      datePickerMenu: false,
      isLoadingData: false,
      questionData: {
        title: "",
        isRequired: false,
        isTooltipNeeded: false,
        helpText: "",
        answerType: "dropdown",
        dateValue: null,
        options: [
          { text: "", _id: `option_0_${Date.now()}` },
          { text: "", _id: `option_1_${Date.now()}` },
          { text: "", _id: `option_2_${Date.now()}` },
          { text: "", _id: `option_3_${Date.now()}` },
        ],
        isDocumentNeeded: false,
        isMandatory: false,
        documentCategory: "",
        documentAnswer: "",
        isConnected: false,
        parentQuestion: "",
        showIfParentOptionValue: "",
        parentQuestionAnswer: "",
      },
      // Per-document mandatory toggle for the currently selected doc-answer pair
      newDocIsMandatory: false,
      // Track validation states
      showDocumentValidation: false,
      showEmptyOptionsValidation: false,
      showOptionsValidation: false,
      // Store document category-answer pairs
      docAnswerList: [],
      answerTypes: [
        { text: "Dropdown", value: "dropdown" },
        { text: "Radio", value: "radio" },
        { text: "Text", value: "text" },
        { text: "Date", value: "date" },
      ],
      documentCategories: [], // Will be populated from API
      parentQuestionsLoading: false, // Track loading state for parent questions
      // Parent questions will be populated from API when connection is enabled
      parentQuestions: [],
      // Parent question answers will be populated from selected parent question's options
      parentQuestionAnswers: [],
      // Validation rules
      rules: {
        titleMaxLength: (v) => {
          if (!v) return true;
          if (v.length > 300) {
            return `Maximum 300 characters allowed (${v.length}/300)`;
          }
          return true;
        },
        tooltipMaxLength: (v) => {
          if (!v) return true;
          if (v.length > 200) {
            return `Maximum 200 characters allowed (${v.length}/200)`;
          }
          return true;
        },
      },
    };
  },
  computed: {
    isEditMode() {
      return this.mode === "edit";
    },
    // Computed getter/setter for document-needed switch to prevent toggling off when links exist
    documentNeededComputed: {
      get() {
        // If there are doc-answer links, force true
        if (this.docAnswerList && this.docAnswerList.length > 0) return true;
        return !!this.questionData.isDocumentNeeded;
      },
      set(val) {
        // Only allow turning off when there are no doc-answer links
        if (this.docAnswerList && this.docAnswerList.length > 0) {
          // ignore attempts to turn off
          this.questionData.isDocumentNeeded = true;
        } else {
          this.questionData.isDocumentNeeded = !!val;
        }
      },
    },
    validOptions() {
      return this.questionData.options.filter(
        (opt) => opt.text && opt.text.trim() !== ""
      );
    },
    minOptionsCount() {
      if (this.questionData.answerType === "dropdown") return 4;
      if (this.questionData.answerType === "radio") return 2;
      return 1; // Default for other types
    },
    shouldShowAddOptions() {
      // Only show Add Options for dropdown and radio types
      if (!["dropdown", "radio"].includes(this.questionData.answerType)) {
        return false;
      }

      // Check if all current options are filled
      const allOptionsFilled = this.questionData.options.every(
        (opt) => opt.text && opt.text.trim() !== ""
      );

      // Get minimum options for current answer type
      const minOptions = this.questionData.answerType === "dropdown" ? 4 : 2;

      // Show button only if we have at least minimum options and all are filled
      return this.questionData.options.length >= minOptions && allOptionsFilled;
    },
    isFormValid() {
      const hasTitle = this.questionData.title.trim() !== "";

      // Basic title validation
      if (!hasTitle) {
        return false;
      }

      // Tooltip validation is only checked during save, not in real-time

      // Document validation - only check if docAnswerList has items when document is needed
      if (this.questionData.isDocumentNeeded) {
        // For radio and dropdown types, need at least one document-answer link
        if (
          this.questionData.answerType === "radio" ||
          this.questionData.answerType === "dropdown"
        ) {
          if (this.docAnswerList.length === 0) {
            return false;
          }
        }
      }

      // Connection validation is only checked during save, not in real-time

      // Answer type specific validations
      if (this.questionData.answerType === "date") {
        return true; // Only title validation needed for date
      }

      if (this.questionData.answerType === "text") {
        return true; // Only title validation needed for text
      }

      // For dropdown and radio, allow save button to be enabled so user can see validation messages
      // Validation will be properly checked in the saveQuestion method
      if (
        ["dropdown", "radio", "boolean"].includes(this.questionData.answerType)
      ) {
        // Only require at least one option to be filled to enable save button
        // More detailed validation will happen on save attempt
        const hasAnyOption = this.questionData.options.some(
          (opt) => opt.text && opt.text.trim() !== ""
        );
        return hasAnyOption;
      }

      return true;
    },

    // Validation messages (only shown when explicitly triggered)
    tooltipValidationMessage() {
      // Tooltip validation is only checked during save, not shown in real-time
      return "";
    },

    documentCategoryValidationMessage() {
      if (
        this.showDocumentValidation &&
        this.questionData.isDocumentNeeded &&
        (this.questionData.answerType === "radio" ||
          this.questionData.answerType === "dropdown") &&
        this.questionData.documentCategory === ""
      ) {
        return "Document category is required when document is needed";
      }
      return "";
    },

    documentAnswerValidationMessage() {
      if (
        this.showDocumentValidation &&
        this.questionData.isDocumentNeeded &&
        (this.questionData.answerType === "radio" ||
          this.questionData.answerType === "dropdown") &&
        this.questionData.documentAnswer === ""
      ) {
        return "Choose answer is required when document is needed";
      }
      return "";
    },

    parentQuestionValidationMessage() {
      // Parent question validation is only checked during save, not shown in real-time
      return "";
    },

    parentAnswerValidationMessage() {
      // Parent answer validation is only checked during save, not shown in real-time
      return "";
    },
    // Show add icon when both document category and answer are selected
    canAddDocAnswer() {
      // Allow adding when document is needed, both category and answer are selected,
      // and the selected answer isn't already linked in docAnswerList.
      return (
        this.questionData.isDocumentNeeded &&
        this.questionData.documentCategory &&
        this.questionData.documentAnswer &&
        !this.docAnswerList.some(
          (item) => item.documentAnswer === this.questionData.documentAnswer
        )
      );
    },
    // Get remaining available answers (not already linked to documents)
    availableDocumentAnswers() {
      const usedAnswers = this.docAnswerList.map((item) => item.documentAnswer);
      return this.validOptions.filter(
        (option) => !usedAnswers.includes(option.text)
      );
    },
    // Check if there are empty extra options (beyond minimum required)
    hasEmptyExtraOptions() {
      if (this.questionData.answerType !== "dropdown") return false;

      const minOptions = this.minOptionsCount;
      const extraOptions = this.questionData.options.slice(minOptions);

      return extraOptions.some((opt) => !opt.text || opt.text.trim() === "");
    },
    emptyOptionsValidationMessage() {
      // Validation messages only shown via snackbar, not inline
      return "";
    },
    // Comprehensive options validation based on answerType
    optionsValidationResult() {
      const { answerType, options } = this.questionData;
      const filledOptions = options.filter(
        (opt) => opt.text && opt.text.trim() !== ""
      );
      const totalOptions = options.length;
      const filledCount = filledOptions.length;

      if (answerType === "dropdown") {
        if (totalOptions > 4) {
          // Extra options added: all must be filled
          if (filledCount < totalOptions) {
            return {
              isValid: false,
              message:
                "All option fields must be filled when you have more than 4 options",
            };
          }
        } else if (totalOptions === 4) {
          // Default 4 options: at least 3 must be filled
          if (filledCount < 3) {
            return {
              isValid: false,
              message:
                "At least 3 options must be filled for dropdown questions",
            };
          }
        }
      } else if (answerType === "radio" || answerType === "boolean") {
        // Radio/Boolean: at least 2 options must be filled
        if (filledCount < 2) {
          return {
            isValid: false,
            message: `At least 2 options must be filled for ${answerType} questions`,
          };
        }
      }

      return { isValid: true, message: "" };
    },
    optionsValidationMessage() {
      // Validation messages only shown via snackbar, not inline
      return "";
    },
  },
  mounted() {
    console.log("🔧 AddQuestionModal mounted");
    console.log("📊 Initial props:", {
      value: this.value,
      dialog: this.dialog,
      selectedCategory: this.selectedCategory,
    });
  },
  watch: {
    value(newVal) {
      console.log("🔄 AddQuestionModal value changed:", newVal);
      console.log("🔧 Current modal props:", {
        mode: this.mode,
        id: this.id,
        isEditMode: this.isEditMode,
        editQuestionData: this.editQuestionData,
      });
      this.dialog = newVal;
      if (newVal) {
        console.log("✅ Dialog opening - fetching document categories");
        // Fetch document categories when dialog opens
        this.fetchDocumentCategories();
        if (this.isEditMode && this.id) {
          console.log("🔄 Edit mode detected - fetching question data");
          this.fetchQuestionData();
        }
      }
    },
    dialog(newVal) {
      console.log("🔄 AddQuestionModal dialog changed:", newVal);
      this.$emit("input", newVal);
      if (!newVal) {
        this.resetForm();
      }
      // Note: fetchDocumentCategories() is already called in value watcher
      // No need to call it again here to prevent duplicate API calls
    },
    selectedCategory(newVal) {
      console.log("AddQuestionModal selectedCategory changed:", newVal);
    },
    mode(newVal) {
      console.log("AddQuestionModal mode changed:", newVal);
      if (this.dialog && newVal === "edit" && this.id) {
        this.fetchQuestionData();
      }
    },
    id(newVal) {
      console.log("AddQuestionModal id changed:", newVal);
      if (this.dialog && this.isEditMode && newVal) {
        this.fetchQuestionData();
      }
    },
    // Watch for connection toggle changes
    "questionData.isConnected"(newVal) {
      console.log("🔗 Connection toggle changed:", newVal);
      if (newVal) {
        console.log("✅ Connection enabled - fetching parent questions");
        this.fetchParentQuestions();
      } else {
        console.log("❌ Connection disabled - clearing parent questions");
        // Clear parent question selections when connection is disabled
        this.questionData.parentQuestion = "";
        this.questionData.showIfParentOptionValue = "";
      }
    },
    // Watch for document needed toggle changes
    "questionData.isDocumentNeeded"(newVal) {
      console.log("📄 Document needed toggle changed:", newVal);
      if (!newVal) {
        // Hide validation messages when toggling off
        this.showDocumentValidation = false;
        // Clear document fields when toggling off
        this.questionData.documentCategory = "";
        this.questionData.documentAnswer = "";
      }
    },
    // Watch for parent question selection to populate answers
    "questionData.parentQuestion"(newVal) {
      console.log("🔄 Parent question selected:", newVal);
      if (newVal && this.parentQuestions.length > 0) {
        // Find the selected parent question
        const selectedParentQuestion = this.parentQuestions.find(
          (q) => q.value === newVal
        );
        if (selectedParentQuestion) {
          console.log(
            "🔍 Found selected parent question:",
            selectedParentQuestion
          );
          // Find the full question data from the API response to get options
          this.fetchParentQuestionOptions(newVal);
        }
      } else {
        console.log("❌ No parent question selected - clearing answers");
        this.parentQuestionAnswers = [];
        this.questionData.showIfParentOptionValue = "";
      }
    },
    // Watch for editQuestionData prop changes (for edit mode)
    editQuestionData: {
      handler(newVal) {
        console.log("🔄 editQuestionData prop changed:", newVal);
        if (newVal && this.isEditMode) {
          console.log("✅ Populating form with question data from prop");
          // This will be populated via the CategoryExpansionPanel passing the question data
          this.populateFormFromQuestionData(newVal);
        }
      },
      immediate: true,
    },
  },
  methods: {
    populateFormFromQuestionData(questionData) {
      if (!questionData) return;

      console.log("🔧 Populating form with question data:", questionData);

      try {
        // Populate basic question info
        this.questionData.title = questionData.questionText || "";
        this.questionData.isRequired = questionData.isRequired !== false;
        this.questionData.isTooltipNeeded = questionData.helpText
          ? true
          : false;
        this.questionData.helpText = questionData.helpText || "";
        this.questionData.answerType = questionData.questionType || "dropdown";

        // Handle options - convert API format to form format
        if (questionData.options && Array.isArray(questionData.options)) {
          this.questionData.options = questionData.options.map(
            (option, idx) => ({
              text: option.label || option.value || "",
              _id: option._id || option.id || `option_${idx}_${Date.now()}`,
            })
          );

          // Ensure all options have stable IDs
          this.ensureOptionIds();

          // Collect document-answer pairs from options (legacy/older API shape)
          const docPairsFromOptions = questionData.options
            // Include option-level document entries regardless of isDocumentRequired
            .filter(
              (option) => option.documentCategoryId || option.documentCategory
            )
            .map((option) => ({
              documentCategory:
                option.documentCategoryId || option.documentCategory,
              documentAnswer: option.label || option.value,
              isDocumentRequired: !!option.isDocumentRequired,
            }));

          // Try to attach optionId to doc pairs when possible (match by label/value)
          docPairsFromOptions.forEach((pair) => {
            const matching = this.questionData.options.find(
              (opt) => (opt.text || "") === (pair.documentAnswer || "")
            );
            if (matching && matching._id) pair.optionId = matching._id;
          });

          // Also collect document entries from top-level `documents` (newer API shape)
          const docPairsFromTopLevel = Array.isArray(questionData.documents)
            ? questionData.documents
              .map((doc) => ({
                documentCategory:
                  doc.documentCategoryId || doc.documentCategory || null,
                documentAnswer: doc.label || doc.value || doc.name || "",
                isDocumentRequired: !!doc.isDocumentRequired,
              }))
              .filter((d) => d.documentCategory && d.documentAnswer)
            : [];

          // Merge both sources, avoiding duplicates (by category+answer)
          const merged = [...docPairsFromOptions];
          docPairsFromTopLevel.forEach((d) => {
            const exists = merged.some(
              (m) =>
                m.documentCategory === d.documentCategory &&
                m.documentAnswer === d.documentAnswer
            );
            if (!exists) merged.push(d);
          });

          this.docAnswerList = merged;

          // If document-answer pairs were loaded, ensure the flag is set so UI shows relevant controls
          if (this.docAnswerList && this.docAnswerList.length > 0) {
            this.questionData.isDocumentNeeded = true;
          }
        } else {
          // Set default options based on answer type
          this.onAnswerTypeChange();
        }

        // Ensure minimum options are present after loading (critical for edit mode)
        this.ensureMinimumOptions();

        // Handle parent question connection - support both parentQuestionId and nested parentQuestion object
        const parentIdFromField = questionData.parentQuestionId;
        const parentIdFromObj =
          questionData.parentQuestion && questionData.parentQuestion.id
            ? questionData.parentQuestion.id
            : null;
        const parentId = parentIdFromField || parentIdFromObj;

        if (parentId) {
          this.questionData.isConnected = true;
          this.questionData.parentQuestion = parentId;
          // Prefer top-level showIfParentOptionValue, fallback to nested parentQuestion.showIfParentOptionValue
          this.questionData.showIfParentOptionValue =
            questionData.showIfParentOptionValue ||
            (questionData.parentQuestion &&
              questionData.parentQuestion.showIfParentOptionValue) ||
            "";

          // Fetch parent questions to populate dropdown and then load parent options
          this.fetchParentQuestions().then(() => {
            // Attempt to fetch options for the parent question (best-effort)
            if (parentId) {
              this.fetchParentQuestionOptions(parentId);
            }
          });
        } else {
          this.questionData.isConnected = false;
          this.questionData.parentQuestion = "";
          this.questionData.showIfParentOptionValue = "";
        }

        console.log("✅ Form populated successfully:", this.questionData);
        console.log("📋 Document answer pairs:", this.docAnswerList);
      } catch (error) {
        console.error("❌ Error populating form:", error);
      }
    },
    async fetchDocumentCategories() {
      if (!siteContent || !siteContent.getDocumentCategories) return;

      try {
        const response = await siteContent.getDocumentCategories();

        if (response) {
          this.documentCategories = response.data.data.map((category) => ({
            text: category.name,
            value: category.id,
          }));
          console.log("documentCategories", this.documentCategories);
        } else {
          this.documentCategories = [];
        }
      } catch (error) {
        this.documentCategories = [];
      }
    },
    async fetchQuestionData() {
      if (!this.id) return;

      try {
        this.isLoadingData = true;
        console.log("🔄 Fetching question data for ID:", this.id);

        const { success, data, message } = await questionnaireApi.getQuestion(
          this.id
        );

        if (success && data) {
          console.log("✅ Question data loaded:", data);

          // Populate form with existing question data
          this.questionData.title = data.questionText || "";
          this.questionData.isRequired = data.isRequired !== false; // Default to true if not specified
          this.questionData.isTooltipNeeded = data.helpText ? true : false;
          this.questionData.helpText = data.helpText || "";
          this.questionData.answerType = data.questionType || "dropdown";

          // Handle options - convert API format to form format
          if (data.options && Array.isArray(data.options)) {
            this.questionData.options = data.options.map((option, idx) => ({
              text: option.label || option.value || "",
              _id: option._id || option.id || `option_${idx}_${Date.now()}`,
            }));

            // Ensure stable ids
            this.ensureOptionIds();

            // Populate docAnswerList from both option-level entries and top-level documents
            const docPairsFromOptions = data.options
              .filter(
                (option) => option.documentCategoryId || option.documentCategory
              )
              .map((option) => ({
                documentCategory:
                  option.documentCategoryId || option.documentCategory,
                documentAnswer: option.label || option.value,
                isDocumentRequired: !!option.isDocumentRequired,
              }));

            // Attach optionId where possible by matching against this.questionData.options
            docPairsFromOptions.forEach((pair) => {
              const matching = this.questionData.options.find(
                (opt) => (opt.text || "") === (pair.documentAnswer || "")
              );
              if (matching && matching._id) pair.optionId = matching._id;
            });

            const docPairsFromTopLevel = Array.isArray(data.documents)
              ? data.documents
                .map((doc) => ({
                  documentCategory:
                    doc.documentCategoryId || doc.documentCategory || null,
                  documentAnswer: doc.label || doc.value || doc.name || "",
                  isDocumentRequired: !!doc.isDocumentRequired,
                }))
                .filter((d) => d.documentCategory && d.documentAnswer)
              : [];

            // Merge and dedupe
            const merged = [...docPairsFromOptions];
            docPairsFromTopLevel.forEach((d) => {
              const exists = merged.some(
                (m) =>
                  m.documentCategory === d.documentCategory &&
                  m.documentAnswer === d.documentAnswer
              );
              if (!exists) merged.push(d);
            });

            this.docAnswerList = merged;

            if (this.docAnswerList && this.docAnswerList.length > 0) {
              this.questionData.isDocumentNeeded = true;
            }
          } else {
            this.questionData.options = [
              { text: "" },
              { text: "" },
              { text: "" },
              { text: "" },
            ];
          }

          // Ensure minimum options are present after loading (critical for edit mode)
          this.ensureMinimumOptions();

          // Handle parent question connection - support nested parentQuestion object
          const parentIdFromField = data.parentQuestionId;
          const parentIdFromObj =
            data.parentQuestion && data.parentQuestion.id
              ? data.parentQuestion.id
              : null;
          const parentId = parentIdFromField || parentIdFromObj;
          if (parentId) {
            this.questionData.isConnected = true;
            this.questionData.parentQuestion = parentId;
            this.questionData.showIfParentOptionValue =
              data.showIfParentOptionValue ||
              (data.parentQuestion &&
                data.parentQuestion.showIfParentOptionValue) ||
              "";

            console.log(
              "data.showIfParentOptionValue",
              data.showIfParentOptionValue
            );
            // Fetch parent questions to populate dropdown
            await this.fetchParentQuestions();

            // Fetch parent question options
            if (parentId) {
              await this.fetchParentQuestionOptions(parentId);
            }
          }

          console.log(
            "✅ Form populated with question data:",
            this.questionData
          );
          console.log("📋 Document answer pairs:", this.docAnswerList);
        } else {
          console.error("❌ Failed to load question data:", message);
          this.showSnackBar = true;
          this.msg = message || "Failed to load question data";
        }
      } catch (err) {
        console.error("❌ Error fetching question data:", err);
        this.showSnackBar = true;
        this.msg = err.message || "Error loading question data";
      } finally {
        this.isLoadingData = false;
      }
    },
    async fetchParentQuestions() {
      try {
        const categoryId = this.getCategoryId();
        if (!categoryId) {
          console.error("❌ Category ID is required to fetch parent questions");
          return;
        }

        console.log(
          "🔄 Fetching parent questions for category ID:",
          categoryId
        );
        this.parentQuestionsLoading = true;

        // Call the same API used in CategoryExpansionPanel
        const { success, data, message } = await questionnaireApi.listQuestions(
          categoryId
        );

        if (success && data && Array.isArray(data)) {
          // Transform API response to dropdown format
          this.parentQuestions = data.map((question) => ({
            text: question.questionText,
            value: question.id,
          }));

          console.log(
            "✅ Parent questions loaded:",
            this.parentQuestions.length,
            "questions"
          );
          console.log("📊 Parent questions:", this.parentQuestions);
        } else {
          console.error("❌ Failed to load parent questions:", message);
          this.parentQuestions = [];
        }
      } catch (error) {
        console.error("❌ Error fetching parent questions:", error);
        this.parentQuestions = [];
      } finally {
        this.parentQuestionsLoading = false;
      }
    },
    async fetchParentQuestionOptions(parentQuestionId) {
      try {
        const categoryId = this.getCategoryId();
        if (!categoryId || !parentQuestionId) {
          console.error("❌ Category ID and parent question ID are required");
          return;
        }

        console.log(
          "🔄 Fetching options for parent question ID:",
          parentQuestionId
        );

        // Call API to get the specific question details including options
        const { success, data, message } = await questionnaireApi.listQuestions(
          categoryId
        );

        if (success && data && Array.isArray(data)) {
          // Find the specific parent question
          const parentQuestion = data.find((q) => q.id === parentQuestionId);

          if (
            parentQuestion &&
            parentQuestion.options &&
            Array.isArray(parentQuestion.options)
          ) {
            // Transform parent question options to dropdown format
            this.parentQuestionAnswers = parentQuestion.options.map(
              (option) => ({
                text: option.label || option.value,
                value: option.value || option.label,
              })
            );

            console.log(
              "✅ Parent question options loaded:",
              this.parentQuestionAnswers.length,
              "options"
            );
            console.log(
              "📊 Parent question answers:",
              this.parentQuestionAnswers
            );
          } else {
            console.log("⚠️ Parent question has no options");
            this.parentQuestionAnswers = [];
          }
        } else {
          console.error("❌ Failed to load parent question options:", message);
          this.parentQuestionAnswers = [];
        }
      } catch (error) {
        console.error("❌ Error fetching parent question options:", error);
        this.parentQuestionAnswers = [];
      }
    },
    closeModal() {
      this.dialog = false;
      // Form will be reset in the dialog watcher
    },
    resetForm() {
      this.questionData = {
        title: "",
        isRequired: true,
        isTooltipNeeded: false,
        helpText: "",
        answerType: "dropdown",
        dateValue: null,
        options: [
          { text: "", _id: `option_0_${Date.now()}` },
          { text: "", _id: `option_1_${Date.now()}` },
          { text: "", _id: `option_2_${Date.now()}` },
          { text: "", _id: `option_3_${Date.now()}` },
        ],
        isDocumentNeeded: false, // Default to false
        isMandatory: false,
        documentCategory: "",
        documentAnswer: "",
        isConnected: false,
        parentQuestion: "",
        parentQuestionAnswer: "",
      };
      this.datePickerMenu = false;
      this.showDocumentValidation = false; // Reset validation state
      // Clear parent questions and answers
      this.parentQuestions = [];
      this.parentQuestionAnswers = [];
      this.docAnswerList = [];
    },
    // Add document-answer pair to list
    addDocAnswer() {
      // Enable validation display
      this.showDocumentValidation = true;

      // Validate both fields before adding
      const hasDocumentCategory = this.questionData.documentCategory !== "";
      const hasDocumentAnswer = this.questionData.documentAnswer !== "";

      if (!hasDocumentCategory || !hasDocumentAnswer) {
        console.log("❌ Validation failed - missing required fields:", {
          hasDocumentCategory,
          hasDocumentAnswer,
          documentCategory: this.questionData.documentCategory,
          documentAnswer: this.questionData.documentAnswer,
        });
        return; // Don't add if validation fails
      }

      const docAnswerPair = {
        documentCategory: this.questionData.documentCategory,
        documentAnswer: this.questionData.documentAnswer,
        isDocumentRequired: !!this.newDocIsMandatory,
      };

      // Try to find the option this documentAnswer corresponds to and attach optionId
      const matchingOption = this.questionData.options.find(
        (opt) => (opt.text || "") === (docAnswerPair.documentAnswer || "")
      );
      if (matchingOption && matchingOption._id) {
        docAnswerPair.optionId = matchingOption._id;
      }

      // Ensure document-needed flag is set when adding links
      this.questionData.isDocumentNeeded = true;

      // Add to list
      this.docAnswerList.push(docAnswerPair);

      // Clear fields for next input
      this.questionData.documentCategory = "";
      this.questionData.documentAnswer = "";
      // reset the per-doc mandatory toggle
      this.newDocIsMandatory = false;

      // Hide validation messages after successful add
      this.showDocumentValidation = false;

      // Don't reset isDocumentNeeded to false when there are document-answer pairs
      // Keep it true so user can add more pairs or the existing pairs remain linked

      console.log("➕ Added doc-answer pair:", docAnswerPair);
      console.log("📋 Current docAnswerList:", this.docAnswerList);
      console.log("🔄 Keeping isDocumentNeeded true (items in list)");
    },

    // Ensure every option has a stable _id
    ensureOptionIds() {
      this.questionData.options = this.questionData.options.map((opt, idx) => {
        if (!opt._id) {
          return {
            ...opt,
            _id: opt._id || opt.id || `option_${idx}_${Date.now()}`,
          };
        }
        return opt;
      });
    },
    // Remove document-answer pair from list
    removeDocAnswer(index) {
      if (index >= 0 && index < this.docAnswerList.length) {
        const removed = this.docAnswerList.splice(index, 1)[0];
        console.log("🗑️ Removed doc-answer pair:", removed);
        console.log("📋 Updated docAnswerList:", this.docAnswerList);
      }
    },
    // Get document category name by ID
    getDocumentCategoryName(categoryId) {
      const category = this.documentCategories.find(
        (cat) => cat.value === categoryId
      );
      return category ? category.text : categoryId;
    },
    onAnswerTypeChange() {
      // Preserve existing filled options when possible
      const existingFilledOptions = this.questionData.options.filter(
        (opt) => opt.text && opt.text.trim() !== ""
      );

      if (this.questionData.answerType === "dropdown") {
        // Start with existing filled options
        this.questionData.options = [...existingFilledOptions];
        // Ensure we have at least 4 options
        while (this.questionData.options.length < 4) {
          this.questionData.options.push({ text: "" });
        }
      } else if (
        this.questionData.answerType === "radio" ||
        this.questionData.answerType === "boolean"
      ) {
        // Start with existing filled options (max 2 for radio)
        this.questionData.options = existingFilledOptions.slice(0, 2);
        // Ensure we have at least 2 options
        while (this.questionData.options.length < 2) {
          this.questionData.options.push({ text: "" });
        }
      } else if (this.questionData.answerType === "text") {
        this.questionData.options = [{ text: "" }];
      } else if (this.questionData.answerType === "date") {
        this.questionData.options = [];
        this.questionData.dateValue = null;
      }
    },
    ensureMinimumOptions() {
      // Ensure minimum number of options based on answer type
      const minOptions = this.minOptionsCount;

      if (
        this.questionData.answerType === "dropdown" ||
        this.questionData.answerType === "radio"
      ) {
        while (this.questionData.options.length < minOptions) {
          this.questionData.options.push({ text: "" });
        }
      }
    },

    getCategoryName() {
      if (
        typeof this.selectedCategory === "object" &&
        this.selectedCategory?.name
      ) {
        return this.selectedCategory.name;
      }
      return this.selectedCategory || "Select Category";
    },
    getCategoryId() {
      if (
        typeof this.selectedCategory === "object" &&
        this.selectedCategory?.id
      ) {
        return this.selectedCategory.id;
      }
      return null;
    },
    addOption() {
      this.questionData.options.push({
        text: "",
        _id: `option_${this.questionData.options.length}_${Date.now()}`,
      });
      this.ensureOptionIds();
    },
    removeOption(index) {
      // Only allow removing options beyond the minimum count
      if (
        index >= this.minOptionsCount &&
        this.questionData.options.length > this.minOptionsCount
      ) {
        // Store the option id and text before removal for document-answer link synchronization
        const removedOption = this.questionData.options[index] || {};
        const removedOptionId = removedOption._id;
        const removedOptionText = removedOption.text || "";

        this.questionData.options.splice(index, 1);
        // Option removed successfully
        console.log(`🗑️ Removed option at index ${index}`);

        // Synchronize Document-Answer Links - remove any links referencing the removed option
        if (removedOptionId) {
          this.syncDocAnswerLinksWithOptionChange(removedOptionId, "");
        } else if (removedOptionText) {
          // Fallback for older links that may reference by text
          this.syncDocAnswerLinksWithOptionChangeByText(removedOptionText, "");
        }
      }
    },
    onOptionTextChange(index, newValue) {
      const option = this.questionData.options[index];
      if (!option) return;

      const oldValue = option.text; // store old text
      const optionId = option._id; // stable id for option

      // Update text
      this.$set(this.questionData.options, index, {
        ...option,
        text: newValue,
      });

      // Only sync if this specific option (by _id) already had a linked document
      const hasLinkedDoc = this.docAnswerList.some(
        (link) => link.optionId && optionId && link.optionId === optionId
      );

      if (hasLinkedDoc) {
        this.syncDocAnswerLinksWithOptionChange(optionId, oldValue, newValue);
      }
    },

    // Synchronize Document-Answer Links when option text changes - primary by optionId
    syncDocAnswerLinksWithOptionChange(optionId, oldValue, newValue) {
      if (!optionId) return; // nothing to sync

      // Find any document-answer links that reference this optionId
      const matchingLinks = this.docAnswerList.filter(
        (link) => link.optionId && link.optionId === optionId
      );

      // If there are no links by optionId, don't auto-match by text (we're stopping auto-linking)
      if (matchingLinks.length === 0) return;

      if (!newValue || newValue.trim() === "") {
        // Option text was cleared - remove all matching document-answer links for this optionId
        this.docAnswerList = this.docAnswerList.filter(
          (link) => !(link.optionId && link.optionId === optionId)
        );
        console.log(
          `🗑️ Removed ${matchingLinks.length} document-answer link(s) for cleared optionId: "${optionId}"`
        );
      } else {
        // Option text changed - update the documentAnswer for links tied to this optionId
        matchingLinks.forEach((link) => {
          link.documentAnswer = newValue;
        });
        console.log(
          `🔄 Updated ${matchingLinks.length} document-answer link(s) for optionId: "${optionId}" -> "${newValue}"`
        );
      }
    },

    // Backward-compat helper: sync/remove links by matching documentAnswer text (used as fallback)
    syncDocAnswerLinksWithOptionChangeByText(oldValue, newValue) {
      if (!oldValue) return;

      const matchingLinks = this.docAnswerList.filter(
        (link) => link.documentAnswer === oldValue
      );

      if (matchingLinks.length === 0) return;

      if (!newValue || newValue.trim() === "") {
        this.docAnswerList = this.docAnswerList.filter(
          (link) => link.documentAnswer !== oldValue
        );
        console.log(
          `🗑️ Removed ${matchingLinks.length} document-answer link(s) for cleared option text: "${oldValue}" (fallback)`
        );
      } else {
        matchingLinks.forEach((link) => {
          link.documentAnswer = newValue;
        });
        console.log(
          `🔄 Updated ${matchingLinks.length} document-answer link(s): "${oldValue}" → "${newValue}" (fallback)`
        );
      }
    },
    onDocumentCategoryChange(newVal) {
      // If category cleared, also clear the selected documentAnswer to avoid stale links
      if (!newVal) {
        this.questionData.documentAnswer = "";
      }
    },
    onParentQuestionChange(newVal) {
      // If parent question is cleared, clear its answers and selected parent answer
      if (!newVal) {
        this.parentQuestionAnswers = [];
        this.questionData.showIfParentOptionValue = "";
      } else {
        // If a new parent is selected, fetch its options
        this.fetchParentQuestionOptions(newVal);
      }
    },
    clearParentQuestion() {
      this.questionData.parentQuestion = "";
      this.parentQuestionAnswers = [];
      this.questionData.showIfParentOptionValue = "";
      // keep validation state as-is; trigger change handling
      this.onParentQuestionChange("");
    },
    clearParentAnswer() {
      this.questionData.showIfParentOptionValue = "";
      this.onParentAnswerChange("");
    },
    onParentAnswerChange(newVal) {
      // Handle parent answer change if needed
      console.log("🔄 Parent answer changed:", newVal);
    },
    getOptionPlaceholder(index) {
      return `Enter option ${index + 1}`;
    },
    async saveQuestion() {
      try {
        this.appLoading = true;

        const categoryId = this.getCategoryId();
        if (!categoryId) {
          throw new Error("Category ID is required to save question");
        }

        // Validate tooltip requirements at save time
        if (this.questionData.isTooltipNeeded) {
          if (this.questionData.helpText.trim() === "") {
            this.appLoading = false;
            this.showSnackBar = true;
            this.msg =
              "Tooltip description is required when tooltip is enabled";
            console.log("❌ Save blocked: Tooltip description required");
            return;
          }
        }

        // Validate connection requirements at save time
        // Only require parent question/answer when connection is enabled
        // AND the answer type actually uses options (radio or dropdown).
        const typesRequiringParent = ["radio", "dropdown"];
        if (
          this.questionData.isConnected &&
          typesRequiringParent.includes(this.questionData.answerType)
        ) {
          const hasParentQuestion = this.questionData.parentQuestion !== "";
          const hasParentAnswer =
            this.questionData.showIfParentOptionValue !== "";
          if (!hasParentQuestion || !hasParentAnswer) {
            this.appLoading = false;
            this.showSnackBar = true;
            this.msg =
              "Parent question and answer are required when question is connected and answer type requires options";
            console.log(
              "❌ Save blocked: Connection fields required for option-based types"
            );
            return;
          }
        }

        // Validate options based on answerType rules
        const optionsValidation = this.optionsValidationResult;
        if (
          !optionsValidation.isValid &&
          ["dropdown", "radio", "boolean"].includes(
            this.questionData.answerType
          )
        ) {
          this.appLoading = false;
          this.showSnackBar = true;
          this.msg = optionsValidation.message;
          console.log(
            "❌ Save blocked: Options validation failed -",
            optionsValidation.message
          );
          return;
        }

        // Legacy validation for extra empty options (still keep for backwards compatibility)
        if (this.hasEmptyExtraOptions) {
          this.appLoading = false;
          this.showSnackBar = true;
          this.msg = "All additional options must be filled or removed";
          console.log("❌ Save blocked: Empty extra options found");
          return;
        }

        // Validate document requirements at save time
        if (this.questionData.isDocumentNeeded) {
          if (
            (this.questionData.answerType === "radio" ||
              this.questionData.answerType === "dropdown") &&
            this.docAnswerList.length === 0
          ) {
            this.showDocumentValidation = true;
            this.appLoading = false;
            this.showSnackBar = true;
            this.msg =
              "At least one Document-Answer Link is required when document is needed";
            console.log("❌ Save blocked: Document-Answer Links required");
            return;
          }
        }

        // Transform options to match API format
        const options =
          this.questionData.answerType === "date" ||
            this.questionData.answerType === "text"
            ? []
            : this.questionData.options
              .filter((opt) => opt.text && opt.text.trim())
              .map((opt, index) => {
                // Check if this option has a document requirement from docAnswerList
                // Prefer matching by optionId (stable), fallback to matching by documentAnswer text
                const docAnswerPair = this.docAnswerList.find((pair) => {
                  if (pair.optionId && opt._id)
                    return pair.optionId === opt._id;
                  return pair.documentAnswer === opt.text.trim();
                });
                const isDocumentRequiredForThisOption = !!docAnswerPair;

                console.log(`🔍 Checking option "${opt.text}":`, {
                  docAnswerPair,
                  isDocumentRequiredForThisOption,
                  docAnswerList: this.docAnswerList,
                });

                const optionData = {
                  value: opt.text.toLowerCase().replace(/\s+/g, "_"), // Convert to snake_case for value
                  label: opt.text,
                  order: index + 1,
                  // Use per-document isDocumentRequired flag from docAnswerPair when present
                  isDocumentRequired: isDocumentRequiredForThisOption
                    ? !!docAnswerPair.isDocumentRequired
                    : false,
                };

                // Add documentCategoryId if document is required for this option
                if (isDocumentRequiredForThisOption && docAnswerPair) {
                  optionData.documentCategoryId =
                    docAnswerPair.documentCategory;
                  // Keep reference to original document link (optional)
                  if (docAnswerPair.optionId)
                    optionData._linkedOptionId = docAnswerPair.optionId;
                }

                console.log(`📋 Option data for "${opt.text}":`, optionData);
                return optionData;
              });

        const requestData = {
          categoryId: categoryId,
          questionText: this.questionData.title,
          questionType: this.questionData.answerType,
          isRequired: this.questionData.isRequired,
          sortOrder: 1, // Default sort order, can be made dynamic if needed
          helpText: this.questionData.isTooltipNeeded
            ? this.questionData.helpText
            : "",
          options: options,
          // Add document mandatory flag if document is needed
          ...(this.questionData.isDocumentNeeded && {
            isMandatory: this.questionData.isMandatory,
          }),
          // Add parent question connection if configured
          ...(this.questionData.isConnected &&
            this.questionData.parentQuestion && {
            parentQuestionId: this.questionData.parentQuestion,
            showIfParentOptionValue:
              this.questionData.showIfParentOptionValue,
          }),
        };

        console.log(
          `📤 ${this.isEditMode ? "Updating" : "Creating"
          } question with payload:`
        );
        console.log("🔗 Document answer pairs:", this.docAnswerList);
        console.log("📊 Transformed options:", options);
        console.log(
          "📋 Full request data:",
          JSON.stringify(requestData, null, 2)
        );

        // Specific logging for document requirements
        const optionsWithDocs = options.filter((opt) => opt.isDocumentRequired);
        if (optionsWithDocs.length > 0) {
          console.log("� Options with document requirements:", optionsWithDocs);
        } else {
          console.log("⚠️ No options have document requirements attached");
        }

        let result;
        if (this.isEditMode && this.id) {
          // Update existing question
          result = await questionnaireApi.updateQuestion(this.id, requestData);
        } else {
          // Create new question
          result = await questionnaireApi.createQuestion(requestData);
        }

        const { success, data, message, error } = result;
        this.appLoading = false;

        if (success) {
          console.log(
            `✅ Question ${this.isEditMode ? "updated" : "created"
            } successfully:`,
            data
          );
          this.$emit("questionSaved", data);
          this.closeModal();
        } else {
          console.error(
            `❌ Failed to ${this.isEditMode ? "update" : "create"} question:`,
            error || message
          );
          this.showSnackBar = true;

          // Prefer the API-returned message first (this is set by the
          // questionnaire API helpers). If that's empty, try multiple
          // locations on the returned `result.error` to extract a backend
          // message. This avoids showing the generic AxiosError string.
          let resolvedMsg = null;

          if (message && typeof message === "string" && message.trim()) {
            resolvedMsg = message.trim();
          }

          // If API helper returned an `error` payload, inspect it (it may be the
          // original Axios error object or a string). Prefer response.data.error
          // then response.data.message, then any string value available.
          if (!resolvedMsg && error) {
            // If error is an Axios error object
            if (error.response && error.response.data) {
              const respData = error.response.data;
              if (typeof respData === "string" && respData.trim()) {
                resolvedMsg = respData;
              } else if (respData.error && typeof respData.error === "string") {
                resolvedMsg = respData.error;
              } else if (
                respData.message &&
                typeof respData.message === "string"
              ) {
                resolvedMsg = respData.message;
              }
            }

            // If still not resolved and error itself is a string, use it
            if (!resolvedMsg && typeof error === "string") {
              resolvedMsg = error;
            }
          }

          this.msg =
            resolvedMsg ||
            `Failed to ${this.isEditMode ? "update" : "create"} question`;
        }
      } catch (err) {
        this.appLoading = false;
        console.error(
          `❌ Error ${this.isEditMode ? "updating" : "creating"} question:`,
          err
        );
        this.showSnackBar = true;

        // Check for backend error message in different possible locations
        let backendError = null;

        // Try to extract backend error from various possible response structures
        if (err.response && err.response.data) {
          backendError = err.response.data.error || err.response.data.message;
        } else if (err.data) {
          backendError = err.data.error || err.data.message;
        } else if (err.error) {
          backendError = err.error;
        }

        // Use backend error if available, otherwise fall back to default
        this.msg =
          backendError ||
          err.message ||
          `Error ${this.isEditMode ? "updating" : "creating"} question`;
      }
    },
    async saveAndAddNew() {
      await this.saveQuestion();
      if (!this.dialog) {
        // If modal closed (successful save), reopen for new question
        this.resetForm();
        this.dialog = true;
      }
    },
  },
};
</script>

<style scoped>
/* Modal Styles - Pixel Perfect from Figma */
.add-question-modal {
  width: 750px !important;
  max-width: 750px !important;
  border-radius: 8px !important;
  /* Use flex column layout so header/footer can be fixed and content scrolls */
  display: flex !important;
  flex-direction: column !important;
  /* Constrain modal height to viewport */
  max-height: 90vh !important;
}

/* Header */
.modal-header {
  background-color: #1a73e9 !important;
  height: 52px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 0 24px !important;
}

.header-title {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 600 !important;
  font-size: 16px !important;
  color: white !important;
  line-height: normal !important;
}

.close-btn {
  width: 20px !important;
  height: 20px !important;
}

/* Content */
.modal-content {
  padding: 24px !important;
  background-color: white !important;
  /* Allow the content area to grow and scroll independently of header/footer */
  overflow: auto !important;
  flex: 1 1 auto !important;
}

/* Category Card */
.category-card {
  height: 40px !important;
  border: 1px solid #1a73e980 !important;
  border-radius: 4px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-bottom: 24px !important;
  background-color: white !important;
}

.category-name {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  color: #1a73e9 !important;
  line-height: 24px !important;
}

/* Form Sections */
/* .form-section {
  margin-bottom: 20px !important;
} */

.field-label {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  color: #5f5f5f !important;
  line-height: 24px !important;
  display: block !important;
  margin-bottom: 6px !important;
}

/* Input Styling */
::v-deep(.question-input .v-input__control),
::v-deep(.answer-type-select .v-input__control),
::v-deep(.option-input .v-input__control),
::v-deep(.document-category-select .v-input__control),
::v-deep(.document-answer-select .v-input__control) {
  min-height: 40px !important;
  height: 40px !important;
}

::v-deep(.question-input .v-text-field__details),
::v-deep(.answer-type-select .v-text-field__details),
::v-deep(.option-input .v-text-field__details),
::v-deep(.document-category-select .v-text-field__details),
::v-deep(.document-answer-select .v-text-field__details) {
  display: none !important;
}

::v-deep(.question-input input),
::v-deep(.option-input input) {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  color: black !important;
  line-height: 24px !important;
  padding: 8px 16px !important;
}

/* Tooltip Textarea Specific Styling */
::v-deep(.tooltip-textarea .v-input__control) {
  min-height: auto !important;
  height: auto !important;
}

::v-deep(.tooltip-textarea textarea) {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  color: black !important;
  line-height: 1.5 !important;
  padding: 12px 16px !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  white-space: pre-wrap !important;
}

::v-deep(.tooltip-textarea .v-text-field__details) {
  margin-top: 4px !important;
  padding: 0 16px !important;
}

::v-deep(.tooltip-textarea .v-counter) {
  font-family: "DM Sans", sans-serif !important;
  font-size: 12px !important;
  color: rgba(0, 0, 0, 0.6) !important;
}

::v-deep(.tooltip-textarea .v-messages__message) {
  font-family: "DM Sans", sans-serif !important;
  font-size: 12px !important;
  color: #d32f2f !important;
}

/* Toggle Sections */
.toggle-section {
  display: flex !important;
  align-items: center !important;
  gap: 0px !important;
  margin-bottom: 8px !important;
}

.toggle-section.disabled {
  opacity: 0.5 !important;
}

.toggle-label {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 400 !important;
  font-size: 12px !important;
  color: #1a73e9 !important;
  line-height: 24px !important;
}

.disabled-label {
  color: rgba(0, 0, 0, 0.5) !important;
}

/* ::v-deep(.required-switch .v-input--switch__thumb),
::v-deep(.document-switch .v-input--switch__thumb),
::v-deep(.mandatory-switch .v-input--switch__thumb),
::v-deep(.connection-switch .v-input--switch__thumb) {
  color: white !important;
}

::v-deep(.required-switch .v-input--switch__track),
::v-deep(.document-switch .v-input--switch__track),
::v-deep(.mandatory-switch .v-input--switch__track),
::v-deep(.connection-switch .v-input--switch__track) {
  color: #1a73e9 !important;
} */

/* Answers Section */
.answers-header {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  margin-bottom: 6px !important;
}

.add-options-btn {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  color: #1a73e9 !important;
  line-height: 24px !important;
  cursor: pointer !important;
  text-decoration: underline !important;
}

.answers-grid {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 16px !important;
}

.answers-single {
  display: block !important;
  width: 50% !important;
}

/* Answer option with close icon */
.answer-option {
  position: relative !important;
}

.answer-option.has-close-icon {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.answer-option.has-close-icon .option-input {
  flex: 1 !important;
}

.remove-option-btn {
  width: 24px !important;
  height: 24px !important;
  flex-shrink: 0 !important;
}

.remove-option-btn:hover {
  background-color: #ffebee !important;
}

.remove-option-btn .v-icon {
  transition: color 0.2s ease !important;
}

.remove-option-btn:hover .v-icon {
  color: #f44336 !important;
}

.date-picker-container {
  width: 50% !important;
}

/* Document Section */
.document-section {
  display: flex !important;
  gap: 10px !important;
  margin-bottom: 12px !important;
  flex-wrap: wrap !important;
}

/* .document-fields {
  margin-bottom: 20px !important;
} */

.document-input-row {
  display: flex !important;
  align-items: center !important;
  /* gap: 2px !important; */
}

.add-inline-btn {
  margin-left: 8px !important;
  min-width: 40px !important;
  height: 32px !important;
  padding: 0 8px !important;
}

.add-doc-btn {
  width: 40px !important;
  height: 40px !important;
  border: 1px solid #1a73e9 !important;
  border-radius: 4px !important;
  background-color: #1a73e9 !important;
}

.add-doc-btn:hover {
  background-color: #1565c0 !important;
}

/* Document Answer List Styles */
.doc-answer-list-section {
  margin-top: 16px !important;
  margin-bottom: 20px !important;
}

.doc-answer-list {
  max-height: 200px !important;
  overflow-y: auto !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 4px !important;
  padding: 8px !important;
}

.doc-answer-item {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 8px 12px !important;
  margin-bottom: 8px !important;
  background-color: #f8f9fa !important;
  border: 1px solid #e9ecef !important;
  border-radius: 4px !important;
}

.doc-answer-item:last-child {
  margin-bottom: 0 !important;
}

.doc-answer-content {
  display: flex !important;
  align-items: center !important;
  flex: 1 !important;
}

.doc-answer-category {
  display: flex !important;
  align-items: center !important;
}

.doc-category-name {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  color: #1a73e9 !important;
}

.doc-answer-answer {
  display: flex !important;
  align-items: center !important;
}

.doc-answer-name {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  color: #4caf50 !important;
}

.delete-doc-btn {
  width: 28px !important;
  height: 28px !important;
}

.delete-doc-btn:hover {
  background-color: #ffebee !important;
}

/* Connection Section */
.connection-section {
  margin-bottom: 20px !important;
  border-top: 1px solid #e0e0e0 !important;
  padding-top: 20px !important;
}

.connection-dropdowns {
  margin-top: 20px !important;
}

/* Native Select Styling */
.native-select {
  width: 100% !important;
  height: 40px !important;
  padding: 8px 16px !important;
  border: 1px solid #9e9e9e !important;
  border-radius: 4px !important;
  background-color: white !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  color: #000000 !important;
  outline: none !important;
  cursor: pointer !important;
  transition: border-color 0.2s ease !important;
}

.native-select:hover {
  border-color: #9ca3af !important;
}

.native-select:focus {
  border-color: #1a73e9 !important;
  box-shadow: 0 0 0 1px #1a73e9 !important;
}

.native-select:disabled {
  background-color: #f3f4f6 !important;
  color: #9ca3af !important;
  cursor: not-allowed !important;
}

.native-select.error--text {
  border-color: #d32f2f !important;
}

.native-select option {
  padding: 8px !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  color: #000000 !important;
}

/* Placeholder color when no option selected - use light gray #D1D5DB */
.native-select.placeholder-selected {
  color: #d1d5db !important;
  /* For browsers that apply color on select */
}

/* For v-select placeholders (Vuetify structure) */
::v-deep(.parent-answer-select .v-select__slot .v-select__selections .v-select__placeholder),
::v-deep(.parent-question-select.placeholder-selected .v-select__slot .v-select__selections .v-select__placeholder) {
  color: #d1d5db !important;
}

/* Clear button styling next to native select */
.clear-select-btn {
  margin-left: 8px !important;
  color: rgba(0, 0, 0, 0.6) !important;
}

.clear-select-btn:hover {
  color: rgba(0, 0, 0, 0.85) !important;
}

/* Ensure selected option text doesn't wrap and shows ellipsis */
.native-select,
::v-deep(.parent-answer-select .v-select__selection) {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

/* Position the clear button inside the select area for native select */
.select-with-clear {
  position: relative;
  width: 100%;
}

.select-with-clear .native-select {
  width: 100%;
  -webkit-appearance: none;
  /* remove default caret for consistent look */
  appearance: none;
  padding-right: 32px !important;
  /* space for clear icon */
}

.select-with-clear .clear-select-btn {
  position: absolute !important;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent !important;
  box-shadow: none !important;
}

/* For Vuetify v-select clear icon positioning (when clearable) */
::v-deep(.parent-answer-select .v-input__append-inner .v-icon) {
  cursor: pointer;
}

.connection-row {
  display: grid !important;
  /* grid-template-columns: 1fr 1fr !important; */
  gap: 16px !important;
}

.connection-field {
  margin-bottom: 0 !important;
}

.parent-question-select .v-menu__content {
  max-width: 200px;
  /* Or any desired fixed width */
  width: 100%;
  /* To ensure it takes up the full max-width */
}

/* Ensure v-selects match native select styling */
::v-deep(.parent-answer-select .v-input__control),
::v-deep(.parent-question-select .v-input__control) {
  min-height: 40px !important;
  height: 40px !important;
}

::v-deep(.parent-answer-select .v-select__selections),
::v-deep(.parent-answer-select .v-select__selection),
::v-deep(.parent-question-select .v-select__selection) {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  color: #000000 !important;
  line-height: 24px !important;
  padding: 8px 12px !important;
  /* match native option padding for visual parity */
}

/* Disabled state */
::v-deep(.parent-answer-select[disabled] .v-input__control),
::v-deep(.parent-question-select[disabled] .v-input__control),
::v-deep(.parent-answer-select .v-input--is-disabled .v-input__control) {
  background-color: #f3f4f6 !important;
  color: #9ca3af !important;
}

/* Error state border color — reuse existing error color */
::v-deep(.parent-answer-select.error--text .v-input__control .v-input__slot),
::v-deep(.parent-question-select.error--text .v-input__control .v-input__slot) {
  border-color: #d32f2f !important;
}

/* Placeholder color parity (Vuetify uses opacity, ensure visually similar) */
::v-deep(.parent-answer-select .v-select__slot .v-select__selections .v-select__placeholder),
::v-deep(.parent-question-select .v-select__slot .v-select__selections .v-select__placeholder) {
  color: rgba(0, 0, 0, 0.6) !important;
  font-size: 14px !important;
}

/* Footer */
.modal-footer {
  padding: 24px !important;
  border-top: 1px solid #e0e0e0 !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  background-color: white !important;
  /* Keep footer fixed at bottom of modal */
  flex: none !important;
}

.cancel-btn {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 400 !important;
  font-size: 14px !important;
  color: black !important;
  line-height: normal !important;
  cursor: pointer !important;
}

.action-buttons {
  display: flex !important;
  gap: 10px !important;
}

.save-add-btn {
  width: 145px !important;
  height: 36px !important;
  border-radius: 4px !important;
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

.save-btn {
  width: 95px !important;
  height: 36px !important;
  border-radius: 4px !important;
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

::v-deep(.save-add-btn .v-btn__content),
::v-deep(.save-btn .v-btn__content) {
  line-height: normal !important;
}

/* Validation Messages */
.validation-message {
  font-family: "DM Sans", sans-serif !important;
  font-size: 12px !important;
  color: #d32f2f !important;
  margin-top: 4px !important;
  margin-left: 12px !important;
  font-weight: 400 !important;
}

/* Error state for input fields */
.error--text .v-input__control .v-input__slot {
  border-color: #d32f2f !important;
}

.error--text .v-select__selection--comma {
  color: #d32f2f !important;
}

/* Global tooltip text wrapping styles - unscoped */
.v-tooltip__content {
  max-width: 300px !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;
  line-height: 1.4 !important;
  text-align: left !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 12px !important;
}

.v-overlay__content .v-tooltip__content {
  max-width: 300px !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
}

/* Vuetify 3.x compatibility */
.v-overlay .v-overlay-container .v-tooltip .v-overlay__content {
  max-width: 300px !important;
}

.v-tooltip .v-overlay__content {
  max-width: 300px !important;
}

/* Specific menu positioning/sizing for the v-menu content when using these classes */
.add-question-modal ::v-deep(.v-menu__content.theme--light.v-menu__content--fixed.menuable__content__active) {
  /* Keep a reasonable max height and z-index, but let Vuetify compute top/left
     and make the width follow the trigger input by using min-width:100% */
  max-height: 304px !important;
  width: auto !important;
  min-width: 100% !important;
  top: auto !important;
  left: auto !important;
  transform-origin: left top !important;
  z-index: 10002 !important;
}

.parent-question-select {
  width: 100%;
  /* or a fixed width like 300px */
}

/* Wrap text inside dropdown items and selection */
.wrapped-text {
  white-space: normal !important;
  overflow-wrap: break-word;
  word-break: break-word;
  line-height: 1.2em;
  max-width: 100%;
}

/* Ensure the dropdown menu matches the textfield width */
.v-menu__content {
  width: auto !important;
  min-width: 100% !important;
}
</style>