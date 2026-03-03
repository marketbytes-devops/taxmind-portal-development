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
        <CreateQuestionnaireHeader :LABELS="LABELS" @addCategory="handleAddCategory" @preview="handlePreview"
          @publish="handlePublish" @back="handleBack" />

        <!-- Main Content Area -->
        <v-card elevation="0" class="pa-4">
          <CategoryExpansionPanel :categories="categories" :LABELS="LABELS" @addQuestion="handleAddQuestion"
            @editCategory="handleEditCategory" @removeCategory="handleRemoveCategory" @editQuestion="handleEditQuestion"
            @removeQuestion="handleRemoveQuestion" />
        </v-card>
      </v-flex>
    </v-layout>

    <!-- Add Category Modal -->
    <AddCategoryModal :showModal="showAddCategoryModal" :LABELS="LABELS" @close="handleCloseAddCategoryModal"
      @categorySaved="handleCategorySaved" />

    <!-- Add Question Modal (dev-only trigger kept) -->
    <AddQuestionModal v-model="showTestAddQuestionModal" selected-category="Test Category"
      @questionSaved="handleTestQuestionSaved" />
  </div>
</template>

<script>
import { QUESTIONNAIRE_LABELS } from "../../../common/constants/questionnaireLabels";
import CreateQuestionnaireHeader from "./components/CreateQuestionnaireHeader.vue";
import CategoryExpansionPanel from "./components/CategoryExpansionPanel.vue";
import AddCategoryModal from "./components/AddCategoryModal.vue";
import AddQuestionModal from "./components/AddQuestionModal.vue";
import ServerError from "../../Common/500.vue";
import { questionnaire as questionnaireApi } from "@/api";

export default {
  name: "CreateQuestionaire",
  components: {
    CreateQuestionnaireHeader,
    CategoryExpansionPanel,
    AddCategoryModal,
    AddQuestionModal,
    ServerError,
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
      showTestAddQuestionModal: false,
      categories: [],
      questionnaireId: null,
      questionnaireStatus: "draft",
    };
  },
  mounted() {
    this.initializePage();
    this.loadCategories();
  },
  methods: {
    initializePage() {
      const { id } = this.$route.params;
      const {
        status,
        financialYear,
        import: importQuestionnaire,
        importFrom,
        returnStatus,
      } = this.$route.query;

      console.log("🎯 Edit Questionnaire Page Initialized");
      console.log("📊 Route Parameters:", { id });
      console.log("📋 Query Parameters:", {
        status,
        financialYear,
        importQuestionnaire,
        importFrom,
        returnStatus,
      });

      this.questionnaireId = id;
      if (status) this.questionnaireStatus = String(status).toLowerCase();

      // Titles from query params remain as implemented previously
      if (financialYear) {
        this.LABELS = {
          ...this.LABELS,
          CREATE_QUESTIONNAIRE_TITLE: `Create Questionnaire - ${financialYear}`,
        };
      }
      if (importQuestionnaire === "true" && importFrom) {
        this.LABELS = {
          ...this.LABELS,
          IMPORTED_FROM: `Imported from - ${importFrom}`,
        };
      }
    },

    handleBack() {
      console.log("🔙 Back button clicked in edit questionnaire");

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

    async loadCategories() {
      if (!this.questionnaireId) return;
      try {
        this.appLoading = true;
        const { success, data, message } =
          await questionnaireApi.listCategories(this.questionnaireId);
        if (!success) {
          this.msg = message || "Failed to load categories";
          this.showSnackBar = true;
          this.categories = [];
          return;
        }
        // Map API model to UI if needed
        this.categories = (data || []).map((c, idx) => ({
          id: c.id ?? c._id ?? `${idx}`,
          name: c.name ?? "Unnamed",
          description: c.description ?? "",
          sortOrder: c.sortOrder ?? c.sort_order ?? idx + 1,
          questions: c.questions || [],
        }));
      } catch (error) {
        console.error(error);
        this.msg =
          error?.response?.data?.message || "Failed to load categories";
        this.showSnackBar = true;
        this.ServerError = Boolean(error?.response?.status === 500);
      } finally {
        this.appLoading = false;
      }
    },

    // Add Category
    handleAddCategory() {
      if (this.questionnaireStatus === "published") {
        this.msg = "Published questionnaire cannot be modified";
        this.showSnackBar = true;
        return;
      }
      // Ensure modal opens in add mode and any previous edit data is cleared
      this.mode = this.mode || "edit"; // preserve page mode
      this.categoryModalMode = "add";
      this.editingCategoryData = null;
      this.showAddCategoryModal = true;
    },
    handleCloseAddCategoryModal() {
      this.showAddCategoryModal = false;
      this.categoryModalMode = "add";
      this.editingCategoryData = null;
    },
    async handleCategorySaved(payload) {
      // The AddCategoryModal now performs the API call and emits the result.
      // Here we simply react to the successful save by reloading categories
      // and showing a message.
      console.log("✅ Category saved (handled by modal):", payload);
      if (this.questionnaireStatus === "published") {
        this.msg = "Published questionnaire cannot be modified";
        this.showSnackBar = true;
        return;
      }
      if (!this.questionnaireId) {
        this.msg = "Questionnaire not found";
        this.showSnackBar = true;
        return;
      }

      const message = payload?.data?.message || "Category created";
      if (this.$snackbar && this.$snackbar.showApiResult) {
        this.$snackbar.showApiResult(payload);
      } else if (this.$snackbar && this.$snackbar.showSuccess) {
        this.$snackbar.showSuccess(message);
      } else {
        this.msg = message;
        this.showSnackBar = true;
      }

      if (!payload || payload.stayOpen !== true) {
        this.showAddCategoryModal = false;
      }
      await this.loadCategories();
    },

    // Edit Category
    async handleEditCategory(category) {
      if (this.questionnaireStatus === "published") {
        this.msg = "Published questionnaire cannot be modified";
        this.showSnackBar = true;
        return;
      }
      const newName = window.prompt("Edit category name", category.name);
      if (!newName || newName.trim() === category.name) return;
      try {
        this.appLoading = true;
        const { success, message } = await questionnaireApi.updateCategory(
          category.id,
          { name: newName.trim() }
        );
        if (!success) {
          this.msg = message || "Failed to update category";
          this.showSnackBar = true;
          return;
        }
        this.msg = message || "Category updated";
        this.showSnackBar = true;
        await this.loadCategories();
      } catch (error) {
        this.msg =
          error?.response?.data?.message || "Failed to update category";
        this.showSnackBar = true;
      } finally {
        this.appLoading = false;
      }
    },

    // Remove Category
    async handleRemoveCategory(category) {
      if (this.questionnaireStatus === "published") {
        this.msg = "Published questionnaire cannot be modified";
        this.showSnackBar = true;
        return;
      }
      const confirmed = window.confirm(
        `Are you sure you want to remove the category "${category.name}"?`
      );
      if (!confirmed) return;
      try {
        this.appLoading = true;
        const { success, message } = await questionnaireApi.deleteCategory(
          category.id
        );
        if (!success) {
          this.msg = message || "Failed to delete category";
          this.showSnackBar = true;
          return;
        }
        this.msg = message || "Category deleted";
        this.showSnackBar = true;
        await this.loadCategories();
      } catch (error) {
        this.msg =
          error?.response?.data?.message || "Failed to delete category";
        this.showSnackBar = true;
      } finally {
        this.appLoading = false;
      }
    },

    // Questions (placeholder hooks)
    handleAddQuestion(category) {
      this.msg = `Add question for ${category.name} will be implemented`;
      this.showSnackBar = true;
    },
    handleEditQuestion() {
      this.msg = `Edit question is not implemented yet`;
      this.showSnackBar = true;
    },
    handleRemoveQuestion() {
      this.msg = `Remove question is not implemented yet`;
      this.showSnackBar = true;
    },

    handleTestQuestionSaved() {
      this.msg = "Test question saved successfully!";
      this.showSnackBar = true;
    },

    handlePreview() {
      this.msg = "Preview functionality will be implemented";
      this.showSnackBar = true;
    },

    async handlePublish() {
      if (!this.questionnaireId) return;
      try {
        this.appLoading = true;
        const { success, message } =
          await questionnaireApi.publishQuestionnaire(this.questionnaireId);
        this.msg = success
          ? message || "Questionnaire published"
          : message || "Failed to publish questionnaire";
        this.showSnackBar = true;
        if (success) this.questionnaireStatus = "published";
      } catch (error) {
        this.msg =
          error?.response?.data?.message || "Failed to publish questionnaire";
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
