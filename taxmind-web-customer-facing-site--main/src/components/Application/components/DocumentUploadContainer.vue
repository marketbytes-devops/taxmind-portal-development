<template>
  <div class="document-category" :key="category.id">
    <div style="text-align: left;" class="category-header" v-if="showCategoryHeader">
      <span>{{ category.documentCategory.name }} <span v-if="category.isRequired" class="required-badge">*</span></span>
    </div>
    <div class="upload-container" :class="{
      'has-error': category.status === 'rejected',
      'is-accepted': category.status === 'accepted',
      'border-red': category.status === 'rejected' || (category.isRequired && (!category.files || category.files.length === 0)),
      'drag-over': isDragOver
    }" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop($event, category)">
      <div class="category-header" v-if="!showCategoryHeader">
        <h3>{{ category.documentCategory.name }} <span v-if="category.isRequired" class="required-badge">*</span></h3>
      </div>

      <!-- Upload Button -->
      <div v-if="category.status !== 'accepted'" class="upload-button">
        <input type="file" :id="`${idPrefix}-upload-${category.id}`" @change="handleFileUpload($event, category)"
          :accept="acceptedFileTypes" multiple style="display: none;" :disabled="!canUploadMoreFiles">
        <label :for="`${idPrefix}-upload-${category.id}`" class="upload-label"
          :class="{ 'disabled': !canUploadMoreFiles }">
          <v-icon style="margin-bottom: 2px;" :color="canUploadMoreFiles ? '#1a73e9' : '#9aa0a6'"
            small>mdi-plus</v-icon>
          {{ canUploadMoreFiles ? 'Upload' : 'Max files reached (5/5)' }}
        </label>
      </div>

      <!-- Approved Message -->
      <div v-else class="approved-message">
        <v-icon small color="#34a853">mdi-check-circle</v-icon>
        <span>Verified and Accepted</span>
      </div>

      <!-- Uploaded Files -->
      <div class="uploaded-files">
        <div v-if="!category.files || category.files.length === 0" class="no-files-message">
          <v-icon size="32" color="#9aa0a6">mdi-cloud-upload</v-icon>
          <p v-if="!isDragOver">Drag & drop files here or click the upload button</p>
          <p v-else class="drag-active">Drop files here to upload</p>
          <p class="file-types-hint">Supported: {{ supportedFileTypesText }}</p>
        </div>
        <div v-else class="file-list">
          <div class="file-item" v-for="file in sortedFiles(category.files)" :key="file.id">
            <div class="file-info" @click="previewFile(file)"
              :class="{ 'clickable': !file.uploading && !file.deleting }">
              <v-icon v-if="file.uploading" class="file-icon uploading rotating" size="16"
                color="#1a73e9">mdi-loading</v-icon>
              <v-icon v-else-if="file.deleting" class="file-icon deleting rotating" size="16"
                color="#ea4335">mdi-loading</v-icon>
              <v-icon v-else class="file-icon" size="16" :color="getFileType(file).color">{{ getFileType(file).icon
              }}</v-icon>
              <span class="file-name">{{ file.fileName }}</span>
              <span v-if="file.uploading" class="upload-status">Uploading...</span>
              <span v-if="file.deleting" class="upload-status">Deleting...</span>
            </div>
            <div v-if="category.status === 'accepted'" class="accepted-icon">
              <v-icon color="#34a853" size="20">mdi-check-circle</v-icon>
            </div>
            <button v-else class="remove-btn" @click="removeFile(category, file)"
              :disabled="file.uploading || file.deleting">
              <v-icon style="font-size: 15px;">mdi-close-circle</v-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Status Messages -->
      <div class="status-message error" v-if="category.status === 'rejected' && category.rejectedReason">
        <v-icon small>mdi-alert-circle</v-icon>
        <span>{{ category.rejectedReason }}</span>
      </div>

      <div class="status-message success" v-if="category.status === 'accepted'">
        <v-icon small>mdi-check-circle</v-icon>
        <span style="color: #ffffff" class="text-light">All documents have been verified and accepted</span>
      </div>
    </div>

    <div class="note" v-if="category.note && showNoteBelow">
      <p>Description : {{ category.note }}</p>
    </div>
    <div class="validation-message" v-if="category.isRequired && (!category.files || category.files.length === 0)">
      <v-icon small color="#ea4335">mdi-alert-circle</v-icon>
      <span>This document is required</span>
    </div>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="450" persistent>
      <v-card>
        <v-card-title class="dialog-title">
          <v-icon color="#ea4335" class="mr-2">mdi-alert-circle-outline</v-icon>
          Delete File?
        </v-card-title>
        <v-card-text class="dialog-text">
          <p>Are you sure you want to delete <strong>"{{ fileToDelete?.fileName }}"</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer></v-spacer>
          <v-btn text @click="cancelDelete" class="cancel-btn">
            Cancel
          </v-btn>
          <v-btn color="#ea4335" dark @click="confirmDelete" class="delete-btn">
            <v-icon small class="mr-1">mdi-delete</v-icon>
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { uploadFile, deleteFile } from '@/services/files.js';

export default {
  name: 'DocumentUploadContainer',
  props: {
    category: {
      type: Object,
      required: true
    },
    idPrefix: {
      type: String,
      default: ''
    },
    showCategoryHeader: {
      type: Boolean,
      default: true
    },
    showNoteBelow: {
      type: Boolean,
      default: true
    },
    useVIcon: {
      type: Boolean,
      default: true
    },
    applicationId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      uploadingFiles: new Set(), // Track files being uploaded
      deletingFiles: new Set(), // Track files being deleted
      showDeleteDialog: false,
      fileToDelete: null,
      categoryToDelete: null,
      isDragOver: false,
      // Global file validation configuration
      fileValidationConfig: {
        allowedTypes: {
          'application/pdf': {
            extension: 'pdf',
            name: 'PDF',
            icon: 'mdi-file-pdf-box',
            color: '#ea4335'
          },
          'image/png': {
            extension: 'png',
            name: 'PNG',
            icon: 'mdi-file-image',
            color: '#34a853'
          },
          'image/jpeg': {
            extension: 'jpeg',
            name: 'JPEG',
            icon: 'mdi-file-image',
            color: '#34a853'
          },
          'image/jpg': {
            extension: 'jpg',
            name: 'JPG',
            icon: 'mdi-file-image',
            color: '#34a853'
          },
          'application/msword': {
            extension: 'doc',
            name: 'DOC',
            icon: 'mdi-file-word-box',
            color: '#2b579a'
          },
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
            extension: 'docx',
            name: 'DOCX',
            icon: 'mdi-file-word-box',
            color: '#2b579a'
          }
        },
        maxFileSize: 2 * 1024 * 1024, // 2MB in bytes
        maxFiles: 5, // Maximum files per upload
        maxTotalFiles: 5, // Maximum total files per category
        errorMessages: {
          invalidType: 'Only PDF, PNG, JPEG, JPG, DOC, and DOCX files are allowed',
          fileSize: 'File size must be less than 2MB',
          maxFiles: 'You can upload maximum 5 files at once',
          maxTotalFiles: `Maximum 5 files allowed per category.Please remove some files before uploading new ones.`
        }
      }
    };
  },
  computed: {
    acceptedFileTypes() {
      return Object.keys(this.fileValidationConfig.allowedTypes).join(',');
    },

    supportedFileTypesText() {
      return Object.values(this.fileValidationConfig.allowedTypes)
        .map(type => type.name)
        .join(', ');
    },

    canUploadMoreFiles() {
      const existingFilesCount = this.category.files ? this.category.files.length : 0;
      return existingFilesCount < this.fileValidationConfig.maxTotalFiles;
    }
  },
  methods: {
    async handleFileUpload(event, category) {
      const files = Array.from(event.target.files);

      // First validate and limit files based on available slots
      const filesToUpload = this.validateAndLimitFiles(files, category);

      if (filesToUpload.length === 0) {
        event.target.value = '';
        return;
      }

      // Then validate each individual file
      const validFiles = filesToUpload.filter(file => this.validateFile(file));

      if (validFiles.length === 0) {
        event.target.value = '';
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const file of validFiles) {
        const success = await this.processFileUpload(file, category);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      // Clear input
      event.target.value = '';

      console.log(`Upload batch complete: ${successCount} success, ${failCount} failed`);
      if (successCount > 0 && failCount === 0) {
        console.log('Emitting all-files-uploaded event');
        this.$emit('all-files-uploaded', { category, successCount });
      } else {
        console.log('Not emitting all-files-uploaded due to failures or no successes');
      }
    },

    validateFile(file) {
      // Check file type
      if (!this.fileValidationConfig.allowedTypes[file.type]) {
        this.$emit('show-error', this.fileValidationConfig.errorMessages.invalidType);
        return false;
      }

      // Check file size
      if (file.size > this.fileValidationConfig.maxFileSize) {
        this.$emit('show-error', this.fileValidationConfig.errorMessages.fileSize);
        return false;
      }

      return true;
    },

    validateFileList(files, category) {
      // Check maximum files limit per upload
      if (files.length > this.fileValidationConfig.maxFiles) {
        this.$emit('show-error', this.fileValidationConfig.errorMessages.maxFiles);
        return false;
      }

      // Check total files limit (existing + new files)
      const existingFilesCount = category.files ? category.files.length : 0;
      const totalFilesAfterUpload = existingFilesCount + files.length;

      if (totalFilesAfterUpload > this.fileValidationConfig.maxTotalFiles) {
        this.$emit('show-error', this.fileValidationConfig.errorMessages.maxTotalFiles);
        return false;
      }

      return true;
    },

    validateAndLimitFiles(files, category) {
      // Check maximum files limit per upload
      if (files.length > this.fileValidationConfig.maxFiles) {
        this.$emit('show-error', this.fileValidationConfig.errorMessages.maxFiles);
        return [];
      }

      // Calculate available slots
      const existingFilesCount = category.files ? category.files.length : 0;
      const availableSlots = this.fileValidationConfig.maxTotalFiles - existingFilesCount;

      if (availableSlots <= 0) {
        this.$emit('show-error', 'Cannot upload more files. Maximum 5 files allowed per category.');
        return [];
      }

      // Limit files to available slots
      const filesToUpload = files.slice(0, availableSlots);

      // Show message if some files were skipped
      if (files.length > availableSlots) {
        const skippedCount = files.length - availableSlots;
        this.$emit('show-error', `Only ${availableSlots} files uploaded. ${skippedCount} files skipped due to 5-file limit.`);
      }

      return filesToUpload;
    },

    // Drag and drop handlers
    handleDragOver(event) {
      event.preventDefault();
      this.isDragOver = true;
    },

    handleDragLeave(event) {
      event.preventDefault();
      // Only set to false if leaving the container entirely
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.isDragOver = false;
      }
    },

    async handleDrop(event, category) {
      event.preventDefault();
      this.isDragOver = false;

      const files = Array.from(event.dataTransfer.files);

      // First validate and limit files based on available slots
      const filesToUpload = this.validateAndLimitFiles(files, category);

      if (filesToUpload.length === 0) {
        return;
      }

      // Then validate each individual file
      const validFiles = filesToUpload.filter(file => this.validateFile(file));

      if (validFiles.length === 0) {
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const file of validFiles) {
        const success = await this.processFileUpload(file, category);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      console.log(`Drag & Drop batch complete: ${successCount} success, ${failCount} failed`);
      if (successCount > 0 && failCount === 0) {
        console.log('Emitting all-files-uploaded event from drag & drop');
        this.$emit('all-files-uploaded', { category, successCount });
      } else {
        console.log('Not emitting all-files-uploaded due to failures or no successes');
      }
    },

    async processFileUpload(file, category) {
      const tempFileId = this.generateId();
      const tempFileObj = this.createTempFileObject(file, tempFileId);

      this.addFileToCategory(category, tempFileObj);
      this.uploadingFiles.add(tempFileId);

      try {
        const uploadResult = await uploadFile(
          {
            entityId: category.id,
            type: 'application_document',
            // metadata: {
            //   documentCategoryId: category.documentCategoryId || category.id,
            //   applicationDocumentId: category.id,
            //   isRequired: category.isRequired || false
            // }
          },
          file
        );

        if (uploadResult.success) {
          // Delete from uploading set before updating the file
          this.uploadingFiles.delete(tempFileId);
          this.handleSuccessfulUpload(category, tempFileId, file, uploadResult);
          return true; // Success
        } else {
          throw new Error(uploadResult.error || 'Upload failed: No success response');
        }
      } catch (error) {
        this.uploadingFiles.delete(tempFileId);
        this.handleUploadError(category, tempFileId, file, error);
        return false; // Failure
      }
    },

    createTempFileObject(file, tempFileId) {
      return {
        id: tempFileId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size.toString(),
        uploadedAt: new Date().toISOString(),
        uploading: true,
        file: file
      };
    },

    addFileToCategory(category, fileObj) {
      if (!category.files) {
        this.$set(category, 'files', []);
      }
      category.files.push(fileObj);
    },

    handleSuccessfulUpload(category, tempFileId, file, uploadResult) {
      const fileIndex = category.files.findIndex(f => f.id === tempFileId);
      if (fileIndex > -1) {
        // Use $set to ensure reactivity
        this.$set(category.files, fileIndex, {
          id: uploadResult.fileId || tempFileId,
          key: uploadResult.key,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size.toString(),
          uploadedAt: new Date().toISOString(),
          url: uploadResult.url,
          uploading: false
        });
      }

      category.status = 'pending';

      // Emit individual file upload event for success messages
      this.$emit('file-uploaded', {
        category,
        file: category.files[fileIndex],
        uploadResult
      });
    },

    handleUploadError(category, tempFileId, file, error) {
      console.error('File upload failed:', error);

      const fileIndex = category.files.findIndex(f => f.id === tempFileId);
      if (fileIndex > -1) {
        category.files.splice(fileIndex, 1);
      }

      // Extract error message from different error formats
      let errorMessage = 'Unknown error occurred';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.$emit('show-error', `Failed to upload ${file.name}: ${errorMessage}`);
    },

    removeFile(category, file) {
      // Don't allow deletion if file is being deleted or uploaded
      if (this.deletingFiles.has(file.id) || file.uploading) {
        return;
      }

      // Show custom confirmation dialog
      this.fileToDelete = file;
      this.categoryToDelete = category;
      this.showDeleteDialog = true;
    },

    cancelDelete() {
      this.showDeleteDialog = false;
      this.fileToDelete = null;
      this.categoryToDelete = null;
    },

    async confirmDelete() {
      const file = this.fileToDelete;
      const category = this.categoryToDelete;

      // Close dialog
      this.showDeleteDialog = false;

      // Mark file as being deleted
      this.deletingFiles.add(file.id);
      this.$set(file, 'deleting', true);

      try {
        // Call DELETE API
        await deleteFile(file.id, 'application_document');

        // Only remove from UI after successful API call
        const index = category.files.findIndex(f => f.id === file.id);
        if (index > -1) {
          category.files.splice(index, 1);

          // Update status if no files left
          if (category.files.length === 0) {
            category.status = category.isRequired ? 'pending' : null;
          }

          this.$emit('file-removed', { category, file });
        }
      } catch (error) {
        console.error('File deletion failed:', error);

        // Extract error message
        let errorMessage = 'Failed to delete file';
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.$emit('show-error', `${errorMessage}: ${file.fileName}`);
      } finally {
        // Clean up deleting state
        this.deletingFiles.delete(file.id);
        this.$set(file, 'deleting', false);
        this.fileToDelete = null;
        this.categoryToDelete = null;
      }
    },

    generateId() {
      return 'file_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    },

    getFileType(file) {
      // Check by mimeType first
      if (file.mimeType && this.fileValidationConfig.allowedTypes[file.mimeType]) {
        return this.fileValidationConfig.allowedTypes[file.mimeType];
      }

      // Fallback to checking file extension
      if (file.fileName) {
        const extension = file.fileName.split('.').pop().toLowerCase();
        const typeConfig = Object.values(this.fileValidationConfig.allowedTypes)
          .find(config => config.extension === extension);

        if (typeConfig) {
          return typeConfig;
        }
      }

      return {
        extension: 'unknown',
        name: 'Unknown',
        icon: 'mdi-file',
        color: '#5f6368'
      };
    },

    previewFile(file) {
      // Don't preview if file is still uploading
      if (file.uploading) {
        return;
      }

      // Check if file has a URL
      if (file.filePath) {
        window.open(file.filePath, '_blank');
      } else {
        // If no URL, show error message
        this.$emit('show-error', 'File preview is not available');
      }
    },

    sortedFiles(files) {
      // Return files in reverse order (latest first)
      if (!files || !Array.isArray(files)) {
        return [];
      }
      return [...files].reverse();
    }
  }
};
</script>

<style lang="scss" scoped>
$light-blue: #F1F7FF;
$blue: #1A73E9;

.document-category {
  .upload-container {
    border: 1px solid #e8eaed;
    border-radius: 8px;
    background: #ffffff;
    transition: all 0.3s ease;
    min-height: auto;
    min-width: 300px;
    text-align: justify;

    &:hover {
      border-color: #4285f4;
      box-shadow: 0 2px 8px rgba(66, 133, 244, 0.1);
    }

    &.border-red {
      border-color: #ea4335;
      background: #ffffff;
    }

    &.is-accepted {
      border-color: #34a853;
      background: #ffffff;
    }

    &.has-error {
      border-color: #ea4335;
      background: #ffffff;
    }

    &.drag-over {
      border-color: #4285f4;
      background: #f8f9ff;
      box-shadow: 0 4px 12px rgba(66, 133, 244, 0.2);
      transform: scale(1.02);
      transition: all 0.2s ease;

      .no-files-message {
        color: #4285f4;

        .drag-active {
          font-weight: 600;
          color: #1a73e9;
        }
      }
    }

    .category-header {
      margin-bottom: 14px;
      text-align: left;

      span {
        text-align: left;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      h3 {
        color: #202124;
        font-size: 14px;
        font-weight: 500;
        margin: 0;
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        .required-badge {
          color: #ea4335;
          font-size: 14px;
          font-weight: 500;
        }
      }
    }

    .required-badge {
      color: #ea4335;
      font-size: 14px;
      font-weight: 500;
    }

    .upload-button {
      background: $light-blue;
      padding: 10px;
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;

      .upload-label {
        display: inline-flex;
        align-items: end;
        gap: 6px;
        background: #f8f9fa;
        color: $blue;
        padding: 8px 12px;
        border: 1px solid #dadce0;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        font-size: 13px;
        transition: all 0.3s ease;

        &:hover:not(.disabled) {
          background: #f1f3f4;
          border-color: #4285f4;
        }

        &.disabled {
          background: #f8f9fa;
          color: #9aa0a6;
          border-color: #dadce0;
          cursor: not-allowed;
          opacity: 0.7;
        }

        i {
          font-size: 12px;
        }
      }
    }

    .approved-message {
      background: #e8f5e9;
      padding: 10px;
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #34a853;
      font-weight: 500;
      font-size: 13px;
      width: 100%;

      span {
        color: #2e7d32;
      }
    }

    .uploaded-files {
      height: 200px;
      overflow-y: auto;

      .no-files-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 150px;
        color: #9aa0a6;

        i {
          font-size: 32px;
          margin-bottom: 10px;
        }

        p {
          font-size: 14px;
          margin: 0;
        }

        .file-types-hint {
          font-size: 12px;
          color: #5f6368;
          margin-top: 8px;
          font-style: italic;
        }

        .drag-active {
          color: #1a73e9;
          font-weight: 600;
        }
      }

      .file-list {
        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 8px;
          border-bottom: 1px solid #f1f3f4;
          margin-bottom: 4px;

          &:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }

          .file-info {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            min-width: 0;
            transition: all 0.2s ease;

            &.clickable {
              cursor: pointer;

              &:hover {
                background-color: #f8f9fa;
                border-radius: 4px;
                padding: 4px 8px;
                margin: -4px -8px;

                .file-name {
                  color: #1a73e9;
                  text-decoration: underline;
                }
              }
            }

            .file-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
              display: flex;
              align-items: center;
              justify-content: center;

              &.pdf {
                color: #ea4335;
              }

              &.image {
                color: #34a853;
              }

              &.uploading {
                color: #1a73e9;
              }

              &.deleting {
                color: #ea4335;
              }

              &.rotating {
                animation: rotate 1s linear infinite;
              }
            }

            @keyframes rotate {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }

            .file-name {
              font-weight: 400;
              color: #5f6368;
              font-size: 13px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              flex: 1;
              width: 100px;
            }

            .upload-status {
              font-size: 11px;
              color: #1a73e9;
              font-style: italic;
              margin-left: 8px;
              flex-shrink: 0;
            }

            .file-icon.uploading {
              color: #1a73e9;
            }
          }

          .accepted-icon {
            margin-right: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            animation: scaleIn 0.3s ease-in-out;
          }

          @keyframes scaleIn {
            from {
              transform: scale(0);
              opacity: 0;
            }

            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          .remove-btn {
            background: transparent;
            color: #0077ee;
            border: none;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            margin-right: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            flex-shrink: 0;

            &:hover:not(:disabled) {
              background: #f1f3f4;
              color: #5f6368;
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            i {
              font-size: 12px;
              // color: #0077ee;
            }
          }
        }
      }
    }

    .status-message {
      text-align: left;

      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      animation: slideIn 0.3s ease-in-out;
      background: #fef5f5;

      &.error {
        background: #fef5f5;
        border: 1px solid #f8d7da;
        color: #ffffff;
      }

      &.success {
        background: #e8f5e9;
        border: 1px solid #c3e6cb;
        color: #2e7d32;
      }

      i {
        font-size: 12px;
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
}

.category-header {
  margin-bottom: 10px;
  text-align: left;
}

.required-badge {
  color: #ea4335;
  font-size: 14px;
  font-weight: 500;
}

.validation-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  color: #ea4335;
  font-size: 12px;
  font-weight: 500;

  i {
    font-size: 12px;
  }
}

.note {
  padding: 8px 10px;
  text-align: left;

  p {
    margin: 0;
    color: #5F5F5F;
    font-size: 12px;
    line-height: 1.4;
  }
}

@media (max-width: 768px) {
  .document-category {
    .upload-container {
      padding: 15px;
      min-height: 180px;

      .category-header {
        span {
          text-align: left;
        }

        h3 {
          font-size: 13px;
        }
      }

      .uploaded-files .file-item {
        padding: 8px 10px;

        .file-info {
          gap: 8px;

          .file-icon {
            font-size: 14px;
          }

          .file-details .file-name {
            font-size: 12px;
          }
        }

        .remove-btn {
          width: 18px;
          height: 18px;

          i {
            font-size: 9px;
          }
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .document-category {
    .upload-container {
      padding: 12px;
      min-height: 160px;

      .category-header span {
        font-size: 12px;
        text-align: left;
      }

      .upload-button .upload-label {
        padding: 8px 16px;
        font-size: 13px;
      }
    }
  }
}

// Delete Dialog Styles
::v-deep .v-dialog {
  .dialog-title {
    background: #fef5f5;
    color: #202124;
    font-size: 18px;
    font-weight: 600;
    padding: 20px 24px;
    display: flex;
    align-items: center;
  }

  .dialog-text {
    padding: 24px;
    font-size: 14px;
    color: #5f6368;

    p {
      margin: 0 0 12px 0;
      line-height: 1.6;

      &:last-child {
        margin-bottom: 0;
      }

      strong {
        color: #202124;
        font-weight: 600;
      }
    }

    .warning-text {
      color: #ea4335;
      font-weight: 500;
      font-size: 13px;
      margin-top: 16px;
    }
  }

  .dialog-actions {
    padding: 16px 24px;
    background: #f8f9fa;

    .cancel-btn {
      color: #5f6368;
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0;

      &:hover {
        background: rgba(95, 99, 104, 0.08);
      }
    }

    .delete-btn {
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0;
      box-shadow: none;

      &:hover {
        background: #d33828 !important;
      }
    }
  }
}
</style>
