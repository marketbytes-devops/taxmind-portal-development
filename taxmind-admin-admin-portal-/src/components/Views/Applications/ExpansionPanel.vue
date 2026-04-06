<template>
  <v-expansion-panels flat class="expansion-panels-bg" v-model="expandedPanel">
    <v-expansion-panel v-for="(panel, i) in panelsWithStatus" :key="i" class="mb-2 panel-spacing">
      <v-expansion-panel-header class="Head2 custom-header">
        {{ panel.title }}

        <!-- Right-side icons -->
        <template #actions>
          <div class="flex items-center gap-2 whitespace-nowrap">
            <!-- Progress indicator (if available) -->
            <!-- <span v-if="panel.progress !== null && panel.progress < 100" class="text-sm text-primary">
              {{ panel.progress }}%
            </span> -->
            <span v-if="panel.key === 'documents' && applicantdata?.uploadPendingDocumentsCount > 0"
              class="text-sm font-medium bg-gray-100 p-2 rounded-lg text-grey-600">
              Pending Documents - {{ applicantdata?.uploadPendingDocumentsCount || 0 }}
            </span>

            <!-- Pending text -->
            <!-- <span v-if="panel.showPendingStatus" class="text-sm text-grey-600">
              Pending
            </span> -->


            <!-- Check/Uncheck icon (no rotation) -->
            <v-icon :color="panel.completed ? 'green' : 'grey'" size="20" class="no-rotate">
              {{ panel.completed ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline' }}
            </v-icon>

            <!-- Rotating arrow -->
            <v-icon color="grey" size="20" :class="[
              'transition-transform duration-300',
              expandedPanel === i ? 'rotate-180' : ''
            ]">
              mdi-chevron-down
            </v-icon>
          </div>
        </template>
      </v-expansion-panel-header>

      <v-expansion-panel-content class="px-0">
        <component v-if="expandedPanel === i" :applicantdata="applicantdata" :userData="userData"
          :showCopyButtons="showCopyButtons" :showViewButton="showViewButton" :stepData="panel.stepData"
          :is="panel.component" @status-updated="handleStatusUpdated" @refresh="handleStatusUpdated"
          @documents-completed="$emit('documents-completed')" @review-completed="$emit('review-completed')" />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
<script>
import InitialReview from "./InitialReview.vue";
import DocumentUploaded from "./DocumentUploaded.vue";
import AgentActivation from "./AgentActivation.vue";
import DocumentReview from "./DocumentReview.vue";
import AgentTaxFiling from "./AgentTaxFiling.vue";
import PaymentConfirmation from "./PaymentConfirmation.vue";
import RefundApprovedSummary from "./RefundApprovedSummary.vue";

export default {
  props: {
    applicantdata: {
      type: Object,
      required: true,
    },
    userData: {
      type: Object,
      required: true,
    },
    showCopyButtons: {
      type: Boolean,
      default: false
    },
    showViewButton: {
      type: Boolean,
      default: true
    },
  },
  components: {
    InitialReview,
    DocumentUploaded,
    AgentActivation,
    DocumentReview,
    AgentTaxFiling,
    PaymentConfirmation,
    RefundApprovedSummary,
  },
  data() {
    return {
      panels: [
        { title: "Questionnaire Submitted", component: InitialReview, showPendingStatus: false, key: "questionnaire" },
        { title: "Document Uploaded", component: DocumentUploaded, showPendingStatus: true, key: "documents" },
        { title: "Agent Activation", component: AgentActivation, showPendingStatus: false, key: "agent_activation" },
        { title: "Review by Tax Agent", component: DocumentReview, showPendingStatus: false, key: "review" },
        { title: "Revenue Processing Tax Filing", component: AgentTaxFiling, showPendingStatus: false, key: "processing" },
        { title: "Refund Approved", component: RefundApprovedSummary, showPendingStatus: false, key: "refund_approved" },
        { title: "Payment Completed", component: PaymentConfirmation, showPendingStatus: false, key: "payment" },
      ],
      expandedPanel: null,
    };
  },
  computed: {
    // Map steps data to panels for status and completion
    panelsWithStatus() {
      if (!this.applicantdata) {
        return this.panels;
      }

      return this.panels.map(panel => {
        // Special logic for virtual steps (6 and 7)
        if (panel.key === 'refund_approved') {
          return {
            ...panel,
            completed: this.applicantdata.status === 'approved' || this.applicantdata.status === 'refund_completed',
          };
        }
        if (panel.key === 'payment') {
          return {
            ...panel,
            completed: this.applicantdata.paymentStatus === 'completed',
          };
        }

        // Standard logic for backend steps
        if (!this.applicantdata.steps) return panel;
        
        const step = this.applicantdata.steps.find(s => s.key === panel.key);

        if (step) {
          return {
            ...panel,
            completed: step.status === true,
            showPendingStatus: step.data && step.data.status === 'pending',
            progress: step.data ? step.data.progress : null,
            stepData: step.data || {},
            pendingDocuments: step.data ? step.data.pendingDocuments : null,
          };
        }

        return panel;
      });
    }
  },
  methods: {
    handleStatusUpdated() {
      console.log('ExpansionPanel: Received status-updated event, re-emitting to parent');
      this.$emit('status-updated');
    }
  }
};
</script>
<style scoped>
/* Main expansion panels container background */
.expansion-panels-bg {
  background-color: #f1f7ff !important;
}

.v-expansion-panel {
  background-color: transparent !important;
}

/* Panel spacing with project background color */
.panel-spacing {
  background-color: #f1f7ff !important;
}

/* Keep header and content colors as white */
.v-expansion-panel-header,
.v-expansion-panel-content {
  background-color: white !important;
}

/* Remove default side padding from expansion panel content */
/* Vue 3 syntax (Vue 2 with <style scoped> + vue-loader v15+ also supports this) */
::v-deep(.v-expansion-panel-content) {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

::v-deep(.v-expansion-panel-content__wrap) {
  padding-left: 0 !important;
  padding-right: 0 !important;
  padding-bottom: 0 !important;
}

.custom-header {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  z-index: 1;
}

.v-expansion-panel-header {
  min-height: 48px !important;
  max-height: 48px;
}

/* Optional: ensure title is vertically centered */
.v-expansion-panel-header .v-expansion-panel-header__icon,
.v-expansion-panel-header .v-expansion-panel-header__content {
  align-items: center;
}

/* Override Vuetify default margins/spacing */
.v-expansion-panel:not(:first-child)::after {
  border-top: none !important;
}

.v-expansion-panel::before {
  box-shadow: none !important;
}

/* Progress indicator styling */
.text-primary {
  color: #1A73E9 !important;
  font-weight: 500;
  font-size: 12px;
}

.text-grey-600 {
  color: #5F5F5F !important;
  font-size: 12px;
}

/* Prevent rotation on check/uncheck icon */
.no-rotate {
  transform: none !important;
}
</style>