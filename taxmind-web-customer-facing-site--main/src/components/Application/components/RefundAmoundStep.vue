<template>
  <div class="refund-amount-step">
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <!-- Global snackbar used via this.$snackbar.showSuccess/showError -->
    <!-- Success Icon and Header -->
    <div class="header-section">
      <div class="success-icon">
        <v-icon color="white" size="32">mdi-check</v-icon>
      </div>
      <h2 class="main-title">Amount Approved By the Government</h2>
      <p class="subtitle">
        Once your refund is approved, the amount is transferred directly to your
        bank account or issued via cheque.
      </p>
    </div>

    <!-- Commission Details Card -->
    <div v-if="localStepData?.commissionPercentage > 0" class="commission-details-card">
      <h3 class="card-title">Commission Details:</h3>
      <div class="details-content">
        <div class="detail-row">
          <span class="label">Standard Fee :</span>
          <span class="value">{{ localStepData?.commissionPercentage || 0 }}% of the total tax
            refund amount.</span>
        </div>
        <div class="detail-row">
          <span class="label">Why It's Easy :</span>
          <span class="value">Secure, fast, and ensures your refund is processed without
            delays.</span>
        </div>
      </div>
    </div>

    <!-- Amount Breakdown -->
    <div class="amount-breakdown">
      <div class="breakdown-content">
        <div class="breakdown-row">
          <span class="breakdown-label">Refund Amount</span>
          <span class="breakdown-value">€ {{ localStepData?.refundAmount || 0 }}</span>
        </div>
        <!-- <template v-if="localStepData?.commissionPercentage > 0"> -->
          <div class="breakdown-row" v-if="localStepData?.commissionPercentage > 0">
            <span class="breakdown-label">Commission Percentage </span>
            <span class="breakdown-value">{{ localStepData?.commissionPercentage || 0 }}%</span>
          </div>
          <div class="breakdown-row" v-if="localStepData?.commissionPercentage > 0">
            <span class="breakdown-label">Commission Amount</span>
            <span class="breakdown-value">€ {{ localStepData?.commissionAmount || 0 }}</span>
          </div>
          <div class="breakdown-row" v-if="localStepData?.commissionPercentage > 0">
            <span class="breakdown-label" >VAT Percentage</span>
            <span class="breakdown-value">{{ localStepData?.vatPercentage || 0 }}%</span>
          </div>
          <div class="breakdown-row" v-if="localStepData?.commissionPercentage > 0">
            <span class="breakdown-label">VAT Amount</span>
            <span class="breakdown-value">€ {{ localStepData?.vatAmount || 0 }}</span>
          </div>
           <div class="breakdown-row" v-if="localStepData?.flatFee > 0">
            <span class="breakdown-label">Flat Fee</span>
            <span class="breakdown-value">€ {{ localStepData?.flatFee || 0 }}</span>
          </div>
          <div class="breakdown-row">
            <span class="breakdown-label">Discount</span>
            <span class="breakdown-value discount">- € {{ localStepData?.discountAmount || 0 }}</span>
          </div>
        <!-- </template> -->
      </div>
      <div class="total-row">
        <span class="total-label">Total Amount</span>
        <span class="total-value">€ {{ Number(localStepData?.finalAmount || 0).toFixed(2) }}</span>
      </div>
    </div>

    <!-- Payment Options -->
    <div v-if="
      localStepData.paymentStatus !== 'completed' &&
      !(
        localStepData.latestOfflinePaymentRequest &&
        localStepData.latestOfflinePaymentRequest.status === 'approved'
      )
    " class="payment-section-container">
      <div class="payment-section">
        <div class="payment-option">
          <v-switch v-model="alreadyPaidOffline" color="success" class="payment-switch" :disabled="localStepData.paymentStatus !== 'pending' ||
            (localStepData.latestOfflinePaymentRequest &&
              localStepData.latestOfflinePaymentRequest.status === 'pending')
            " @change="handleSwitchChange"></v-switch>
          <span class="payment-label">I have already paid offline</span>
        </div>

        <v-btn class="pay-now-btn" color="#E0E0E0" :disabled="alreadyPaidOffline || isProcessingCheckout"
          :loading="isProcessingCheckout" large rounded @click="handlePayNow">
          Pay now
        </v-btn>
      </div>

      <!-- Offline Payment Review Message -->
      <div v-if="alreadyPaidOffline && localStepData.latestOfflinePaymentRequest" class="offline-review-message">
        <v-icon color="#FF9800" size="18" class="mr-2 mt-1">mdi-clock-outline</v-icon>
        <span>Your payment is currently under review by our admin team. We’ll
          notify you as soon as it’s approved.</span>
      </div>
    </div>

    <!-- Payment Success Notification -->
    <!-- <div v-if="localStepData.paymentStatus === 'completed' || (localStepData.latestOfflinePaymentRequest && localStepData.latestOfflinePaymentRequest.status === 'approved')"
            class="payment-success-notification">
            <div class="success-header">Payment Successfully Completed!</div>
            <div class="success-message">
                Your payment has been verified and approved. Your tax refund process is now complete.
            </div>
            <div class="success-amount" v-if="localStepData.latestPayment?.amount">
                Amount Paid: €{{ localStepData.latestPayment.amount }}
            </div>
            <div class="success-transaction" v-if="localStepData.latestPayment?.transactionNo">
                Transaction No: {{ localStepData.latestPayment.transactionNo }}
            </div>
        </div> -->

    <!-- Payment Rejection Notification -->
    <div v-if="
      localStepData.paymentStatus === 'rejected' ||
      (localStepData.latestOfflinePaymentRequest &&
        localStepData.latestOfflinePaymentRequest.status === 'rejected')
    " class="payment-rejection-notification">
      <div class="rejection-header">
        Offline payment request has been rejected. Please try again.
      </div>
      <div class="rejection-reason">
        Reason: {{ localStepData.latestOfflinePaymentRequest?.rejectionReason }}
      </div>
      <div class="rejection-category" v-if="localStepData.latestOfflinePaymentRequest?.rejectionCategory">
        Category:
        {{ localStepData.latestOfflinePaymentRequest.rejectionCategory }}
      </div>
      <div class="rejection-date" v-if="localStepData.latestOfflinePaymentRequest?.rejectedDate">
        Rejected on:
        {{ formatDate(localStepData.latestOfflinePaymentRequest.rejectedDate) }}
      </div>
      <div class="rejection-support">
        Please contact our support team for assistance.
      </div>
      <v-btn class="contact-btn" color="primary" @click="contactSupport">Contact</v-btn>
    </div>

    <!-- Payment Details for Completed Payments -->
    <template v-if="
      localStepData.paymentStatus === 'completed' ||
      (localStepData.latestOfflinePaymentRequest &&
        localStepData.latestOfflinePaymentRequest.status === 'approved')
    ">
      <div v-if="localStepData.refundAmount > 0" class="commission-details-card mb-5 mt-5 p-5">
        <h3 class="card-title mb-0">Payment Details</h3>
      </div>

      <!-- Amount Breakdown for Completed Payment -->
      <div v-if="localStepData.refundAmount > 0" class="amount-breakdown mb-5">
        <div class="breakdown-content">
          <div class="breakdown-row">
            <span class="breakdown-label">Payment Method</span>
            <span class="breakdown-value">{{
              localStepData.latestPayment?.paymentMethod ||
              localStepData.latestOfflinePaymentRequest
                ?.verifiedPaymentMethod ||
              "-"
            }}</span>
          </div>
          <div class="breakdown-row">
            <span class="breakdown-label">Transaction ID</span>
            <span class="breakdown-value">{{
              localStepData.latestPayment?.transactionId ||
              localStepData.latestOfflinePaymentRequest
                ?.verifiedTransactionId ||
              "-"
            }}</span>
          </div>

          <div class="breakdown-row">
            <span class="breakdown-label">Payment Date</span>
            <span class="breakdown-value">{{
              formatDate(localStepData.latestPayment?.createdAt) ||
              formatDate(
                localStepData.latestOfflinePaymentRequest?.verifiedPaymentDate
              ) ||
              "-"
            }}</span>
          </div>
          <div class="breakdown-row">
            <span class="breakdown-label">Status</span>
            <span class="breakdown-value success-status">{{
              localStepData.latestPayment?.status ||
              localStepData.latestOfflinePaymentRequest?.status ||
              "-"
              }}</span>
          </div>
        </div>
      </div>
      <v-btn v-if="
        localStepData.taxReturnDocument &&
        localStepData.taxReturnDocument.filePath
      " color="primary" :ripple="false" depressed dark block @click="downloadTaxReturn">
        Download Tax Return <v-icon class="ml-2">mdi-download</v-icon>
      </v-btn>

      <!-- Review Section -->
      <div v-if="!reviewSubmitted" class="review-section mt-10">
        <div class="review-header">
          <h3 class="review-title mb-3">Give your feedback</h3>
        </div>
        <div class="review-content">
          <div class="rating-section">
            <p class="rating-label">Rate Us</p>
            <div class="star-rating">
              <v-icon v-for="star in 5" :key="star" :color="star <= selectedRating ? '#FFD700' : '#E0E0E0'" size="32"
                class="star-icon" @click="setRating(star)">
                mdi-star
              </v-icon>
            </div>
          </div>

          <div class="feedback-section">
            <p class="feedback-label">
              Write Your Feedback <span class="optional-text">(Optional)</span>
            </p>
            <v-textarea v-model="feedbackText" placeholder="Tell us..." outlined rows="4" class="feedback-textarea"
              hide-details></v-textarea>
          </div>

          <v-btn class="submit-review-btn" color="#1976D2" dark block large rounded :disabled="selectedRating === 0"
            :loading="submittingReview" @click="submitReview">
            Submit
          </v-btn>
        </div>
      </div>
      <!-- Review Success Message -->
      <div v-else class="review-success-message">
        <div class="success-content">
          <!-- <div class="success-icon-container">
                        <v-icon color="white" size="40">mdi-check-circle</v-icon>
                    </div> -->
          <h3 class="success-title">Thank you for your feedback!</h3>
          <p class="success-message">
            Your review has been submitted successfully. We appreciate you
            taking the time to share your experience with us.
          </p>
          <div class="review-details-container">
            <div class="rating-display">
              <span class="rating-text">Your Rating:</span>
              <div class="stars-display">
                <v-icon v-for="star in 5" :key="star" :color="star <= selectedRating ? '#FFD700' : '#E0E0E0'" size="24">
                  mdi-star
                </v-icon>
              </div>
            </div>
            <div v-if="feedbackText" class="feedback-display">
              <p class="feedback-display-label">Your Feedback:</p>
              <p class="feedback-display-text">{{ feedbackText }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Offline Payment Confirmation Dialog -->
    <v-dialog v-model="showOfflineConfirmationDialog" max-width="450" persistent>
      <v-card class="offline-confirmation-card">
        <v-card-text class="text-center pa-8">
          <div class="confirmation-icon">
            <v-icon color="white" size="32">mdi-check</v-icon>
          </div>
          <h3 class="confirmation-title">Offline payment confirmation</h3>
          <p class="confirmation-message">
            Our team will verify and notify you once the payment is approved. Do
            you want to continue?
          </p>
          <v-btn class="continue-btn" color="#4285f4" dark block large rounded @click="confirmOfflinePayment"
            :loading="isProcessingPayment">
            Continue
          </v-btn>
        </v-card-text>
        <v-btn icon class="close-btn" @click="cancelOfflinePayment">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card>
    </v-dialog>

    <!-- AI Tax Summary Section -->
    <div v-if="false" class="ai-tax-summary-section mt-8">
      <!-- Locked State -->
      <div v-if="!isAiSummaryUnlocked" class="ai-summary-card locked-card">
        <div class="card-header">
          <div class="header-left">
            <v-icon color="white" size="20">mdi-creation</v-icon>
            <span class="header-title">Tax Summary AI</span>
          </div>
        </div>
        <div class="card-content">
          <div class="lock-icon-container">
            <div class="lock-icon">
              <v-icon color="white" size="24">mdi-lock</v-icon>
            </div>
          </div>
          <h3 class="summary-title">Generate AI Tax Summary</h3>
          <p class="summary-description">
            Confirm your payment to receive the complete analysis in seconds.
          </p>
        </div>
      </div>

      <!-- Unlocked State -->
      <div v-else class="ai-summary-card unlocked-card">
        <div class="card-header">
          <div class="header-left">
            <v-icon color="white" size="20">mdi-creation</v-icon>
            <span class="header-title">Tax Summary AI</span>
          </div>
        </div>
        <div class="card-content">
          <div class="report-content">
            <h3 class="report-title">AI Tax Summary Report</h3>
            <p class="assessment-year">Assessment Year: 2024-2025</p>
            <div class="report-details">
              <p>
                John Murphy, holding PPS number 1234567A, filed his tax return
                for the year 2024. His total income amounted to €47,500, which
                included €45,000 from employment and €2,500 from other sources.
                He was eligible for total tax credits of €4,050, including
                personal and PAYE credits of €1,875 each, and €300 for medical
                expenses. Throughout the year, he paid €7,800 in taxes. After
                calculations, his total tax due was €7,450, resulting in an
                overpayment of €350. A refund of this amount is due, and the
                return was submitted on 15 January 2025 and processed by the
                Revenue Commissioners.
              </p>
            </div>
          </div>

          <div class="action-buttons">
            <v-btn color="white" class="action-btn">
              <v-icon left text size="16">mdi-content-copy</v-icon>
              Copy
            </v-btn>
            <v-btn color="white" class="action-btn">
              <v-icon left text size="16">mdi-download</v-icon>
              Download
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Toggle Button for Testing -->
      <!-- <v-btn small text color="primary" class="mt-2" @click="toggleAiSummary">
                {{ isAiSummaryUnlocked ? 'Lock AI Summary' : 'Unlock AI Summary' }}
            </v-btn> -->
    </div>
  </div>
</template>

<script>
import ApplicationService from "../../../services/application";

export default {
  name: "RefundAmoundStep",
  data() {
    return {
      appLoading: false,
      payNowBtnLoading: false,
      ServerError: false,
      snackbarColor: "#1A73E9",
      timeout: 5000,
      localStepData: {},
      alreadyPaidOffline: false,
      isAiSummaryUnlocked: false,
      paymentRejected: true,
      isProcessingPayment: false,
      isProcessingCheckout: false,
      refundData: {
        refundAmount: 0,
        commissionRate: 0,
        vatRate: 0,
        discount: 0,
      },
      showOfflineConfirmationDialog: false,
      selectedRating: 0,
      feedbackText: "",
      reviewSubmitted: false,
      submittingReview: false,
    };
  },
  props: {
    applicationData: {
      type: Object,
      required: true,
    },
    currentStepData: {
      type: Object,
      required: true,
    },
  },
  watch: {
    currentStepData: {
      immediate: true,
      deep: true,
      handler(newVal) {
        if (newVal) {
          this.localStepData = { ...(newVal?.stepData?.application || {}) };
          console.log("localStepData updated:", this.localStepData);
          // Auto-set alreadyPaidOffline to true if there's an existing offline payment request with pending status
          if (
            this.localStepData.latestOfflinePaymentRequest &&
            this.localStepData.latestOfflinePaymentRequest.status ===
            "pending" &&
            this.localStepData.paymentStatus === "pending"
          ) {
            this.alreadyPaidOffline = true;
          } else if (
            this.localStepData.latestOfflinePaymentRequest &&
            this.localStepData.latestOfflinePaymentRequest.status === "rejected"
          ) {
            // Reset switch if payment was rejected
            this.alreadyPaidOffline = false;
          }

          // Check if review already exists
          if (this.localStepData.review) {
            this.reviewSubmitted = true;
            this.selectedRating =
              parseInt(this.localStepData.review.rating) || 0;
            this.feedbackText = this.localStepData.review.review || "";
          }
        }
      },
    },
  },

  computed: {
    // commissionAmount() {
    //     return (this.refundData.refundAmount * this.refundData.commissionRate) / 100;
    // },
    // vatAmount() {
    //     return (this.commissionAmount * this.refundData.vatRate) / 100;
    // },
    // totalCommissionAmount() {
    //     return this.commissionAmount + this.vatAmount;
    // },
    // totalAmount() {
    //     return this.totalCommissionAmount - this.refundData.discount;
    // }
  },
  methods: {
    handleSwitchChange(value) {
      console.log("value", value);

      if (value === true) {
        // Prevent immediate toggle and show confirmation
        this.showOfflinePaymentConfirmation();
      }
    },

    async handlePayNow() {
      if (this.alreadyPaidOffline || this.isProcessingCheckout) {
        return;
      }

      if (!this.applicationData?.id) {
        console.error("Application ID is missing");
        this.$snackbar.showError(
          "Application ID is missing. Please try again."
        );
        return;
      }

      this.isProcessingCheckout = true;
      this.payNowBtnLoading = true;

      try {
        const response = await ApplicationService.paymentCheckout(
          this.applicationData.id
        );

        if (response && response.success) {
          console.log("Payment checkout successful:", response);

          // Show success message
          this.$snackbar.showSuccess(
            "Payment checkout initiated successfully!"
          );

          // Call getRefundStepData and loadApplicationData after successful payment
          await this.handlePostPaymentActions();

          // If there's a checkout URL, redirect to it
          if (response.data?.checkoutUrl || response.checkoutUrl) {
            const checkoutUrl =
              response.data?.checkoutUrl || response.checkoutUrl;
            window.location.href = checkoutUrl;
          }
        } else {
          throw new Error("Payment checkout failed");
        }
      } catch (error) {
        console.error("Error processing payment checkout:", error);
        this.handleApiError(error);
      } finally {
        this.isProcessingCheckout = false;
        this.payNowBtnLoading = false;
      }
    },

    toggleAiSummary() {
      this.isAiSummaryUnlocked = !this.isAiSummaryUnlocked;
    },

    downloadTaxReturn() {
      if (
        this.localStepData.taxReturnDocument &&
        this.localStepData.taxReturnDocument.filePath
      ) {
        const filePath = this.localStepData.taxReturnDocument.filePath;
        const fileName =
          this.localStepData.taxReturnDocument.fileName ||
          "tax_return_document.pdf";

        // Open the file in a new tab or trigger download
        const link = document.createElement("a");
        link.href = filePath;
        link.target = "_blank";
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show success message
        this.$snackbar.showSuccess("Tax return document download initiated!");
      } else {
        this.$snackbar.showError("Tax return document not available.");
      }
    },

    contactSupport() {
      // Handle contact support action
      // add router to customer-support
      this.$router.push("/customer-support");
    },

    async handleOfflinePaymentRequest() {
      if (!this.applicationData?.id) {
        console.error("Application ID is missing");
        return;
      }

      this.isProcessingPayment = true;

      try {
        const response = await ApplicationService.requestOfflinePayment(
          this.applicationData.id
        );

        if (response && response.success) {
          console.log("Offline payment request successful:", response);
          // Show success message via global snackbar
          this.$snackbar.showSuccess(
            "Offline payment request submitted successfully!"
          );

          // Call getRefundStepData and loadApplicationData after successful offline payment
          await this.handlePostPaymentActions();
        } else {
          throw new Error("Payment request failed");
        }
      } catch (error) {
        console.error("Error requesting offline payment:", error);

        // Revert the switch back to false on error
        this.alreadyPaidOffline = false;

        this.handleApiError(error);
      } finally {
        this.isProcessingPayment = false;
      }
    },
    async handlePostPaymentActions() {
      try {
        console.log(
          "Calling getRefundStepData and loadApplicationData after payment success..."
        );

        // Call getRefundStepData API
        const refundData = await ApplicationService.getRefundStepData(
          this.applicationData.id
        );
        console.log("Refund step data retrieved:", refundData);

        // Emit event to parent to call loadApplicationData
        this.$emit("reload-application-data");
      } catch (error) {
        console.error("Error in post-payment actions:", error);
        this.$snackbar.showError(
          "Payment successful, but failed to refresh data. Please reload the page."
        );
      }
    },

    showOfflinePaymentConfirmation() {
      this.showOfflineConfirmationDialog = true;
      // Reset the switch to false until user confirms
      this.$nextTick(() => {
        this.alreadyPaidOffline = false;
      });
    },

    async confirmOfflinePayment() {
      this.alreadyPaidOffline = true;
      await this.handleOfflinePaymentRequest();
      this.showOfflineConfirmationDialog = false;
    },

    cancelOfflinePayment() {
      this.showOfflineConfirmationDialog = false;
      this.alreadyPaidOffline = false;
    },

    handleApiError(err) {
      let message = "An unexpected error occurred. Please try again.";
      if (err.response) {
        if (err.response.status === 500) {
          this.ServerError = true;
          message = "A server error occurred. Please try again later.";
        } else {
          this.ServerError = false;
          message = err.response.data.error || "An error occurred.";
        }
      }
      this.$snackbar.showError(message);
    },

    formatDate(dateString) {
      if (!dateString) return "-";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        console.error("Error formatting date:", error);
        return dateString;
      }
    },

    setRating(rating) {
      this.selectedRating = rating;
    },

    async submitReview() {
      if (this.selectedRating === 0) {
        this.$snackbar.showError("Please select a rating before submitting.");
        return;
      }

      if (!this.applicationData?.id) {
        console.error("Application ID is missing");
        this.$snackbar.showError(
          "Application ID is missing. Please try again."
        );
        return;
      }

      this.submittingReview = true;

      try {
        // Prepare review data
        const reviewData = {
          applicationId: this.applicationData.id,
          rating: this.selectedRating,
          review: this.feedbackText || "",
        };

        // Call API to submit review
        const response = await ApplicationService.submitReview(reviewData);

        if (response && response.success) {
          console.log("Review submitted successfully:", response);

          // Show success message
          this.$snackbar.showSuccess("Thank you for your feedback!");

          // Mark review as submitted
          this.reviewSubmitted = true;
        } else {
          throw new Error("Review submission failed");
        }
      } catch (error) {
        console.error("Error submitting review:", error);
        this.handleApiError(error);
      } finally {
        this.submittingReview = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.refund-amount-step {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: "DM Sans", sans-serif;
}

.header-section {
  text-align: center;
  margin-bottom: 30px;

  .success-icon {
    width: 60px;
    height: 60px;
    background: #4caf50;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }

  .main-title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
    line-height: 1.3;
  }

  .subtitle {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
    max-width: 500px;
    margin: 0 auto;
  }
}

.commission-details-card {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 30px;
  text-align: left;

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #2196f3;
    margin-bottom: 10px;
  }

  .details-content {
    .detail-row {
      margin-bottom: 5px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        font-weight: 600;
        color: #333;
        margin-right: 8px;
      }

      .value {
        color: #666;
        font-size: 14px;
      }
    }
  }
}

.amount-breakdown {
  background: white;
  border-radius: 12px;
  // padding: 24px;
  margin-bottom: 30px;
  border: 1px solid rgb(219, 219, 219);

  // box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  .breakdown-content {
    padding: 15px 15px;
  }

  .breakdown-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    // border-bottom: 1px solid #F0F0F0;

    .breakdown-label {
      font-size: 14px;
      color: #666;
    }

    .breakdown-value {
      font-size: 14px;
      color: #333;
      font-weight: 500;

      &.discount {
        color: #4caf50;
      }

      &.success-status {
        color: #4caf50;
        font-weight: 600;
        text-transform: capitalize;
      }
    }
  }

  // .total-row {
  //     display: flex;
  //     justify-content: space-between;
  //     align-items: center;
  //     padding: 16px 0 0;
  //     border-top: 2px solid #E0E0E0;

  //     .total-label {
  //         font-size: 16px;
  //         font-weight: 600;
  //         color: #333;
  //     }

  //     .total-value {
  //         font-size: 18px;
  //         font-weight: 700;
  //         color: #333;
  //     }
  // }
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-top: 1px solid #e0e0e0;

  .total-label {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .total-value {
    font-size: 18px;
    font-weight: 700;
    color: #333;
  }
}

.payment-section-container {
  margin-bottom: 20px;
}

.payment-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;

  .payment-option {
    display: flex;
    // align-items: center;

    gap: 12px;

    .payment-switch {
      margin: 0;
    }

    .payment-label {
      font-size: 14px;
      color: #333;
      margin-top: 2px;
      font-weight: 500;
    }
  }

  .pay-now-btn {
    min-width: 120px;
    height: 44px;
    text-transform: none;
    font-weight: 500;
    font-size: 14px;

    &:not(:disabled) {
      background: #2196f3 !important;
      color: white !important;
    }
  }
}

.offline-review-message {
  text-align: left;
  display: flex;
  align-items: center;
  background: #fff3e0;
  border: 1px solid #ffe0b2;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 16px;
  font-size: 14px;
  align-items: flex-start;
  color: #e65100;
  line-height: 1.5;

  span {
    flex: 1;
  }
}

// AI Tax Summary Styles
.ai-tax-summary-section {
  .ai-summary-card {
    border: 2px solid #e3f2fd;
    border-radius: 12px;
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    overflow: hidden;
    margin-bottom: 16px;

    .card-header {
      background: linear-gradient(90deg, #2196f3 0%, #9c27b0 100%);
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .header-title {
          color: white;
          font-weight: 600;
          font-size: 16px;
        }
      }
    }

    .card-content {
      padding: 32px 24px;
      text-align: center;
      background: #b7dbe8;
      background: #2196f3;
      background: #2196f3;
      background: linear-gradient(42deg,
          rgba(33, 150, 243, 0.21) 0%,
          rgba(156, 39, 176, 0.07) 100%,
          rgba(255, 255, 255, 1) 100%);
    }

    // Locked State Styles
    &.locked-card {
      .lock-icon-container {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;

        .lock-icon {
          width: 60px;
          height: 60px;
          background: #2196f3;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .summary-title {
        font-size: 20px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
      }

      .summary-description {
        color: #666;
        font-size: 14px;
        line-height: 1.5;
        max-width: 400px;
        margin: 0 auto;
      }
    }

    // Unlocked State Styles
    &.unlocked-card {
      .card-content {
        text-align: left;
        padding: 24px;
      }

      .report-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 2px;
      }

      .assessment-year {
        color: #666;
        font-size: 14px;
        margin-bottom: 20px;
        padding-bottom: 10px;
      }

      .report-details {
        border-top: 1px solid rgb(233, 233, 233);
        padding-top: 20px;
      }

      .report-content {
        background: white;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;

        p {
          color: #333;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }
      }

      .action-buttons {
        display: flex;
        gap: 12px;

        .action-btn {
          text-transform: none;
          font-weight: 500;
          height: 36px;
          border-radius: 6px;

          .v-icon {
            margin-right: 4px !important;
          }
        }
      }
    }
  }
}

// Payment Success Notification Styles
.payment-success-notification {
  border: 1px solid #4caf50;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
  margin: 20px 0;
  background-color: #f1f8e9;

  .success-header {
    color: #2e7d32;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    display: flex;
    align-items: center;

    &::before {
      content: "✓";
      display: inline-block;
      width: 20px;
      height: 20px;
      background: #4caf50;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 20px;
      font-size: 12px;
      font-weight: bold;
      margin-right: 8px;
    }
  }

  .success-message {
    color: #388e3c;
    font-size: 14px;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .success-amount {
    color: #2e7d32;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .success-transaction {
    color: #388e3c;
    font-size: 13px;
    font-family: monospace;
    background: rgba(76, 175, 80, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
  }
}

// Payment Rejection Notification Styles
.payment-rejection-notification {
  border: 1px solid #f17070;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
  margin: 20px 0;
  background-color: #fff;

  .rejection-header {
    color: #d32f2f;
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .rejection-reason {
    color: #616161;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .rejection-category {
    color: #616161;
    font-size: 14px;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .rejection-date {
    color: #616161;
    font-size: 14px;
    margin-bottom: 12px;
    font-style: italic;
  }

  .rejection-support {
    color: #2196f3;
    font-size: 14px;
    margin-top: 20px;
    margin-bottom: 5px;
  }

  .contact-btn {
    text-transform: none;
    font-weight: 500;
    height: 36px;
    width: 100px;
    border-radius: 4px;
  }
}

// Offline Payment Confirmation Dialog Styles
.offline-confirmation-card {
  border-radius: 12px;
  position: relative;

  .confirmation-icon {
    width: 60px;
    height: 60px;
    background: #4caf50;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
  }

  .confirmation-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
    line-height: 1.3;
  }

  .confirmation-message {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
    margin-bottom: 32px;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
  }

  .continue-btn {
    text-transform: none;
    font-weight: 500;
    font-size: 16px;
    height: 48px;
    box-shadow: none;

    &:hover {
      box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
    }
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    color: #9aa0a6;

    &:hover {
      background-color: #f1f3f4;
      color: #5f6368;
    }
  }
}

// Vuetify overrides
::v-deep .v-input--switch .v-input__slot {
  margin-bottom: 0;
}

::v-deep .v-input--switch .v-input__control {
  width: auto;
}

// Review Section Styles
.review-section {
  background: white;
  border-radius: 12px;
  // padding: 24px;

  margin-top: 24px;
  text-align: left;

  .review-content {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 24px;

    .review-header {
      margin-bottom: 20px;

      .review-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0;
      }
    }

    .rating-section {
      margin-bottom: 24px;

      .rating-label {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
      }

      .star-rating {
        display: flex;
        gap: 4px;
        align-items: center;

        .star-icon {
          cursor: pointer;
          transition: color 0.2s ease;

          &:hover {
            transform: scale(1.1);
          }
        }
      }
    }

    .feedback-section {
      margin-bottom: 24px;

      .feedback-label {
        font-size: 14px;
        font-weight: 500;
        color: #333;
        margin-bottom: 12px;

        .optional-text {
          font-size: 13px;
          font-weight: 400;
          color: #999;
          font-style: italic;
        }
      }

      .feedback-textarea {
        ::v-deep .v-input__control {
          .v-input__slot {
            border-radius: 8px;
          }
        }

        ::v-deep .v-text-field__slot input::placeholder {
          color: #999;
          font-size: 14px;
        }
      }
    }

    .submit-review-btn {
      text-transform: none;
      font-weight: 500;
      font-size: 16px;
      height: 48px;
      box-shadow: none;

      &:hover:not(:disabled) {
        box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
      }

      &:disabled {
        background-color: #e0e0e0 !important;
        color: #9e9e9e !important;
      }
    }
  }

  // Review Success Message Styles

  @keyframes successPulse {

    0%,
    100% {
      transform: scale(1);
      box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
    }

    50% {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
    }
  }

  @keyframes checkBounce {
    0% {
      transform: scale(0);
      opacity: 0;
    }

    50% {
      transform: scale(1.2);
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
}

.review-success-message {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 100%);
  border: 2px solid #4caf50;
  border-radius: 16px;
  padding: 0;
  margin-top: 24px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);

  .success-content {
    padding: 40px 32px;
    text-align: center;
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #4caf50 0%, #66bb6a 100%);
    }
  }

  .success-icon-container {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
    animation: successPulse 2s ease-in-out infinite;

    .v-icon {
      animation: checkBounce 0.6s ease-out;
    }
  }

  .success-title {
    font-size: 24px;
    font-weight: 700;
    color: #2e7d32;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }

  .success-message {
    font-size: 15px;
    color: #555;
    margin: 0 0 24px 0;
    line-height: 1.6;
    max-width: 450px;
    margin-left: auto;
    margin-right: auto;
  }

  .review-details-container {
    background: white;
    border-radius: 12px;
    padding: 20px 24px;
    margin-top: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    text-align: left;
  }

  .rating-display {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;

    .rating-text {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .stars-display {
      display: flex;
      gap: 4px;
      align-items: center;
    }
  }

  .feedback-display {
    border-top: 1px solid #e0e0e0;
    padding-top: 16px;

    .feedback-display-label {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    .feedback-display-text {
      font-size: 14px;
      color: #555;
      line-height: 1.6;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
}
</style>
