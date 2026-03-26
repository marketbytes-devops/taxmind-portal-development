<template>
  <!-- Vuetify Dialog Component -->
  <v-dialog
    v-model="dialogVisible"
    persistent
    max-width="750px"
    content-class="add-category-dialog"
  >
    <v-card class="add-category-modal" elevation="0">
      <!-- Modal Header - Blue Header 48px height -->
      <div class="modal-header">
        <span class="header-title">{{
          isEditMode ? "Edit Category" : "Add Category"
        }}</span>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Category Name Field -->
        <div class="form-group">
          <div class="form-label">Category Name</div>
          <div class="input-container">
            <input
              v-model="formData.categoryName"
              type="text"
              placeholder="Enter category name"
              class="custom-input"
            />
          </div>
        </div>

        <!-- Upload Category Icon Field -->
        <div class="form-group">
          <div class="form-label">Upload Category Icon</div>
          <div class="upload-row">
            <div class="upload-input-container">
              <input
                :value="uploadFileName"
                type="text"
                readonly
                class="custom-input upload-input"
              />
            </div>
            <button class="upload-btn" @click="triggerFileUpload">
              <v-icon size="16" color="#1A73E9">mdi-upload</v-icon>
              Upload
            </button>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*,.svg"
            style="display: none"
            @change="handleFileUpload"
          />
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <div class="footer-separator"></div>
        <div class="button-group">
          <!-- Cancel Button -->
          <button class="cancel-btn" @click="handleCancel">Cancel</button>

          <!-- Save & Add New Button - Only show in add mode -->
          <button
            v-if="!isEditMode"
            class="save-add-new-btn"
            @click="handleSaveAndAddNew"
            :disabled="!isFormValid || isSaving"
          >
            <span v-if="isSaving">Saving...</span>
            <span v-else>Save & add new</span>
          </button>

          <!-- Save Button -->
          <button
            class="save-btn"
            @click="handleSave"
            :disabled="!isFormValid || isSaving"
          >
            <span v-if="isSaving">{{
              isEditMode ? "Updating..." : "Saving..."
            }}</span>
            <span v-else>{{ isEditMode ? "Update" : "Save" }}</span>
          </button>
        </div>
      </div>
    </v-card>

    <!-- Loading Overlay -->
    <vue-element-loading
      :active="appLoading"
      spinner="bar-fade-scale"
      color="primary"
      size="60"
      is-full-screen
    />

    <!-- Snackbar Notifications -->
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
  </v-dialog>
</template>

<script>
import { questionnaire as questionnaireApi, files } from "@/api";
export default {
  name: "AddCategoryModal",
  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
    LABELS: {
      type: Object,
      required: true,
    },
    questionnaireId: {
      type: [String, Number],
      default: null,
    },
    mode: {
      type: String,
      default: "add",
      validator: (value) => ["add", "edit"].includes(value),
    },
    categoryData: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      formData: {
        categoryName: "",
        categoryIcon: null,
      },
      uploadFileName: "",
      appLoading: false,
      isSaving: false,
      showSnackBar: false,
      timeout: 5000,
      msg: "",
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.showModal;
      },
      set(value) {
        if (!value) {
          this.$emit("close");
        }
      },
    },
    isFormValid() {
      return this.formData.categoryName.trim().length > 0;
    },
    isEditMode() {
      return this.mode === "edit";
    },
  },
  watch: {
    showModal(newVal) {
      if (newVal) {
        // If modal opened in edit mode with data -> populate fields
        if (this.isEditMode && this.categoryData) {
          this.populateFormForEdit();
        } else {
          // Opened in add mode -> ensure fields are cleared
          this.resetForm();
        }
      } else {
        // Modal closed -> reset form to be safe
        this.resetForm();
      }
    },
    categoryData: {
      handler(newVal) {
        if (newVal && this.isEditMode && this.showModal) {
          this.populateFormForEdit();
        }
      },
      deep: true,
    },
  },
  methods: {
    handleCancel() {
      this.resetForm();
      this.$emit("close");
    },

    async handleSave() {
      if (!this.isFormValid) return;
      this.isSaving = true;
      this.appLoading = true;
      try {
        const name = this.formData.categoryName.trim();
        const payload = { name };

        // Include questionnaireId if provided
        if (this.questionnaireId) {
          payload.questionnaireId = this.questionnaireId;
        }

        let result;
        if (this.isEditMode && this.categoryData?.id) {
          // Update existing category
          result = await questionnaireApi.updateCategory(
            this.categoryData.id,
            payload
          );

          // Upload icon if provided
          if (result.success && this.formData.categoryIcon) {
            try {
              await files.uploadCategoryIcon(
                this.categoryData.id,
                this.formData.categoryIcon
              );
            } catch (iconError) {
              console.warn("Icon upload failed:", iconError);
            }
          }

          this.msg = result.success
            ? result.message || "Category updated successfully"
            : result.message || "Failed to update category";
        } else {
          // Create new category
          result = await questionnaireApi.createCategory(payload);

          // Upload icon if provided and category was created successfully
          if (result.success && this.formData.categoryIcon && result.data?.id) {
            try {
              await files.uploadCategoryIcon(
                result.data.id,
                this.formData.categoryIcon
              );
            } catch (iconError) {
              console.warn("Icon upload failed:", iconError);
            }
          }

          this.msg = result.success
            ? result.message || "Category created"
            : result.message || "Failed to create category";
        }

        this.showSnackBar = true;
        if (result.success) {
          const eventName = this.isEditMode
            ? "categoryUpdated"
            : "categorySaved";
          this.$emit(eventName, {
            name,
            handled: true,
            data: result.data,
            originalData: this.categoryData,
            stayOpen: false,
          });
          this.resetForm();
          this.$emit("close");
        }
      } catch (e) {
        this.msg =
          e?.response?.data?.message ||
          `Failed to ${this.isEditMode ? "update" : "create"} category`;
        this.showSnackBar = true;
      } finally {
        this.isSaving = false;
        this.appLoading = false;
      }
    },

    async handleSaveAndAddNew() {
      // Only allow "Save & Add New" in add mode
      if (this.isEditMode || !this.isFormValid) return;

      this.isSaving = true;
      this.appLoading = true;
      try {
        const name = this.formData.categoryName.trim();
        const payload = { name };

        // Include questionnaireId if provided
        if (this.questionnaireId) {
          payload.questionnaireId = this.questionnaireId;
        }

        const result = await questionnaireApi.createCategory(payload);

        // Upload icon if provided and category was created successfully
        if (result.success && this.formData.categoryIcon && result.data?.id) {
          try {
            await files.uploadCategoryIcon(
              result.data.id,
              this.formData.categoryIcon
            );
          } catch (iconError) {
            console.warn("Icon upload failed:", iconError);
          }
        }

        this.msg = result.success
          ? result.message || "Category created! Add another category."
          : result.message || "Failed to create category";
        this.showSnackBar = true;
        if (result.success) {
          // stayOpen: true tells the parent not to close the modal for "Save & add new"
          this.$emit("categorySaved", {
            name,
            handled: true,
            data: result.data,
            stayOpen: true,
          });
          this.resetForm();
        }
      } catch (e) {
        this.msg = e?.response?.data?.message || "Failed to create category";
        this.showSnackBar = true;
      } finally {
        this.isSaving = false;
        this.appLoading = false;
      }
    },

    triggerFileUpload() {
      this.$refs.fileInput.click();
    },

    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.formData.categoryIcon = file;
        this.uploadFileName = file.name;
      }
    },

    populateFormForEdit() {
      if (this.categoryData) {
        this.formData.categoryName = this.categoryData.name || "";

        // Handle category icon - the icon is a nested object with fileName property
        if (this.categoryData.icon) {
          if (
            typeof this.categoryData.icon === "object" &&
            this.categoryData.icon.fileName
          ) {
            // Icon is an object with fileName property
            this.uploadFileName = this.categoryData.icon.fileName;
          } else if (typeof this.categoryData.icon === "string") {
            // Icon is a string path - extract filename
            const filename =
              this.categoryData.icon.split("/").pop() ||
              this.categoryData.icon.split("\\").pop() ||
              this.categoryData.icon;
            this.uploadFileName = filename;
          }
        }

        console.log("📝 Form populated for edit:", this.formData);
        console.log("📝 Category data received:", this.categoryData);
        console.log("📝 Icon object:", this.categoryData.icon);
        console.log("📝 Upload filename set to:", this.uploadFileName);
      }
    },

    resetForm() {
      this.formData = {
        categoryName: "",
        categoryIcon: null,
      };
      this.uploadFileName = "";
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = "";
      }
    },
  },
};
</script>

<style scoped>
/* Import common questionnaire styles */
@import "../../../../common/styles/questionnaire.css";

/* Dialog Custom Class Override */
::v-deep(.add-category-dialog) {
  box-shadow: none;
  margin: 0;
  overflow: visible;
}

/* Modal Container - Pixel Perfect 750px × 305px */
.add-category-modal {
  width: 750px !important;
  height: 305px !important;
  background: #ffffff !important;
  border-radius: 0 !important;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1) !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  margin: 0 !important;
}

/* Modal Header - Blue Header 48px height */
.modal-header {
  background: #1a73e9;
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-title {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  line-height: normal;
}

/* Modal Content */
.modal-content {
  flex: 1;
  padding: 20px 24px 0 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
}

/* Form Groups */
.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #5f5f5f;
  line-height: 24px;
  margin-bottom: 4px;
}

/* Input Container */
.input-container {
  width: 100%;
}

/* Custom Input Styling - Pixel Perfect */
.custom-input {
  width: 100%;
  height: 40px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0 12px;
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #000000;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s ease;
}

.custom-input::placeholder {
  color: rgba(95, 95, 95, 0.5);
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
}

.custom-input:hover {
  border-color: #9ca3af;
}

.custom-input:focus {
  border-color: #1a73e9;
  box-shadow: 0 0 0 1px #1a73e9;
}

/* Upload Row */
.upload-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.upload-input-container {
  flex: 1;
}

.upload-input {
  background-color: #ffffff;
  cursor: default;
}

.upload-btn {
  height: 36px;
  width: 104px;
  border-radius: 4px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  padding: 0 16px;
  border: 1px solid #1a73e9;
  color: #1a73e9;
  background-color: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s ease;
}

.upload-btn:hover {
  background-color: rgba(26, 115, 233, 0.04);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Footer */
.modal-footer {
  flex-shrink: 0;
  background: white;
  margin-top: auto;
}

.footer-separator {
  height: 1px;
  background-color: #e5e7eb;
  width: 100%;
}

.button-group {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 16px 24px;
  gap: 12px;
}

/* Button Styling - Pixel Perfect */
.cancel-btn {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #000000;
  text-transform: none;
  letter-spacing: normal;
  padding: 0;
  height: 36px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cancel-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  padding: 0 8px;
}

.save-add-new-btn {
  height: 36px;
  border-radius: 4px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  padding: 0 16px;
  width: 145px;
  border: 1px solid #1a73e9;
  color: #1a73e9;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-left: auto;
  margin-right: 12px;
}

.save-add-new-btn:hover:not(:disabled) {
  background-color: rgba(26, 115, 233, 0.04);
}

.save-add-new-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-btn {
  height: 36px;
  border-radius: 4px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  padding: 0 16px;
  width: 95px;
  background-color: #1a73e9;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background-color: #1557b7;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .add-category-modal {
    width: 90% !important;
    max-width: 750px !important;
    height: auto !important;
    min-height: 305px !important;
  }

  .modal-content {
    padding: 16px;
  }

  .button-group {
    flex-direction: column;
    gap: 8px;
    padding: 16px;
  }

  .cancel-btn,
  .save-add-new-btn,
  .save-btn {
    width: 100%;
    margin: 0;
  }

  .save-add-new-btn {
    margin-left: 0;
    margin-right: 0;
  }
}

@media (max-width: 480px) {
  .add-category-modal {
    width: 95% !important;
    margin: 16px !important;
  }

  .upload-row {
    flex-direction: column;
    gap: 8px;
  }

  .upload-btn {
    width: 100%;
  }
}
</style>