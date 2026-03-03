<template>
  <div class="timeline-container">
    <!-- Timeline Header -->
    <div class="timeline-header">
      <h3 class="timeline-title">Application Timeline</h3>
    </div>

    <!-- Timeline Steps -->
    <div class="timeline-wrapper">
      <!-- Connecting Lines -->
      <div class="timeline-lines">
        <!-- Full gray line -->
        <div class="line-full"></div>
        <!-- Green progress segments for each completed step -->
        <div v-for="(status, index) in allStatuses" :key="`progress-${index}`" class="line-progress-segment"
          :class="{ 'segment-completed': isStepActive(status) && index < allStatuses.length - 1 }"
          :style="getProgressSegmentStyle(index)"></div>
      </div>

      <!-- Steps -->
      <div class="timeline-steps">
        <div v-for="(status, index) in allStatuses" :key="index" class="timeline-step" :class="{
          'step-active': isStepActive(status),
          'step-inactive': !isStepActive(status),
        }">
          <!-- Step Circle -->
          <div class="step-circle" :class="{ active: isStepActive(status) }">
            <!-- Checkmark icon inside circle -->
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <!-- Step Info -->
          <div class="step-info">
            <div class="step-label">Step {{ index + 1 }}</div>
            <div class="step-title">{{ status }}</div>
            <div class="step-status" v-if="getStepStatus(status)">
              {{ formatStepStatus(getStepStatus(status)) }}
            </div>
            <div class="step-progress" v-if="getStepProgress(status)">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getStepProgress(status) + '%' }"></div>
              </div>
              <span class="progress-text">{{ getStepProgress(status) }}%</span>
            </div>
            <div class="step-date" v-if="getStepDate(status)">
              {{ formatDate(getStepDate(status)) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Timeline",
  props: {
    applicantdata: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      // Default statuses if steps are not available from API
      defaultStatuses: [
        "Initial Review & Enquiry",
        "Document Upload",
        "Agent Activation",
        "Review",
        "Processing",
        "Refund Amount",
      ],
    };
  },
  computed: {
    // Get steps from applicantdata or use default statuses
    allStatuses() {
      if (this.applicantdata && this.applicantdata.steps && this.applicantdata.steps.length > 0) {
        // Sort steps by stageIndex if available
        const sortedSteps = [...this.applicantdata.steps].sort((a, b) => a.stageIndex - b.stageIndex);
        return sortedSteps.map(step => step.title);
      }
      return this.defaultStatuses;
    },
  },
  methods: {
    isStepActive(status) {
      // Check if applicantdata exists and has steps
      if (!this.applicantdata || !this.applicantdata.steps) {
        return false;
      }

      // Find the step with matching title and check its status
      const step = this.applicantdata.steps.find(step => step.title === status);
      return step ? step.status : false;
    },
    getStepDate(status) {
      // Check if applicantdata exists and has steps
      if (!this.applicantdata || !this.applicantdata.steps) {
        return null;
      }

      // Find the step with matching title
      const step = this.applicantdata.steps.find(step => step.title === status);

      if (!step || !step.data) {
        return null;
      }

      // Return the appropriate date based on the step key
      switch (step.key) {
        case 'questionnaire':
          return step.data.submittedAt || step.data.createdAt;
        case 'documents':
          // Return some date related to documents if available
          return null;
        case 'agent_activation':
          return step.data.taxAgentVerificationCompletedAt;
        default:
          // For other steps, try to find any date field in the data
          return null;
      }
    },
    formatDate(date) {
      if (!date) return "";

      const dateObj = new Date(date);
      return dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    getStepStatus(status) {
      // Check if applicantdata exists and has steps
      if (!this.applicantdata || !this.applicantdata.steps) {
        return null;
      }

      // Find the step with matching title
      const step = this.applicantdata.steps.find(step => step.title === status);

      if (!step || !step.data) {
        return null;
      }

      return step.data.status;
    },

    formatStepStatus(status) {
      if (!status) return '';

      // Convert snake_case to Title Case with spaces
      return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },

    getStepProgress(status) {
      // Check if applicantdata exists and has steps
      if (!this.applicantdata || !this.applicantdata.steps) {
        return null;
      }

      // Find the step with matching title
      const step = this.applicantdata.steps.find(step => step.title === status);

      if (!step || !step.data) {
        return null;
      }

      // Return progress if available
      return step.data.progress;
    },

    getActiveLineWidth() {
      // Count how many steps are active
      const activeStepsCount = this.allStatuses.filter((status) =>
        this.isStepActive(status)
      ).length;

      if (activeStepsCount <= 1) return "0%";

      // Calculate percentage: (activeSteps - 1) / (totalSteps - 1) * 100
      // We subtract 1 because the line doesn't extend beyond the last active step
      const percentage =
        ((activeStepsCount - 1) / (this.allStatuses.length - 1)) * 100;
      return `${Math.min(percentage, 100)}%`;
    },

    getProgressSegmentStyle(index) {
      const totalSteps = this.allStatuses.length;
      if (totalSteps <= 1) return { display: 'none' };

      // Get the step name for this index
      const stepName = this.allStatuses[index];

      // Custom positioning for each step
      const stepPositions = {
        'Questionnaire Submitted': {
          left: '1%',
          width: '22.2%'
        },
        'Document Upload': {
          left: '22%',
          width: '20%'
        },
        'Agent Activation': {
          left: '40%',
          width: '20%'
        },
        'Review by Tax Agent': {
          left: '60%',
          width: '16%'
        },
        'Revenue Processing Tax Filing': {
          left: '77.9%',
          width: '21%'
        },

      };

      // Return custom position if defined for this step
      if (stepPositions[stepName]) {
        return {
          ...stepPositions[stepName],
          display: 'block'
        };
      }

      // Fallback to calculated positions for any other steps
      const segmentWidth = 100 / (totalSteps - 1);
      const leftPosition = (index / (totalSteps - 1)) * 100;

      return {
        left: `${leftPosition}%`,
        width: `${segmentWidth}%`,
        display: index < totalSteps - 1 ? 'block' : 'none'
      };
    },
  },
};
</script>

<style scoped>
.timeline-container {
  background: #ffffff;
  padding: 24px 32px;
  border-radius: 5px;
  font-family: "DM Sans", sans-serif;
}

.timeline-header {
  margin-bottom: 32px;
}

.timeline-title {
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #000000;
  margin: 0;
  line-height: 24px;
}

.timeline-wrapper {
  position: relative;
  padding: 16px 0;
}

/* Timeline Lines */
.timeline-lines {
  position: absolute;
  top: 28px;
  left: 12px;
  right: 12px;
  height: 2px;
  z-index: 1;
}

.line-full {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #e5e7eb;
  border-radius: 1px;
}

.line-active {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  background: #3b82f6;
  border-radius: 1px;
  transition: width 0.4s ease-in-out;
  z-index: 2;
}

/* Green Progress Segments */
.line-progress-segment {
  position: absolute;
  top: 0;
  height: 2px;
  background: transparent;
  border-radius: 1px;
  transition: background-color 0.4s ease-in-out;
  z-index: 3;
}

.line-progress-segment.segment-completed {
  background: #3b82f6;
  /* Green color for completed segments */
}

/* Timeline Steps */
.timeline-steps {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 3;
}

.timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 120px;
  max-width: 140px;
}

/* First step - left aligned */
.timeline-step:first-child {
  align-items: flex-start;
}

/* Last step - right aligned */
.timeline-step:last-child {
  align-items: flex-end;
}

/* Step Circle */
.step-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-bottom: 12px;
  position: relative;
  z-index: 4;
  background: #e5e7eb;
  color: #9ca3af;
  transition: all 0.3s ease;
}

.step-circle.active {
  background: #3b82f6;
  color: #ffffff;
}

.step-circle svg {
  width: 14px;
  height: 14px;
}

/* Step Info */
.step-info {
  text-align: center;
  width: 100%;
}

/* First step info - left aligned */
.timeline-step:first-child .step-info {
  text-align: left;
}

/* Last step info - right aligned */
.timeline-step:last-child .step-info {
  text-align: right;
}

.step-label {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
  margin-bottom: 4px;
  line-height: 16px;
}

.step-title {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
  line-height: 20px;
  word-wrap: break-word;
  hyphens: auto;
}

.step-status {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #1A73E9;
  line-height: 16px;
  margin-bottom: 4px;
}

.step-progress {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background-color: #E5E7EB;
  border-radius: 2px;
  overflow: hidden;
  margin-right: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #3B82F6;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-family: "DM Sans", sans-serif;
  font-size: 10px;
  font-weight: 500;
  color: #6B7280;
  white-space: nowrap;
}

.step-date {
  font-family: "DM Sans", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
  line-height: 16px;
}

/* Active step styling */
.step-active .step-title {
  color: #111827;
  font-weight: 600;
}

.step-active .step-label {
  color: #6b7280;
}

.step-active .step-date {
  color: #6b7280;
}

/* Inactive step styling */
.step-inactive .step-title {
  color: #9ca3af;
  font-weight: 500;
}

.step-inactive .step-label {
  color: #d1d5db;
}

.step-inactive .step-date {
  color: #d1d5db;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .timeline-container {
    padding: 20px 24px;
  }

  .timeline-steps {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .timeline-step {
    min-width: 100px;
    max-width: 120px;
  }

  .step-title {
    font-size: 13px;
    line-height: 18px;
  }
}

@media (max-width: 768px) {
  .timeline-container {
    padding: 16px 20px;
  }

  .timeline-title {
    font-size: 16px;
  }

  .timeline-steps {
    gap: 8px;
  }

  .timeline-step {
    min-width: 90px;
    max-width: 110px;
  }

  .step-title {
    font-size: 12px;
    line-height: 16px;
  }

  .step-label,
  .step-date {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .timeline-wrapper {
    overflow-x: auto;
    padding: 16px 8px;
  }

  .timeline-steps {
    min-width: 600px;
    justify-content: flex-start;
    gap: 16px;
  }

  .timeline-step {
    flex: none;
    min-width: 90px;
  }

  .timeline-lines {
    min-width: 600px;
  }
}
</style>
