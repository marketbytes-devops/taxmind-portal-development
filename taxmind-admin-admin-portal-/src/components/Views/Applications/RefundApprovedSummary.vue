<template>
  <v-card flat class="pa-4">
    <div class="text-subtitle-1 font-weight-bold mb-4">Refund Approval Details</div>
    
    <v-row v-if="hasData">
      <v-col cols="12" md="6">
        <div class="detail-group mb-4">
          <div class="text-caption grey--text text-uppercase">Final Refund Amount</div>
          <div class="text-h5 primary--text">€ {{ refundAmount }}</div>
        </div>
        
        <div class="detail-group mb-4">
          <div class="text-caption grey--text text-uppercase">Approval Status</div>
          <v-chip color="success" text-color="white" small label>
            {{ applicantdata.status === 'refund_completed' ? 'REFUND COMPLETED' : 'APPROVED' }}
          </v-chip>
        </div>
      </v-col>
      
      <v-col cols="12" md="6">
        <div class="detail-group mb-4">
          <div class="text-caption grey--text text-uppercase">Payment Method</div>
          <div class="text-body-1">{{ paymentMethod }}</div>
        </div>
      </v-col>
      
      <v-col cols="12" v-if="applicantdata.taxReturnSummary">
        <v-divider class="my-4"></v-divider>
        <div class="text-caption grey--text text-uppercase mb-2">Final Summary Report</div>
        <v-sheet color="grey lighten-4" class="pa-3 rounded">
          <div class="text-body-2 summary-text">{{ applicantdata.taxReturnSummary }}</div>
        </v-sheet>
      </v-col>
    </v-row>
    
    <v-alert v-else type="info" text dense class="mb-0">
      Approval details will appear here once the status is updated to 'Approved'.
    </v-alert>
  </v-card>
</template>

<script>
export default {
  name: 'RefundApprovedSummary',
  props: {
    applicantdata: {
      type: Object,
      required: true,
    },
  },
  computed: {
    hasData() {
      return this.applicantdata && 
             (this.applicantdata.status === 'approved' || 
              this.applicantdata.status === 'refund_completed' ||
              this.applicantdata.refundAmount > 0);
    },
    refundAmount() {
      return this.applicantdata.refundAmount || 0;
    },
    paymentMethod() {
      if (this.applicantdata.paymentMethod) return this.applicantdata.paymentMethod;
      return 'Not Specified';
    }
  }
};
</script>

<style scoped>
.summary-text {
  white-space: pre-wrap;
  color: #374151;
  line-height: 1.6;
}
.detail-group {
  border-left: 3px solid #1A73E9;
  padding-left: 12px;
}
</style>
