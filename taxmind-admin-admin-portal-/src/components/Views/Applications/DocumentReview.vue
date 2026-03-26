<template>
  <div>
    <div style="padding-top: 0 !important;" class="document-review pa-6">
      <!-- Tab Navigation -->
      <div class="mx-5 mt-4">
        <div class="tab-container px-4 py-2" style="background-color: #f1f7ff">
          <div class="tab-buttons">
            <v-btn v-for="(tabItem, index) in tabs" :key="index"
              :class="['tab-button', { active: activeTab === index }]" @click="setActiveTab(index)" text :ripple="false"
              depressed>
              {{ tabItem.label }}
            </v-btn>
          </div>
          <!-- Upload Documents Button -->
            <v-btn
            v-if="applicantdata?.isDocumentsUploaded"
            :disabled="currentTabDocuments.length === 0|| documentsSubmitted"
            depressed
            :ripple="false"
            class="upload-documents-btn"
            @click="triggerMainDocumentUpload"
          >
            Submit Documents
          </v-btn>
          <div class="action-header">Action</div>
        </div>

        <!-- Document Cards List -->
        <div class="documents-list">
          <!-- Empty State -->
          <div v-if="currentTabDocuments.length === 0" class="empty-documents-state">
            <div class="empty-icon">
              <v-icon size="48" color="#E0E0E0">mdi-file-document-outline</v-icon>
            </div>
            <span class="empty-text">No documents available in this category</span>
          </div>

          <!-- Document Cards Grid -->
          <div v-else>
            <div v-for="(document, index) in currentTabDocuments" :key="index" class="document-category-section"
              :class="{ 'has-divider': index < currentTabDocuments.length - 1 }">
              <!-- Document Category Header -->
              <div class="document-header">
                <div class="document-info">
                  <div class="document-title">
                    {{ document.title }}
                    <span v-if="document.isRequired" class="required-asterisk">*</span>
                  </div>
                  <div class="document-date">{{ document.date }}</div>
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons">
                  <template
                    v-if="(activeTab === 0 || document.status === 'inReview') && !applicantdata.isDocumentReviewCompleted && canEdit('applications')">
                    <v-btn class="accept-button" @click="handleDocumentAction('accept', document.id, false)" depressed
                      :ripple="false">
                      <v-icon size="16" color="white" class="mr-1">mdi-check</v-icon>
                      Accept
                    </v-btn>
                    <v-btn class="reject-button" @click="handleDocumentAction('reject', document.id, false)" depressed
                      :ripple="false">
                      <v-icon size="16" color="#D53E3E" class="mr-1">mdi-close</v-icon>
                      Reject
                    </v-btn>
                    <v-btn v-if="document.status === 'inReview'" class="withdraw-button"
                      @click="handleDocumentAction('withdraw', document.id, false)" text :ripple="false">
                      <v-icon size="16" color="#FF9800" class="mr-1">mdi-undo-variant</v-icon>
                      Withdraw
                    </v-btn>
                  </template>
                  <div v-else-if="document.status === 'accepted' || document.status === 'rejected'" class="status-indicator" :class="document.status">
                    <v-icon size="16" :color="document.status === 'accepted' ? 'green' : '#D53E3E'" class="mr-1">
                      {{ document.status === 'accepted' ? 'mdi-check-circle' : 'mdi-close-circle' }}
                    </v-icon>
                    {{ document.status === 'accepted' ? 'Accepted' : 'Rejected' }}
                  </div>
                </div>
              </div>

              <!-- Files Grid Container -->
              <v-container fluid class="documents-grid pa-0">
                <v-layout wrap flex justify-start align-start>
                  <v-flex v-for="(file, fileIndex) in document.files" :key="fileIndex" xs12 sm6 md4 lg2 xl3
                    class="pa-2 d-flex">
                    <v-card class="document-card-grid" elevation="0"
                      @mouseenter="showViewOption(file.id || file.fileId)" @mouseleave="hideViewOption()">
                      <div v-if="getFileStatusText(document.status)" class="status-badge" :class="getFileStatusColor(document.status)">
                        {{ getFileStatusText(document.status) }}
                      </div>
                      <div class="document-preview">
                        <v-layout wrap justify-center>
                          <v-flex xs2 class="document-type-icon mb-2"
                            :style="getDocumentTypeStyle(getDocumentType(file.name))">
                            <span class="icon-text">{{ getDocumentType(file.name) }}</span>
                          </v-flex>
                          <v-flex xs12 class="document-name-text">
                            {{ formatDocumentName(file.name || 'Document') }}
                          </v-flex>
                        </v-layout>
                        <div v-if="hoveredDocument === (file.id || file.fileId)"
                          class="view-overlay" @click="downloadFile(file)">
                          <div class="view-icon-container">
                            <v-icon color="white" size="24">mdi-eye</v-icon>
                          </div>
                          <span class="view-overlay-text">View Document</span>
                        </div>
                      </div>
                      <v-layout wrap justify-center class="download-link-section">
                        <v-flex shrink align-self-center>
                          <span class="download-link" @click="downloadFile(file)">Download</span>
                        </v-flex>
                      </v-layout>
                    </v-card>
                  </v-flex>
                </v-layout>
              </v-container>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Documents Request Section -->
      <div class="additional-documents-section">
        <!-- Request Form Header -->
        <div class="request-header">
          <h3 class="request-title">Additional Documents Request</h3>
        </div>

        <!-- Request Form -->
        <div class="request-form-container">
          <div class="form-row">
            <!-- Document Type Dropdown -->
            <div class="form-group dropdown-group">
              <v-select v-model="selectedDocumentType" :items="documentTypes" item-text="name" item-value="id"
                placeholder="Tax Aggregation-Notary Attested or Payslips or Income proof" :hide-details="true" solo flat
                outlined dense clearable style="font-family: 'DM Sans', sans-serif" background-color="white"
                class="figma-dropdown" :disabled="applicantdata.isDocumentReviewCompleted">
                <template v-slot:append>
                  <v-icon v-if="!selectedDocumentType" color="#5F5F5F">
                    mdi-chevron-down
                  </v-icon>
                </template>
                <template v-slot:append-item>
                  <!-- This ensures proper dropdown behavior -->
                </template>
              </v-select>
            </div>

            <!-- Request Button -->
            <div class="form-group request-button-group">
              <v-btn
                :disabled="!selectedDocumentType || applicantdata.isDocumentReviewCompleted || !canEdit('applications')"
                color="primary" depressed :ripple="false" class="figma-request-btn" @click="openRequestPopup">
                Request
              </v-btn>
            </div>

            <!-- Upload Button -->
            <div class="form-group upload-button-group">
              <v-btn
                :disabled="!selectedDocumentType || isUploading || applicantdata.isDocumentReviewCompleted || !canEdit('applications')"
                depressed :ripple="false" class="figma-upload-btn" @click="triggerFileUpload" :loading="isUploading">
                <template v-if="!isUploading">
                  <v-img :src="require('@/assets/iconsets/uploadFile.svg')" width="16" height="16"
                    class="upload-icon"></v-img>
                  Upload
                </template>
                <template v-else>
                  Uploading...
                </template>
              </v-btn>
              <input ref="fileInput" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" @change="handleFileSelect"
                style="display: none"
                :disabled="!selectedDocumentType || isUploading || applicantdata.isDocumentReviewCompleted || !canEdit('applications')" />
            </div>
          </div>

          <!-- Uploaded Files Display -->
          <div v-if="uploadedFiles.length > 0" class="uploaded-files-section">
            <div class="uploaded-files-list">
              <div v-for="(file, index) in uploadedFiles" :key="index" class="uploaded-file-item-figma">
                <div class="file-icon-figma">
                  <v-img :src="require('@/assets/iconsets/commentsIcon.svg')" width="16" height="20"></v-img>
                </div>
                <span class="file-name-figma">{{ file.name }}</span>
                <v-btn icon x-small :ripple="false" class="remove-file-btn-figma" @click="removeFile(index)">
                  <v-icon size="12" color="#5F5F5F">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Documents Tabs -->
        <div class="additional-tabs-section">
          <!-- Tab Navigation -->
          <div class="additional-tab-container px-4 py-2" style="background-color: #f1f7ff">
            <div class="additional-tab-buttons">
              <v-btn v-for="(tabItem, index) in additionalTabs" :key="index" :class="[
                'additional-tab-button',
                { active: activeAdditionalTab === index },
              ]" @click="setActiveAdditionalTab(index)" text :ripple="false" depressed>
                {{ tabItem.label }}
              </v-btn>
            </div>
          <!-- Upload Documents Button -->
          <v-btn
          v-if="activeAdditionalTab === 1"
            :disabled="currentAdditionalTabDocuments.length === 0|| documentsSubmitted"
            depressed
            :ripple="false"
            class="upload-documents-btn"
            @click="triggerMainDocumentUpload"
          >
            Submit Documents
          </v-btn>
            <div class="additional-action-header">Action</div>
          </div>

          <!-- Additional Documents List -->
          <div class="additional-documents-list">
            <!-- Empty State for Additional Documents -->
            <div v-if="currentAdditionalTabDocuments.length === 0" class="additional-empty-state">
              <div class="empty-icon">
                <v-icon size="48" color="#E0E0E0">mdi-file-document-outline</v-icon>
              </div>
              <span class="empty-text">No additional documents in this category</span>
            </div>

            <!-- Additional Document Cards Grid -->
            <div v-else>
              <div v-for="(document, index) in currentAdditionalTabDocuments" :key="index"
                class="additional-document-category-section" :class="{
                  'has-divider': index < currentAdditionalTabDocuments.length - 1,
                }">
                <!-- Document Header -->
                <div class="additional-document-header">
                  <div class="additional-document-info">
                    <div class="additional-document-title">
                      {{ document.title }}
                      <span v-if="document.isRequired" class="required-asterisk">*</span>
                    </div>
                    <div class="additional-document-date">{{ document.date }}</div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="additional-action-buttons">
                    <template
                      v-if="activeAdditionalTab === 1 && !applicantdata.isDocumentReviewCompleted && canEdit('applications')">
                      <v-btn color="background2" dark :ripple="false" depressed
                        @click="handleDocumentAction('accept', document.id, true)">
                        <v-icon small class="mr-1">mdi-check</v-icon>
                        Accept
                      </v-btn>
                      <v-btn color="error" text :ripple="false"
                        @click="handleDocumentAction('reject', document.id, true)">
                        <v-icon small class="mr-1">mdi-close</v-icon>
                        Reject
                      </v-btn>
                    </template>
                    <v-btn
                      v-if="activeAdditionalTab === 0 && !applicantdata.isDocumentReviewCompleted && canEdit('applications')"
                      class="withdraw-button" @click="handleDocumentAction('withdraw', document.id, true)" text
                      :ripple="false">
                      <v-icon size="16" color="#FF9800" class="mr-1">mdi-undo-variant</v-icon>
                      Withdraw
                    </v-btn>
                    <div v-else-if="document.status === 'accepted' || document.status === 'rejected'"
                      class="status-indicator" :class="document.status">
                      <v-icon size="16" :color="document.status === 'accepted' ? 'green' : '#D53E3E'" class="mr-1">
                        {{ document.status === 'accepted' ? 'mdi-check-circle' : 'mdi-close-circle' }}
                      </v-icon>
                      {{ document.status === 'accepted' ? 'Accepted' : 'Rejected' }}
                    </div>
                  </div>
                </div>

                <!-- Files Grid Container -->
                <v-container fluid class="documents-grid pa-0">
                  <v-layout wrap flex justify-start align-start>
                    <v-flex v-for="(file, fileIndex) in document.files" :key="fileIndex" xs12 sm6 md4 lg2 xl3
                      class="pa-2 d-flex">
                      <v-card class="document-card-grid" elevation="0"
                        @mouseenter="showViewOption(file.id || file.fileId)" @mouseleave="hideViewOption()">
                        <div v-if="getFileStatusText(document.status)" class="status-badge" :class="getFileStatusColor(document.status)">
                          {{ getFileStatusText(document.status) }}
                        </div>
                        <div class="document-preview">
                          <v-layout wrap justify-center>
                            <v-flex xs2 class="document-type-icon mb-2"
                              :style="getDocumentTypeStyle(getDocumentType(file.name))">
                              <span class="icon-text">{{ getDocumentType(file.name) }}</span>
                            </v-flex>
                            <v-flex xs12 class="document-name-text">
                              {{ formatDocumentName(file.name || 'Document') }}
                            </v-flex>
                          </v-layout>
                          <div v-if="hoveredDocument === (file.id || file.fileId)"
                            class="view-overlay" @click="downloadAdditionalFile(file)">
                            <div class="view-icon-container">
                              <v-icon color="white" size="24">mdi-eye</v-icon>
                            </div>
                            <span class="view-overlay-text">View Document</span>
                          </div>
                        </div>
                        <v-layout wrap justify-center class="download-link-section">
                          <v-flex shrink align-self-center>
                            <span class="download-link" @click="downloadAdditionalFile(file)">Download</span>
                          </v-flex>
                        </v-layout>
                      </v-card>
                    </v-flex>
                  </v-layout>
                </v-container>
              </div>
            </div>
          </div>
        </div>

      </div>


      <!-- Loading Overlay -->
      <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" />

      <!-- Snackbar Notifications -->
      <v-snackbar v-model="showSnackBar" color="primary" right :timeout="timeout">
        <span style="color: white">{{ msg }}</span>
        <v-btn small text @click="showSnackBar = false">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-snackbar>

      <!-- Server Error Component -->
      <ServerError v-if="ServerError" />

      <!-- Document Request Popup -->
      <v-dialog v-model="showRequestPopup" max-width="600" persistent>
        <v-card class="request-popup-container">
          <div class="request-popup-header">
            <div class="request-popup-title">
              <v-icon color="#1A73E9" class="mr-2">mdi-file-document-outline</v-icon>
              Request Document
            </div>
            <v-btn icon @click="closeRequestPopup" class="close-button">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>

          <v-divider></v-divider>

          <v-card-text class="request-popup-content flex-column  pa-4">
            <!-- Document Type Dropdown -->
            <div class=" mb-4">
              <div class="form-label mb-1">Document Category <span class="required-asterisk">*</span></div>
              <v-select v-model="selectedDocumentType" :items="documentTypes" item-text="name" item-value="id" outlined
                dense placeholder="Select document category" hide-details class="document-type-select"
                background-color="white"></v-select>
            </div>

            <!-- Note Input -->
            <div class=" mb-4">
              <div class="form-label mb-1">Note <span class="required-asterisk">*</span></div>
              <v-textarea v-model="requestDescription" outlined hide-details
                placeholder="Enter note for the document request" background-color="white" rows="3"
                class="description-input"></v-textarea>
            </div>

            <!-- Required Checkbox -->
            <!-- <div class="form-row mb-4">
              <v-checkbox v-model="isDocumentRequired" label="Mark as required document" hide-details
                class="required-checkbox mt-0" color="#1A73E9"></v-checkbox>
            </div> -->
          </v-card-text>

          <v-divider></v-divider>

          <!-- Action Buttons -->
          <v-card-actions class="popup-buttons pa-4">
            <v-spacer></v-spacer>
            <v-btn class="popup-cancel-btn mr-3" depressed :ripple="false" @click="closeRequestPopup" text>
              Cancel
            </v-btn>
            <v-btn class="popup-request-btn" color="primary" depressed :ripple="false" :loading="requestLoading"
              @click="submitDocumentRequest" elevation="0">
              <v-icon left size="18">mdi-send</v-icon>
              Request
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Document Accept Confirmation Dialog -->
      <v-dialog v-model="showAcceptPopup" max-width="400" persistent>
        <div class="accept-popup-container">
          <div class="accept-popup-content-wrapper">
            <v-layout wrap justify-center>
              <v-flex shrink py-1>
                <!-- <v-img :src="require('@/assets/iconsets/check-circle.svg')" width="58" height="58" contain></v-img> -->
              </v-flex>
              <v-flex xs11 class="accept-popup-title">Accept document?</v-flex>

              <!-- Subtitle -->
              <v-flex xs11 class="accept-popup-subtitle">
                Are you sure you want to accept this document?
              </v-flex>

              <!-- Action Buttons -->
              <v-flex xs11>
                <div class="accept-popup-buttons">
                  <v-btn class="accept-cancel-btn" depressed :ripple="false" @click="closeAcceptPopup">
                    Cancel
                  </v-btn>
                  <v-btn class="accept-submit-btn" depressed :ripple="false" @click="submitAcceptDocument">
                    Accept
                  </v-btn>
                </div>
              </v-flex>
            </v-layout>
          </div>
        </div>
      </v-dialog>

      <!-- Document Reject Popup - Pixel Perfect Figma Design -->
      <v-dialog v-model="showRejectPopup" max-width="400" persistent>
        <div class="reject-popup-container">
          <!-- Popup Content -->
          <div class="reject-popup-content-wrapper">
            <v-layout wrap justify-center>
              <v-flex shrink py-1>
                <v-img :src="require('@/assets/iconsets/reject.svg')" width="58" height="58" contain></v-img></v-flex>
              <v-flex xs11 class="reject-popup-title">Reject document ?</v-flex>

              <!-- Subtitle -->
              <v-flex xs11 class="reject-popup-subtitle">
                Please enter reason for rejecting the document
              </v-flex>

              <!-- Dropdown for rejection reason -->
              <v-flex xs11 class="reject-dropdown-container">
                <v-select v-model="rejectReasonType" :items="rejectReasonOptions" placeholder="Document is incomplete"
                  outlined dense hide-details background-color="white">
                  <template v-slot:append>
                    <v-icon color="#5F5F5F">mdi-chevron-down</v-icon>
                  </template>
                </v-select>
              </v-flex>

              <!-- Reason Input -->
              <v-flex xs11>
                <v-textarea v-model="rejectReason" placeholder="Enter reason" outlined hide-details
                  background-color="white" rows="3"></v-textarea>

                <!-- Error Message -->
                <div v-if="rejectReasonError" class="reject-error-message">
                  {{ rejectReasonType
                    ? 'Please provide details about the rejection reason.'
                    : 'Please select a reason type and provide details.'
                  }}
                </div>

              </v-flex>
              <!-- Action Buttons -->
              <v-flex xs11>
                <div class="reject-popup-buttons">
                  <v-btn class="reject-cancel-btn" depressed :ripple="false" @click="closeRejectPopup">
                    Cancel
                  </v-btn>
                  <v-btn class="reject-submit-btn" depressed :ripple="false" @click="submitRejectDocument"
                    :loading="rejectLoading">
                    Reject
                  </v-btn>
                </div>
              </v-flex>
            </v-layout>
          </div>
        </div>
      </v-dialog>
    </div>
    <v-divider class=""></v-divider>
    <v-card-actions>
      <v-switch v-model="documentsCompleted" class="ml-6" label="Mark as Completed"
        :disabled="applicantdata.isDocumentReviewCompleted || !canEdit('applications')"
        @change="showCompletionConfirmation"></v-switch>
    </v-card-actions>

    <!-- Document Completion Confirmation Dialog -->
    <v-dialog v-model="showCompletionDialog" max-width="400" persistent>
      <div class="completion-popup-container">
        <div class="completion-popup-content-wrapper">
          <v-layout wrap justify-center>
            <v-flex shrink py-1>
              <v-icon size="58" color="#FF9800">mdi-alert-circle-outline</v-icon>
            </v-flex>
            <v-flex xs11 class="completion-popup-title">Mark Documents as Completed?</v-flex>

            <!-- Warning Message -->
            <v-flex xs11 class="completion-popup-subtitle">
              <strong>Warning:</strong> Once documents are marked as completed, they cannot be edited further. This
              action
              cannot be undone.
            </v-flex>

            <!-- Action Buttons -->
            <v-flex xs11>
              <div class="completion-popup-buttons">
                <v-btn class="completion-cancel-btn" depressed :ripple="false" @click="cancelCompletion">
                  Cancel
                </v-btn>
                <v-btn class="completion-confirm-btn" color="primary" depressed :ripple="false"
                  @click="confirmCompletion" :loading="completionLoading">
                  Confirm
                </v-btn>
              </div>
            </v-flex>
          </v-layout>
        </div>
      </div>
    </v-dialog>

    <!-- Document Withdraw Confirmation Dialog -->
    <v-dialog v-model="showWithdrawPopup" max-width="400" persistent>
      <div class="withdraw-popup-container">
        <div class="withdraw-popup-content-wrapper">
          <v-layout wrap justify-center>
            <v-flex shrink py-1>
              <v-icon size="58" color="#FF9800">mdi-alert-circle-outline</v-icon>
            </v-flex>
            <v-flex xs11 class="withdraw-popup-title">Withdraw Document?</v-flex>

            <!-- Warning Message -->
            <v-flex xs11 class="withdraw-popup-subtitle">
              Are you sure you want to withdraw this document?
            </v-flex>

            <!-- Action Buttons -->
            <v-flex xs11>
              <div class="withdraw-popup-buttons">
                <v-btn class="withdraw-cancel-btn" depressed :ripple="false" @click="closeWithdrawPopup">
                  Cancel
                </v-btn>
                <v-btn class="withdraw-confirm-btn" color="warning" depressed :ripple="false"
                  @click="submitWithdrawDocument" :loading="withdrawLoading">
                  Withdraw
                </v-btn>
              </div>
            </v-flex>
          </v-layout>
        </div>
      </div>
    </v-dialog>

    <!-- File Delete Confirmation Dialog -->
    <v-dialog v-model="showFileDeletePopup" max-width="400" persistent>
      <div class="delete-popup-container">
        <div class="delete-popup-content-wrapper">
          <v-layout wrap justify-center>
            <v-flex shrink py-1>
              <v-icon size="58" color="#D53E3E">mdi-alert-circle-outline</v-icon>
            </v-flex>
            <v-flex xs11 class="delete-popup-title">Delete File?</v-flex>

            <!-- Warning Message -->
            <v-flex xs11 class="delete-popup-subtitle">
              Are you sure you want to delete "{{ fileToDelete?.name }}"? This action cannot be undone.
            </v-flex>

            <!-- Action Buttons -->
            <v-flex xs11>
              <div class="delete-popup-buttons">
                <v-btn class="delete-cancel-btn" depressed :ripple="false" @click="closeFileDeletePopup">
                  Cancel
                </v-btn>
                <v-btn class="delete-confirm-btn" color="error" depressed :ripple="false" @click="submitFileDelete"
                  :loading="fileDeleteLoading">
                  Delete
                </v-btn>
              </div>
            </v-flex>
          </v-layout>
        </div>
      </div>
    </v-dialog>
  </div>

</template>

<script>
import http from "@/api/http";
import {
  getApplicationDocuments,
  acceptApplicationDocument,
  rejectApplicationDocument,
  acceptAdditionalDocument,

  withdrawApplicationDocument,
  withdrawAdditionalDocument,
  getDocumentCategories,
  updateApplicationDocumentsUploaded,
  checkDocumentsUploaded
} from "@/api/modules/applications";
import { files } from "@/api"
import permissionMixin from '@/mixins/permissionMixin';
export default {
  name: "DocumentReview",
  mixins: [permissionMixin],
  props: {
    applicantdata: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showCompletionDialog: false,
      completionLoading: false,
      // Withdraw dialog properties
      showWithdrawPopup: false,
      withdrawDocumentId: null,
      isWithdrawingAdditionalDocument: false,
      withdrawLoading: false,
      // File delete dialog properties
      showFileDeletePopup: false,
      fileToDelete: null,
      documentToUpdate: null,
      isAdditionalFileDelete: false,
      fileDeleteLoading: false,
      // Loading states
      appLoading: false,
      requestLoading: false,
      rejectLoading: false,
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      ServerError: false,

      // Original tab system
      activeTab: 0,
      tabs: [
        { label: "To Be Reviewed" },
        { label: "To Be Uploaded" },
        { label: "Accepted" },
        { label: "Rejected" },
      ],

      // Additional documents request
      selectedDocumentType: null,
      uploadedFiles: [],
      isUploading: false,
      uploadedFileInfo: null,

      // Request popup
      showRequestPopup: false,
      requestDescription: "",
      isDocumentRequired: true,

      // Accept popup
      showAcceptPopup: false,
      acceptDocumentId: null,
      isAcceptingAdditionalDocument: false,

      // Reject popup
      showRejectPopup: false,
      rejectReason: "",
      rejectReasonType: "",
      rejectDocumentId: null,
      rejectReasonError: false,
      isRejectingAdditionalDocument: false,
      rejectReasonOptions: [
        "Document quality is poor",
        "Document is incomplete",
        "Document is not valid",
        "Document format is incorrect"
      ],

      // Document types for dropdown
      documentTypes: [
        { id: 1, name: "Medical Expenses Tax Credit" },
        { id: 2, name: "Dependent Relative Tax Credit" },
        { id: 3, name: "Income Statement" },
        { id: 4, name: "Bank Statement" },
        { id: 5, name: "Property Tax Receipt" },
        { id: 6, name: "Employment Certificate" },
        { id: 7, name: "Insurance Documents" },
        { id: 8, name: "Education Expenses" },
      ],

      // Additional documents tab system
      activeAdditionalTab: 0,
      additionalTabs: [
        { label: "Pending Requests" },
        { label: "In Review" },
        { label: "Accepted" },
        { label: "Rejected" },
      ],

      // API data
      applicationDocumentsGrouped: {
        toBeReviewed: [],
        pending: [],
        accepted: [],
        rejected: []
      },
      additionalApplicationDocumentsGrouped: {
        toBeReviewed: [],
        pending: [],
        accepted: [],
        rejected: []
      },

      // Mapped documents for UI
      documents: {
        "To Be Reviewed": [],
        "To Be Uploaded": [],
        "Accepted": [],
        "Rejected": []
      },

      // Additional documents data
      additionalDocuments: {
        "Pending Requests": [],
        "In Review": [],
        "Accepted": [],
        "Rejected": []
      },

      // Document completion status
      documentsCompleted: false,

      // Documents submission tracking
      documentsSubmitted: false,

      // Card view hover state
      hoveredDocument: null,
    };
  },
  computed: {
    currentTabDocuments() {
      const currentTabLabel = this.tabs[this.activeTab].label;
      return this.documents[currentTabLabel] || [];
    },
    currentAdditionalTabDocuments() {
      const currentTabLabel =
        this.additionalTabs[this.activeAdditionalTab].label;
      return this.additionalDocuments[currentTabLabel] || [];
    },
  },
  methods: {
    // Document completion confirmation methods
    showCompletionConfirmation(value) {
      if (value) {
        // Only show confirmation when turning ON the switch
        this.showCompletionDialog = true;
      } else {
        // When turning OFF, just update the value
        this.documentsCompleted = false;
      }
    },

    cancelCompletion() {
      // Reset the switch and close dialog
      this.documentsCompleted = false;
      this.showCompletionDialog = false;
    },

    confirmCompletion() {
      this.completionLoading = true;

      console.log('DocumentReview: Confirming completion for application ID:', this.applicantdata.id);

      // Call the API to update document status
      updateApplicationDocumentsUploaded(this.applicantdata.id)
        .then(() => {
          this.completionLoading = false;
          this.showCompletionDialog = false;

          // Show success message
          this.msg = "Documents marked as completed successfully";
          this.showSnackBar = true;

          console.log('DocumentReview: Emitting status-updated event');
          // Emit event to parent component to refresh data
          this.$emit('documents-completed');
          // Emit status-updated event to trigger getData() in applicationView
          this.$emit('status-updated');
        })
        .catch(error => {
          this.completionLoading = false;
          this.documentsCompleted = false;
          this.showCompletionDialog = false;

          // Show error message
          this.msg = error.response?.data?.error || "Failed to mark documents as completed";
          this.showSnackBar = true;
        });
    },
    // Original tab methods
    setActiveTab(index) {
      this.activeTab = index;
    },
    acceptDocument(documentId) {
      this.acceptDocumentId = documentId;
      this.isAcceptingAdditionalDocument = false;
      this.showAcceptPopup = true;
    },

    closeAcceptPopup() {
      this.showAcceptPopup = false;
      // this.acceptDocumentId = null;
      this.isAcceptingAdditionalDocument = false;
    },

    async submitAcceptDocument() {
      try {
        this.appLoading = true;
        this.closeAcceptPopup();

        let response;
        if (this.isAcceptingAdditionalDocument) {
          response = await acceptAdditionalDocument(this.applicantdata.id, this.acceptDocumentId);
        } else {
          response = await acceptApplicationDocument(this.acceptDocumentId);
        }

        this.appLoading = false;

        if (response.data.status) {
          const documentType = this.isAcceptingAdditionalDocument ? "Additional document" : "Document";
          this.msg = `${documentType} accepted successfully`;
          this.showSnackBar = true;

          // Refresh documents list
          await this.fetchApplicationDocuments();

          // Emit event to trigger getData() in parent
          this.$emit('status-updated');
        } else {
          this.msg = response.data.message || "Failed to accept document";
          this.showSnackBar = true;
        }
      } catch (err) {
        this.appLoading = false;
        this.handleApiError(err);
      }
    },
    rejectDocument(documentId) {
      this.rejectDocumentId = documentId;
      this.rejectReason = "";
      this.rejectReasonType = "";
      this.rejectReasonError = false;
      this.showRejectPopup = true;
    },
    downloadFile(file) {
      if (file.filePath) {
        // Open the file in a new tab
        window.open(file.filePath, '_blank');
      } else {
        console.log("File path not available for:", file.name);
        this.msg = "File path not available";
        this.showSnackBar = true;
      }
    },

    // Withdraw document functionality
    async withdrawDocument(documentId) {
      try {
        this.appLoading = true;

        const response = await withdrawApplicationDocument(documentId);

        this.appLoading = false;

        if (response.data.status) {
          this.msg = "Document withdrawn successfully";
          this.showSnackBar = true;

          // Refresh documents list
          await this.fetchApplicationDocuments();

          // Emit event to trigger getData() in parent
          this.$emit('status-updated');
          return true;
        } else {
          this.msg = response.data.message || "Failed to withdraw document";
          this.showSnackBar = true;
          return false;
        }
      } catch (err) {
        this.appLoading = false;
        this.handleApiError(err);
        return false;
      }
    },

    // Additional documents tab methods
    setActiveAdditionalTab(index) {
      this.activeAdditionalTab = index;
    },

    // Request popup methods
    openRequestPopup() {
      this.requestDescription = "";
      this.showRequestPopup = true;
    },
    closeRequestPopup() {
      this.showRequestPopup = false;
      this.requestDescription = "";
      this.selectedDocumentType = null;
      this.isDocumentRequired = true;
    },

    // Reject popup methods
    closeRejectPopup() {
      this.showRejectPopup = false;
      this.rejectReason = "";
      this.rejectReasonType = "";
      this.rejectDocumentId = null;
      this.rejectReasonError = false;
      this.isRejectingAdditionalDocument = false;
    },

    async submitRejectDocument() {
      // Validate reason - require both reason type and detailed reason
      if (!this.rejectReason.trim()) {
        this.rejectReasonError = true;
        this.msg = "Please enter a rejection reason";
        this.showSnackBar = true;
        return;
      }

      // If using predefined reason types, require one to be selected
      if (this.rejectReasonOptions.length > 0 && !this.rejectReasonType && this.rejectReason.trim().length < 10) {
        this.rejectReasonError = true;
        this.msg = "Please select a reason type or provide a detailed explanation";
        this.showSnackBar = true;
        return;
      }

      this.rejectReasonError = false;

      try {
        this.rejectLoading = true;

        // Prepare rejection data
        const rejectionReason = this.rejectReasonType
          ? `${this.rejectReasonType}: ${this.rejectReason}`
          : this.rejectReason;

        const rejectionData = {
          reason: rejectionReason
        };

        let response;
        if (this.isRejectingAdditionalDocument) {
          response = await rejectApplicationDocument(this.rejectDocumentId, rejectionData);
        } else {
          response = await rejectApplicationDocument(this.rejectDocumentId, rejectionData);
        }

        this.rejectLoading = false;

        if (response.data.status) {
          const documentType = this.isRejectingAdditionalDocument ? "Additional document" : "Document";
          this.msg = `${documentType} rejected successfully`;
          this.showSnackBar = true;

          // Refresh documents list
          await this.fetchApplicationDocuments();

          // Emit event to trigger getData() in parent
          this.$emit('status-updated');
        } else {
          this.msg = response.data.message || "Failed to reject document";
          this.showSnackBar = true;
        }

        // Close popup
        this.closeRejectPopup();
      } catch (err) {
        this.rejectLoading = false;
        this.handleApiError(err);
        this.closeRejectPopup();
      }
    },

    // File upload methods
    async triggerMainDocumentUpload() {
      try {
        this.appLoading = true;
        console.log('Application ID:', this.applicantdata.id);

        const response = await checkDocumentsUploaded(this.applicantdata.id);

        this.appLoading = false;

        if (response.data.status) {
          this.msg = response.data.message || "Documents checked successfully";
          this.showSnackBar = true;

          // Disable button after successful submission
          this.documentsSubmitted = true;

          // Emit event to trigger getData() in parent
          this.$emit('status-updated');
        } else {
          this.msg = response.data.message || "Failed to check documents";
          this.showSnackBar = true;
        }
      } catch (err) {
        this.appLoading = false;
        this.handleApiError(err);
      }
    },

    triggerFileUpload() {
      if (this.selectedDocumentType) {
        // Reset the file input value before clicking to ensure it triggers change event
        // even if the same file is selected again
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = "";
        }
        this.$refs.fileInput.click();
      } else {
        this.msg = "Please select a document category first";
        this.showSnackBar = true;
      }
    },
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file && this.validateFile(file)) {
        // Clear previous uploaded files and file info
        this.uploadedFiles = [];
        this.uploadedFileInfo = null;

        // Set the new file and start upload
        this.uploadedFiles = [file];
        this.uploadFile(file); // Automatically start upload
      } else if (!file) {
        // If no file is selected, reset the file input
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = "";
        }
      }
    },
    handleDrop(event) {
      const file = event.dataTransfer.files[0];
      if (file && this.validateFile(file)) {
        // Clear previous uploaded files and file info
        this.uploadedFiles = [];
        this.uploadedFileInfo = null;

        // Set the new file and start upload
        this.uploadedFiles = [file];
        this.uploadFile(file); // Automatically start upload
      }
    },
    async uploadFile(file) {
      try {
        this.isUploading = true;
        this.appLoading = true;

        await this.uploadFiles(file);

        // Reset file input to allow selecting the same file again
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = "";
        }
        this.uploadedFiles = '';
        this.selectedDocumentType = null
        this.isUploading = false;
        this.appLoading = false;
      } catch (error) {
        this.isUploading = false;
        this.appLoading = false;
        this.handleApiError(error);

        // Reset file input even on error
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = "";
        }
      }
    },
    validateFile(file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.msg = "File size must be less than 5MB";
        this.showSnackBar = true;
        return false;
      }

      // Check file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];

      if (!allowedTypes.includes(file.type)) {
        this.msg =
          "Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.";
        this.showSnackBar = true;
        return false;
      }

      return true;
    },
    removeFile(index) {
      this.uploadedFiles.splice(index, 1);
    },

    // API submission for document request
    async submitDocumentRequest() {
      try {
        this.requestLoading = true;

        // Validate form inputs
        if (!this.selectedDocumentType) {
          this.msg = "Please select a document category";
          this.showSnackBar = true;
          this.requestLoading = false;
          return;
        }

        if (!this.requestDescription.trim()) {
          this.msg = "Please enter a note for the document request";
          this.showSnackBar = true;
          this.requestLoading = false;
          return;
        }

        // Prepare request data according to required structure
        const requestData = {
          applicationId: this.applicantdata.id,
          documentCategoryId: this.selectedDocumentType,
          isRequired: this.isDocumentRequired,
          note: this.requestDescription
        };

        const response = await http.post(
          "/applications/documents/request",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
          }
        );

        this.requestLoading = false;

        if (response.data.status) {
          this.msg =
            response.data.message ||
            "Document request submitted successfully";
          this.showSnackBar = true;
          this.$emit('status-updated');
          // Reset form and close popup
          this.selectedDocumentType = null;
          this.requestDescription = "";
          this.isDocumentRequired = true;
          this.showRequestPopup = false;

          // Refresh additional documents list
          this.fetchApplicationDocuments();
        } else {
          this.msg = response.data.error || "Failed to submit request";
          this.selectedDocumentType = null;
          this.requestDescription = "";
          this.isDocumentRequired = true;
          this.showRequestPopup = false;
          this.showSnackBar = true;
        }
      } catch (err) {
        this.selectedDocumentType = null;
        this.requestDescription = "";
        this.isDocumentRequired = true;
        this.showRequestPopup = false;
        this.showSnackBar = true;
        this.requestLoading = false;
        this.handleApiError(err);
      }
    },

    // Unified document action methods
    handleDocumentAction(action, documentId, isAdditional = false) {
      switch (action) {
        case 'accept':
          this.acceptDocumentId = documentId;
          this.isAcceptingAdditionalDocument = isAdditional;
          this.showAcceptPopup = true;
          break;
        case 'reject':
          this.rejectDocumentId = documentId;
          this.rejectReason = "";
          this.rejectReasonType = "";
          this.rejectReasonError = false;
          this.isRejectingAdditionalDocument = isAdditional;
          this.showRejectPopup = true
          break;
        case 'withdraw':
          this.withdrawDocumentConfirm(documentId, isAdditional);
          break;
      }
    },

    // Methods for additional documents
    // These methods are kept separate from the main document methods

    // Additional document action methods
    acceptAdditionalDocument(documentId) {
      this.handleDocumentAction('accept', documentId, true);
    },

    rejectAdditionalDocument(documentId) {
      this.handleDocumentAction('reject', documentId, true);
    },

    // Withdraw confirmation method
    withdrawDocumentConfirm(documentId, isAdditional = false) {
      this.withdrawDocumentId = documentId;
      this.isWithdrawingAdditionalDocument = isAdditional;
      this.showWithdrawPopup = true;
    },

    // Close withdraw popup
    closeWithdrawPopup() {
      this.showWithdrawPopup = false;
      this.withdrawDocumentId = null;
      this.isWithdrawingAdditionalDocument = false;
    },

    // Submit withdraw document
    async submitWithdrawDocument() {
      try {
        this.withdrawLoading = true;

        if (this.isWithdrawingAdditionalDocument) {
          await this.withdrawDocument(this.withdrawDocumentId);
        } else {
          await this.withdrawDocument(this.withdrawDocumentId);
        }

        this.withdrawLoading = false;
        this.closeWithdrawPopup();
      } catch (err) {
        this.withdrawLoading = false;
        this.handleApiError(err);
        this.closeWithdrawPopup();
      }
    },

    downloadAdditionalFile(file) {
      if (file.filePath) {
        // Open the file in a new tab
        window.open(file.filePath, '_blank');
      } else {
        console.log("File path not available for:", file.name);
        this.msg = "File path not available";
        this.showSnackBar = true;
      }
    },

    // Withdraw additional document functionality
    async withdrawAdditionalDocument(documentId) {
      try {
        this.appLoading = true;

        const response = await withdrawAdditionalDocument(this.applicantdata.id, documentId);

        this.appLoading = false;

        if (response.data.status) {
          this.msg = "Additional document withdrawn successfully";
          this.showSnackBar = true;

          // Refresh documents list
          await this.fetchApplicationDocuments();

          // Emit event to trigger getData() in parent
          this.$emit('status-updated');
          return true;
        } else {
          this.msg = response.data.message || "Failed to withdraw additional document";
          this.showSnackBar = true;
          return false;
        }
      } catch (err) {
        this.appLoading = false;
        this.handleApiError(err);
        return false;
      }
    },

    async uploadFiles(file) {
      try {
        // Clear previous upload info
        this.uploadedFileInfo = null;

        const params = {
          type: 'application_document_direct',
          entityId: this.applicantdata.id,
          filename: file.name,
          "metadata": {
            "applicationId": this.applicantdata.id,
            "documentCategoryId": this.selectedDocumentType
          }
        };



        const response = await files.uploadFile(params, file, 'application_document_direct');

        if (response && response.success) {
          // Store the file information
          this.uploadedFileInfo = {
            key: response.fileId,
            url: response.url,
            type: this.getFileMessageType(file.type),
            presignedExpiresIn: response.presignedExpiresIn
          };

          // Show success notification
          this.msg = "File uploaded successfully";
          this.showSnackBar = true;

          // Refresh document list to show the new file
          await this.fetchApplicationDocuments();

          return response;
        } else {
          throw new Error(response?.error || "File upload failed");
        }
      } catch (error) {
        this.msg = error.message || "File upload failed. Please try again.";
        this.showSnackBar = true;
        this.uploadedFiles = [];
        throw error;
      }
    },

    getFileMessageType(mimeType) {
      if (mimeType.includes('image')) return 'image';
      if (mimeType.includes('pdf')) return 'pdf';
      if (mimeType.includes('word') || mimeType.includes('doc')) return 'document';
      return 'file';
    },



    organizeAdditionalDocuments(documentsData) {
      // Organize additional documents by their status
      const organized = {
        "Pending Requests": [],
        "In Review": [],
        Accepted: [],
        Rejected: [],
      };

      documentsData.forEach((doc) => {
        switch (doc.status) {
          case "PENDING":
            organized["Pending Requests"].push(doc);
            break;
          case "IN_REVIEW":
            organized["In Review"].push(doc);
            break;
          case "APPROVED":
            organized["Accepted"].push(doc);
            break;
          case "DECLINED":
            organized["Rejected"].push(doc);
            break;
        }
      });

      this.additionalDocuments = organized;
    },
    async fetchGetDocumentCategories() {
      const response = await getDocumentCategories();
      if (response.data.status) {
        this.documentTypes = response.data.data;
      }
    },
    // Fetch application documents from API
    async fetchApplicationDocuments() {
      try {
        this.appLoading = true;

        const response = await getApplicationDocuments(this.applicantdata.id);

        this.appLoading = false;

        if (response.data.status) {
          // Store the API response data
          this.applicationDocumentsGrouped = response.data.data.applicationDocumentsGrouped || {
            toBeReviewed: [],
            pending: [],
            accepted: [],
            rejected: []
          };

          this.additionalApplicationDocumentsGrouped = response.data.data.additionalApplicationDocumentsGrouped || {
            toBeReviewed: [],
            pending: [],
            accepted: [],
            rejected: []
          };

          // Map API data to UI structure
          this.mapDocumentsForUI();
          this.mapAdditionalDocumentsForUI();
        } else {
          this.msg = response.data.message || "Failed to fetch documents";
          this.showSnackBar = true;
        }
      } catch (err) {
        this.appLoading = false;
        this.handleApiError(err);
      }
    },

    // Map API documents data to UI structure
    mapDocumentsForUI() {
      this.documents = {
        "To Be Reviewed": this.mapDocumentArray(this.applicationDocumentsGrouped.toBeReviewed),
        "To Be Uploaded": this.mapDocumentArray(this.applicationDocumentsGrouped.pending),
        "Accepted": this.mapDocumentArray(this.applicationDocumentsGrouped.accepted),
        "Rejected": this.mapDocumentArray(this.applicationDocumentsGrouped.rejected)
      };
    },

    // Map additional documents data to UI structure
    mapAdditionalDocumentsForUI() {
      this.additionalDocuments = {
        "Pending Requests": this.mapDocumentArray(this.additionalApplicationDocumentsGrouped.pending),
        "In Review": this.mapDocumentArray(this.additionalApplicationDocumentsGrouped.toBeReviewed),
        "Accepted": this.mapDocumentArray(this.additionalApplicationDocumentsGrouped.accepted),
        "Rejected": this.mapDocumentArray(this.additionalApplicationDocumentsGrouped.rejected)
      };
    },

    // Helper method to map document array from API to UI format
    mapDocumentArray(documents) {
      if (!Array.isArray(documents)) return [];

      return documents.map(doc => ({
        id: doc.id,
        title: doc.documentCategory?.name || 'Unknown Document',
        date: this.formatDate(doc.createdAt || doc.updatedAt),
        isRequired: doc.isRequired || false,
        status: doc.status,
        note: doc.note,
        rejectedReason: doc.rejectedReason,
        isAdditionalDocument: doc.isAdditionalDocument || false,
        files: this.mapFilesArray(doc.files || [])
      }));
    },

    // Helper method to map files array
    mapFilesArray(files) {
      if (!Array.isArray(files)) return [];

      return files.map(file => ({
        id: file.id,
        name: file.fileName || 'Unknown File',
        isClickable: true,
        filePath: file.filePath,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        fileId: file.fileId || file.id // Ensure we have fileId for deletion
      }));
    },

    // File deletion methods
    confirmFileDelete(file, document, isAdditional = false) {
      this.fileToDelete = file;
      this.documentToUpdate = document;
      this.isAdditionalFileDelete = isAdditional;
      this.showFileDeletePopup = true;
    },

    closeFileDeletePopup() {
      this.showFileDeletePopup = false;
      this.fileToDelete = null;
      this.documentToUpdate = null;
      this.isAdditionalFileDelete = false;
    },

    async submitFileDelete() {
      try {
        this.fileDeleteLoading = true;

        const fileId = this.fileToDelete.fileId || this.fileToDelete.id;
        const type = "application_document";

        // Call the delete API
        const response = await files.deleteFile(fileId, type);

        this.fileDeleteLoading = false;

        if (response.data.status || response.status === 200) {
          this.msg = "File deleted successfully";
          this.showSnackBar = true;

          // Refresh documents list to reflect the deletion
          await this.fetchApplicationDocuments();

          // Emit event to trigger getData() in parent
          this.$emit('status-updated');
        } else {
          this.msg = response.data?.message || "Failed to delete file";
          this.showSnackBar = true;
        }

        this.closeFileDeletePopup();
      } catch (err) {
        this.fileDeleteLoading = false;
        this.msg = err.response?.data?.message || err.message || "Failed to delete file";
        this.showSnackBar = true;
        this.closeFileDeletePopup();
      }
    },

    // Helper method to format date
    formatDate(dateString) {
      if (!dateString) return 'Unknown Date';

      const date = new Date(dateString);
      const options = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };

      return date.toLocaleDateString('en-GB', options);
    },

    handleApiError(err) {
      if (err.response) {
        if (err.response.status === 500) {
          this.ServerError = true;
          this.msg = "A server error occurred. Please try again later.";
        } else {
          this.ServerError = false;
          this.msg = err.response.data.error || err.response.data.message || "An error occurred.";
        }
      } else {
        this.ServerError = true;
        this.msg = "An unexpected error occurred. Please try again.";
      }
      this.showSnackBar = true;
    },

    // Helper methods for card view
    showViewOption(documentId) {
      this.hoveredDocument = documentId;
    },

    hideViewOption() {
      this.hoveredDocument = null;
    },

    getDocumentType(fileName) {
      if (!fileName) return "PDF";
      const extension = fileName.split(".").pop().toLowerCase();
      switch (extension) {
        case "pdf": return "PDF";
        case "jpg":
        case "jpeg": return "JPG";
        case "png": return "PNG";
        case "doc":
        case "docx": return "DOC";
        case "xls":
        case "xlsx": return "XLS";
        default: return "PDF";
      }
    },

    getDocumentTypeStyle(fileType) {
      const type = fileType ? fileType.toLowerCase() : "pdf";
      let backgroundColor = "#dc2626";
      switch (type) {
        case "pdf": backgroundColor = "#dc2626"; break;
        case "jpg":
        case "jpeg":
        case "png": backgroundColor = "#0284c7"; break;
        case "doc":
        case "docx": backgroundColor = "#2563eb"; break;
        case "xls":
        case "xlsx": backgroundColor = "#16a34a"; break;
        default: backgroundColor = "#6366f1";
      }
      return { backgroundColor };
    },

    formatDocumentName(name) {
      if (!name) return "Document.pdf";
      const nameWithoutExt = name.replace(/\.[^/.]+$/, "");
      if (nameWithoutExt.length > 15) {
        const words = nameWithoutExt.split(" ");
        if (words.length > 1) {
          const midPoint = Math.ceil(words.length / 2);
          const firstLine = words.slice(0, midPoint).join(" ");
          const secondLine = words.slice(midPoint).join(" ");
          return `${firstLine}\n${secondLine}`;
        }
      }
      return nameWithoutExt;
    },

    getFileStatusText(status) {
      switch (status) {
        case 'accepted': return 'Accepted';
        case 'rejected': return 'Rejected';
        case 'pending': return 'Pending';
        case 'toBeReviewed': return 'To Be Reviewed';
        default: return '';
      }
    },

    getFileStatusColor(status) {
      switch (status) {
        case 'accepted': return 'success';
        case 'rejected': return 'error';
        case 'pending': return 'warning';
        case 'toBeReviewed': return 'info';
        default: return 'warning';
      }
    },
  },

  mounted() {
    // Fetch documents when component is mounted
    this.fetchGetDocumentCategories();
    this.fetchApplicationDocuments();

    // Set initial state based on applicantdata
    if (this.applicantdata.isDocumentReviewCompleted) {
      this.documentsCompleted = true;
    }

  },
};
</script>

<style scoped>
/* Document Completion Confirmation Dialog Styles */
.completion-popup-container {
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.completion-popup-content-wrapper {
  padding: 24px;
}

.completion-popup-title {
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  color: #000000;
  text-align: center;
  margin-top: 16px;
  margin-bottom: 8px;
}

.completion-popup-subtitle {
  font-family: "DM Sans", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #5F5F5F;
  text-align: center;
  margin-bottom: 24px;
}

.completion-popup-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
}

.completion-cancel-btn {
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #5F5F5F;
  background-color: transparent;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  height: 40px;
  min-width: 100px;
}

.completion-confirm-btn {
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #FFFFFF;
  background-color: #1A73E9;
  border-radius: 4px;
  height: 40px;
  min-width: 100px;
}

/* Document Withdraw Confirmation Dialog Styles */
.withdraw-popup-container {
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.withdraw-popup-content-wrapper {
  padding: 24px;
}

.withdraw-popup-title {
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  color: #000000;
  text-align: center;
  margin-top: 16px;
  margin-bottom: 8px;
}

.withdraw-popup-subtitle {
  font-family: "DM Sans", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #5F5F5F;
  text-align: center;
  margin-bottom: 24px;
}

.withdraw-popup-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
}

.withdraw-cancel-btn {
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #5F5F5F;
  background-color: transparent;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  height: 40px;
  min-width: 100px;
}

.withdraw-confirm-btn {
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #FFFFFF;
  background-color: #FF9800;
  border-radius: 4px;
  height: 40px;
  min-width: 100px;
}

.document-review {
  /* max-width: 960px; */
  margin: 0 auto;
  font-family: "DM Sans", sans-serif;
  background: #ffffff;
}

/* Tab Container */
.tab-container {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px 8px 0 0;
  padding: 4px 16px 4px 4px;
  border-bottom: 1px solid #e0e0e0;
}

.tab-buttons {
  flex: 1;
  display: flex;
  gap: 4px;
}

.tab-button {
  padding: 8px 16px !important;
  background: transparent !important;
  border: none !important;
  border-radius: 5px !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  color: #5f5f5f !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  white-space: nowrap !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  box-shadow: none !important;
  min-width: auto !important;
  height: auto !important;
}

.tab-button.active {
  background: #1a73e9 !important;
  color: #ffffff !important;
  font-weight: 400 !important;
}

.tab-button:hover:not(.active) {
  background: #f1f7ff !important;
  color: #1a73e9 !important;
}

.action-header {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  min-width: 80px;
  text-align: center;
}

/* Upload Documents Button */
.upload-documents-btn {
  background: #1a73e9 !important;
  color: #ffffff !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  height: 36px !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  border-radius: 4px !important;
  box-shadow: none !important;
  margin-right: 16px !important;
  min-width: auto !important;
}

.upload-documents-btn:hover:not(.v-btn--disabled) {
  background: #1557b7 !important;
}

.upload-documents-btn.v-btn--disabled {
  background: #e0e0e0 !important;
  color: #9e9e9e !important;
}

/* Documents List */
.documents-list {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 8px 8px;

}

.document-category-section {
  padding: 16px;
}

.document-category-section.has-divider {
  border-bottom: 1px solid #e0e0e0;
}

/* Document Card Grid Styles */
.documents-grid {
  margin-top: 12px;
  margin-bottom: 12px;
}

.document-card-grid {
  position: relative;
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px !important;
  overflow: hidden;
  width: 184px;
  height: 150px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  cursor: pointer;
}

.document-card-grid:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

/* Status Badge */
.status-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  color: white;
  z-index: 2;
  font-family: "DM Sans", sans-serif;
}

.status-badge.success {
  background-color: #10b981;
}

.status-badge.warning {
  background-color: #f59e0b;
}

.status-badge.error {
  background-color: #ef4444;
}

.status-badge.info {
  background-color: #3b82f6;
}

/* Document Preview Area */
.document-preview {
  position: relative;
  height: 110px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Document Type Icon */
.document-type-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "DM Sans", sans-serif;
  font-size: 8px;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  background: #dc2626;
}

.icon-text {
  font-family: "DM Sans", sans-serif;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* View Overlay */
.view-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.36);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
  gap: 4px;
}

.document-card-grid:hover .view-overlay {
  opacity: 1;
}

.view-icon-container {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.36);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.view-overlay-text {
  font-family: "DM Sans", sans-serif;
  font-size: 10px;
  font-weight: 400;
  color: #ffffff;
  text-align: center;
  font-variation-settings: "opsz" 14;
}

.document-name-text {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: #000000;
  text-align: center;
  white-space: pre-line;
  word-break: break-word;
  font-variation-settings: "opsz" 14;
}

/* Download Link Section */
.download-link-section {
  display: flex;
  justify-content: center;
  padding: 0 12px 8px 12px;
  flex-shrink: 0;
  height: 26px;
  align-items: center;
}

.download-link {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #1a73e9;
  cursor: pointer;
  text-decoration: none;
  font-variation-settings: "opsz" 14;
  line-height: normal;
}

.download-link:hover {
  text-decoration: underline;
}

/* Document Header */
.document-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.document-info {
  flex: 1;
}

.document-title {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  line-height: 1.6;
  margin-bottom: 4px;
}

.required-asterisk {
  color: #d53e3e;
  margin-left: 4px;
}

.document-date {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #5f5f5f;
  line-height: 1.6;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.accept-button,
.reject-button {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  padding: 7px 10px 7px 5px !important;
  border-radius: 5px !important;
  border: none !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  white-space: nowrap !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  box-shadow: none !important;
  min-width: auto !important;
  height: auto !important;
}

.accept-button {
  background: #29a61a !important;
  color: #ffffff !important;
}

.accept-button:hover {
  background: #228a15 !important;
}

.reject-button {
  background: rgba(213, 62, 62, 0.05) !important;
  color: #d53e3e !important;
}

.reject-button:hover {
  background-color: rgba(213, 62, 62, 0.1) !important;
}

/* Withdraw Button */
.withdraw-button {
  background: transparent !important;
  border: none !important;
  color: #FF9800 !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  padding: 0 16px !important;
  height: 36px !important;
  border-radius: 4px !important;
  margin-left: 8px !important;
  transition: background-color 0.2s ease !important;
}

.withdraw-button:hover {
  background-color: rgba(255, 152, 0, 0.1) !important;
}

/* Status Indicator */
.status-indicator {
  display: flex;
  align-items: center;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
}

.status-indicator.accepted {
  color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
}

.status-indicator.rejected {
  color: #D53E3E;
  background-color: rgba(213, 62, 62, 0.1);
}

.status-indicator.withdrawn {
  color: #FF9800;
  background-color: rgba(255, 152, 0, 0.1);
}

.accept-button .v-btn__content,
.reject-button .v-btn__content {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
}

/* Files Container */
.files-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.file-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-chip:hover {
  background: #f1f7ff;
  border-color: #1a73e9;
}

.file-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.file-name {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #5f5f5f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.file-name.file-link {
  color: #1a73e9;
  text-decoration: underline;
}

.file-name.file-link:hover {
  color: #1557b7;
}

.download-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
}

.download-icon:hover svg path {
  fill: #1a73e9;
}

/* Responsive Design */
@media (max-width: 768px) {
  .tab-container {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 8px;
  }

  .action-header {
    text-align: left;
    min-width: auto;
  }

  .document-header {
    flex-direction: column;
    gap: 12px;
  }

  .action-buttons {
    align-self: flex-start;
  }
}

/* Additional Documents Section */
.additional-documents-section {
  margin-top: 25px;
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); */
}

.request-header {
  margin-bottom: 24px;
}

.request-title {
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  margin: 0;
  line-height: 24px;
}

/* Request Form - Figma Design */
.request-form-container {
  margin-bottom: 32px;
}

.form-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.dropdown-group {
  flex: 1;
  max-width: 400px;
}

.request-button-group,
.upload-button-group {
  flex: 0 0 auto;
}

.figma-dropdown {
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  border-radius: 4px !important;
}

.figma-dropdown .v-input__control .v-input__slot {
  background-color: white !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 4px !important;
  min-height: 40px !important;
}

.figma-dropdown .v-select__selections input {
  font-family: "DM Sans", sans-serif !important;
  color: #333 !important;
}

.figma-dropdown .v-input__append-inner {
  margin-top: 8px !important;
}

.figma-dropdown .v-input__icon--clear .v-icon {
  color: #5f5f5f !important;
  font-size: 18px !important;
}

.figma-dropdown .v-input__icon--clear:hover .v-icon {
  color: #1a73e9 !important;
}

/* Request Button - Exact Figma Design with Vuetify */

.figma-request-btn:hover:not(.v-btn--disabled) {
  background: #1557b7 !important;
}



.figma-upload-btn:hover:not(.v-btn--disabled) {
  background: #1557b7 !important;
}

.figma-request-btn.v-btn--disabled {
  background: #e0e0e0 !important;
  color: #9e9e9e !important;
}

/* Upload Button - Exact Figma Design with Vuetify */
.figma-upload-btn {
  width: 100px !important;
  height: 40px !important;
  background: #e3f2fd !important;
  border-radius: 4px !important;
  border: 1px solid #bbdefb !important;
  font-family: "DM Sans", sans-serif !important;
  font-style: normal !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  line-height: 18px !important;
  color: #1a73e9 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  box-shadow: none !important;
}

.figma-upload-btn:hover {
  background: #bbdefb !important;
}

.figma-upload-btn .upload-icon {
  margin-right: 6px !important;
}

.figma-upload-btn .v-btn__content {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
}

/* Uploaded Files Section - Figma Style */
.uploaded-files-section {
  margin-top: 16px;
}

.uploaded-files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.uploaded-file-item-figma {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-family: "DM Sans", sans-serif;
}

.file-icon-figma {
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-name-figma {
  flex: 1;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-file-btn-figma {
  background: none !important;
  border: none !important;
  padding: 2px !important;
  border-radius: 2px !important;
  box-shadow: none !important;
  min-width: auto !important;
  width: 20px !important;
  height: 20px !important;
}

.remove-file-btn-figma:hover {
  background-color: #ffebee !important;
}

.remove-file-btn-figma .v-icon {
  color: #5f5f5f !important;
}

.upload-sub-text {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
}

/* Uploaded Files Display */
.uploaded-files-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.uploaded-file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f1f7ff;
  border: 1px solid #1a73e9;
  border-radius: 4px;
  max-width: 180px;
}

.file-icon-small {
  flex-shrink: 0;
}

.file-name-small {
  font-family: "DM Sans", sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: #1a73e9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.remove-file-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  border-radius: 2px;
  flex-shrink: 0;
}

.remove-file-button:hover {
  background: rgba(95, 95, 95, 0.1);
}

/* Additional Tabs Section */
.additional-tabs-section {
  margin-top: 24px;
}

.additional-tab-container {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px 8px 0 0;
  padding: 4px 16px 4px 4px;
  border-bottom: 1px solid #e0e0e0;
}

.additional-tab-buttons {
  flex: 1;
  display: flex;
  gap: 4px;
}

.additional-tab-button {
  padding: 8px 16px !important;
  background: transparent !important;
  border: none !important;
  border-radius: 5px !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  color: #5f5f5f !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  white-space: nowrap !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  box-shadow: none !important;
  min-width: auto !important;
  height: auto !important;
}

.additional-tab-button.active {
  background: #1a73e9 !important;
  color: #ffffff !important;
  font-weight: 400 !important;
}

.additional-tab-button:hover:not(.active) {
  background: #f1f7ff !important;
  color: #1a73e9 !important;
}

.additional-action-header {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  min-width: 80px;
  text-align: center;
}

/* Additional Documents List */
.additional-documents-list {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 8px 8px;
  min-height: 200px;
}

.additional-document-category-section {
  padding: 16px;
}

.additional-document-category-section.has-divider {
  border-bottom: 1px solid #e0e0e0;
}

.additional-document-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.additional-document-info {
  flex: 1;
}

.additional-document-title {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  line-height: 24px;
  margin-bottom: 4px;
}

.additional-document-date {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
  line-height: 16px;
}

.additional-action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Additional Files Container */
.additional-files-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.additional-file-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.additional-file-chip:hover {
  background: #f1f7ff;
  border-color: #1a73e9;
}

.additional-file-chip .file-name {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #5f5f5f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.additional-file-chip .file-name.file-link {
  color: #1a73e9;
  text-decoration: underline;
}

/* Additional Empty State */
.empty-documents-state,
.additional-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  text-align: center;
  background-color: #ffffff;
  border-radius: 0 0 8px 8px;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #5f5f5f;
}

/* Responsive Design for Additional Documents */
@media (max-width: 768px) {
  .additional-documents-section {
    padding: 16px;
    margin-top: 24px;
  }

  .form-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .dropdown-group {
    max-width: 100%;
  }

  .figma-request-btn,
  .figma-upload-btn {
    width: 100% !important;
  }

  .request-button-group {
    min-width: auto;
  }

  .additional-tab-container {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 12px;
  }

  .additional-action-header {
    text-align: left;
    min-width: auto;
  }

  .additional-document-header {
    flex-direction: column;
    gap: 12px;
  }

  .additional-action-buttons {
    align-self: flex-start;
  }

  .uploaded-files-display {
    justify-content: flex-start;
  }
}

/* Document Request Popup - Pixel Perfect Figma Design */
.request-popup-container {
  background: #ffffff;
  border-radius: 8px;
  padding: 0;
  width: 600px;
  height: 450px;
  margin: 0 auto;
}

.popup-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 32px 24px 32px;
  height: 100%;
  position: relative;
}

/* Popup Icon */
.popup-icon-container {
  margin-bottom: 24px;
}

.popup-icon {
  width: 58px;
  height: 58px;
  background: rgba(26, 115, 233, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Popup Title */
.popup-title {
  font-family: "DM Sans", sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 21px;
  text-align: center;
  color: #000000;
  margin-bottom: 24px;
}

/* Input Container */
.popup-input-container {
  width: 100%;
  margin-bottom: 24px;
}

.popup-input {
  width: 100%;
  height: 73px;
  background: #ffffff !important;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  color: rgba(95, 95, 95, 0.5);
}

.popup-input .v-input__control {
  min-height: 73px !important;
  background: #ffffff !important;
}

.popup-input .v-input__slot {
  background-color: #ffffff !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 8px !important;
  padding: 16px !important;
  min-height: 73px !important;
  align-items: flex-start !important;
}

/* Ensure white background covers all input field parts */
.popup-input.v-input--hide-details.theme--light.v-text-field.v-text-field--single-line.v-text-field--solo.v-text-field--solo-flat.v-text-field--is-booted.v-text-field--enclosed.v-text-field--placeholder {
  background: #ffffff !important;
}

.popup-input .v-input {
  background: #ffffff !important;
}

.popup-input .v-text-field__slot input {
  font-family: "DM Sans", sans-serif !important;
  font-size: 12px !important;
  color: rgba(95, 95, 95, 0.5) !important;
  padding: 0 !important;
  margin-top: 0 !important;
}

.popup-input .v-text-field__slot input::placeholder {
  color: rgba(95, 95, 95, 0.5) !important;
  font-family: "DM Sans", sans-serif !important;
}

/* Popup Buttons */
.popup-buttons {
  display: flex;
  gap: 24px;
  width: 100%;
  justify-content: center;
}

.popup-cancel-btn,
.popup-request-btn {
  width: 152px !important;
  height: 42px !important;
  border-radius: 8px !important;
  font-family: "DM Sans", sans-serif !important;
  font-style: normal !important;
  font-weight: 500 !important;
  font-size: 16px !important;
  line-height: 21px !important;
  text-align: center !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  box-shadow: none !important;
}

.popup-cancel-btn {
  background: #f8f9fa !important;
  border: 1px solid #e0e0e0 !important;
  color: #5f5f5f !important;
}

.popup-cancel-btn:hover {
  background: #e9ecef !important;
  border-color: #dee2e6 !important;
}

.popup-request-btn {
  background: #1a73e9 !important;
  color: #ffffff !important;
  border: none !important;
}

.popup-request-btn:hover {
  background: #1557b7 !important;
}

.popup-request-btn:disabled {
  background: #e0e0e0 !important;
  color: #9e9e9e !important;
}

/* Dialog overlay styling */
.v-dialog__content {
  z-index: 210 !important;
}

.v-overlay__scrim {
  background: rgba(0, 0, 0, 0.2) !important;
  backdrop-filter: blur(5px) !important;
}

/* Remove unwanted scroll from dialog */
.v-dialog {
  overflow: hidden !important;
}

.v-dialog>.v-card {
  overflow: hidden !important;
}

/* Document Accept Popup */
.accept-popup-container {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
}

.accept-popup-content-wrapper {
  width: 100%;
}

.accept-popup-title {
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: #000000;
  text-align: center;
  margin-top: 16px;
  margin-bottom: 8px;
}

.accept-popup-subtitle {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #5f5f5f;
  text-align: center;
  margin-bottom: 16px;
}

.accept-popup-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.accept-cancel-btn {
  background-color: #f5f5f5 !important;
  color: #5f5f5f !important;
  border-radius: 6px !important;
  padding: 8px 24px !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  text-transform: none !important;
}

.accept-submit-btn {
  background-color: #1a73e9 !important;
  color: #ffffff !important;
  border-radius: 6px !important;
  padding: 8px 24px !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  text-transform: none !important;
}

/* Document Reject Popup - Pixel Perfect Figma Design */
.reject-popup-container {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  max-height: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

.reject-popup-content-wrapper {
  width: 100%;
  overflow: hidden;
}

.reject-popup-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 32px 24px 32px;
  height: 100%;
  position: relative;
}

/* Reject Icon */
.reject-icon-container {
  margin-bottom: 24px;
}

.reject-icon {
  width: 58px;
  height: 58px;
  background: rgba(213, 62, 62, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Reject Popup Title */
.reject-popup-title {
  font-family: "DM Sans", sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 21px;
  text-align: center;
  color: #000000;
  margin-bottom: 8px;
}

/* Reject Popup Subtitle */
.reject-popup-subtitle {
  font-family: "DM Sans", sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  text-align: center;
  color: #5f5f5f;
  margin-bottom: 16px;
}

/* Reject Dropdown Container */
.reject-dropdown-container {
  width: 100%;
  margin-bottom: 12px;
}

.reject-dropdown {
  width: 100%;
  height: 42px;
  background: #ffffff !important;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #000000;
}

.reject-dropdown .v-input__control {
  min-height: 42px !important;
  background: #ffffff !important;
}

.reject-dropdown .v-input__slot {
  background-color: #ffffff !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 8px !important;
  padding: 12px 16px !important;
  min-height: 42px !important;
  align-items: center !important;
}

.reject-dropdown .v-select__selections input {
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  color: #000000 !important;
}

.reject-dropdown .v-input__append-inner {
  margin-top: 8px !important;
}

/* Reject Input Container */
.reject-input-container {
  width: 100%;
  margin-bottom: 24px;
}

.reject-input {
  width: 100%;
  height: 73px;
  background: #ffffff !important;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  color: rgba(95, 95, 95, 0.5);
}

.reject-input.error {
  border-color: #d53e3e !important;
}

.reject-input .v-input__control {
  min-height: 73px !important;
  background: #ffffff !important;
}

.reject-input .v-input__slot {
  background-color: #ffffff !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 8px !important;
  padding: 16px !important;
  min-height: 73px !important;
  align-items: flex-start !important;
}

.reject-input.error .v-input__slot {
  border-color: #d53e3e !important;
}

.reject-input textarea {
  font-family: "DM Sans", sans-serif !important;
  font-size: 12px !important;
  color: rgba(95, 95, 95, 0.5) !important;
  padding: 0 !important;
  margin-top: 0 !important;
  resize: none !important;
}

.reject-input textarea::placeholder {
  color: rgba(95, 95, 95, 0.5) !important;
  font-family: "DM Sans", sans-serif !important;
}

/* Reject Error Message */
.reject-error-message {
  font-family: "DM Sans", sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #d53e3e;
  margin-top: 8px;
  margin-left: 4px;
}

/* Reject Popup Buttons */
.reject-popup-buttons {
  display: flex;
  gap: 24px;
  width: 100%;
  justify-content: center;
  margin-top: 16px;
  padding-bottom: 8px;
}

.reject-cancel-btn,
.reject-submit-btn {
  width: 152px !important;
  height: 42px !important;
  border-radius: 8px !important;
  font-family: "DM Sans", sans-serif !important;
  font-style: normal !important;
  font-weight: 500 !important;
  font-size: 16px !important;
  line-height: 21px !important;
  text-align: center !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  box-shadow: none !important;
}

.reject-cancel-btn {
  background: #f8f9fa !important;
  border: 1px solid #e0e0e0 !important;
  color: #5f5f5f !important;
}

.reject-cancel-btn:hover {
  background: #e9ecef !important;
  border-color: #dee2e6 !important;
}

.reject-submit-btn {
  background: #d53e3e !important;
  color: #ffffff !important;
}

.reject-submit-btn:hover {
  background: #b73030 !important;
}

.reject-submit-btn:disabled {
  background: #e0e0e0 !important;
  color: #9e9e9e !important;
}

/* File Actions Styling */
.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.download-icon,
.remove-icon {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.download-icon:hover {
  background-color: rgba(95, 95, 95, 0.1);
}

.remove-icon:hover {
  background-color: rgba(213, 62, 62, 0.1);
}

/* File Delete Popup Styling */
.delete-popup-container {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.delete-popup-content-wrapper {
  width: 100%;
}

.delete-popup-title {
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #000000;
  text-align: center;
  margin-top: 16px;
  margin-bottom: 8px;
}

.delete-popup-subtitle {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #5f5f5f;
  text-align: center;
  margin-bottom: 16px;
}

.delete-popup-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.delete-cancel-btn {
  background-color: #f5f5f5 !important;
  color: #5f5f5f !important;
  border-radius: 6px !important;
  padding: 8px 24px !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  width: 120px !important;
  height: 40px !important;
}

.delete-cancel-btn:hover {
  background-color: #e9ecef !important;
}

.delete-confirm-btn {
  background-color: #d53e3e !important;
  color: #ffffff !important;
  border-radius: 6px !important;
  padding: 8px 24px !important;
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  width: 120px !important;
  height: 40px !important;
}

.delete-confirm-btn:hover {
  background-color: #b73030 !important;
}

.delete-confirm-btn:disabled {
  background-color: #e0e0e0 !important;
  color: #9e9e9e !important;
}

/* Document Request Popup Styles */
.request-popup-container {
  background: #ffffff !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
}

.request-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #f9fbff;
}

.request-popup-title {
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: #000000;
  display: flex;
  align-items: center;
}

.form-row.mb-4 {
  margin-bottom: 16px !important;
}

.form-label.mb-1 {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  margin-bottom: 6px;
}

.required-asterisk {
  color: #D53E3E;
  margin-left: 2px;
}

.document-type-select .v-input__slot,
.description-input .v-input__slot {
  border-radius: 6px !important;
  border-color: #E0E0E0 !important;
}

.document-type-select .v-input__slot:hover,
.description-input .v-input__slot:hover {
  border-color: #1A73E9 !important;
}

.required-checkbox .v-input--selection-controls__input {
  margin-right: 8px;
}

.popup-buttons {
  display: flex;
  justify-content: flex-end;
}

.popup-cancel-btn {
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #5F5F5F !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  border-radius: 6px !important;
  margin-right: 12px !important;
}

.popup-request-btn {
  font-family: "DM Sans", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #FFFFFF !important;
  background-color: #1A73E9 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  border-radius: 6px !important;
  padding: 0 20px !important;
  height: 36px !important;
}

.popup-request-btn:hover {
  background-color: #1565D8 !important;
}
</style>