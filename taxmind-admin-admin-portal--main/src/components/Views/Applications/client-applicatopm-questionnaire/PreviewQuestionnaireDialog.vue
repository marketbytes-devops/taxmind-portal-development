<template>
  <v-dialog v-model="dialog" :max-width="isMobile ? '100vw' : '1280px'" :max-height="isMobile ? '100vh' : '80vh'"
    :fullscreen="isMobile" persistent scrollable content-class="preview-dialog-overlay"
    :transition="isMobile ? 'dialog-bottom-transition' : 'dialog-transition'">
    <v-card elevation="0" class="preview-card white" :class="{ 'mobile-fullscreen': isMobile }">

      <!-- Desktop Header with Title and Close Button -->
      <v-card-title v-if="!isMobile" class="preview-header px-6 py-4">
        <span class="preview-title">Questionnaire</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="close" class="close-btn">
          <v-icon color="#5F5F5F">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Progress Bar -->
      <v-card v-if="hasCategories" rounded="lg" flat class="pa-4 progress-card">
        <div class="d-flex justify-space-between align-center mb-5">
          <div class="step-header text-body-1">
            Tax Credit Eligibility Questionnaire
          </div>
          <div class="text-caption step-progress font-weight-medium">
            <span class="text-blue">{{ completionPercentage }}%</span>
            Completed
          </div>
        </div>

        <v-progress-linear :color="completionPercentage === 100 ? 'success' : 'primary'" :value="completionPercentage"
          height="6" rounded></v-progress-linear>
      </v-card>

      <!-- Mobile Header with Menu Button -->
      <v-layout v-if="isMobile" class="mobile-header" align-center justify-space-between>
        <v-btn v-if="hasCategories" icon @click="sidebarOpen = true" class="mobile-menu-btn">
          <v-icon color="#1A73E9">mdi-menu</v-icon>
        </v-btn>
        <div v-else style="width: 40px;"></div>
        <div class="mobile-header-content">
          <span class="mobile-current-category">{{ hasCategories ? activeCategory.name : 'Questionnaire' }}</span>
          <span v-if="hasCategories" class="mobile-category-indicator">{{ activeIndex + 1 }} of {{
            categoriesToShow.length }}</span>
        </div>
        <v-btn icon @click="close" class="mobile-close-btn">
          <v-icon color="#5F5F5F">mdi-close</v-icon>
        </v-btn>
      </v-layout>

      <!-- Body -->
      <div class="preview-body-container">
        <!-- Mobile Sidebar Overlay -->
        <v-overlay v-if="isMobile && sidebarOpen" :value="sidebarOpen" @click="sidebarOpen = false" z-index="10001"
          class="mobile-sidebar-overlay">
          <div @click.stop class="mobile-sidebar" :class="{ open: sidebarOpen }">
            <!-- Mobile Sidebar Header -->
            <v-layout class="mobile-sidebar-header" align-center justify-space-between>
              <span class="mobile-sidebar-title">Categories</span>
              <v-btn icon small @click="sidebarOpen = false">
                <v-icon color="#5F5F5F">mdi-close</v-icon>
              </v-btn>
            </v-layout>

            <!-- Mobile Categories List -->
            <div class="mobile-categories-list">
              <div v-for="(cat, i) in categoriesToShow" :key="cat.id || i" class="mobile-category-item" :class="{
                active: i === activeIndex,
                disabled: cat.isDisabled,
                completed: cat.isCompleted
              }" @click="handleMobileCategoryClick(cat, i)">
                <div class="mobile-category-content">
                  <img v-if="getCategoryIcon(cat)" :src="getCategoryIcon(cat)" :alt="cat.name"
                    class="mobile-category-icon" :class="{ 'disabled-icon': cat.isDisabled }" />
                  <img v-else src="/no_img.svg" :alt="cat.name" class="mobile-category-icon"
                    :class="{ 'disabled-icon': cat.isDisabled }" />
                  <span class="mobile-category-name" :class="{ 'disabled-label': cat.isDisabled }">{{ cat.name }}</span>
                </div>
                <v-icon v-if="cat.isCompleted" color="#4CAF50">mdi-check-circle</v-icon>
                <v-icon v-else-if="i === activeIndex" color="#1A73E9">mdi-check</v-icon>
              </div>
            </div>
          </div>
        </v-overlay>

        <v-layout wrap class="preview-body backgroundOne">
          <!-- Left: Category Tiles (Desktop only) -->
          <v-flex v-if="!isMobile" xs12 md3 class="left-pane white">
            <!-- Show categories if available -->
            <v-layout v-if="hasCategories" wrap class="tile-grid">
              <v-flex xs6 v-for="(cat, i) in categoriesToShow" :key="cat.id || i" class="tile-cell">
                <v-card elevation="0" class="tile-card" :class="{
                  selected: i === activeIndex,
                  disabled: cat.isDisabled,
                  completed: cat.isCompleted
                }" @click="handleCategoryClick(cat, i)">
                  <v-layout column align-center justify-center class="tile-content">
                    <!-- Completed Check Mark -->
                    <v-icon v-if="cat.isCompleted" class="completed-icon" color="#4CAF50"
                      size="20">mdi-check-circle</v-icon>

                    <!-- Category Icon: Show image if available, else dummy image -->
                    <div class="category-icon-container">
                      <img v-if="getCategoryIcon(cat)" :src="getCategoryIcon(cat)" :alt="cat.name" class="category-icon"
                        :class="{ 'disabled-icon': cat.isDisabled }" />
                      <img v-else src="/no_img.svg" :alt="cat.name" class="category-icon"
                        :class="{ 'disabled-icon': cat.isDisabled }" />
                    </div>
                    <div
                      :class="['tile-label', i === activeIndex ? 'active' : '', cat.isDisabled ? 'disabled-label' : '']">
                      {{ cat.name }}
                    </div>
                  </v-layout>
                </v-card>
              </v-flex>
            </v-layout>
            <!-- Show fallback message when no categories -->
            <v-layout v-else column align-center justify-center class="empty-state">
              <v-icon size="48" color="#CCCCCC" class="mb-4">mdi-folder-outline</v-icon>
              <div class="empty-state-title">No Categories Available</div>
              <div class="empty-state-subtitle">
                Categories will appear here once they are added to the
                questionnaire.
              </div>
            </v-layout>
          </v-flex>

          <!-- Right: Questions Preview -->
          <v-flex xs12 :md9="!isMobile" class="right-pane">
            <v-card elevation="0" class="section-card white" :class="{ 'mobile-full-width': isMobile }"
              @touchstart="handleTouchStart" @touchend="handleTouchEnd">
              <!-- Show header only if there are categories -->
              <v-layout v-if="hasCategories" align-center justify-space-between class="section-header">
                <span class="section-title">{{ activeCategory.name }}</span>
                <!-- <v-btn icon @click="navigateToApplication" class="back-to-app-btn"
                  :class="{ 'mobile-back-btn': isMobile }">
                  <v-icon :size="isMobile ? 20 : 24" color="#1A73E9">mdi-arrow-left</v-icon>
                </v-btn> -->
              </v-layout>

              <!-- Show questions if categories exist -->
              <div v-if="hasCategories" class="questions-scrollable-container">
                <QuestionPreviewTree ref="questionnaireTree" :questions="activeCategory.questions"
                  :responses.sync="previewResponses" :responseId="responseId" @show-snackbar="handleShowSnackbar" />
              </div>

              <!-- Show fallback content when no categories -->
              <v-layout v-else column align-center justify-center class="empty-state questions-empty-state">
                <v-icon size="48" color="#CCCCCC" class="mb-4">mdi-help-circle-outline</v-icon>
                <div class="empty-state-title">No Questions Available</div>
                <div class="empty-state-subtitle">
                  Questions will be displayed here once categories and questions
                  are added to the questionnaire.
                </div>
              </v-layout>
            </v-card>
          </v-flex>
        </v-layout>
      </div>
      <!-- Footer Actions -->
      <v-container style="padding-top: 13px !important;" fluid class="preview-footer pa-0">
        <v-row no-gutters align="center" justify="space-between" class="fill-height">
          <v-col cols="auto" v-if="!isMobile">
            <!-- Empty space on desktop for left alignment -->
          </v-col>
          <v-col :cols="isMobile ? '12' : 'auto'" class="d-flex mx-1"
            :class="isMobile ? 'justify-space-between' : 'justify-end'">
            <v-btn :ripple="false" outlined color="primary" :disabled="!canGoBack" @click="goToPreviousCategory"
              class="footer-btn back-btn" :class="{ 'mobile-btn': isMobile }">
              <v-icon left size="16" v-if="isMobile">mdi-chevron-left</v-icon>
              <span class="btn-text">Back</span>
            </v-btn>

            <v-btn v-if="!isLastCategory" :ripple="false" depressed color="primary" :disabled="!canGoNext"
              @click="goToNextCategory" class="footer-btn next-btn ml-3" :class="{ 'mobile-btn': isMobile }">
              <span class="btn-text">Next</span>
              <v-icon right size="16" v-if="isMobile">mdi-chevron-right</v-icon>
            </v-btn>

            <v-btn v-else :ripple="false" depressed color="success" @click="submitQuestionnaire" :loading="isSubmitting"
              :disabled="isSubmitting" class="footer-btn submit-btn ml-3" :class="{ 'mobile-btn': isMobile }">
              <span class="btn-text">{{ isSubmitting ? 'Submitting...' : 'Submit' }}</span>
              <v-icon right size="16" v-if="!isSubmitting">mdi-check</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-card>

    <!-- Submit Confirmation Dialog -->
    <v-dialog v-model="showSubmitConfirmation" max-width="480" persistent>
      <v-card class="confirmation-dialog">
        <v-card-title class="confirmation-header">
          <v-icon color="#FF9800" size="24" class="mr-3">mdi-alert-circle</v-icon>
          <span class="confirmation-title">Confirm Submission</span>
          <v-spacer></v-spacer>
          <v-btn icon small @click="cancelSubmit" class="close-icon-btn">
            <v-icon size="20" color="#666">mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="confirmation-content">
          <div class="warning-message">
            <p class="main-warning">
              <strong>Important:</strong> Once you submit this questionnaire, you will not be able to edit your
              responses.
            </p>
            <p class="sub-warning">
              Please review your answers carefully before proceeding. Make sure all information is accurate and
              complete.
            </p>
          </div>

          <div class="confirmation-checklist">
            <div class="checklist-item">
              <v-icon color="#1A73E9" size="18" class="mr-2">mdi-check-circle</v-icon>
              <span>All required questions are answered</span>
            </div>
            <div class="checklist-item">
              <v-icon color="#1A73E9" size="18" class="mr-2">mdi-check-circle</v-icon>
              <span>Information provided is accurate</span>
            </div>
            <div class="checklist-item">
              <v-icon color="#1A73E9" size="18" class="mr-2">mdi-check-circle</v-icon>
              <span>Ready to finalize submission</span>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="confirmation-actions">
          <v-btn text color="#666" @click="cancelSubmit" class="cancel-btn">
            <v-icon left size="16">mdi-arrow-left</v-icon>
            Review Again
          </v-btn>

          <v-spacer></v-spacer>

          <v-btn depressed color="success" @click="confirmSubmit" class="confirm-submit-btn">
            <v-icon left size="16">mdi-send</v-icon>
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script>
import QuestionPreviewTree from "./QuestionPreviewTree.vue";
export default {
  name: "PreviewQuestionnaireDialog",
  components: { QuestionPreviewTree },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    categories: {
      type: Array,
      default: () => [],
    },
    responseId: {
      type: String,
      default: null,
    },
  },
  data() {
    const LABELS = {
      PREVIEW_TITLE: "Preview Questionnaire",
    };

    return {
      LABELS,
      dialog: this.value,
      activeIndex: 0,
      previewResponses: {},
      sidebarOpen: false, // For mobile collapsible sidebar
      isMobile: false, // Track if current screen is mobile
      touchStartX: 0,
      touchStartY: 0,
      showSubmitConfirmation: false, // Control submit confirmation dialog
      isSubmitting: false, // Track submission state
    };
  },
  computed: {
    categoriesToShow() {
      if (this.categories && this.categories.length) {
        return this.categories;
      }
      return [];
    },
    hasCategories() {
      return this.categories && this.categories.length > 0;
    },
    activeCategory() {
      const src = this.categoriesToShow;
      if (!src.length) {
        return { name: "", questions: [] };
      }
      return src[this.activeIndex] || { name: "", questions: [] };
    },
    canGoBack() {
      return this.hasCategories && this.activeIndex > 0;
    },
    canGoNext() {
      return (
        this.hasCategories &&
        this.activeIndex < this.categoriesToShow.length - 1
      );
    },
    isLastCategory() {
      return (
        this.hasCategories &&
        this.activeIndex === this.categoriesToShow.length - 1
      );
    },
    completionPercentage() {
      if (!this.hasCategories) {
        return 0;
      }
      const completedCount = this.categoriesToShow.filter(cat => cat.isCompleted).length;
      return Math.round((completedCount / this.categoriesToShow.length) * 100);
    },
  },
  mounted() {
    this.checkScreenSize();
    window.addEventListener("resize", this.checkScreenSize);
    this.populateExistingAnswers();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.checkScreenSize);
  },
  watch: {
    value(n) {
      console.log('👁️ PreviewQuestionnaireDialog - value changed:', n);
      this.dialog = n;
      // Reset to first category when dialog opens
      if (n === true) {
        this.setInitialCategory();
        this.sidebarOpen = false;
      }
    },
    dialog(n) {
      console.log('👁️ PreviewQuestionnaireDialog - dialog changed:', n);
      this.$emit("input", n);
      // Reset to first category when dialog opens
      if (n === true) {
        this.setInitialCategory();
        this.sidebarOpen = false;
      }
    },
    categories: {
      handler(newVal) {
        console.log('👁️ PreviewQuestionnaireDialog - categories changed:', newVal);
        console.log('Categories length:', newVal ? newVal.length : 0);
        this.populateExistingAnswers();
        this.setInitialCategory();
      },
      deep: true,
      immediate: true,
    },
    responseId(newVal) {
      console.log('👁️ PreviewQuestionnaireDialog - responseId changed:', newVal);
    },
  },
  methods: {
    close() {
      this.dialog = false;
    },

    goToPreviousCategory() {
      if (this.canGoBack) {
        // Reset validation state when navigating backwards
        if (this.$refs.questionnaireTree) {
          this.$refs.questionnaireTree.resetValidationState();
        }
        this.activeIndex = this.activeIndex - 1;
      }
    },

    async goToNextCategory() {
      if (!this.canGoNext) {
        return;
      }

      // Validate current category before proceeding
      if (this.$refs.questionnaireTree) {
        const isValid = this.$refs.questionnaireTree.triggerValidationOnSubmit();
        if (!isValid) {

          return;
        }
      }

      console.log('👉 Next button clicked, current index:', this.activeIndex);

      // Reset validation state for next category
      if (this.$refs.questionnaireTree) {
        this.$refs.questionnaireTree.resetValidationState();
      }

      // Get current category ID before moving
      const currentCategory = this.categoriesToShow[this.activeIndex];

      // Emit event to parent to update progress and fetch questionnaire data
      this.$emit('fetch-questionnaire', () => {
        console.log('📍 Callback executing, current index:', this.activeIndex);
        // This callback will be called on success
        // Find next non-disabled category
        let nextIndex = this.activeIndex + 1;
        while (nextIndex < this.categoriesToShow.length && this.categoriesToShow[nextIndex].isDisabled) {
          nextIndex++;
        }
        console.log('🎯 Moving to index:', nextIndex);
        if (nextIndex < this.categoriesToShow.length) {
          this.activeIndex = nextIndex;
          console.log('✅ Index updated to:', this.activeIndex);

          // Reset validation state after successfully moving to next category
          if (this.$refs.questionnaireTree) {
            this.$refs.questionnaireTree.resetValidationState();
          }
        } else {
          console.log('⚠️ No more categories available');
        }
      }, currentCategory);
    },

    handleCategoryClick(category, index) {
      if (!category.isDisabled) {
        // Reset validation state when clicking on different category
        if (this.$refs.questionnaireTree) {
          this.$refs.questionnaireTree.resetValidationState();
        }
        this.activeIndex = index;
      }
    },

    handleMobileCategoryClick(category, index) {
      if (!category.isDisabled) {
        // Reset validation state when selecting mobile category
        if (this.$refs.questionnaireTree) {
          this.$refs.questionnaireTree.resetValidationState();
        }
        this.selectCategoryAndClose(index);
      }
    },

    checkScreenSize() {
      this.isMobile = window.innerWidth < 960; // md breakpoint
    },

    selectCategoryAndClose(index) {
      this.activeIndex = index;
      this.sidebarOpen = false;
    },

    getCategoryIcon(category) {
      // Check for icon in different possible formats
      if (category.icon) {
        // If it's an object with filePath property (primary format)
        if (typeof category.icon === "object" && category.icon.filePath) {
          return category.icon.filePath;
        }
        // If it's an object with key property (fallback format)
        if (typeof category.icon === "object" && category.icon.key) {
          // Construct the file URL from the key
          return `/api/files/get?key=${encodeURIComponent(category.icon.key)}`;
        }
        // If it's a full URL or path string
        if (
          typeof category.icon === "string" &&
          (category.icon.startsWith("http") || category.icon.startsWith("/"))
        ) {
          return category.icon;
        }
      }
      return null;
    },

    // Touch event handlers for swipe gestures
    handleTouchStart(event) {
      if (!this.isMobile || !this.hasCategories) return;
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
    },

    handleTouchEnd(event) {
      if (!this.isMobile || !this.hasCategories) return;

      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;

      // Only process horizontal swipes (ignore vertical scrolling)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0 && this.canGoBack) {
          // Swipe right - go to previous category
          this.goToPreviousCategory();
        } else if (deltaX < 0 && this.canGoNext) {
          // Swipe left - go to next category
          this.goToNextCategory();
        }
      }
    },

    handleShowSnackbar(payload) {
      this.$emit('show-snackbar', payload);
    },

    submitQuestionnaire() {
      // Validate current category before showing confirmation
      if (this.$refs.questionnaireTree) {
        const isValid = this.$refs.questionnaireTree.triggerValidationOnSubmit();
        if (!isValid) {

          return;
        }
      }
      this.showSubmitConfirmation = true;
    },

    confirmSubmit() {
      this.isSubmitting = true;
      this.showSubmitConfirmation = false;
      this.$emit('submit-questionnaire');
      // Reset submitting state after a delay (in case parent doesn't handle it)
      setTimeout(() => {
        this.isSubmitting = false;
      }, 3000);
    },

    cancelSubmit() {
      this.showSubmitConfirmation = false;
    },

    setInitialCategory() {
      if (!this.categories || this.categories.length === 0) {
        return;
      }

      // Find the last non-disabled category
      let lastNonDisabledIndex = -1;
      for (let i = this.categories.length - 1; i >= 0; i--) {
        if (!this.categories[i].isDisabled) {
          lastNonDisabledIndex = i;
          break;
        }
      }

      // Set active index to last non-disabled category, or 0 if all are disabled
      this.activeIndex = lastNonDisabledIndex >= 0 ? lastNonDisabledIndex : 0;

      console.log('🎯 Initial category set to index:', this.activeIndex,
        'Category:', this.categories[this.activeIndex]?.name);
    },

    populateExistingAnswers() {
      if (!this.categories || this.categories.length === 0) {
        return;
      }

      const responses = {};

      // Iterate through all categories and questions to extract existing answers
      this.categories.forEach(category => {
        if (category.questions && category.questions.length > 0) {
          category.questions.forEach(question => {
            this.extractAnswerFromQuestion(question, responses);
          });
        }
      });

      this.previewResponses = responses;
      console.log('📝 Populated existing answers:', responses);
    },

    extractAnswerFromQuestion(question, responses) {
      // Check if question has an answer
      if (question.answer && question.answer.value !== null && question.answer.value !== undefined) {
        let value = question.answer.value;

        // Convert ISO date string to YYYY-MM-DD format for date fields
        if (question.questionType === 'date' && typeof value === 'string') {
          // Check if it's an ISO date string
          if (value.includes('T') || value.includes('Z')) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              // Format as YYYY-MM-DD
              value = date.toISOString().split('T')[0];
            }
          }
        }

        responses[question.id] = value;
      }

      // Recursively extract answers from nested questions in options
      if (question.options && question.options.length > 0) {
        question.options.forEach(option => {
          if (option.questions && option.questions.length > 0) {
            option.questions.forEach(nestedQuestion => {
              this.extractAnswerFromQuestion(nestedQuestion, responses);
            });
          }
        });
      }

      // Handle legacy children format
      if (question.children && question.children.length > 0) {
        question.children.forEach(childQuestion => {
          this.extractAnswerFromQuestion(childQuestion, responses);
        });
      }
    },

    navigateToApplication() {
      // Close the current dialog
      this.close();
      // Emit event to parent component to navigate to application page
      // this.$emit('navigate-to-application');

      this.$router.push('/application');
    },
  },
};
</script>

<style scoped>
.preview-dialog-overlay {
  backdrop-filter: blur(5px);
  background: rgba(0, 0, 0, 0.2) !important;
}

.progress-card {
  background: white !important;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 0 !important;
}

.step-header {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.step-progress {
  font-family: "DM Sans", sans-serif;
  color: #666;
}

.text-blue {
  color: #1A73E9;
  font-weight: 700;
  margin-right: 4px;
}

.preview-card {
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-fullscreen {
  border-radius: 0 !important;
  height: 100vh !important;
  max-height: 100vh !important;
}

.preview-header {
  height: 66px;
  min-height: 66px;
  padding: 0 24px;
  flex-shrink: 0;
  border-bottom: 1px solid #f0f0f0;
  background: white;
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.preview-title {
  font-family: "DM Sans", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #1a73e9;
  line-height: 1.2;
}

.close-btn {
  width: 40px !important;
  height: 40px !important;
}

.mobile-close-btn {
  width: 40px !important;
  height: 40px !important;
}

.preview-body {
  /* padding: 20px 24px 8px 24px; */
  height: calc(80vh - 140px);
  min-height: 400px;
  max-height: calc(80vh - 140px);
  flex: 1;
  overflow: hidden;
}

.questions-scrollable-container {
  height: calc(80vh - 194px);
  max-height: calc(80vh - 197px);
  overflow-y: auto;
  padding: 20px;
}

.left-pane {
  border-right: 6px solid #f7faf8;
  height: 100%;
  min-height: 400px;
  background: rgb(254, 254, 254);
}

.right-pane {
  height: 100%;
}

.section-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tile-grid {
  padding: 12px 8px;
  height: 64vh;
  overflow: auto;
  align-content: flex-start;
  border-right: 6px solid #f6f9f7;
}

.tile-cell {
  padding: 6px;
}

.tile-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  height: 124px;
  position: relative;
  transition: all 0.2s ease;
}

.tile-card.selected {
  border-color: #1a73e9;
  background: #f1f7ff;
}

.tile-card.completed {
  border: 2px solid #4CAF50;
  background: #f1f8f4;
}

.tile-card.disabled {
  border-color: #e0e0e0;
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.tile-card.disabled:hover {
  background: #f5f5f5;
}

.tile-content {
  height: 100%;
  position: relative;
}

.completed-icon {
  position: absolute;
  top: 8px;
  right: 8px;
}

.disabled-icon {
  opacity: 0.4;
  filter: grayscale(100%);
}

.disabled-label {
  color: #9e9e9e !important;
}

.tile-label {
  font-family: "DM Sans", sans-serif;
  font-size: 13.3px;
  color: #5f5f5f;
  text-align: center;
  white-space: pre-line;
  margin-top: 8px;
}

.tile-label.active {
  color: #1a73e9;
}

/* Category Icon Styles */
.category-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin-bottom: 8px;
}

.category-icon {
  width: 30px;
  height: 30px;
  object-fit: contain;
  border-radius: 4px;
}

.section-header {
  height: 40px;
  padding: 20px;
  background: #fff;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.05);
  z-index: 1;
  position: relative;
  flex-shrink: 0;
}

.section-title {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1a73e9;
}

/* Back to Application Button Styles */
.back-to-app-btn {
  width: 40px !important;
  height: 40px !important;
  border-radius: 8px !important;
  background-color: #f8f9fa !important;
  border: 1px solid #e5e7eb !important;
  transition: all 0.2s ease !important;
}

.back-to-app-btn:hover {
  background-color: #f1f7ff !important;
  border-color: #1a73e9 !important;
  transform: translateX(-2px);
}

.mobile-back-btn {
  width: 36px !important;
  height: 36px !important;
  border-radius: 6px !important;
}

.question-label {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #000;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.required {
  color: #d53e3e;
  margin-left: 4px;
}

.option-row {
  gap: 10px;
}

.option-pill {
  height: 40px;
  min-width: 143px;
  border: 0.95px solid rgba(230, 230, 230, 1);
  border-radius: 5px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  margin-bottom: 10px;
}

.option-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #000;
}

/* Empty State Styles */
.empty-state {
  height: 100%;
  min-height: 400px;
  padding: 40px 20px;
  text-align: center;
}

.questions-empty-state {
  min-height: 520px;
}

.empty-state-title {
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
}

.empty-state-subtitle {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #9ca3af;
  max-width: 300px;
  line-height: 1.5;
}

.preview-footer {
  min-height: 60px;
  padding: 12px 24px 20px;
  background: #f1f7ff;
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb;
}

/* Footer Button Styles */
.footer-btn {
  min-width: 120px !important;
  height: 40px !important;
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

.back-btn {
  border-color: #1a73e9 !important;
  color: #1a73e9 !important;
}

.back-btn .v-btn__content {
  color: #1a73e9 !important;
}

.next-btn {
  background-color: #1a73e9 !important;
  color: white !important;
}

.next-btn:disabled {
  background-color: #e0e0e0 !important;
  color: #9e9e9e !important;
}

.btn-text {
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  font-size: 14px;
}

/* Mobile Header Styles */
.mobile-header {
  height: 56px;
  min-height: 56px;
  padding: 0 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.mobile-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.mobile-current-category {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1a73e9;
  line-height: 1.2;
}

.mobile-header-spacer {
  width: 40px;
}

/* Mobile Responsive Styles */
.preview-body-container {
  position: relative;
}

.mobile-menu-btn {
  width: 40px !important;
  height: 40px !important;
}

.mobile-category-indicator {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.2;
}

.mobile-sidebar-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(2px);
  z-index: 10001 !important;
}

.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  max-width: 80vw;
  height: 100vh;
  background: white;
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.15);
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10002;
  overflow-y: auto;
}

.mobile-sidebar.open {
  transform: translateX(0);
}

.mobile-sidebar-header {
  height: 60px;
  padding: 0 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8f9fa;
}

.mobile-sidebar-title {
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #1a73e9;
}

.mobile-categories-list {
  padding: 16px 0;
}

.mobile-category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.15s;
}

.mobile-category-item:hover {
  background: #f5f9ff;
}

.mobile-category-item.active {
  background: #f1f7ff;
  border-left: 4px solid #1a73e9;
}

.mobile-category-item.completed {
  background: #f1f8f4;
  border-left: 4px solid #4CAF50;
}

.mobile-category-item.disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.mobile-category-item.disabled:hover {
  background: #f5f5f5;
}

.mobile-category-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.mobile-category-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
  margin-right: 12px;
}

.mobile-category-name {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #000;
  line-height: 1.4;
}

.mobile-full-width {
  margin-left: 0 !important;
}

/* Mobile Styles */
@media (max-width: 959px) {
  .mobile-menu-btn {
    display: inline-flex !important;
  }

  .preview-title {
    font-size: 18px;
  }

  .mobile-category-indicator {
    display: block;
  }

  .left-pane {
    display: none !important;
  }

  .right-pane {
    flex: 1 1 100% !important;
    max-width: 100% !important;
  }

  .section-card {
    margin-left: 0 !important;
  }

  .preview-body {
    /* padding: 10px 16px 8px 16px; */
    height: calc(100vh - 140px);
    min-height: calc(100vh - 140px);
    max-height: calc(100vh - 140px);
  }

  .questions-scrollable-container {
    height: calc(100vh - 256px);
    max-height: calc(100vh - 256px);
  }

  .mobile-btn {
    min-width: 100px !important;
    flex: 1;
    max-width: 150px;
  }

  .footer-btn.mobile-btn {
    height: 44px !important;
  }
}

@media (max-width: 599px) {
  .preview-header {
    padding: 0 16px;
    height: 60px;
    min-height: 60px;
  }

  .preview-title {
    font-size: 16px;
  }

  .mobile-category-indicator {
    font-size: 11px;
    display: block;
    margin-top: 1px;
  }

  .preview-footer {
    padding: 16px;
    min-height: 76px;
  }

  .close-button,
  .mobile-menu-btn {
    width: 36px !important;
    height: 36px !important;
  }

  .close-button .v-icon,
  .mobile-menu-btn .v-icon {
    font-size: 18px !important;
  }

  .mobile-btn {
    min-width: 90px !important;
    height: 48px !important;
    font-size: 13px !important;
  }

  .btn-text {
    font-size: 13px !important;
  }

  .preview-body {
    /* padding: 8px 12px; */
    height: calc(100vh - 192px);
    min-height: calc(100vh - 192px);
    max-height: calc(100vh - 192px);
  }

  .questions-scrollable-container {
    height: calc(100vh - 252px);
    max-height: calc(100vh - 252px);
    padding: 12px;
  }
}

/* Landscape mobile orientation */
@media (max-width: 959px) and (orientation: landscape) and (max-height: 600px) {
  .preview-header {
    height: 50px;
    min-height: 50px;
  }

  .preview-title {
    font-size: 16px;
  }

  .mobile-category-indicator {
    font-size: 11px;
  }

  .preview-footer {
    min-height: 60px;
    padding: 8px 16px 12px;
  }

  .mobile-btn {
    height: 40px !important;
  }

  .preview-body {
    height: calc(100vh - 110px);
    min-height: calc(100vh - 110px);
    max-height: calc(100vh - 110px);
  }

  .questions-scrollable-container {
    height: calc(100vh - 170px);
    max-height: calc(100vh - 170px);
  }
}

.backgroundOne {
  background-color: #ab8484 !important;
  border-color: #f1f7ff !important;
}

/* Submit Confirmation Dialog Styles */
.confirmation-dialog {
  border-radius: 12px !important;
  overflow: hidden;
}

.confirmation-header {
  background: linear-gradient(135deg, #fff3e0 0%, #fff8f0 100%);
  border-bottom: 1px solid #ffe0b2;
  padding: 20px 24px 16px 24px !important;
  display: flex;
  align-items: center;
}

.close-icon-btn {
  margin-left: auto;
  transition: all 0.2s ease;
}

.close-icon-btn:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
  transform: rotate(90deg);
}

.confirmation-title {
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #e65100;
  line-height: 1.3;
}

.confirmation-content {
  padding: 24px !important;
  background: white;
}

.warning-message {
  margin-bottom: 24px;
}

.main-warning {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.5;
}

.sub-warning {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.confirmation-checklist {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #1A73E9;
}

.checklist-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #333;
}

.checklist-item:last-child {
  margin-bottom: 0;
}

.confirmation-actions {
  padding: 16px 24px 20px 24px !important;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  color: #666 !important;
  border-radius: 6px !important;
}

.cancel-btn:hover {
  background-color: #f5f5f5 !important;
}

.confirm-submit-btn {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  background-color: #4CAF50 !important;
  color: white !important;
  border-radius: 6px !important;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3) !important;
}

.confirm-submit-btn:hover {
  background-color: #45a049 !important;
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4) !important;
}
</style>