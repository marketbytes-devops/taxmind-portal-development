<template>
  <div style="background-color: #f1f7ff">
    <!-- Error handling -->
    <ServerError v-if="ServerError" />

    <!-- Loading overlay -->
    <vue-element-loading
      :active="appLoading"
      spinner="bar-fade-scale"
      color="primary"
      size="60"
      is-full-screen
    />

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
      <v-flex pt-5 xs11 sm11 md11 lg11 xl11>
        <!-- Page Header Component -->
        <QuestionnaireHeader
          :LABELS="LABELS"
          :current-status="currentStatus"
          :can-create="canCreate('questionnaire')"
          @statusChange="handleStatusChange"
          @create="handleCreateClick"
        />

        <!-- Questionnaire Cards Grid Component -->
        <QuestionnaireGrid
          v-if="questionnaireData.length > 0"
          :items="questionnaireData"
          :selected-item="selectedYear"
          :LABELS="LABELS"
          :can-edit="canEdit('questionnaire')"
          :can-delete="canDelete('questionnaire')"
          @select="selectYear"
          @view="viewQuestionnaire"
          @edit="redirectToEditPage"
          @delete="handleDeleteClick"
        />

        <!-- Pagination Controls -->
        <div
          v-if="questionnaireData.length > 0"
          class="mt-4 pa-4"
          elevation="0"
        >
          <!-- Pagination Component -->
          <v-layout
            v-if="shouldShowPagination()"
            justify-center
            class="mb-3 questionnaire-pagination"
          >
            <v-pagination
              v-model="pagination.page"
              :length="pagination.totalPages"
              :total-visible="7"
              :disabled="pagination.loading"
              color="primary"
              circle
              @input="handlePageChange"
            ></v-pagination>
          </v-layout>
        </div>

        <!-- Empty State Component -->
        <QuestionnaireEmptyState
          v-if="questionnaireData.length === 0 && !appLoading"
          :description="LABELS.NO_DATA_DESCRIPTION"
          :show-create-button="false"
          :LABELS="LABELS"
          @create="handleCreateClick"
        />
      </v-flex>
    </v-layout>

    <!-- Edit Confirmation Popup -->
    <EditConfirmationPopup
      :visible="showConfirmationPopup"
      :item="selectedItemForEdit"
      :LABELS="LABELS"
      @cancel="handleConfirmationCancel"
      @confirm="handleConfirmationConfirm"
    />

    <!-- Delete Confirmation Popup -->
    <DeleteConfirmationPopup
      :visible="showDeleteConfirmationPopup"
      :item="selectedItemForDelete"
      :LABELS="LABELS"
      @cancel="handleDeleteCancel"
      @confirm="handleDeleteConfirm"
    />

    <!-- Create Questionnaire Modal -->
    <CreateQuestionnaireModal
      :visible="showCreateModal"
      :LABELS="LABELS"
      @cancel="handleCreateCancel"
      @proceed="handleCreateProceed"
    />
  </div>
</template>

<script>
import { questionnaireMixin } from "../../../common/mixins/questionnaireMixin";
import QuestionnaireHeader from "./components/QuestionnaireHeader.vue";
import QuestionnaireGrid from "./components/QuestionnaireGrid.vue";
import QuestionnaireEmptyState from "./components/QuestionnaireEmptyState.vue";
import EditConfirmationPopup from "./components/EditConfirmationPopup.vue";
import DeleteConfirmationPopup from "./components/DeleteConfirmationPopup.vue";
import CreateQuestionnaireModal from "./components/CreateQuestionnaireModal.vue";
import { questionnaire as questionnaireApi } from "@/api";
import permissionMixin from "@/mixins/permissionMixin";

export default {
  name: "Questionnaire",
  components: {
    QuestionnaireHeader,
    QuestionnaireGrid,
    QuestionnaireEmptyState,
    EditConfirmationPopup,
    DeleteConfirmationPopup,
    CreateQuestionnaireModal,
  },
  mixins: [questionnaireMixin, permissionMixin],

  data() {
    return {
      questionnaireData: [],
      selectedYear: null,
      showConfirmationPopup: false,
      selectedItemForEdit: null,
      showDeleteConfirmationPopup: false,
      selectedItemForDelete: null,
      showCreateModal: false,
      currentStatus: "published",
      // Pagination data
      pagination: {
        page: 1,
        size: 12, // 12 items per page for good grid layout (3x4 or 4x3)
        total: 0,
        totalPages: 0,
        sizeOptions: [6, 12, 24, 48],
        loading: false,
      },
    };
  },

  mounted() {
    // Initialize status from URL query parameter or default to 'published'
    this.initializeStatusFromQuery();

    // Load questionnaires from API on mount
    this.loadQuestionnaires();
  },

  watch: {
    // Watch for route changes to update status when navigating back
    $route(to, from) {
      // Check if we're coming back to the questionnaire listing page
      if (to.name === "questionnaire" || to.name === "Questionnaire") {
        // If coming back from other pages, check for stored status
        const storedStatus = sessionStorage.getItem("questionnaireListStatus");

        if (
          storedStatus &&
          ["published", "draft"].includes(storedStatus.toLowerCase()) &&
          storedStatus !== this.currentStatus
        ) {
          console.log(
            "🔄 Route changed - restoring status from sessionStorage:",
            storedStatus
          );
          this.currentStatus = storedStatus.toLowerCase();
          this.updateURLWithStatus(this.currentStatus);
          this.pagination.page = 1; // Reset to first page
          this.loadQuestionnaires();
          // Clear after use
          sessionStorage.removeItem("questionnaireListStatus");
          return;
        }
      }

      // Only update if the status query parameter has changed
      const newStatus = to.query.status;
      const oldStatus = from.query.status;

      if (
        newStatus &&
        newStatus !== oldStatus &&
        newStatus !== this.currentStatus
      ) {
        console.log(
          "🔄 Route changed - updating status from query:",
          newStatus
        );
        this.currentStatus = newStatus.toLowerCase();
        this.pagination.page = 1; // Reset to first page
        this.loadQuestionnaires();
      }
    },
  },

  methods: {
    async loadQuestionnaires() {
      try {
        this.appLoading = true;
        this.pagination.loading = true;
        const { success, data, message, metadata } =
          await questionnaireApi.listQuestionnaires({
            status: this.currentStatus,
            page: this.pagination.page,
            limit: this.pagination.size,
          });

        if (!success) {
          this.msg = message || "Failed to load questionnaires";
          this.showSnackBar = true;
          // No sample data fallback. Show empty state instead.
          this.questionnaireData = [];
          // Reset pagination
          this.pagination.total = 0;
          this.pagination.totalPages = 0;
          console.log(
            "⚠️ No questionnaire data returned from API; showing empty state"
          );
          return;
        }

        // Map API data to UI model
        this.questionnaireData = (data || []).map((q, idx) => ({
          id: q.id ?? q._id ?? idx + 1,
          year: q.taxYear ?? q.year ?? q.tax_year ?? "—",
          title:
            q.title ||
            `Create questionnaire for year ${q.taxYear || q.year || "Unknown"}`,
          questionCount:
            q.questionCount ?? q.totalQuestions ?? q.total_questions ?? 0,
          totalApplications: q.totalApplications ?? q.total_applications ?? 0,
          applicationsInReview: q.applicationsInReview ?? q.in_review ?? 0,
          applicationsCompleted: q.applicationsCompleted ?? q.completed ?? 0,
          description:
            q.description ||
            `Comprehensive tax questionnaire for the ${
              q.taxYear || q.year || "Unknown"
            } tax year.`,
          status: (q.status || "draft").toString().toLowerCase(),
          version: q.version ?? 1,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
          publishedAt: q.publishedAt,
          // Preserve importedFrom so we can pass it when redirecting to edit/create
          importedFrom: q.importedFrom ?? q.imported_from ?? null,
        }));

        // Update pagination metadata
        if (metadata) {
          this.pagination.total = metadata.total || 0;
          this.pagination.totalPages = Math.ceil(
            this.pagination.total / this.pagination.size
          );
          console.log("📄 Pagination updated:", {
            page: this.pagination.page,
            size: this.pagination.size,
            total: this.pagination.total,
            totalPages: this.pagination.totalPages,
          });
        }
      } catch (err) {
        // Reuse mixin error handler
        this.handleError(err);
        // No sample data fallback. Clear list and show empty state.
        this.questionnaireData = [];
        this.pagination.total = 0;
        this.pagination.totalPages = 0;
        console.log(
          "❌ Error loading questionnaires; showing empty state",
          err
        );
      } finally {
        this.appLoading = false;
        this.pagination.loading = false;
      }
    },

    selectYear(year) {
      this.selectedYear =
        this.selectedYear && this.selectedYear.id === year.id ? null : year;
    },

    viewQuestionnaire(item) {
      console.log(
        "🎯 View questionnaire method called in questionnaire.vue for:",
        item.year,
        "ID:",
        item.id,
        "Status:",
        item.status
      );

      // Check if item has required properties
      if (!item || !item.id) {
        console.error("❌ Invalid item passed to viewQuestionnaire:", item);
        this.msg = "Error: Invalid questionnaire data";
        this.showSnackBar = true;
        return;
      }

      try {
        // Store current filter status in sessionStorage to preserve it
        sessionStorage.setItem("questionnaireListStatus", this.currentStatus);
        console.log(
          "💾 Saved current filter status to sessionStorage:",
          this.currentStatus
        );

        // Navigate to the view questionnaire page
        this.$router.push({
          name: "viewQuestionnaire",
          params: { id: item.id.toString() }, // Ensure ID is string
          query: {
            taxYear: item.year || item.taxYear,
            // Add return info to help with back navigation
            returnStatus: this.currentStatus,
          },
        });

        console.log(
          "🔗 Successfully navigating to view questionnaire page for ID:",
          item.id
        );
      } catch (error) {
        console.error("❌ Navigation error:", error);
        this.msg = "Error navigating to questionnaire view";
        this.showSnackBar = true;
      }
    },

    redirectToEditPage(item) {
      // Redirect to editQuestionaire.vue page
      console.log("🔗 Redirecting to edit page for questionnaire:", item.year);

      try {
        // Store current filter status in sessionStorage to preserve it
        sessionStorage.setItem("questionnaireListStatus", this.currentStatus);
        console.log(
          "💾 Saved current filter status to sessionStorage:",
          this.currentStatus
        );

        // Always use the createQuestionaire page in edit mode for both draft
        // and published questionnaires. The create page handles edit mode
        // without changing API flows.
        // Build route config and include importedFrom when editing a draft that was imported
        const routeConfig = {
          name: "createQuestionaire",
          params: { id: item.id, year: item.year },
          query: { mode: "edit", status: this.currentStatus },
        };

        if (
          this.currentStatus === "draft" &&
          item &&
          Object.prototype.hasOwnProperty.call(item, "importedFrom") &&
          item.importedFrom
        ) {
          routeConfig.query.importFrom = item.importedFrom;
          console.log(
            "ℹ️ Passing importedFrom to createQuestionaire route:",
            item.importedFrom
          );
        }

        this.$router.push(routeConfig);
        console.log("✅ Navigated to createQuestionaire in edit mode (always)");
      } catch (error) {
        console.error("❌ Navigation error:", error);
        // Fallback: Show message if navigation fails
        this.msg = `Redirecting to edit Tax Year ${item.year} questionnaire...`;
        this.showSnackBar = true;
      }
    },

    handleConfirmationCancel() {
      // Hide confirmation popup
      this.showConfirmationPopup = false;
      this.selectedItemForEdit = null;
      console.log("❌ User cancelled editing published questionnaire");
    },

    handleConfirmationConfirm(item) {
      // Hide popup and redirect to edit page
      this.showConfirmationPopup = false;
      this.selectedItemForEdit = null;
      this.redirectToEditPage(item);
      console.log(
        "✅ User confirmed editing published questionnaire:",
        item.year
      );
    },

    handleDeleteClick(item) {
      this.selectedItemForDelete = item;
      this.showDeleteConfirmationPopup = true;
      console.log("🗑️ Delete initiated for questionnaire:", item.year);
    },

    handleDeleteCancel() {
      this.showDeleteConfirmationPopup = false;
      this.selectedItemForDelete = null;
      console.log("❌ User cancelled delete operation");
    },

    handleDeleteConfirm() {
      // The DeleteConfirmationPopup component handles the API call internally
      // Just reset the popup state when deletion is complete
      this.showDeleteConfirmationPopup = false;
      this.selectedItemForDelete = null;
      // Refresh the questionnaires list to reflect deletion
      this.loadQuestionnaires();
      console.log("✅ Delete confirmed, refreshing questionnaires list");
    },

    initializeStatusFromQuery() {
      // Check for status query parameter and set currentStatus accordingly
      const statusFromQuery = this.$route.query.status;

      if (
        statusFromQuery &&
        ["published", "draft"].includes(statusFromQuery.toLowerCase())
      ) {
        this.currentStatus = statusFromQuery.toLowerCase();
        console.log(
          "📋 Status initialized from query parameter:",
          this.currentStatus
        );
      } else {
        // Check if we have a stored status from sessionStorage (when returning from view/edit)
        const storedStatus = sessionStorage.getItem("questionnaireListStatus");

        if (
          storedStatus &&
          ["published", "draft"].includes(storedStatus.toLowerCase())
        ) {
          this.currentStatus = storedStatus.toLowerCase();
          console.log(
            "📋 Status restored from sessionStorage:",
            this.currentStatus
          );
          // Update URL to reflect the restored status
          this.updateURLWithStatus(this.currentStatus);
        } else {
          // If no valid status in query or storage, default to 'published' and update URL
          this.currentStatus = "published";
          this.updateURLWithStatus(this.currentStatus);
          console.log("📋 Status defaulted to 'published' and URL updated");
        }
      }

      // Clear the stored status after using it to avoid conflicts
      sessionStorage.removeItem("questionnaireListStatus");
    },

    updateURLWithStatus(status) {
      // Update URL query parameter without triggering navigation
      const currentQuery = { ...this.$route.query };
      currentQuery.status = status;

      // Only update if different from current URL
      if (this.$route.query.status !== status) {
        this.$router
          .replace({
            name: this.$route.name,
            params: this.$route.params,
            query: currentQuery,
          })
          .catch((err) => {
            // Ignore navigation duplicated errors
            if (err.name !== "NavigationDuplicated") {
              console.error("Navigation error:", err);
            }
          });
      }
    },

    handleStatusChange(status) {
      // Handle status filter change (Published/Draft)
      console.log("🔄 Status changed to:", status);
      this.currentStatus = status;

      // Update URL to persist the status
      this.updateURLWithStatus(status);

      // Reset to first page when changing status
      this.pagination.page = 1;
      this.loadQuestionnaires();
    },

    handlePageChange(page) {
      // Handle pagination page change
      console.log("📄 Page changed to:", page);
      this.pagination.page = page;
      this.loadQuestionnaires();
    },

    handlePageSizeChange(size) {
      // Handle pagination size change
      console.log("📄 Page size changed to:", size);
      this.pagination.size = size;
      this.pagination.page = 1; // Reset to first page
      this.loadQuestionnaires();
    },

    // Helper method to check if pagination should be shown
    shouldShowPagination() {
      return (
        this.questionnaireData.length > 0 && this.pagination.totalPages > 1
      );
    },

    // Helper method to get pagination display text
    getPaginationText() {
      if (this.pagination.total === 0) return "No questionnaires found";

      const start = (this.pagination.page - 1) * this.pagination.size + 1;
      const end = Math.min(
        this.pagination.page * this.pagination.size,
        this.pagination.total
      );

      return `Showing ${start}-${end} of ${
        this.pagination.total
      } questionnaire${this.pagination.total === 1 ? "" : "s"}`;
    },

    handleCreateClick() {
      // Show Create Questionnaire modal
      this.showCreateModal = true;
      console.log(
        "➕ Create button clicked - showing Create Questionnaire modal"
      );
    },

    handleCreateCancel() {
      // Hide Create Questionnaire modal
      this.showCreateModal = false;
      console.log("❌ User cancelled creating questionnaire");
    },

    handleCreateProceed(data) {
      // Hide modal and navigate to create questionnaire page
      this.showCreateModal = false;

      console.log("✅ User proceeding with questionnaire creation:", data);

      try {
        // Store current filter status in sessionStorage to preserve it
        sessionStorage.setItem("questionnaireListStatus", this.currentStatus);
        console.log(
          "💾 Saved current filter status to sessionStorage:",
          this.currentStatus
        );

        const routeConfig = {
          name: "createQuestionaire",
          params: {
            id: data.questionnaireId || "new", // Use questionnaireId if available, otherwise "new"
          },
          query: {
            financialYear: data.financialYear, // Move financialYear to query params
            import: data.importQuestionnaire,
            importFrom: data.importFromYear,
            // Add return info to help with back navigation
            returnStatus: this.currentStatus,
          },
        };

        // Log the route configuration
        console.log(
          "🔗 Creating questionnaire with route config:",
          routeConfig
        );

        // Navigate to createQuestionaire route with form data
        this.$router.push(routeConfig);

        console.log("🔗 Successfully navigated to createQuestionaire page");
      } catch (error) {
        console.error("❌ Navigation error:", error);
        // Fallback: Show message if navigation fails
        this.msg = `Creating questionnaire for ${data.financialYear}...`;
        this.showSnackBar = true;
      }
    },

    // No sample data helper - when API returns no data or errors occur
    // we show the empty state UI instead of sample content.
  },
};
</script>

<style>
/* Import common questionnaire styles - Global styles for Vuetify override */
@import "../../../common/styles/questionnaire.css";
</style>

<style scoped>
/* Pagination Styles */
.page-size-selector {
  max-width: 80px;
  min-width: 70px;
}

.page-size-selector >>> .v-input__control {
  min-height: 32px !important;
}

.page-size-selector >>> .v-input__slot {
  min-height: 32px !important;
  padding: 0 8px !important;
}

.page-size-selector >>> .v-select__selections {
  line-height: 32px;
}

/* Ensure pagination is responsive */
@media (max-width: 600px) {
  .page-size-selector {
    margin-top: 8px;
  }
}

/* Pagination info text styling */
.caption.text--secondary {
  font-size: 14px !important;
  color: rgba(0, 0, 0, 0.6) !important;
}

/* Pagination component styling */
.questionnaire-pagination >>> .v-pagination {
  justify-content: center;
}

.questionnaire-pagination >>> .v-pagination__item {
  box-shadow: none !important;
  margin: 0 2px;
}

.questionnaire-pagination >>> .v-pagination__item--active {
  background-color: #1a73e9 !important;
  color: white !important;
}

.questionnaire-pagination >>> .v-pagination__navigation {
  box-shadow: none !important;
  color: #1a73e9 !important;
}
</style>