<template>
  <v-layout column class="category-expansion-panel">
    <v-expansion-panels v-model="expansionModel" multiple flat>
      <v-expansion-panel
        v-for="category in categories"
        :key="category.id"
        class="custom-expansion-panel"
      >
        <v-expansion-panel-header class="custom-expansion-header">
          <!-- Header Layout using Vuetify Grid -->
          <v-layout wrap justify-space-between align-center>
            <!-- Left side: Collapse icon and category name -->
            <v-flex d-flex align-center>
              <v-icon
                size="20"
                color="#5F5F5F"
                class="collapse-icon mr-3"
                :class="{ expanded: isExpanded(category.id) }"
              >
                mdi-chevron-down
              </v-icon>
              <span class="category-title">{{ category.name }}</span>
            </v-flex>

            <!-- Right side: Actions (create/edit mode only) -->
            <v-flex v-if="mode !== 'view'" shrink @click.stop>
              <v-layout align-center>
                <!-- Three dots menu -->
                <v-menu offset-y>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      icon
                      small
                      class="mr-2"
                      v-bind="attrs"
                      v-on="on"
                      color="#F5F5F5"
                      elevation="0"
                    >
                      <v-icon size="16" color="#5F5F5F"
                        >mdi-dots-vertical</v-icon
                      >
                    </v-btn>
                  </template>
                  <v-list dense>
                    <v-list-item @click="handleEditCategory(category)">
                      <v-list-item-title>Edit</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="handleRemoveCategory(category)">
                      <v-list-item-title class="error--text"
                        >Remove</v-list-item-title
                      >
                    </v-list-item>
                  </v-list>
                </v-menu>

                <!-- Add Question Button (create/edit mode only) -->
                <ghost-button
                  v-if="mode !== 'view'"
                  :text="LABELS.ADD_QUESTION"
                  :onClick="() => handleAddQuestion(category)"
                  icon="mdi-plus"
                  size="medium"
                  class="add-category-btn"
                />
              </v-layout>
            </v-flex>
          </v-layout>
        </v-expansion-panel-header>

        <v-expansion-panel-content>
          <!-- Loading State -->
          <v-layout
            v-if="loadingCategories.includes(category.id)"
            justify-center
            align-center
            column
            class="py-6"
          >
            <v-flex>
              <v-progress-circular
                indeterminate
                color="#1A73E9"
                size="32"
              ></v-progress-circular>
            </v-flex>
            <v-flex class="mt-2">
              <span class="text1 grey--text text--darken-1">
                Loading questions...
              </span>
            </v-flex>
          </v-layout>

          <!-- Questions List using Vuetify Grid -->
          <v-layout
            column
            v-else-if="
              categoryQuestions[category.id] &&
              categoryQuestions[category.id].length > 0
            "
            :class="{
              'pb-2': index !== categoryQuestions[category.id].length - 1,
            }"
          >
            <v-flex
              xs12
              v-for="question in categoryQuestions[category.id]"
              :key="question.id"
              :class="{
                'pb-2': index !== categoryQuestions[category.id].length - 1,
              }"
            >
              <v-layout wrap justify-space-between>
                <v-flex xs9 align-self-center>
                  <span class="text5">{{ question.questionText }}</span>
                </v-flex>
                <v-flex v-if="mode !== 'view'" xs3 align-self-center>
                  <v-layout wrap justify-end>
                    <v-flex shrink align-self-center text-right>
                      <v-btn
                        text
                        color="#5F5F5F"
                        @click="handleEditQuestion(question)"
                        >Edit</v-btn
                      >
                    </v-flex>
                    <v-flex shrink align-self-center text-right>
                      <v-btn
                        text
                        color="red"
                        class="px-0"
                        @click="handleRemoveQuestion(question)"
                        >Remove</v-btn
                      >
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
              <v-layout wrap>
                <v-flex
                  xs12
                  v-for="(options, index) in question.options"
                  :key="options.order"
                  :class="{ 'pb-2': index !== question.options.length - 1 }"
                >
                  <v-card outlined flat class="pa-2">
                    <span class="buttonText" style="color: #5f5f5f">{{
                      options.label
                    }}</span></v-card
                  >
                </v-flex>
              </v-layout>
            </v-flex>
          </v-layout>

          <!-- Empty State using Vuetify Grid -->
          <v-layout v-else justify-center align-center column class="py-10">
            <v-flex>
              <span class="text1 grey--text text--darken-1">
                No questions added yet. Click "Add question" to get started.
              </span>
            </v-flex>
          </v-layout>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Add Question Modal -->
    <AddQuestionModal
      ref="addQuestionModal"
      v-model="showAddQuestionModal"
      :selected-category="selectedCategoryForQuestion"
      :questionnaire-id="questionnaireId"
      :mode="questionModalMode"
      :id="editingQuestionId"
      :edit-question-data="editingQuestionData"
      @questionSaved="handleQuestionSaved"
      @input="handleModalInput"
    />

    <!-- Remove Question Modal -->
    <RemoveQuestionModal
      v-model="showRemoveQuestionModal"
      :question="questionToRemove"
      @questionDeleted="handleQuestionDeleted"
      @error="handleRemoveError"
    />

    <!-- Remove Category Modal -->
    <RemoveCategoryModal
      v-model="showRemoveCategoryModal"
      :category="categoryToRemove"
      @categoryDeleted="handleCategoryDeleted"
      @error="handleRemoveCategoryError"
    />
  </v-layout>
</template>

<script>
import { questionnaire as questionnaireApi } from "@/api";
import GhostButton from "../../../utilities/GhostButton.vue";
import AddQuestionModal from "./AddQuestionModal.vue";
import RemoveQuestionModal from "./RemoveQuestionModal.vue";
import RemoveCategoryModal from "./RemoveCategoryModal.vue";

export default {
  name: "CategoryExpansionPanel",
  components: {
    AddQuestionModal,
    RemoveQuestionModal,
    RemoveCategoryModal,
    GhostButton,
  },
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
    mode: {
      type: String,
      default: "create",
      validator: (value) => ["create", "view", "edit"].includes(value),
    },
  },
  data() {
    return {
      expansionModel: [], // Tracks which panels are expanded
      showAddQuestionModal: false,
      selectedCategoryForQuestion: null,
      categoryQuestions: {}, // Store questions for each category by category.id
      loadingCategories: [], // Track which categories are currently loading
      questionModalMode: "add", // "add" or "edit"
      editingQuestionId: null,
      editingQuestionData: null,
      showRemoveQuestionModal: false,
      questionToRemove: null,
      showRemoveCategoryModal: false,
      categoryToRemove: null,
    };
  },
  computed: {
    // Debug computed to track category questions
    debugCategoryQuestions() {
      console.log("🔍 categoryQuestions computed:", this.categoryQuestions);
      return this.categoryQuestions;
    },
  },
  watch: {
    expansionModel: {
      handler(newExpansions, oldExpansions) {
        console.log("🔄 Expansion model changed:", {
          newExpansions,
          oldExpansions,
        });

        // Find newly expanded panels
        const newlyExpanded = newExpansions.filter(
          (index) => !oldExpansions.includes(index)
        );

        // Fetch questions for newly expanded categories
        newlyExpanded.forEach((index) => {
          if (this.categories[index]) {
            const category = this.categories[index];
            console.log(
              "📂 Category expanded:",
              category.name,
              "ID:",
              category.id
            );
            this.fetchCategoryQuestions(category.id);
          }
        });
      },
      immediate: false,
    },
  },
  methods: {
    async fetchCategoryQuestions(categoryId) {
      try {
        console.log("🔄 Fetching questions for category ID:", categoryId);

        // Skip if already loading or already have data
        if (
          this.loadingCategories.includes(categoryId) ||
          this.categoryQuestions[categoryId]
        ) {
          console.log("⏭️ Skipping fetch - already loading or data exists");
          return;
        }

        // Add to loading state
        this.loadingCategories.push(categoryId);

        // Call API
        const { success, data, message } = await questionnaireApi.listQuestions(
          categoryId
        );

        if (success && data) {
          // Store the response in categoryQuestions object
          this.$set(this.categoryQuestions, categoryId, data);
          console.log(
            "✅ Questions loaded for category",
            categoryId,
            ":",
            data
          );
          console.log("📊 Total categoryQuestions:", this.categoryQuestions);
        } else {
          console.error(
            "❌ Failed to load questions for category",
            categoryId,
            ":",
            message
          );
          // Store empty array to prevent repeated attempts
          this.$set(this.categoryQuestions, categoryId, []);
        }
      } catch (error) {
        console.error("❌ Error fetching category questions:", error);
        // Store empty array to prevent repeated attempts
        this.$set(this.categoryQuestions, categoryId, []);
      } finally {
        // Remove from loading state
        const loadingIndex = this.loadingCategories.indexOf(categoryId);
        if (loadingIndex > -1) {
          this.loadingCategories.splice(loadingIndex, 1);
        }
      }
    },

    isExpanded(categoryId) {
      return this.expansionModel.includes(
        this.categories.findIndex((c) => c.id === categoryId)
      );
    },

    handleAddQuestion(category) {
      console.log("➕ Add question for category:", category.name);
      console.log("Current showAddQuestionModal:", this.showAddQuestionModal);
      console.log("Category object:", category);

      // Set modal to add mode and clear edit data
      this.questionModalMode = "add";
      this.editingQuestionId = null;
      this.editingQuestionData = null;

      // Set the complete category information
      this.selectedCategoryForQuestion = category;

      // Force modal to open
      this.$nextTick(() => {
        this.showAddQuestionModal = true;
        console.log(
          "After setting showAddQuestionModal:",
          this.showAddQuestionModal
        );
      });
    },

    handleEditCategory(category) {
      console.log("✏️ Edit category:", category.name);
      this.$emit("editCategory", category);
    },

    handleRemoveCategory(category) {
      console.log("🗑️ Remove category triggered:", category.name);

      // Set the category to remove and open the confirmation modal
      this.categoryToRemove = category;
      this.showRemoveCategoryModal = true;

      console.log("🔧 Remove category modal opened for:", category.id);
    },

    handleEditQuestion(question) {
      console.log("✏️ Edit question clicked:", question);
      console.log("🔧 Current modal state BEFORE:", {
        showAddQuestionModal: this.showAddQuestionModal,
        questionModalMode: this.questionModalMode,
        editingQuestionId: this.editingQuestionId,
      });

      // First, ensure modal is closed
      this.showAddQuestionModal = false;

      // Set modal to edit mode
      this.questionModalMode = "edit";
      this.editingQuestionId = question.id;
      this.editingQuestionData = { ...question }; // Create a copy to avoid reference issues

      // Find and set the category for this question
      const questionCategory = this.categories.find((cat) => {
        return (
          this.categoryQuestions[cat.id] &&
          this.categoryQuestions[cat.id].some((q) => q.id === question.id)
        );
      });

      if (questionCategory) {
        this.selectedCategoryForQuestion = { ...questionCategory }; // Create a copy
        console.log("✅ Found question category:", questionCategory.name);
      } else {
        console.log("❌ Could not find category for question:", question.id);
        // Fallback: use the first category if available
        if (this.categories.length > 0) {
          this.selectedCategoryForQuestion = { ...this.categories[0] };
          console.log("🔄 Using fallback category:", this.categories[0].name);
        }
      }

      console.log("🔧 Props to be passed:", {
        mode: this.questionModalMode,
        id: this.editingQuestionId,
        editingQuestionData: this.editingQuestionData,
        selectedCategory: this.selectedCategoryForQuestion,
      });

      // Use double nextTick to ensure all reactive updates are processed
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.showAddQuestionModal = true;
          console.log("🔧 After opening edit modal:", {
            showAddQuestionModal: this.showAddQuestionModal,
            mode: this.questionModalMode,
            questionId: this.editingQuestionId,
            category: this.selectedCategoryForQuestion?.name,
          });

          // Force update modal props if reference exists
          if (this.$refs.addQuestionModal) {
            console.log("🔄 Found modal reference, forcing prop updates");
            this.$refs.addQuestionModal.$forceUpdate();
          }

          // Additional verification
          setTimeout(() => {
            console.log("🔍 Modal state after timeout:", {
              showAddQuestionModal: this.showAddQuestionModal,
              modalExists: !!this.$refs.addQuestionModal,
              modalDialog: this.$refs.addQuestionModal?.dialog,
            });

            // Try to manually set the dialog if it's not opening
            if (
              this.$refs.addQuestionModal &&
              !this.$refs.addQuestionModal.dialog
            ) {
              console.log("🚨 Manual modal open attempt");
              this.$refs.addQuestionModal.dialog = true;
            }
          }, 100);
        });
      });
    },

    handleRemoveQuestion(question) {
      console.log("🗑️ Remove question triggered:", question.questionText);

      // Set the question to remove and open the confirmation modal
      this.questionToRemove = question;
      this.showRemoveQuestionModal = true;

      console.log("🔧 Remove question modal opened for:", question.id);
    },

    handleQuestionDeleted(deletedQuestion) {
      console.log("✅ Question deleted successfully:", deletedQuestion.id);

      // Remove the question from local categoryQuestions data
      Object.keys(this.categoryQuestions).forEach((categoryId) => {
        if (this.categoryQuestions[categoryId]) {
          this.categoryQuestions[categoryId] = this.categoryQuestions[
            categoryId
          ].filter((q) => q.id !== deletedQuestion.id);
        }
      });

      // Emit to parent component
      this.$emit("questionDeleted", deletedQuestion);

      // Reset modal state
      this.questionToRemove = null;
    },

    handleRemoveError(errorMessage) {
      console.error("❌ Error removing question:", errorMessage);
      // Emit error to parent component
      this.$emit("error", errorMessage);

      // Reset modal state
      this.questionToRemove = null;
    },

    handleCategoryDeleted(deletedCategory) {
      console.log("✅ Category deleted successfully:", deletedCategory.id);

      // Emit to parent component
      this.$emit("categoryDeleted", deletedCategory);

      // Reset modal state
      this.categoryToRemove = null;
    },

    handleRemoveCategoryError(errorMessage) {
      console.error("❌ Error removing category:", errorMessage);
      // Emit error to parent component
      this.$emit("error", errorMessage);

      // Reset modal state
      this.categoryToRemove = null;
    },

    handleModalInput(value) {
      console.log("🔄 Modal input event received:", value);
      this.showAddQuestionModal = value;
    },

    // Debug method to test modal opening
    debugModalOpen() {
      console.log("🔍 DEBUG: Manual modal open test");
      console.log("Modal reference exists:", !!this.$refs.addQuestionModal);
      console.log("Current showAddQuestionModal:", this.showAddQuestionModal);

      this.showAddQuestionModal = true;
      this.$nextTick(() => {
        console.log(
          "After nextTick - showAddQuestionModal:",
          this.showAddQuestionModal
        );
        if (this.$refs.addQuestionModal) {
          console.log(
            "Modal dialog state:",
            this.$refs.addQuestionModal.dialog
          );
        }
      });
    },

    handleQuestionSaved(questionData) {
      console.log("💾 Question saved:", questionData);

      // Refresh the questions for the category that was updated
      if (
        this.selectedCategoryForQuestion &&
        this.selectedCategoryForQuestion.id
      ) {
        console.log(
          "🔄 Refreshing questions for category:",
          this.selectedCategoryForQuestion.id
        );
        // Clear existing data to force refresh
        this.$delete(
          this.categoryQuestions,
          this.selectedCategoryForQuestion.id
        );
        // Fetch updated questions
        this.fetchCategoryQuestions(this.selectedCategoryForQuestion.id);
      }

      this.$emit("questionSaved", questionData);
    },
  },
};
</script>

<style scoped>
/* Import common questionnaire styles */
@import "../../../../common/styles/questionnaire.css";

/* Component Root Spacing */
.category-expansion-panel {
  margin-top: 24px;
    min-height: 75vh;
  width: 100%;
}

/* Custom Expansion Panels - Minimal Custom Styling */
::v-deep(.custom-expansion-panel) {
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  margin-bottom: 12px;
  overflow: hidden;
}
::v-deep(.v-expansion-panel-content__wrap) {
  padding: 16px !important;
}

::v-deep(.v-expansion-panel--active .custom-expansion-header) {
  box-shadow: inset 0 -1px 0 #e6e6e6;
}

::v-deep(.custom-expansion-header) {
  border-bottom: none;
  box-shadow: none;
  border-radius: 4px;
  background: #fff;
  min-height: 40px;
  padding: 4px;
}

::v-deep(.custom-expansion-header .v-expansion-panel-header__icon) {
  display: none;
}

/* Icon Animation */
.collapse-icon {
  transition: transform 0.3s ease;
  margin-left: 4px;
}

.collapse-icon.expanded {
  transform: rotate(180deg);
}

/* Typography using predefined classes */
.category-title {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1a73e9;
  line-height: 24px;
}

.question-text {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  line-height: 24px;
}

/* Responsive Design */
@media (max-width: 768px) {
  ::v-deep(.custom-expansion-header) {
    padding: 0 16px;
    min-height: 60px;
  }
}

@media (max-width: 480px) {
  .category-title {
    font-size: 13px;
  }
}
</style>
