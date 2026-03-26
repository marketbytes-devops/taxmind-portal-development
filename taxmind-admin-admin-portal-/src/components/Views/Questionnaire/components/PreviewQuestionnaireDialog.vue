<template>
  <v-dialog v-model="dialog" :max-width="isMobile ? '100vw' : '1280px'" :max-height="isMobile ? '100vh' : '80vh'"
    :fullscreen="isMobile" persistent scrollable content-class="preview-dialog-overlay"
    :transition="isMobile ? 'dialog-bottom-transition' : 'dialog-transition'">
    <v-card elevation="0" class="preview-card white" :class="{ 'mobile-fullscreen': isMobile }">
      <!-- Header -->
      <v-container fluid class="preview-header pa-0">
        <v-row no-gutters align="center" justify="space-between" class="fill-height">
          <v-col cols="auto" class="d-flex align-center">
            <!-- Mobile menu button (only visible on mobile screens) -->
            <v-btn v-if="isMobile && hasCategories" icon small :ripple="false" @click="sidebarOpen = !sidebarOpen"
              class="mobile-menu-btn mr-2">
              <v-icon color="#1A73E9" size="20">mdi-menu</v-icon>
            </v-btn>
            <div class="title-container">
              <span class="preview-title mx-2 ml-6">{{
                LABELS.PREVIEW_TITLE
              }}</span>
              <!-- Current category indicator on mobile -->
              <div v-if="isMobile && hasCategories" class="mobile-category-indicator">
                {{ activeCategory.name }}
              </div>
            </div>
          </v-col>
          <v-col cols="auto" class="d-flex align-center" :class="{ 'mr-4': !isMobile }">
            <v-btn color="primary" class="ma-2" @click="publish" :disabled="isPublished">
              <v-icon left size="16">mdi-upload</v-icon>
              {{ LABELS.PUBLISH }}
            </v-btn>
            <v-btn icon small :ripple="false" @click="close" class="close-button">
              <v-icon color="#5F5F5F" size="20">mdi-close</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
      <!-- Preview Publish Confirmation Popup -->
      <PreviewPublishConfirmationPopup :visible="showPublishPopup" :questionnaireId="$attrs.questionnaireId || null"
        :title="LABELS.PUBLISH_CONFIRM_TITLE" :description="LABELS.PUBLISH_CONFIRM_DESC" :cancelLabel="LABELS.CANCEL"
        :proceedLabel="LABELS.PROCEED" @cancel="showPublishPopup = false" @published="
          (payload) => {
            showPublishPopup = false;
            dialog = false;
            $emit('published', payload);
          }
        " @error="
          (err) => {
            /* handled inside popup via toast */
          }
        " />
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
              <div v-for="(cat, i) in categoriesToShow" :key="cat.id || i" class="mobile-category-item"
                :class="{ active: i === activeIndex }" @click="selectCategoryAndClose(i)">
                <div class="mobile-category-content">
                  <img v-if="getCategoryIcon(cat)" :src="getCategoryIcon(cat)" :alt="cat.name"
                    class="mobile-category-icon" />
                  <img v-else src="/no_img.svg" :alt="cat.name" class="mobile-category-icon" />
                  <span class="mobile-category-name">{{ cat.name }}</span>
                </div>
                <v-icon v-if="i === activeIndex" color="#1A73E9">mdi-check</v-icon>
              </div>
            </div>
          </div>
        </v-overlay>

        <v-layout wrap class="preview-body backgroundOne">
          <!-- Left: Category Tiles (Desktop only) -->
          <v-flex v-if="!isMobile" xs12 md3 class="left-pane white">
            <!-- Show categories if available -->
            <div v-if="hasCategories" class="categories-scrollable-container">
              <v-layout wrap class="tile-grid">
                <v-flex xs6 v-for="(cat, i) in categoriesToShow" :key="cat.id || i" class="tile-cell">
                  <v-card elevation="0" class="tile-card" :class="{ selected: i === activeIndex }"
                    @click="activeIndex = i">
                    <v-layout column align-center justify-center class="tile-content">
                      <!-- Category Icon: Show image if available, else dummy image -->
                      <div class="category-icon-container">
                        <img v-if="getCategoryIcon(cat)" :src="getCategoryIcon(cat)" :alt="cat.name"
                          class="category-icon" />
                        <img v-else src="/no_img.svg" :alt="cat.name" class="category-icon" />
                      </div>
                      <div :class="[
                        'tile-label',
                        i === activeIndex ? 'active' : '',
                      ]">
                        {{ cat.name }}
                      </div>
                    </v-layout>
                  </v-card>
                </v-flex>
              </v-layout>
            </div>
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
            <v-card elevation="0" class="section-card white" :class="{ 'mobile-full-width': isMobile }">
              <!-- Show header only if there are categories -->
              <v-layout v-if="hasCategories" align-center class="section-header">
                <span class="section-title">{{ activeCategory.name }}</span>
              </v-layout>

              <!-- Show questions if categories exist -->
              <div v-if="hasCategories" class="questions-scrollable-container">
                <QuestionPreviewTree :questions="activeCategory.questions" :responses.sync="previewResponses" />
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
      <v-container fluid class="preview-footer pa-0">
        <v-row no-gutters align="center" justify="space-between" class="fill-height">
          <!-- Spacer to align with right panel on desktop -->
          <v-col v-if="!isMobile" md3 class="footer-spacer">
            <!-- Empty space to match left panel width -->
          </v-col>
          <v-col :cols="isMobile ? '12' : 'auto'" :md="!isMobile ? '9' : undefined" class="d-flex" :class="isMobile ? 'justify-space-between mx-1' : 'justify-end mr-4'
            ">
            <v-btn :ripple="false" outlined color="primary" :disabled="!canGoBack" @click="goToPreviousCategory"
              class="footer-btn back-btn" :class="{ 'mobile-btn': isMobile }">
              <v-icon left size="16" v-if="isMobile">mdi-chevron-left</v-icon>
              <span class="btn-text">Back</span>
            </v-btn>

            <v-btn :ripple="false" depressed color="primary" :disabled="!canGoNext" @click="goToNextCategory"
              class="footer-btn next-btn ml-3" :class="{ 'mobile-btn': isMobile }">
              <span class="btn-text">Next</span>
              <v-icon right size="16" v-if="isMobile">mdi-chevron-right</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script>
import QuestionPreviewTree from "./QuestionPreviewTree.vue";
import PreviewPublishConfirmationPopup from "./PreviewPublishConfirmationPopup.vue";
export default {
  name: "PreviewQuestionnaireDialog",
  components: { QuestionPreviewTree, PreviewPublishConfirmationPopup },
  emits: ["input", "publish"],
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    categories: {
      type: Array,
      default: () => [],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const LABELS = {
      PREVIEW_TITLE: "Preview Questionnaire",
      PUBLISH: "Publish",
      PUBLISH_CONFIRM_TITLE: "Publish Questionnaire",
      PUBLISH_CONFIRM_DESC:
        "Are you sure you want to publish this questionnaire? This action will make it live.",
      CANCEL: "Cancel",
      PROCEED: "Proceed",
    };

    return {
      LABELS,
      dialog: this.value,
      activeIndex: 0,
      previewResponses: {},
      sidebarOpen: false, // For mobile collapsible sidebar
      isMobile: false, // Track if current screen is mobile
      showPublishPopup: false,
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
  },
  mounted() {
    this.checkScreenSize();
    window.addEventListener("resize", this.checkScreenSize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.checkScreenSize);
  },
  watch: {
    value(n) {
      this.dialog = n;
      // Reset to first category when dialog opens
      if (n === true) {
        this.activeIndex = 0;
        this.sidebarOpen = false;
      }
    },
    dialog(n) {
      this.$emit("input", n);
      // Reset to first category when dialog opens
      if (n === true) {
        this.activeIndex = 0;
        this.sidebarOpen = false;
      }
    },
  },
  methods: {
    close() {
      this.dialog = false;
    },

    publish() {
      // Do nothing if already published
      if (this.isPublished) {
        return;
      }

      // Open preview publish confirmation popup
      this.showPublishPopup = true;
    },

    goToPreviousCategory() {
      if (this.canGoBack) {
        this.activeIndex = this.activeIndex - 1;
      }
    },

    goToNextCategory() {
      if (this.canGoNext) {
        this.activeIndex = this.activeIndex + 1;
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
  },
};
</script>

<style scoped>
.preview-dialog-overlay {
  backdrop-filter: blur(5px);
  background: rgba(0, 0, 0, 0.2) !important;
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
  /* Slightly increased horizontal padding so close button isn't flush to border */
  padding: 0 28px;
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

.preview-body {
  padding: 20px 24px 8px 24px;
  height: calc(80vh - 140px);
  min-height: 400px;
  max-height: calc(80vh - 140px);
  flex: 1;
  overflow: hidden;
}

.questions-scrollable-container {
  height: calc(80vh - 220px);
  max-height: calc(80vh - 220px);
  overflow-y: auto;
  padding: 20px;
}

.left-pane {
  border-right: 1px solid #f0f0f0;
  height: 100%;
  min-height: 400px;
  overflow: hidden;
}

.categories-scrollable-container {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.right-pane {
  height: 100%;
  padding-left: 8px;
}

.section-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tile-grid {
  padding: 12px 8px;
}

.tile-cell {
  padding: 6px;
}

.tile-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  height: 124px;
}

.tile-card.selected {
  border-color: #1a73e9;
  background: #f1f7ff;
}

.tile-content {
  height: 100%;
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
  /* Slightly increased right padding so footer buttons aren't flush to border */
  padding: 12px 28px 20px;
  background: #f1f7ff;
  flex-shrink: 0;
  /* border-top: 1px solid #e5e7eb; */
}

/* Header Button Styles */
.publish-btn {
  background-color: #1a73e9 !important;
  color: white !important;
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  height: 36px !important;
  min-width: 100px !important;
}

/* small margin for close and next buttons to keep them away from dialog edges */
.close-button {
  margin-right: 8px;
}

.next-btn {
  margin-right: 8px;
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

/* Mobile Responsive Styles */
.preview-body-container {
  position: relative;
}

.mobile-menu-btn {
  display: none;
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
  width: 320px;
  max-width: 85vw;
  height: 100vh;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
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
    padding-left: 0 !important;
  }

  .section-card {
    margin-left: 0 !important;
  }

  .publish-btn {
    min-width: 80px !important;
    height: 32px !important;
  }

  .preview-body {
    padding: 10px 16px 8px 16px;
    height: calc(100vh - 140px);
    min-height: calc(100vh - 140px);
    max-height: calc(100vh - 140px);
  }

  .questions-scrollable-container {
    height: calc(100vh - 200px);
    max-height: calc(100vh - 200px);
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
    padding: 8px 12px;
    height: calc(100vh - 136px);
    min-height: calc(100vh - 136px);
    max-height: calc(100vh - 136px);
  }

  .questions-scrollable-container {
    height: calc(100vh - 196px);
    max-height: calc(100vh - 196px);
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
</style>