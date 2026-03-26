<template>
  <div>
    <vue-element-loading :active="loading" spinner="bar-fade-scale" color="#1A73E9" size="60" />
    <v-snackbar v-model="showSnackBar" color="error" right :timeout="5000">
      <v-layout wrap justify-center>
        <v-flex text-left class="align-self-center">
          <span style="color: #ffffff">{{ errorMessage }}</span>
        </v-flex>
        <v-flex text-right>
          <v-btn small :ripple="false" text @click="showSnackBar = false">
            <v-icon style="color: #ffffff">mdi-close</v-icon>
          </v-btn>
        </v-flex>
      </v-layout>
    </v-snackbar>

    <v-layout wrap pa-6>
      <v-flex xs12 v-if="loading" class="text-center pa-5">
        <v-progress-circular indeterminate color="#1A73E9" size="32"></v-progress-circular>
      </v-flex>
      <template v-else>
        <v-flex xs12 v-for="(section, index) in sections" :key="index" class="">
          <v-card outlined elevation="0" :class="index !== sections.length - 1 ? 'mb-4' : ''">
            <div class="pa-2">
              <span class="primary--text buttonText">{{ section.title }}</span>
            </div>
            <div class="table-container">
              <!-- Label column -->
              <div class="label-column">
                <div v-for="item in section.items" :key="item.id" class="item-row buttonText"
                  :style="{ color: $vuetify.theme.themes.light.greyText }">
                  {{ item.text }}
                </div>
              </div>
              <div class="vertical-divider"></div>
              <div class="value-column">
                <div v-for="item in section.items" :key="item.id" class="item-row buttonText font-weight-bold">
                  {{ item.value }}
                </div>
              </div>
            </div>
          </v-card>
        </v-flex>
      </template>
    </v-layout>
  </div>
</template>

<script>
import http from "@/api/http";
import VueElementLoading from "vue-element-loading";

export default {
  components: {
    VueElementLoading
  },
  props: {
    applicationId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      appid: '',
      showSnackBar: false,
      errorMessage: "",
      sections: [],
      rawQuestionnaireData: null
    };
  },
  created() {
    // Use the applicationId from props if available, otherwise try to get from route query
    this.appId = this.applicationId || this.$route.query.id;
    this.fetchQuestionnaireData(this.appId);
  },
  methods: {
    fetchQuestionnaireData() {
      this.loading = true;
      http
        .get(`questionnaires/applications/${this.appId}`)
        .then(response => {
          this.loading = false;
          if (response.data && response.data.success) {
            this.rawQuestionnaireData = response.data.data;
            this.processQuestionnaireData(response.data.data);
          } else {
            this.errorMessage = response.data.message || "Failed to load questionnaire data";
            this.showSnackBar = true;
          }
        })
        .catch(error => {
          this.loading = false;
          console.error("Error fetching questionnaire data:", error);
          this.errorMessage = error.response?.data?.message || "An error occurred while fetching questionnaire data";
          this.showSnackBar = true;

          // Load default data for development/testing
          this.loadDefaultData();
        });
    },
    processQuestionnaireData(data) {
      // Process the API response into the format needed for display
      if (!data || !data.questionnaire || !data.questionnaire.questionCategories) {
        this.loadDefaultData();
        return;
      }

      this.sections = data.questionnaire.questionCategories.map(category => {
        return {
          title: category.name,
          items: category.questions.map((question, index) => {
            return {
              id: index + 1,
              text: question.questionText,
              value: this.formatQuestionValue(question.answer)
            };
          })
        };
      });
    },
    formatQuestionValue(answer) {
      if (!answer || answer.value === null || answer.value === undefined) return "-";

      const value = answer.value;

      // Handle date type answers
      if (value && typeof value === 'string' && value.includes('T00:00:00.000Z')) {
        return this.formatDate(value);
      }

      // Handle boolean or yes/no values
      if (value === true || value === 'yes') {
        return "Yes";
      }

      if (value === false || value === 'no') {
        return "No";
      }

      // Format underscore-separated values (e.g., i_have_but_expired -> I Have But Expired)
      const stringValue = value.toString();
      if (stringValue.includes('_')) {
        return stringValue
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }

      return stringValue;
    },
    formatDate(dateString) {
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      } catch (e) {
        return dateString;
      }
    },
    loadDefaultData() {
      // Fallback data in case the API fails
      this.sections = [
        {
          title: "Home Carer Tax Credit",
          items: [
            { id: 1, text: "Marital Status", value: "Married" },
            { id: 2, text: "Does your spouse earn less than €10,400 per year?", value: "Yes" },
            { id: 3, text: "Do you care for a dependent child, elderly person, or disabled individual?", value: "Yes" },
            { id: 4, text: "Enter the PPS Number of the dependent child", value: "-" },
            { id: 5, text: "Select the Date of Birth of the dependent child", value: "01-01-1970" }
          ]
        },
        {
          title: "Medical Expenses Tax Credit",
          items: [
            { id: 6, text: "Have you incurred medical or dental expenses not covered by insurance?", value: "Yes" },
            { id: 7, text: "Do you have receipts for these expenses?", value: "Yes" },
            { id: 8, text: "Enter the total amount of medical expenses incurred (€)", value: "-" }
          ]
        },
        {
          title: "Dependent Relative Tax Credit",
          items: [
            { id: 9, text: "Do you financially support a relative who is unable to support themselves?", value: "Yes" },
            { id: 10, text: "Select the dependent relative's relation", value: "Parent" },
            { id: 11, text: "Does their annual income fall below €16,000?", value: "Yes" }
          ]
        }
      ];
    }
  }
};
</script>

<style scoped>
.table-container {
  display: flex;
  border-top: 1px solid #eee;
}

/* Label column */
.label-column {
  flex: 7;
  display: flex;
  flex-direction: column;
}

/* Value column */
.value-column {
  flex: 5;
  display: flex;
  flex-direction: column;
}

/* Vertical divider spanning full height */
.vertical-divider {
  width: 1px;
  background-color: #ccc;
}

/* Individual row styling */
.item-row {
  padding: 8px 10px;
  /* optional row separator */
}
</style>
