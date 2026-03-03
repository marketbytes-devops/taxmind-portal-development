<template>
  <v-card elevation="0" flat class="px-4">
    <v-layout wrap>
      <v-flex xs12 class="d-flex align-center">
        <div class="section-title">Documents</div>
        <v-spacer></v-spacer>
        <v-progress-circular v-if="loading" indeterminate color="primary" size="24" width="2"></v-progress-circular>
      </v-flex>
    </v-layout>

    <!-- Loading State -->
    <v-layout v-if="loading && !hasError" wrap justify-center class="my-5">
      <v-flex xs12 class="text-center">
        <div class="loading-text">Loading documents...</div>
      </v-flex>
    </v-layout>

    <!-- Error State -->
    <v-layout v-else-if="hasError" wrap justify-center class="my-5">
      <v-flex xs12 class="text-center">
        <div class="error-text">{{ errorMessage }}</div>
        <v-btn color="primary" text @click="fetchApplicationDocuments" class="mt-3">
          <v-icon left>mdi-refresh</v-icon> Retry
        </v-btn>
      </v-flex>
    </v-layout>

    <!-- Empty State -->
    <v-layout v-else-if="!loading && !hasDocuments" wrap justify-center class="my-5">
      <v-flex xs12 class="text-center">
        <v-icon size="64" color="grey lighten-1">mdi-file-document-outline</v-icon>
        <div class="empty-text mt-3">No documents found for this application</div>
      </v-flex>
    </v-layout>

    <!-- Document Categories -->
    <template v-else>
      <div v-for="category in filteredCategories" :key="category.name">
      <v-layout wrap>
        <v-flex xs12>
          <div class="category-title">{{ category.name }}</div>
        </v-flex>
      </v-layout>

      <v-container fluid class="documents-grid pa-0">
        <v-layout wrap flex justify-start align-start>
          <v-flex v-for="document in category.documents" :key="document._id || document.id" xs12 sm6 md4 lg2 xl3
            class="pa-2 d-flex">
            <v-card v-if="document.status === 'accepted'" class="document-card" elevation="0"
              @mouseenter="showViewOption(document._id || document.id)" @mouseleave="hideViewOption()">
              <!-- Status Badge -->
              <div v-if="document.statusText" class="status-badge" :class="document.statusColor">
                {{ document.statusText }}
              </div>

              <!-- Document Preview Area -->
              <div class="document-preview">
                <!-- Document Type Icon -->
                <v-layout wrap justify-center>
                  <v-flex xs2 class="document-type-icon mb-2"
                    :style="getDocumentTypeStyle(document.fileType || getDocumentType(document.name))">
                    <span class="icon-text">{{ document.fileType || getDocumentType(document.name) }}</span>
                  </v-flex>
                  <v-flex xs12 class="document-name-text">
                    {{ formatDocumentName(document.name || document.fileName || 'Document') }}
                  </v-flex>
                </v-layout>

                <!-- View Document Overlay (on hover) -->
                <div v-if="hoveredDocument === (document._id || document.id) && !document.isStepData"
                  class="view-overlay" @click="viewDocument(document)">
                  <div class="view-icon-container">
                    <v-icon color="white" size="24">mdi-eye</v-icon>
                  </div>
                  <span class="view-overlay-text">View Document</span>
                </div>

                <!-- Upload Document Overlay (for step data without document) -->
                <div v-if="hoveredDocument === (document._id || document.id) && document.isStepData"
                  class="view-overlay" @click="uploadDocument(document)">
                  <div class="view-icon-container">
                    <v-icon color="white" size="24">mdi-upload</v-icon>
                  </div>
                  <span class="view-overlay-text">Upload Document</span>
                </div>
              </div>

              <v-layout wrap justify-center class="download-link-section">
                <v-flex shrink align-self-center>
                  <span v-if="!document.isStepData" class="download-link" @click="downloadDocument(document)">
                    Download
                  </span>
                  <span v-else class="upload-link" @click="uploadDocument(document)">
                    Upload
                  </span>
                </v-flex>
              </v-layout>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </div>
    </template>

    <!-- Completion Status -->

    <!-- </v-container> -->
  </v-card>
</template>

<script>
import { getApplicationDocuments } from "@/api/modules/applications";

export default {
  name: "Documents",

  props: {
    applicantdata: {
      type: String,
      default: ""
    },
  },

  data() {
    return {
      hoveredDocument: null,
      isCompleted: false,
      loading: false,
      hasError: false,
      errorMessage: "",
      documentCategories: [],
      applicationDocuments: [],
      documentStatusMap: {
        true: "Completed",
        false: "Pending"
      },
      documentStatusColorMap: {
        true: "success",
        false: "warning"
      }
    };
  },

  computed: {
    hasDocuments() {
      return this.documentCategories && this.documentCategories.length > 0;
    },
    filteredCategories() {
      // Return only categories that have at least one document with status 'accepted'
      return this.documentCategories.filter(category => 
        category.documents.some(document => document.status === 'accepted')
      );
    }
  },
  mounted() {
    this.fetchApplicationDocuments();

  },
  created() {
    this.fetchApplicationDocuments();
  },

  methods: {
    async fetchApplicationDocuments() {
      if (!this.applicantdata) {
        this.hasError = true;
        this.errorMessage = "Application ID is required to fetch documents";
        return;
      }

      this.loading = true;
      this.hasError = false;
      this.errorMessage = "";

      try {
        const response = await getApplicationDocuments(this.applicantdata.id);

        if (response.data && response.data.success) {
          // Store only applicationDocuments from the API response
          this.applicationDocuments = response.data.data.applicationDocuments || [];

          // Process documents
          this.processDocuments();
        } else {
          throw new Error(response.data.message || "Failed to fetch application documents");
        }
      } catch (error) {
        console.error("Error fetching application documents:", error);
        this.hasError = true;
        this.errorMessage = error.message || "Failed to load documents. Please try again.";
      } finally {
        this.loading = false;
      }
    },

    processDocuments() {
      // Group documents by category
      const documentsByCategory = {};

      // Process applicationDocuments from the API response
      this.applicationDocuments.forEach(doc => {
        const categoryName = doc.documentCategory?.name || "Other Documents";

        if (!documentsByCategory[categoryName]) {
          documentsByCategory[categoryName] = [];
        }

        // For each file in the document, create a document entry
        if (doc.files && doc.files.length > 0) {
          doc.files.forEach(file => {
            documentsByCategory[categoryName].push({
              id: file.id,
              _id: file.id, // For compatibility with existing code
              name: file.fileName,
              fileName: file.fileName,
              status: doc.status,

              statusText: this.getStatusTextFromApi(doc.status),
              statusColor: this.getStatusColorFromApi(doc.status),
              fileUrl: file.filePath,
              url: file.filePath,
              fileType: this.getDocumentType(file.fileName),
              mimeType: file.mimeType,
              fileSize: file.fileSize,
              uploadedAt: file.uploadedAt,
              uploaderType: file.uploaderType,
              documentCategoryId: doc.documentCategory?.id,
              isRequired: doc.isRequired,
              isAdditionalDocument: doc.isAdditionalDocument,
              note: doc.note,
              rejectedReason: doc.rejectedReason
            });
          });
        } else {
          // If no files, still show the document category
          documentsByCategory[categoryName].push({
            id: doc.id,
            _id: doc.id,
            name: doc.documentCategory?.name || "Document",
            status: doc.status,
            statusText: this.getStatusTextFromApi(doc.status),
            statusColor: this.getStatusColorFromApi(doc.status),
            isRequired: doc.isRequired,
            isAdditionalDocument: doc.isAdditionalDocument,
            documentCategoryId: doc.documentCategory?.id,
            // Default values for required fields
            url: "",
            fileType: "PDF"
          });
        }
      });

      // Convert to array format for rendering
      this.documentCategories = Object.keys(documentsByCategory).map(category => ({
        name: category,
        documents: documentsByCategory[category]
      }));
    },

    showViewOption(documentId) {
      this.hoveredDocument = documentId;
    },

    hideViewOption() {
      this.hoveredDocument = null;
    },

    viewDocument(document) {
      // Check if document URL exists
      const url = document.fileUrl || document.url;
      if (!url || url === "") {
        this.$emit("show-message", "Document not available for viewing");
        return;
      }

      // Open document in new tab
      window.open(url, "_blank");
      this.$emit("show-message", "Opening document...");
    },

    uploadDocument(document) {
      // Handle document upload for step data items
      if (document.isStepData) {
        this.$emit("show-message", `Please upload a document for ${document.name}`);
        // Here you would typically open a file upload dialog
        // For now we'll just show a message
      }
    },

    getStatusColor(status) {
      return status ? 'success' : 'warning';
    },

    getStatusText(status) {
      return status ? 'Completed' : 'Pending';
    },

    getStatusTextFromApi(status) {
      switch (status) {
        case 'accepted':
          return 'Accepted';
        case 'rejected':
          return 'Rejected';
        case 'pending':
          return 'Pending';
        case 'toBeReviewed':
          return 'To Be Reviewed';
        default:
          return 'Pending';
      }
    },

    getStatusColorFromApi(status) {
      switch (status) {
        case 'accepted':
          return 'success';
        case 'rejected':
          return 'error';
        case 'pending':
          return 'warning';
        case 'toBeReviewed':
          return 'info';
        default:
          return 'warning';
      }
    },


    downloadDocument(document) {
      // Check if document exists
      const url = document.fileUrl || document.url;
      if (!url || url === "") {
        this.$emit("show-message", "Document not available for download");
        return;
      }

      try {
        // Create download link
        const link = document.createElement("a");
        link.href = url;
        link.download = this.getDocumentName(document.name || document.fileName || "Document");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.$emit("show-message", "Download started");
      } catch (error) {
        this.$emit("show-message", "Error downloading file");
      }
    },

    getDocumentName(name) {
      // Handle null, undefined, or empty document names
      if (!name || name === "") {
        return "Document.pdf";
      }
      return name;
    },

    getDocumentType(fileName) {
      if (!fileName) return "PDF";

      const extension = fileName.split(".").pop().toLowerCase();
      switch (extension) {
        case "pdf":
          return "PDF";
        case "jpg":
        case "jpeg":
          return "JPG";
        case "png":
          return "PNG";
        case "doc":
        case "docx":
          return "DOC";
        case "xls":
        case "xlsx":
          return "XLS";
        default:
          return "PDF";
      }
    },

    getDocumentTypeStyle(fileType) {
      // Return background color based on file type
      const type = fileType ? fileType.toLowerCase() : "pdf";
      let backgroundColor = "#dc2626"; // Default red for PDF

      switch (type) {
        case "pdf":
          backgroundColor = "#dc2626"; // Red
          break;
        case "jpg":
        case "jpeg":
        case "png":
          backgroundColor = "#0284c7"; // Blue
          break;
        case "doc":
        case "docx":
          backgroundColor = "#2563eb"; // Blue
          break;
        case "xls":
        case "xlsx":
          backgroundColor = "#16a34a"; // Green
          break;
        default:
          backgroundColor = "#6366f1"; // Purple for others
      }

      return { backgroundColor };
    },

    hasAcceptedDocuments(category) {
      // Check if the category has at least one document with status 'accepted'
      return category.documents.some(document => document.status === 'accepted');
    },

    formatDocumentName(name) {
      if (!name) return "Document.pdf";

      // Remove file extension for display
      const nameWithoutExt = name.replace(/\.[^/.]+$/, "");

      // Split long names into two lines
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

    toggleCompleted() {
      this.isCompleted = !this.isCompleted;
      this.$emit("completion-changed", this.isCompleted);
    },
  },
};
</script>

<style scoped>
/* Pixel Perfect Design Matching Figma */
.documents-container {
  font-family: "DM Sans", sans-serif;
  background: transparent !important;
  margin-bottom: 24px;
}

.section-title {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: #000000;
  margin-bottom: 16px;
  font-variation-settings: "opsz" 14;
}

/* Loading, Error and Empty States */
.loading-text,
.error-text,
.empty-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  line-height: 20px;
  color: #64748b;
  font-variation-settings: "opsz" 14;
}

.error-text {
  color: #dc2626;
}

/* .document-category {
  margin-bottom: 32px;
} */

/* .document-category:last-child {
  margin-bottom: 0;
} */

.category-title {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #5f5f5f;
  margin-bottom: 16px;
  font-variation-settings: "opsz" 14;
}

.documents-grid {
  margin-bottom: 24px;
}

/* Document Cards - Pixel Perfect Figma Match */
.document-card {
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
  /* Removed margin: 0 auto for left alignment */
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

.document-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

/* Document Preview Area - Reduced Height for Better Proportions */
.document-preview {
  position: relative;
  height: 110px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Document Type Icon - Smaller Size */
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
  /* Default PDF red */
}

.icon-text {
  font-family: "DM Sans", sans-serif;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* View Overlay - Adjusted for Smaller Preview Area */
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

.document-card:hover .view-overlay {
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

/* Document Name Section - More Space for Better Balance */
.document-name-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  text-align: center;
  min-height: 50px;
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

/* Download Link - Proper Bottom Positioning */
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

.upload-link {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #3b82f6;
  cursor: pointer;
  text-decoration: none;
  font-variation-settings: "opsz" 14;
  line-height: normal;
}

.upload-link:hover {
  text-decoration: underline;
}

/* Completion Section */
/* .completion-section {
  padding-top: 32px;
  margin-top: 32px;
} */

.completion-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 12px;
}

.toggle-switch {
  width: 25px;
  height: 14px;
  background-color: #1a73e9;
  border-radius: 10px;
  position: relative;
  transition: background-color 0.3s;
  cursor: pointer;
}

.toggle-switch:not(.active) {
  background-color: #e5e7eb;
}

.toggle-slider {
  width: 12px;
  height: 12px;
  background-color: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: 1px;
  left: 12px;
  transition: transform 0.3s;
}

.toggle-switch:not(.active) .toggle-slider {
  left: 1px;
}

.checkbox-label {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 24px;
  color: #1a73e9;
  cursor: pointer;
  font-variation-settings: "opsz" 14;
}

/* Responsive Design - Maintain Figma Proportions */
@media (max-width: 600px) {
  .documents-container {
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 14px;
    margin-bottom: 12px;
  }

  /* .document-category {
    margin-bottom: 24px;
  } */

  .documents-grid {
    margin-bottom: 20px;
  }

  /* Slightly smaller on mobile but maintain proportions */
  .document-card {
    width: 160px;
    height: 130px;
  }

  .document-preview {
    height: 62px;
  }

  .document-type-icon {
    width: 28px;
    height: 28px;
  }

  .icon-text {
    font-size: 7px;
  }

  .document-name-section {
    min-height: 42px;
    padding: 6px 10px;
  }

  .document-name-text {
    font-size: 11px;
    line-height: 14px;
  }

  .download-link-section {
    height: 22px;
    padding: 0 10px 6px 10px;
  }

  .download-link {
    font-size: 11px;
  }

  .view-icon-container {
    width: 28px;
    height: 28px;
  }

  .view-overlay-text {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .completion-section {
    padding-top: 20px;
    margin-top: 20px;
  }

  /* Even smaller on very small screens */
  .document-card {
    width: 140px;
    height: 115px;
  }

  .document-preview {
    height: 50px;
  }

  .document-type-icon {
    width: 24px;
    height: 24px;
  }

  .icon-text {
    font-size: 6px;
  }

  .document-name-section {
    min-height: 38px;
    padding: 5px 8px;
  }

  .document-name-text {
    font-size: 10px;
    line-height: 13px;
  }

  .download-link-section {
    height: 20px;
    padding: 0 8px 5px 8px;
  }

  .download-link {
    font-size: 10px;
  }

  .view-icon-container {
    width: 24px;
    height: 24px;
  }

  .view-overlay-text {
    font-size: 8px;
  }
}
</style>
