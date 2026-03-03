<template>
    <div class="document-upload-container">
        <!-- <div class="header">
            <div class="icon">
                <i class="fas fa-upload"></i>
            </div>
            <h2>Upload Required Documents</h2>
            <p>Upload necessary files for income documents. PDFs are accepted for claims or other tax-related
                documentation for the year 2025.</p>
        </div> -->

        <!-- Application Documents Section -->
        <div class="documents-section">
            <div v-if="!documentsData.applicationDocumentsGrouped || documentsData.applicationDocumentsGrouped.length === 0"
                class="no-data-message">
                <i class="fas fa-folder-open"></i>
                <p>No documents available</p>
            </div>
            <div v-else class="documents-grid">
                <DocumentUploadContainer v-for="category in documentsData.applicationDocumentsGrouped"
                    :key="category.id" :category="category" idPrefix="regular" :showCategoryHeader="true"
                    :showNoteBelow="true" :useVIcon="true" :applicationId="applicationData.id"
                    @file-uploaded="$emit('file-uploaded', $event)" @file-removed="$emit('file-removed', $event)"
                    @all-files-uploaded="$emit('all-files-uploaded', $event)"
                    @show-error="$emit('show-error', $event)" />
            </div>
        </div>

        <!-- Additional Documents Section -->
        <div class="additional-documents-section">
            <h2 class="section-title">Additional Documents</h2>

            <div v-if="!documentsData.additionalApplicationDocumentsGrouped || documentsData.additionalApplicationDocumentsGrouped.length === 0"
                class="no-data-message">
                <i class="fas fa-folder-open"></i>
                <p>No additional documents available requested</p>
            </div>
            <div v-else class="documents-grid">
                <DocumentUploadContainer v-for="category in documentsData.additionalApplicationDocumentsGrouped"
                    :key="category.id" :category="category" idPrefix="regular" :showCategoryHeader="true"
                    :showNoteBelow="true" :useVIcon="true" :applicationId="applicationData.id"
                    @file-uploaded="$emit('file-uploaded', $event)" @file-removed="$emit('file-removed', $event)"
                    @all-files-uploaded="$emit('all-files-uploaded', $event)"
                    @show-error="$emit('show-error', $event)" />
            </div>
        </div>

        <!-- Submit Button -->
        <div class="submit-section" :class="{ 'sticky': true }">
            <div class="submit-content">

                <button class="submit-btn" @click="submitDocuments" :disabled="!isFormValid || isSubmitting">
                    <i class="fas"
                        :class="isSubmitting ? 'fa-spinner fa-spin' : hasRejectedDocuments ? 'fa-exclamation-triangle' : 'fa-paper-plane'"></i>
                    {{ submitButtonMessage }}
                </button>
            </div>
        </div>

        <!-- Confirmation Dialog -->
        <div v-if="showConfirmDialog" class="dialog-overlay" @click.self="showConfirmDialog = false">
            <div class="dialog-content">
                <div class="dialog-header">
                    <v-icon>mdi-alert-circle</v-icon>
                    <h3>Confirm Document Submission</h3>
                </div>
                <div class="dialog-body">
                    <p>Once you submit, you will not be able to re-upload documents. Are you sure you want to continue?
                    </p>
                </div>
                <div class="dialog-actions">
                    <button class="cancel-btn" @click="showConfirmDialog = false">Cancel</button>
                    <button class="confirm-btn" @click="confirmSubmit">Confirm</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import DocumentUploadContainer from './DocumentUploadContainer.vue';
import ApplicationService from '@/services/application.js';

export default {
    name: 'DocumentUpload',
    components: {
        DocumentUploadContainer
    },

    props: {
        applicationData: {
            type: Object,
            default: () => ({

            })
        },

        documentsData: {
            type: Object,
            default: () => ({
                applicationDocumentsGrouped: [],
                additionalApplicationDocumentsGrouped: []
            })
        }
    },

    data() {
        return {
            showConfirmDialog: false,
            isSubmitting: false
        };
    },

    computed: {
        hasRejectedDocuments() {
            const allCategories = [
                ...(this.documentsData.applicationDocumentsGrouped || []),
                ...(this.documentsData.additionalApplicationDocumentsGrouped || [])
            ];

            return allCategories.some(category => category.status === 'rejected');
        },

        rejectedDocumentsCount() {
            const allCategories = [
                ...(this.documentsData.applicationDocumentsGrouped || []),
                ...(this.documentsData.additionalApplicationDocumentsGrouped || [])
            ];

            return allCategories.filter(category => category.status === 'rejected').length;
        },

        isFormValid() {
            const allCategories = [
                ...(this.documentsData.applicationDocumentsGrouped || []),
                ...(this.documentsData.additionalApplicationDocumentsGrouped || [])
            ];

            // Check if all required documents are uploaded
            const allRequiredUploaded = allCategories.every(category => {
                if (category.isRequired) {
                    return category.files && category.files.length > 0;
                }
                return true;
            });

            // Form is valid only if all required docs are uploaded AND no documents are rejected
            return allRequiredUploaded && !this.hasRejectedDocuments;
        },

        submitButtonMessage() {
            if (this.hasRejectedDocuments) {
                return `Submit Documents`;
            }

            if (this.isSubmitting) {
                return 'Submitting...';
            }

            return 'Submit Documents';
        },

        totalRequiredCount() {
            const allCategories = [
                ...(this.documentsData.applicationDocumentsGrouped || []),
                ...(this.documentsData.additionalApplicationDocumentsGrouped || [])
            ];
            return allCategories.filter(category => category.isRequired).length;
        },

        uploadedCount() {
            const allCategories = [
                ...(this.documentsData.applicationDocumentsGrouped || []),
                ...(this.documentsData.additionalApplicationDocumentsGrouped || [])
            ];
            return allCategories.filter(category => {
                if (category.isRequired) {
                    return category.files && category.files.length > 0;
                }
                return false;
            }).length;
        }
    },

    methods: {
        formatFileSize(bytes) {
            const size = parseInt(bytes);
            if (size === 0) return '0 Bytes';

            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(size) / Math.log(k));

            return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        submitDocuments() {
            if (!this.isFormValid) {
                this.$emit('show-error', 'Please upload all required documents');
                return;
            }

            // Show confirmation dialog
            this.showConfirmDialog = true;
        },

        async confirmSubmit() {
            this.showConfirmDialog = false;
            this.isSubmitting = true;

            try {
                // Call the API to check documents uploaded
                const response = await ApplicationService.checkDocumentsUploaded(this.applicationData.id);

                console.log('Documents check response:', response);

                // Emit success event to reload application data
                this.$emit('documents-submitted-success');

                // Show success message
                this.$emit('show-success', 'Documents submitted successfully! Redirecting to your profile...');

                // Upon final submission of the application, redirect the user to their profile
                setTimeout(() => {
                    this.$router.push({ path: '/profile' }).catch(err => {
                        console.error('Navigation to profile failed:', err);
                    });
                }, 1500);
            } catch (error) {
                console.error('Error submitting documents:', error);
                this.$emit('show-error', error.response?.data?.message || 'Failed to submit documents. Please try again.');
            } finally {
                this.isSubmitting = false;
            }
        }
    }
};
</script>

<style lang="scss" scoped>
$light-blue: #F1F7FF;
$blue: #1A73E9;

.document-upload-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    padding-top: 0px;
    font-family: "DM Sans", sans-serif;

    .header {
        text-align: center;
        margin-bottom: 40px;

        .icon {
            width: 60px;
            height: 60px;
            background: #4285f4;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;

            i {
                color: white;
                font-size: 24px;
            }
        }

        h2 {
            color: #333;
            margin-bottom: 10px;
            font-size: 24px;
            font-weight: 600;
        }

        p {
            color: #666;
            font-size: 14px;
            max-width: 600px;
            margin: 0 auto;
        }
    }

    .documents-section,
    .additional-documents-section {
        margin-bottom: 40px;
    }

    .section-title {
        color: #4285f4;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 20px;
        text-align: left;
        padding-top: 20px;
        border-top: 1px dotted grey;
    }

    .no-data-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        background: #f8f9fa;
        border: 2px dashed #dadce0;
        border-radius: 8px;
        color: #9aa0a6;
        text-align: center;

        i {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.6;
        }

        p {
            font-size: 16px;
            margin: 0;
            font-weight: 500;
        }
    }

    .documents-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 30px;

        &>* {
            flex: 0 0 350px;
            width: 350px;
        }

        @media (max-width: 767px) {
            gap: 15px;

            &>* {
                flex: 0 0 100%;
                width: 100%;
            }
        }
    }

    .category-header {
        margin-bottom: 10px;
        text-align: left;
    }

    .document-category {
        .upload-container {
            border: 1px solid #e8eaed;
            border-radius: 8px;
            // padding: 16px;
            background: #ffffff;
            transition: all 0.3s ease;
            min-height: auto;
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

            .category-header {
                margin-bottom: 14px;
                text-align: left;

                span {
                    text-align: left;

                }

                h3 {
                    color: #202124;
                    font-size: 14px;
                    font-weight: 500;
                    margin: 0;
                    line-height: 1.4;

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
                // margin-bottom: 12px;
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

                    &:hover {
                        background: #f1f3f4;
                        border-color: #4285f4;
                    }

                    i {
                        font-size: 12px;
                    }
                }
            }

            .uploaded-files {
                min-height: 150px;
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
                }

                .file-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 0;
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

                        .file-icon {
                            color: #ea4335;
                            font-size: 16px;
                            width: 16px;
                            height: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }

                        .file-name {
                            font-weight: 400;
                            color: #5f6368;
                            font-size: 13px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            flex: 1;
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

                        &:hover {
                            background: #f1f3f4;
                            color: #5f6368;
                        }

                        i {
                            font-size: 12px;
                        }
                    }
                }
            }

            .status-message {
                text-align: left;
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 10px;
                padding: 8px 12px;
                border-radius: 6px;
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                font-size: 12px;

                &.success {
                    background: #d4edda;
                    border-color: #c3e6cb;
                    color: #155724;
                }

                i {
                    font-size: 12px;
                }
            }




        }
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

    .submit-section {
        margin-top: 40px;
        margin-bottom: 20px;

        &.sticky {
            position: sticky;
            bottom: 0;
            background: white;
            border-top: 2px solid #e8eaed;
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
            z-index: 2;
            margin: 0 -20px;
            padding: 16px 20px;
        }

        .submit-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;

            .submit-info {
                flex: 1;
                min-width: 250px;

                .submit-status {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 8px;

                    i {
                        font-size: 24px;

                        &.fa-check-circle {
                            color: #34a853;
                        }

                        &.fa-exclamation-circle {
                            color: #ea4335;
                        }
                    }

                    .status-text {
                        text-align: left;

                        h3 {
                            margin: 0;
                            font-size: 16px;
                            font-weight: 600;
                            color: #202124;
                        }

                        p {
                            margin: 4px 0 0 0;
                            font-size: 13px;
                            color: #5f6368;
                        }
                    }
                }

                .upload-progress {
                    margin-left: 12px;
                    text-align: left;

                    .progress-text {
                        font-size: 13px;
                        color: #5f6368;
                        font-weight: 500;
                        text-align: left;
                    }
                }
            }

            .submit-btn {
                background: #34a853;
                color: white;
                border: none;
                padding: 14px 32px;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                white-space: nowrap;
                flex-shrink: 0;

                i {
                    font-size: 14px;
                }

                &:hover:not(:disabled) {
                    background: #2d8f47;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(52, 168, 83, 0.3);
                }

                &:disabled {
                    background: #9aa0a6;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                &.has-rejected {
                    background: #ea4335;

                    &:hover:not(:disabled) {
                        background: #d33b2c;
                        box-shadow: 0 4px 12px rgba(234, 67, 53, 0.3);
                    }

                    &:disabled {
                        background: #ea4335;
                        opacity: 0.7;
                    }
                }
            }
        }
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
    .document-upload-container {
        padding: 15px;
        padding-bottom: 100px;

        .documents-grid {
            grid-template-columns: 1fr;
            gap: 15px;
        }

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

        .submit-section {
            &.sticky {
                margin: 0 -15px;
                padding: 12px 15px;
            }

            .submit-content {
                flex-direction: column;
                align-items: stretch;
                gap: 12px;

                .submit-info {
                    .submit-status {
                        i {
                            font-size: 20px;
                        }

                        .status-text {
                            text-align: left;

                            h3 {
                                font-size: 14px;
                            }

                            p {
                                font-size: 12px;
                            }
                        }
                    }

                    .upload-progress {
                        margin-left: 12px;

                        .progress-text {
                            font-size: 12px;
                        }
                    }
                }

                .submit-btn {
                    width: 100%;
                    justify-content: center;
                    padding: 12px 24px;
                    font-size: 14px;
                }
            }
        }
    }
}

.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease;

    .dialog-content {
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.3s ease;
        text-align: left;

        .dialog-header {
            display: flex;
            text-align: left;
            gap: 12px;
            margin-bottom: 16px;

            i {
                color: #ff9800;
                font-size: 24px;
            }

            h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }
        }

        .dialog-body {
            margin-bottom: 24px;

            p {
                margin: 0;
                color: #666;
                font-size: 14px;
                line-height: 1.6;
            }
        }

        .dialog-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;

            button {
                padding: 10px 24px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;

                &.cancel-btn {
                    background: #f1f3f4;
                    color: #5f6368;

                    &:hover {
                        background: #e8eaed;
                    }
                }

                &.confirm-btn {
                    background: #34a853;
                    color: white;

                    &:hover {
                        background: #2d8f47;
                        box-shadow: 0 2px 8px rgba(52, 168, 83, 0.3);
                    }
                }
            }
        }
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        transform: translateY(20px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@media (max-width: 480px) {
    .document-upload-container {
        padding: 10px;

        .documents-grid {
            gap: 12px;
        }

        .document-category .upload-container {
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
</style>
