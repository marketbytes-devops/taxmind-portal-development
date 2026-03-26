<template>
  <v-dialog
    v-model="dialog"
    max-width="1280px"
    max-height="60vh"
    persistent
    scrollable
    content-class="preview-dialog-overlay"
  >
    <v-card elevation="0" class="preview-card white">
      <!-- Header -->
      <v-layout class="preview-header" align-center justify-space-between>
        <v-flex py-2>
          <span class="preview-title">{{ LABELS.PREVIEW_TITLE }}</span>
        </v-flex>
        <v-flex shrink class="text-right">
          <v-btn icon :ripple="false" @click="close">
            <v-icon color="#5F5F5F">mdi-close</v-icon>
          </v-btn>
        </v-flex>
      </v-layout>
      <!-- Body -->
      <v-layout wrap class="preview-body backgroundOne">
        <!-- Left: Category Tiles (Figma style) -->
        <v-flex xs12 md3 class="left-pane white">
          <!-- Show categories if available -->
          <v-layout v-if="hasCategories" wrap class="tile-grid">
            <v-flex
              xs6
              v-for="(cat, i) in categoriesToShow"
              :key="cat.id || i"
              class="tile-cell"
            >
              <v-card
                elevation="0"
                class="tile-card"
                :class="{ selected: i === activeIndex }"
                @click="activeIndex = i"
              >
                <v-layout
                  column
                  align-center
                  justify-center
                  class="tile-content"
                >
                  <!-- Category Icon: Show image if available, else dummy image -->
                  <div class="category-icon-container">
                    <img
                      v-if="getCategoryIcon(cat)"
                      :src="getCategoryIcon(cat)"
                      :alt="cat.name"
                      class="category-icon"
                    />
                    <img
                      v-else
                      src="/logo.png"
                      :alt="cat.name"
                      class="category-icon"
                    />
                  </div>
                  <div
                    :class="['tile-label', i === activeIndex ? 'active' : '']"
                  >
                    {{ cat.name }}
                  </div>
                </v-layout>
              </v-card>
            </v-flex>
          </v-layout>
          <!-- Show fallback message when no categories -->
          <v-layout
            v-else
            column
            align-center
            justify-center
            class="empty-state"
          >
            <v-icon size="48" color="#CCCCCC" class="mb-4"
              >mdi-folder-outline</v-icon
            >
            <div class="empty-state-title">No Categories Available</div>
            <div class="empty-state-subtitle">
              Categories will appear here once they are added to the
              questionnaire.
            </div>
          </v-layout>
        </v-flex>
        <!-- Right: Questions Preview -->
        <v-flex xs12 md9 class="right-pane">
          <v-card elevation="0" class="section-card white ml-3">
            <!-- Show header only if there are categories -->
            <v-layout v-if="hasCategories" align-center class="section-header">
              <span class="section-title">{{ activeCategory.name }}</span>
            </v-layout>

            <!-- Show questions if categories exist -->
            <div v-if="hasCategories" class="questions-scrollable-container">
              <div
                v-for="(q, qi) in activeCategory.questions"
                :key="q.id || qi"
                class="question-item"
              >
                <!-- Question Label with improved styling -->
                <div class="question-label-container">
                  <div class="question-number">{{ qi + 1 }}.</div>
                  <div class="question-content">
                    <div class="question-text">
                      {{ q.questionText || q.label }}
                      <span v-if="q.isRequired || q.required" class="required"
                        >*</span
                      >
                    </div>

                    <!-- Show tooltip/help text if available -->
                    <div v-if="q.helpText" class="question-help-text">
                      {{ q.helpText }}
                    </div>

                    <!-- Options Display -->
                    <div v-if="hasOptions(q)" class="options-container">
                      <!-- Radio/Dropdown Options -->
                      <div
                        v-if="
                          q.questionType === 'radio' ||
                          q.questionType === 'dropdown'
                        "
                        class="option-pills-grid"
                      >
                        <div
                          v-for="(opt, oi) in q.options || []"
                          :key="oi"
                          class="option-pill"
                        >
                          <span class="option-text">{{
                            opt.label || opt
                          }}</span>
                        </div>
                      </div>

                      <!-- Text Input Placeholder -->
                      <div
                        v-else-if="q.questionType === 'text'"
                        class="text-input-placeholder"
                      >
                        <v-text-field
                          outlined
                          dense
                          readonly
                          placeholder="Enter your answer..."
                          class="preview-text-field"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Show fallback content when no categories -->
            <v-layout
              v-else
              column
              align-center
              justify-center
              class="empty-state questions-empty-state"
            >
              <v-icon size="48" color="#CCCCCC" class="mb-4"
                >mdi-help-circle-outline</v-icon
              >
              <div class="empty-state-title">No Questions Available</div>
              <div class="empty-state-subtitle">
                Questions will be displayed here once categories and questions
                are added to the questionnaire.
              </div>
            </v-layout>
          </v-card>
        </v-flex>
      </v-layout>
      <!-- Footer Actions -->
      <v-layout class="preview-footer" align-center justify-end>
        <v-btn
          :ripple="false"
          depressed
          outlined
          class="mr-3"
          @click="$emit('back')"
        >
          <span class="buttonText" style="color: #5f5f5f">{{
            LABELS.BACK
          }}</span>
        </v-btn>
        <v-btn :ripple="false" depressed color="primary" @click="$emit('next')">
          <span class="buttonText" style="color: white">{{ LABELS.NEXT }}</span>
        </v-btn>
      </v-layout>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "PreviewQuestionnaireDialog",
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    categories: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    const LABELS = {
      PREVIEW_TITLE: "Preview",
      BACK: "Back",
      NEXT: "Next",
    };

    return {
      LABELS,
      dialog: this.value,
      activeIndex: 0,
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
  },
  watch: {
    value(n) {
      this.dialog = n;
    },
    dialog(n) {
      this.$emit("input", n);
    },
  },
  methods: {
    close() {
      this.dialog = false;
    },

    getCategoryIcon(category) {
      // Check for icon in different possible formats
      if (category.icon) {
        // If it's a full URL or path
        if (
          typeof category.icon === "string" &&
          (category.icon.startsWith("http") || category.icon.startsWith("/"))
        ) {
          return category.icon;
        }
        // If it's an object with filePath or key
        if (typeof category.icon === "object") {
          return category.icon.filePath || category.icon.key || null;
        }
      }
      return null;
    },

    hasOptions(question) {
      return (
        question.options &&
        Array.isArray(question.options) &&
        question.options.length > 0
      );
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
}

.preview-header {
  height: 66px;
  padding: 0 24px;
}

.preview-title {
  font-family: "DM Sans", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #1a73e9;
}

.preview-body {
  padding: 20px 24px 8px 24px;
  height: calc(60vh - 140px);
  min-height: 400px;
  max-height: calc(60vh - 140px);
}

.questions-scrollable-container {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
}

.left-pane {
  border-right: 1px solid #f0f0f0;
  height: 100%;
  min-height: 400px;
}

/* Tile grid to mirror Figma side section */
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
}

.section-title {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1a73e9;
}

/* Questions Container */
.questions-container {
  padding: 24px;
}

.question-item {
  margin-bottom: 32px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 24px;
}

.question-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

/* Question Layout */
.question-label-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.question-number {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1a73e9;
  min-width: 24px;
  margin-top: 2px;
}

.question-content {
  flex: 1;
}

.question-text {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  margin-bottom: 8px;
  line-height: 1.5;
}

.required {
  color: #d53e3e;
  margin-left: 4px;
}

.question-help-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  margin-bottom: 16px;
  font-style: italic;
}

/* Options Styling */
.options-container {
  margin-top: 12px;
}

.option-pills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.option-pill {
  height: 44px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #ffffff;
  cursor: default;
  transition: all 0.2s ease;
}

.option-pill:hover {
  border-color: #1a73e9;
  background: #f8faff;
}

.option-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #374151;
}

/* Text Input Placeholder */
.text-input-placeholder {
  margin-top: 8px;
  max-width: 400px;
}

.preview-text-field {
  pointer-events: none;
}

.preview-text-field ::v-deep(.v-input__control) {
  background-color: #f9fafb;
}

.preview-text-field ::v-deep(.v-text-field__details) {
  display: none;
}

/* Empty State Styles */
.empty-state {
  height: 100%;
  min-height: 400px;
  padding: 40px 20px;
  text-align: center;
}

.questions-empty-state {
  min-height: 400px;
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
  padding: 12px 24px 20px;
  border-top: 1px solid #e0e0e0;
}

.container {
  height: 60vh;
  overflow-y: auto;
}
</style>