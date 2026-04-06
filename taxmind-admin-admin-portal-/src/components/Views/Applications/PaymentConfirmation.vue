<template>
  <v-card flat class="pa-4">
    <v-row align="center">
      <v-col cols="12" md="8">
        <div class="text-subtitle-1 font-weight-bold mb-2">Manual Payment Confirmation</div>
        <p class="text-body-2 text-secondary">
          If the user has paid offline (Cash/Bank Transfer) but the system does not reflect it, you can manually mark it as completed here.
        </p>
      </v-col>
      <v-col cols="12" md="4" class="text-right">
        <v-chip :color="isCompleted ? 'success' : 'warning'" label small class="mb-2">
          {{ isCompleted ? 'COMPLETED' : 'PENDING' }}
        </v-chip>
        <v-switch v-model="internalCompleted" label="Mark as Completed" color="success" :disabled="isCompleted"
          @change="handleToggle" hide-details class="mt-0 pt-0 justify-end"></v-switch>
      </v-col>
    </v-row>

    <v-divider class="my-4"></v-divider>

    <v-alert v-if="isCompleted" type="success" text dense class="mb-0">
      This application's payment has been confirmed and marked as completed.
    </v-alert>
    <v-alert v-else type="info" text dense class="mb-0">
      Payment is currently pending. Once confirmed, the applicant will be notified.
    </v-alert>

    <v-overlay :value="loading" absolute>
      <v-progress-circular indeterminate size="48"></v-progress-circular>
    </v-overlay>
  </v-card>
</template>

<script>
import { markPaymentAsCompleted } from '@/api/modules/applications';

export default {
  name: 'PaymentConfirmation',
  props: {
    applicantdata: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      internalCompleted: false,
    };
  },
  computed: {
    isCompleted() {
      return this.applicantdata && this.applicantdata.paymentStatus === 'completed';
    },
  },
  watch: {
    isCompleted: {
      handler(val) {
        this.internalCompleted = val;
      },
      immediate: true,
    },
  },
  methods: {
    async handleToggle(val) {
      if (!val) return; // Don't allow un-marking for now as it's a critical action

      this.loading = true;
      try {
        const response = await markPaymentAsCompleted(this.applicantdata.id);
        if (response.data.success) {
          this.$notification.success('Payment marked as completed successfully');
          this.$emit('refresh'); // Signal parent to refresh data
        } else {
          throw new Error(response.data.message || 'Failed to update payment status');
        }
      } catch (error) {
        console.error('Error marking payment as completed:', error);
        this.$notification.error(error.message || 'An error occurred while marking payment as completed');
        this.internalCompleted = false; // Reset toggle on error
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.justify-end :deep(.v-input--selection-controls__input) {
  margin-right: 0;
}
</style>
