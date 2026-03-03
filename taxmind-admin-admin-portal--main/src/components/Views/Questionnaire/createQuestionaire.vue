<template>
  <div style="background-color: #f1f7ff">
    <!-- Error handling -->
    <ServerError v-if="ServerError" />

    <!-- Loading overlay -->
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="primary" size="60" is-full-screen />

    <!-- Snackbar notifications -->
    <v-snackbar v-model="showSnackBar" color="primary" right :timeout="timeout">
      <v-layout wrap justify-center>
        <v-flex text-left class="align-self-center">
          <span style="color: white">{{ msg }}</span>
        </v-flex>
        <v-flex text-right>
          <v-btn small :ripple="false" text @click="showSnackBar = false">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-flex>
      </v-layout>
    </v-snackbar>

    <!-- Main Content -->
    <v-layout wrap justify-center>
      <v-flex pt-5 xs11 sm11 md11 lg11 xl9 style="z-index: 1">
        <!-- Create Questionnaire Header Component -->
        <CreateQuestionnaireHeader :LABELS="LABELS" :mode="effectiveMode" :isPublished="isPublished"
          @addCategory="handleAddCategory" @preview="handlePreview" @publish="handlePublish" @back="handleBack" />

        <!-- Test Add Question Button -->
        <!-- <v-btn color="primary" @click="testAddQuestion" style="margin: 10px">
          Test Add Question Modal
        </v-btn> -->

        <!-- Main Content Area -->
        <v-card elevation="0" class="pa-4">
          <!-- Empty State when no categories -->
          <EmptyStateCategories v-if="categories.length === 0 && !appLoading" @addCategory="handleAddCategory" />

          <!-- Category Expansion Panels -->
          <CategoryExpansionPanel v-else :categories="categories" :LABELS="LABELS" :questionnaire-id="questionnaireId"
            :mode="effectiveMode" @addQuestion="handleAddQuestion" @editCategory="handleEditCategory"
            @removeCategory="handleRemoveCategory" @categoryDeleted="handleCategoryDeleted"
            @editQuestion="handleEditQuestion" @removeQuestion="handleRemoveQuestion"
            @questionSaved="handleQuestionSaved" @questionDeleted="handleQuestionDeleted" @error="handleError" />
        </v-card>
      </v-flex>
    </v-layout>

    <!-- Add Category Modal (create mode only) -->
    <AddCategoryModal v-if="effectiveMode !== 'view'" :showModal="showAddCategoryModal" :LABELS="LABELS"
      :questionnaireId="questionnaireId" :mode="categoryModalMode" :categoryData="editingCategoryData"
      @close="handleCloseAddCategoryModal" @categorySaved="handleCategorySaved"
      @categoryUpdated="handleCategoryUpdated" />

    <!-- Test Add Question Modal (create mode only) -->
    <AddQuestionModal v-if="effectiveMode !== 'view'" v-model="showTestAddQuestionModal"
      selected-category="Test Category" @questionSaved="handleTestQuestionSaved" />

    <!-- Preview Questionnaire Dialog -->
    <PreviewQuestionnaireDialog v-model="showPreviewDialog" :categories="categories" :questionnaireId="questionnaireId"
      :isPublished="isPublished" @published="
        (payload) => {
          showPreviewDialog = false;
          msg = payload?.message || 'Published successfully';
          showSnackBar = true;
        }
      " />

    <!-- Publish Confirmation Popup -->
    <PublishConfirmationPopup :visible="showPublishConfirm" @cancel="showPublishConfirm = false"
      @confirm="confirmPublish" :title="LABELS.PUBLISH_CONFIRM_TITLE" :description="LABELS.PUBLISH_CONFIRM_DESC"
      :cancelLabel="LABELS.CANCEL" :proceedLabel="LABELS.PROCEED" />
  </div>
</template>

<script>
import { QUESTIONNAIRE_LABELS } from "../../../common/constants/questionnaireLabels";
import CreateQuestionnaireHeader from "./components/CreateQuestionnaireHeader.vue";
import CategoryExpansionPanel from "./components/CategoryExpansionPanel.vue";
import AddCategoryModal from "./components/AddCategoryModal.vue";
import AddQuestionModal from "./components/AddQuestionModal.vue";
import PreviewQuestionnaireDialog from "./components/PreviewQuestionnaireDialog.vue";
import PublishConfirmationPopup from "./components/PublishConfirmationPopup.vue";
import EmptyStateCategories from "./components/EmptyStateCategories.vue";
import ServerError from "../../Common/500.vue";
import { questionnaire as questionnaireApi } from "@/api";

export default {
  name: "CreateQuestionaire",
  components: {
    CreateQuestionnaireHeader,
    CategoryExpansionPanel,
    PublishConfirmationPopup,
    AddCategoryModal,
    AddQuestionModal,
    PreviewQuestionnaireDialog,
    EmptyStateCategories,
    ServerError,
  },
  props: {
    mode: {
      type: String,
      default: "create",
      validator: (value) => ["create", "view", "edit"].includes(value),
    },
  },
  computed: {
    // Reactive mode that considers both prop and query parameter
    effectiveMode() {
      return this.$route.query.mode || this.mode || "create";
    },
  },
  data() {
    return {
      LABELS: QUESTIONNAIRE_LABELS,
      appLoading: false,
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      ServerError: false,
      showAddCategoryModal: false,
      categoryModalMode: "add", // 'add' or 'edit'
      editingCategoryData: null,
      showTestAddQuestionModal: false,
      showPreviewDialog: false,
      showPublishConfirm: false,
      categories: [],
      questionnaireId: null,
      isPublished: false,
    };
  },
  mounted() {
    this.initializePage();
  },
  watch: {
    // Watch for route changes to reload categories
    $route(to, from) {
      // If the route parameters have changed, reinitialize the page
      if (to.params.id !== from.params.id || to.path !== from.path) {
        console.log("🔄 Route changed, reinitializing page");
        this.initializePage();
      }
    },
  },
  methods: {
    initializePage() {
      // Get route parameters passed from questionnaire creation modal or edit flow
      const {
        financialYear,
        import: importQuestionnaire,
        importFrom,
        mode: queryMode,
        status,
        taxYear,
        returnStatus,
      } = this.$route.query;
      const { id, year } = this.$route.params;

      console.log("🎯 Create Questionnaire Page Initialized");
      console.log("📊 Route Parameters:", { id, year });
      console.log("📋 Query Parameters:", {
        financialYear,
        importQuestionnaire,
        importFrom,
        mode: queryMode,
        status,
        taxYear,
        returnStatus,
      });
      console.log("🔧 Current component mode prop:", this.mode);

      // Set the mode from query if not set via prop
      if (queryMode && !this.mode) {
        console.log("📝 Setting mode from query parameter:", queryMode);
      }

      // Set questionnaireId from route params
      if (id) {
        this.questionnaireId = id;
        console.log("📋 Questionnaire ID set:", this.questionnaireId);
      }

      // Handle view mode - load existing data for viewing only
      if (this.effectiveMode === "view") {
        console.log("👁️ View mode detected");
        // Set the title for view mode
        if (taxYear || year) {
          this.LABELS = {
            ...this.LABELS,
            CREATE_QUESTIONNAIRE_TITLE: `View Questionnaire - ${taxYear || year
              }`,
          };
        } else {
          this.LABELS = {
            ...this.LABELS,
            CREATE_QUESTIONNAIRE_TITLE: `View Questionnaire`,
          };
        }
        // Load the questionnaire data for viewing
        this.loadCategories();
        return; // Exit early, no need to continue with create/edit flow
      }

      // Handle edit mode - determine if we need to import or load existing data
      if (this.effectiveMode === "edit") {
        console.log("✏️ Edit mode detected, status:", status);

        if (status === "published") {
          console.log(
            "📝 Editing published questionnaire - triggering import flow"
          );
          this.handleEditPublishedQuestionnaire(taxYear || year);
          return; // Exit early, import flow will handle the rest
        } else if (status === "draft") {
          console.log("📝 Editing draft questionnaire - loading existing data");
          // For draft questionnaires, we'll load the data in loadCategories
          // Set the title based on tax year if available
          if (taxYear || year) {
            this.LABELS = {
              ...this.LABELS,
              CREATE_QUESTIONNAIRE_TITLE: `Edit Questionnaire - ${taxYear || year
                }`,
            };
          }
          // Load the draft questionnaire data
          this.loadCategories();
          return; // Exit early, no need to continue with create flow
        }
      }

      // Set page title for create mode using the available year
      if (this.effectiveMode === "create") {
        const createYear = financialYear || taxYear || year;
        if (createYear) {
          // User requested format: 'Create questionnaire for year {year}'
          this.LABELS = {
            ...this.LABELS,
            CREATE_QUESTIONNAIRE_TITLE: `Create questionnaire for year ${createYear}`,
          };
        } else {
          this.LABELS = {
            ...this.LABELS,
            CREATE_QUESTIONNAIRE_TITLE: `Create questionnaire`,
          };
        }
      }

      // Set import subtitle based on route information - only when actually importing
      let importYear = null;

      // Only set importYear if we have valid, non-empty import information
      if (importFrom && importFrom !== "" && importFrom !== "undefined") {
        importYear = importFrom;
      } else if (year && year !== "" && year !== "undefined") {
        importYear = year;
      }

      // Only set IMPORTED_FROM if we're importing AND have a valid import year
      // But exclude it for edit/view modes when status is published or imported_for_edit
      const shouldShowImported =
        importYear &&
        importQuestionnaire === "true" &&
        !(
          (this.effectiveMode === "edit" || this.effectiveMode === "view") &&
          (status === "published" || status === "imported_for_edit")
        );

      if (shouldShowImported) {
        this.LABELS = {
          ...this.LABELS,
          IMPORTED_FROM: `Imported from - ${importYear}`,
        };
        console.log(`📥 Set IMPORTED_FROM: Imported from - ${importYear}`);
      } else {
        // Ensure IMPORTED_FROM is empty when not importing or when edit/view mode with published/imported_for_edit status
        this.LABELS = {
          ...this.LABELS,
          IMPORTED_FROM: "",
        };
        console.log(`🚫 No import - IMPORTED_FROM cleared`);
      }

      // Check if we have imported categories from the modal
      // This would be passed through sessionStorage
      const importedData = JSON.parse(
        sessionStorage.getItem("importedCategories") || "null"
      );

      if (importedData && Array.isArray(importedData)) {
        console.log("📥 Using imported categories:", importedData.length);
        console.log(
          "📂 Imported category names:",
          importedData.map((cat) => cat.name).join(", ")
        );
        this.categories = importedData;
        // Clear the temporary storage
        sessionStorage.removeItem("importedCategories");
      } else {
        // Load categories for this questionnaire from API
        this.loadCategories();
      }
    },

    async handleEditPublishedQuestionnaire(taxYear) {
      console.log("🔄 Starting import flow for published questionnaire edit");
      this.appLoading = true;

      try {
        // Import the published questionnaire to create a new draft for editing
        const { success, data, message } =
          await questionnaireApi.importQuestionnaire({
            importFromTaxYear: taxYear,
            taxYear: taxYear, // Use the same tax year for the new draft
          });

        if (success && data && data.id) {
          console.log(
            "✅ Published questionnaire imported for editing:",
            data.id
          );

          // Update the questionnaire ID to the new imported one
          this.questionnaireId = data.id;

          // Update the URL to reflect the new questionnaire ID
          this.$router.replace({
            name: "createQuestionaire",
            params: { id: data.id },
            query: {
              mode: "edit",
              status: "imported_for_edit",
              taxYear: taxYear,
              importFrom: taxYear,
            },
          });

          // Set the imported categories if available
          const importedCategories = data.questionCategories || [];
          if (importedCategories.length > 0) {
            this.categories = importedCategories;
            console.log(
              "📥 Loaded imported categories:",
              importedCategories.length
            );
          }

          // Set the page title (no import info for published questionnaires in edit mode)
          this.LABELS = {
            ...this.LABELS,
            CREATE_QUESTIONNAIRE_TITLE: `Edit Questionnaire - ${taxYear}`,
            IMPORTED_FROM: "", // Don't show imported from for published questionnaires
          };

          // this.msg = "Published questionnaire imported for editing";
          // this.showSnackBar = true;
        } else {
          console.error(
            "❌ Failed to import published questionnaire:",
            message
          );
          this.msg = message || "Failed to import questionnaire for editing";
          this.showSnackBar = true;
          // Fallback to loading the original questionnaire data
          this.loadCategories();
        }
      } catch (error) {
        console.error("❌ Error importing published questionnaire:", error);
        this.msg = "Error importing questionnaire for editing";
        this.showSnackBar = true;
        // Fallback to loading the original questionnaire data
        this.loadCategories();
      } finally {
        this.appLoading = false;
      }
    },

    handleBack() {
      console.log("🔙 Back button clicked");

      // Check if we have a returnStatus in the route query parameters
      const returnStatus = this.$route.query.returnStatus;

      if (
        returnStatus &&
        ["published", "draft"].includes(returnStatus.toLowerCase())
      ) {
        console.log("📋 Navigating back with preserved status:", returnStatus);
        this.$router.push({
          name: "questionnaire",
          query: { status: returnStatus.toLowerCase() },
        });
      } else {
        // Fallback to default navigation
        console.log("📋 Navigating back to questionnaire listing (default)");
        this.$router.push({ name: "questionnaire" });
      }
    },

    handleAddCategory() {
      console.log("➕ Add Category clicked");
      // Ensure modal opens in add mode and any previous edit data is cleared
      this.categoryModalMode = "add";
      this.editingCategoryData = null;
      this.showAddCategoryModal = true;
    },

    handleImportCategories() {
      console.log("📥 Import Categories clicked");
      // TODO: Implement import categories functionality
      // This could open a file picker or import dialog
      this.$toast.info("Import Categories functionality coming soon!");
    },

    handleCloseAddCategoryModal() {
      console.log("❌ Add Category Modal closed");
      // Clear modal state on close to avoid stale edit data
      this.showAddCategoryModal = false;
      this.categoryModalMode = "add";
      this.editingCategoryData = null;
    },

    async handleCategorySaved(payload) {
      // AddCategoryModal performs the API call and emits the result.
      // This handler should only react to the event by reloading data and
      // showing a message to avoid duplicate POSTs.
      console.log("✅ Category saved (handled by modal):", payload);
      const message = payload?.data?.message || "Category created";
      if (this.$snackbar && this.$snackbar.showApiResult) {
        this.$snackbar.showApiResult(payload);
      } else if (this.$snackbar && this.$snackbar.showSuccess) {
        this.$snackbar.showSuccess(message);
      } else {
        this.msg = message;
        this.showSnackBar = true;
      }

      // If the modal signalled stayOpen=true (Save & add new), keep it open and just clear fields;
      // otherwise close it.
      if (!payload || payload.stayOpen !== true) {
        this.showAddCategoryModal = false;
      }

      await this.loadCategories();
    },

    handleAddQuestion(category) {
      console.log("➕ Add question for category:", category.name);
      // TODO: Open Add Question modal/form
      this.msg = `Add question functionality for ${category.name} will be implemented here`;
      this.showSnackBar = true;
    },

    testAddQuestion() {
      console.log("🧪 Test Add Question clicked");
      this.showTestAddQuestionModal = true;
    },

    handleTestQuestionSaved(questionData) {
      console.log("✅ Test Question saved:", questionData);
      this.msg = "Test question saved successfully!";
      this.showSnackBar = true;
    },

    handleCategoryUpdated(updatedData) {
      console.log("✅ Category updated:", updatedData);
      this.msg = `Category "${updatedData.name}" updated successfully`;
      this.showSnackBar = true;

      // Refresh categories to show the updated data
      this.loadCategories();
    },

    handleQuestionSaved(questionData) {
      console.log("✅ Question saved successfully:", questionData);
      this.msg = "Question saved successfully!";
      this.showSnackBar = true;
      // Refresh categories to show the new question
      this.loadCategories();
    },

    handleEditCategory(category) {
      console.log("✏️ Edit category:", category.name);

      // Set modal to edit mode
      this.categoryModalMode = "edit";
      this.editingCategoryData = { ...category }; // Create a copy to avoid mutations

      // Open the modal
      this.showAddCategoryModal = true;

      console.log("🔧 Edit category modal opened:", {
        mode: this.categoryModalMode,
        data: this.editingCategoryData,
      });
    },

    handleRemoveCategory(category) {
      console.log("🗑️ Remove category (legacy handler):", category.name);
      // This method is kept for compatibility but the actual removal
      // is now handled by the RemoveCategoryModal through handleCategoryDeleted
    },

    handleCategoryDeleted(deletedCategory) {
      console.log("✅ Category deleted successfully:", deletedCategory.id);
      this.msg = `Category "${deletedCategory.name}" deleted successfully`;
      this.showSnackBar = true;

      // Refresh categories to reflect the deletion
      this.loadCategories();
    },

    handleEditQuestion(question) {
      console.log("✏️ Edit question:", question.text);
      // TODO: Open Edit Question modal
      this.msg = `Edit question functionality will be implemented here`;
      this.showSnackBar = true;
    },

    handleRemoveQuestion(question) {
      console.log("🗑️ Remove question:", question.text);
      // TODO: Show confirmation dialog and remove question
      const confirmed = confirm(
        `Are you sure you want to remove this question?`
      );
      if (confirmed) {
        // Find and remove question from categories
        this.categories.forEach((category) => {
          category.questions = category.questions.filter(
            (q) => q.id !== question.id
          );
        });
        this.msg = `Question has been removed`;
        this.showSnackBar = true;
      }
    },

    handleQuestionDeleted(deletedQuestion) {
      console.log("✅ Question deleted successfully:", deletedQuestion.id);
      this.msg = "Question deleted successfully!";
      this.showSnackBar = true;
      // Refresh categories to reflect the deletion
      this.loadCategories();
    },

    handleError(errorMessage) {
      console.error("❌ Error occurred:", errorMessage);
      this.msg = errorMessage || "An error occurred";
      this.showSnackBar = true;
    },

    async loadCategories() {
      console.log("🔄 Loading categories from API...");
      this.appLoading = true;

      try {
        let result;

        if (this.questionnaireId) {
          console.log(
            "� Loading categories for questionnaire:",
            this.questionnaireId
          );
          result = await questionnaireApi.listCategories(this.questionnaireId);
        } else {
          console.log("🌍 Loading all global categories");
          result = await questionnaireApi.listAllCategories();
        }

        const { success, data, questionnaire, message } = result;

        if (success) {
          this.categories = data || [];
          // Set published flag based on questionnaire status if available
          this.isPublished = !!(
            questionnaire && questionnaire.status === "published"
          );
          console.log(
            "✅ Categories loaded successfully:",
            this.categories.length,
            "categories"
          );

          // Handle mode-specific title updates
          if (this.effectiveMode === "edit") {
            const editStatus = this.$route.query.status;
            if (
              editStatus === "draft" &&
              questionnaire &&
              questionnaire.taxYear
            ) {
              this.LABELS = {
                ...this.LABELS,
                CREATE_QUESTIONNAIRE_TITLE: `Edit Questionnaire - ${questionnaire.taxYear}`,
              };
              console.log("✏️ Updated title for draft edit mode");
            }
          } else if (this.effectiveMode === "view") {
            // Handle view mode title updates
            if (questionnaire && questionnaire.taxYear) {
              this.LABELS = {
                ...this.LABELS,
                CREATE_QUESTIONNAIRE_TITLE: `View Questionnaire - ${questionnaire.taxYear}`,
              };
              console.log("👁️ Updated title for view mode");
            }
          }

          // Ensure create-mode header uses the requested phrasing and avoid
          // overriding it with the questionnaire.title from the API which may
          // contain 'Tax Return Questionnaire for ...'. Use the taxYear when
          // available.
          if (
            this.effectiveMode === "create" &&
            questionnaire &&
            questionnaire.taxYear
          ) {
            this.LABELS = {
              ...this.LABELS,
              CREATE_QUESTIONNAIRE_TITLE: `Create questionnaire for year ${questionnaire.taxYear}`,
            };
            console.log(
              "✅ Set create-mode title to:",
              this.LABELS.CREATE_QUESTIONNAIRE_TITLE
            );
          }

          // Set IMPORTED_FROM if questionnaire was imported (check for importedFromTaxYear or similar)
          // But exclude it for edit/view modes when status is published or imported_for_edit
          const status = this.$route.query.status;
          const shouldShowImportedFromData =
            questionnaire &&
            questionnaire.importedFromTaxYear &&
            questionnaire.importedFromTaxYear !== "" &&
            !(
              (this.effectiveMode === "edit" ||
                this.effectiveMode === "view") &&
              (status === "published" || status === "imported_for_edit")
            );

          if (shouldShowImportedFromData) {
            this.LABELS = {
              ...this.LABELS,
              IMPORTED_FROM: `Imported from - ${questionnaire.importedFromTaxYear}`,
            };
            console.log(
              "✅ Updated IMPORTED_FROM from questionnaire data:",
              this.LABELS.IMPORTED_FROM
            );
          } else {
            // Ensure IMPORTED_FROM is cleared if no import data or edit/view mode with published/imported_for_edit status
            this.LABELS = {
              ...this.LABELS,
              IMPORTED_FROM: "",
            };
            console.log(
              "🚫 No import data in questionnaire or edit/view published/imported_for_edit mode - IMPORTED_FROM cleared"
            );
          }

          if (this.questionnaireId) {
            console.log(
              "ℹ️ Categories for questionnaire",
              this.questionnaireId
            );
          } else {
            console.log("ℹ️ Global categories loaded");
          }
        } else {
          console.error("❌ Failed to load categories:", message);
          this.msg = message || "Failed to load categories";
          this.showSnackBar = true;
        }
      } catch (error) {
        console.error("❌ Error loading categories:", error);
        this.msg = "Error loading categories";
        this.showSnackBar = true;
      } finally {
        this.appLoading = false;
      }
    },

    handlePreview() {
      console.log("👁️ Preview clicked");
      this.showPreviewDialog = true;
    },

    async handlePublish() {
      // Show confirmation popup first
      this.showPublishConfirm = true;
    },

    async confirmPublish() {
      // user confirmed, perform publish
      this.showPublishConfirm = false;
      if (!this.questionnaireId) {
        console.error("❌ No questionnaire ID available for publishing");
        this.msg = "Cannot publish: No questionnaire ID found";
        this.showSnackBar = true;
        return;
      }

      try {
        this.appLoading = true;
        console.log("🔄 Publishing questionnaire:", this.questionnaireId);

        const { success, message } =
          await questionnaireApi.publishQuestionnaire(this.questionnaireId);

        if (success) {
          console.log("✅ Questionnaire published successfully");
          // Prefer API message when provided, otherwise fall back to default
          this.msg = message || "Questionnaire published successfully!";
          this.showSnackBar = true;

          setTimeout(() => {
            const returnStatus = this.$route.query.returnStatus || "published";
            this.$router.push({
              name: "questionnaire",
              query: { status: returnStatus.toLowerCase() },
            });
          }, 1500);
        } else {
          console.error("❌ Failed to publish questionnaire:", message);
          this.msg = message || "Failed to publish questionnaire";
          this.showSnackBar = true;
        }
      } catch (error) {
        console.error("❌ Error publishing questionnaire:", error);
        this.msg = error.message || "Error publishing questionnaire";
        this.showSnackBar = true;
      } finally {
        this.appLoading = false;
      }
    },
  },
};
</script>

<style scoped>
/* Import common questionnaire styles */
@import "../../../common/styles/questionnaire.css";

/* Page specific styles */
.content-area {
  min-height: 400px;
  background: white;
  border-radius: 8px;
  padding: 24px;
}

.Head1 {
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  line-height: 24px;
}

.text1 {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #5f5f5f;
  line-height: 20px;
}
</style>
