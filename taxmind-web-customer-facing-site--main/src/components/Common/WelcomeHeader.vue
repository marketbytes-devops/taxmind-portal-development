<template>
  <div>
    <div class="d-flex align-items-center justify-space-between welcome-header">
      <div>
        {{ welcomeText }} <span class="name">{{ userName }}</span>{{ messageText }}
      </div>
      <div v-if="showButton">
        <v-btn class="action-btn ml-4" color="primary" :ripple="false" depressed dark @click="handleButtonClick">
          {{ buttonText }}
        </v-btn>
      </div>
    </div>

    <!-- Create Questionnaire Modal -->
    <CreateQuestionnaireModal :visible="showCreateModal" :LABELS="LABELS" @cancel="handleCreateCancel"
      @show-snackbar="handleShowSnackbar" @success="handleCreateSuccess" />

    <!-- Global snackbar used via this.$snackbar -->
  </div>
</template>

<script>
import CreateQuestionnaireModal from "../Application/components/questionnaire/CreateQuestionnaireModal.vue";
import { QUESTIONNAIRE_LABELS } from "../../common/constants/questionnaireLabels";

export default {
  name: "WelcomeHeader",

  components: {
    CreateQuestionnaireModal,
  },

  props: {
    userName: {
      type: String,
      default: () => localStorage.getItem("userName") || "User",
    },
    welcomeText: {
      type: String,
      default: "Welcome",
    },
    messageText: {
      type: String,
      default: ", Let's start your tax refund journey.",
    },
    buttonText: {
      type: String,
      default: "New Claim",
    },
    showButton: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    return {
      showCreateModal: false,
      // Global snackbar used via this.$snackbar
      LABELS: QUESTIONNAIRE_LABELS,
    };
  },

  methods: {
    handleButtonClick() {
      this.showCreateModal = true;
    },
    handleCreateCancel() {
      this.showCreateModal = false;
    },
    handleShowSnackbar({ message }) {
      // Use global snackbar instead of local
      this.$snackbar.showSuccess(message);
    },
    handleCreateSuccess(response) {
      console.log("Application created successfully:", response);
      this.$emit("create-success", response);
    },
  },
};
</script>

<style lang="scss" scoped>
$blue: #3073f8;

.welcome-header {
  background: white;
  margin-bottom: 15px;
  padding: 15px;
  border-radius: 10px;
  align-items: center;
  display: flex;
}

.amendment-btn {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: white !important;

  &:hover {
    background-color: #2563eb !important;
    border-color: #2563eb !important;
  }

  &:before {
    display: none !important;
  }

  .v-icon {
    color: white !important;
  }
}

.action-btn {
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  border-radius: 8px !important;
  height: 40px !important;
  padding: 0 16px !important;
  font-size: 14px !important;
  min-width: auto !important;
  box-shadow: none !important;

  .v-icon {
    margin-right: 8px !important;
    margin-left: 0 !important;
  }
}

.name {
  color: $blue;
  font-family: "DM Sans", sans-serif;
}
</style>
