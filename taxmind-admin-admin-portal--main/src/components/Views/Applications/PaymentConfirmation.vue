<template>
  <v-card elevation="0" class="white pa-4">
    <v-snackbar v-model="showSnackBar" :color="snackbarColor" right :timeout="5000">
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

    <div class="d-flex align-center justify-space-between mb-4">
      <h2 class="Head2">Payment Completion</h2>
      <v-chip
        v-if="isCompleted"
        color="success"
        text-color="white"
        small
        class="font-weight-bold"
      >
        COMPLETED
      </v-chip>
      <v-chip
        v-else
        color="warning"
        text-color="white"
        small
        class="font-weight-bold"
      >
        PENDING
      </v-chip>
    </div>

    <v-divider class="mb-6"></v-divider>

    <v-layout wrap align-center>
      <v-flex xs12 sm8>
        <div class="text-h6 mb-1">Manual Payment Override</div>
        <div class="text-body-2 grey--text">
          Use this toggle to manually mark the payment as completed if the user paid offline but forgot to update their status.
        </div>
      </v-flex>
      <v-flex xs12 sm4 class="text-sm-right mt-4 mt-sm-0">
        <v-switch
          v-model="internalCompleted"
          :loading="loading"
          :disabled="isCompleted || loading"
          color="success"
          inset
          label="Mark as Completed"
          @change="handleToggle"
        ></v-switch>
      </v-flex>
    </v-layout>

    <v-alert
      v-if="isCompleted"
      type="info"
      outlined
      dense
      class="mt-6"
    >
      This application's payment has been finalized. No further manual changes are required.
    </v-alert>
  </v-card>
</template>

<script>
import { markPaymentAsCompleted } from "@/api/modules/applications";

export default {
  name: "PaymentConfirmation",
  props: {
    applicantdata: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      showSnackBar: false,
      snackbarColor: "primary",
      msg: "",
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
      if (!val) return;

      try {
        this.loading = true;
        const response = await markPaymentAsCompleted(this.applicantdata.id);
        
        if (response.data.success) {
          this.msg = "Payment successfully marked as completed.";
          this.snackbarColor = "success";
          this.showSnackBar = true;
          // Trigger data refresh in parent
          this.$emit('refresh');
        } else {
          throw new Error(response.data.message || "Failed to update payment status");
        }
      } catch (error) {
        console.error("Manual payment update error:", error);
        this.msg = error.message || "An error occurred while updating payment status.";
        this.snackbarColor = "error";
        this.showSnackBar = true;
        this.internalCompleted = false; // Reset toggle
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.Head2 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}
</style>
