<template>
  <v-container class="pa-6">
    <v-alert v-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>
    <vue-element-loading v-if="loading" :active="loading" spinner="bar-fade-scale" color="#1A73E9" size="60" />
    <!-- <v-skeleton-loader v-if="loading" type="list-item-three-line" :types="{ 'list-item-three-line': 'list-item@3' }"
      class="mb-4"></v-skeleton-loader> -->

    <template v-else>
      <v-row v-if="documents.length === 0" class="align-center pa-2">
        <v-alert type="info" class="w-100">
          No documents found for this application.
        </v-alert>
      </v-row>

      <v-row v-for="(document, i) in documents" :key="i" class="align-center pa-2">
        <!-- Document Icon -->
        <!-- <v-icon :color="document.status === 'APPROVED' ? 'green' : document.status === 'REJECTED' ? 'red' : 'grey'">
          {{ getDocumentIcon(document.type) }}
        </v-icon> -->
        <v-icon :color="document.isUploaded ? 'green' : 'grey'" size="20">
          {{ document.isUploaded ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline' }}
        </v-icon>
        <!-- Document Details -->
        <div class="ml-2 flex-grow-1">
          <div class="subtitle-1">{{ document.documentCategory.name }}</div>
          <div class="caption text--secondary">{{ document.type }}</div>
        </div>

        <!-- Status Badge -->
        <!-- <v-chip :color="getStatusColor(document.status)" small>
          {{ document.status }}
        </v-chip> -->
      </v-row>
    </template>
  </v-container>
</template>

<script>
import { getApplicationDocuments } from '@/api/modules/applications';

export default {
  props: {
    applicationId: {
      type: String,
      required: false
    },
    applicantdata: {
      type: Object,
      required: false
    }
  },
  data() {
    return {
      documents: [],
      loading: false,
      error: null
    };
  },
  computed: {
    appId() {
      return this.applicantdata?.id || this.applicationId || this.$route.query.id;
    }
  },
  created() {
    this.fetchDocuments(this.appId);

    // Listen for status-updated event from DocumentReview to refresh documents
    this.$parent.$on('status-updated', () => {
      this.fetchDocuments(this.appId);
    });
  },
  beforeDestroy() {
    // Clean up event listener
    this.$parent.$off('status-updated');
  },
  methods: {
    async fetchDocuments(appId) {
      if (!appId) return;

      this.loading = true;
      this.error = null;

      try {
        const response = await getApplicationDocuments(appId);
        this.documents = response.data.data.applicationDocuments || [];
      } catch (err) {
        console.error('Error fetching application documents:', err);
        this.error = 'Failed to load documents. Please try again later.';
      } finally {
        this.loading = false;
      }
    },
    getDocumentIcon(type) {
      const iconMap = {
        'PDF': 'mdi-file-pdf-box',
        'IMAGE': 'mdi-file-image',
        'DOCX': 'mdi-file-word',
        'XLSX': 'mdi-file-excel',
        'TEXT': 'mdi-file-document'
      };

      return iconMap[type] || 'mdi-file';
    },
    getStatusColor(status) {
      const colorMap = {
        'APPROVED': 'success',
        'REJECTED': 'error',
        'PENDING': 'warning',
        'UPLOADED': 'info'
      };

      return colorMap[status] || 'grey';
    }
  }
};
</script>
