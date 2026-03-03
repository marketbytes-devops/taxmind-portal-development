/**
 * Questionnaire Common Mixins
 * TaxMind Admin Portal
 */

import axios from "axios";
import { QUESTIONNAIRE_LABELS } from "../constants/questionnaireLabels";
import {
  QUESTIONNAIRE_API,
  getDefaultHeaders,
} from "../constants/questionnaireAPI";

export const questionnaireErrorMixin = {
  methods: {
    handleError(err) {
      if (err.response) {
        if (err.response.status === 500) {
          this.ServerError = true;
          this.msg = QUESTIONNAIRE_LABELS.SERVER_ERROR;
        } else {
          this.ServerError = false;
          this.msg =
            err.response.data.message || QUESTIONNAIRE_LABELS.ERROR_MESSAGE;
        }
      } else {
        this.ServerError = true;
        this.msg = QUESTIONNAIRE_LABELS.ERROR_MESSAGE;
      }
      this.showSnackBar = true;
      console.error("API Error:", err);
    },
  },
};

export const questionnaireDataMixin = {
  data() {
    return {
      LABELS: QUESTIONNAIRE_LABELS,
      appLoading: false,
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      ServerError: false,
    };
  },
};

export const questionnaireAPIMixin = {
  methods: {
    async makeAPICall(config) {
      try {
        this.appLoading = true;
        const response = await axios({
          ...config,
          headers: {
            ...getDefaultHeaders(),
            ...config.headers,
          },
        });

        this.appLoading = false;
        return response;
      } catch (err) {
        this.appLoading = false;
        this.handleError(err);
        throw err;
      }
    },

    async fetchQuestionnaires() {
      try {
        const response = await this.makeAPICall({
          method: QUESTIONNAIRE_API.METHODS.GET,
          url: QUESTIONNAIRE_API.LIST,
        });

        if (response.data.status) {
          return response.data.data || [];
        } else {
          this.msg = response.data.message;
          this.showSnackBar = true;
          return [];
        }
      } catch (err) {
        return [];
      }
    },
  },
};

export const questionnaireSampleDataMixin = {
  methods: {
    generateSampleQuestionnaires() {
      return [
        {
          id: 1,
          year: 2025,
          totalQuestions: 45,
          totalApplications: 128,
          applicationsInReview: 32,
          completed: 96,
          description: "Tax Year 2025 Questionnaire",
          status: "Published",
          createdAt: "2025-01-15T10:30:00Z",
          updatedAt: "2025-01-20T14:45:00Z",
        },
        {
          id: 2,
          year: 2024,
          totalQuestions: 42,
          totalApplications: 245,
          applicationsInReview: 15,
          completed: 230,
          description: "Tax Year 2024 Questionnaire",
          status: "Published",
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-12-20T16:20:00Z",
        },
        {
          id: 3,
          year: 2023,
          totalQuestions: 38,
          totalApplications: 189,
          applicationsInReview: 0,
          completed: 189,
          description: "Tax Year 2023 Questionnaire",
          status: "Archived",
          createdAt: "2023-01-15T10:30:00Z",
          updatedAt: "2023-12-31T23:59:00Z",
        },
        {
          id: 4,
          year: 2022,
          totalQuestions: 35,
          totalApplications: 167,
          applicationsInReview: 0,
          completed: 167,
          description: "Tax Year 2022 Questionnaire",
          status: "Archived",
          createdAt: "2022-01-15T10:30:00Z",
          updatedAt: "2022-12-31T23:59:00Z",
        },
        {
          id: 5,
          year: 2021,
          totalQuestions: 32,
          totalApplications: 143,
          applicationsInReview: 0,
          completed: 143,
          description: "Tax Year 2021 Questionnaire",
          status: "Archived",
          createdAt: "2021-01-15T10:30:00Z",
          updatedAt: "2021-12-31T23:59:00Z",
        },
        {
          id: 6,
          year: 2020,
          totalQuestions: 30,
          totalApplications: 89,
          applicationsInReview: 0,
          completed: 89,
          description: "Tax Year 2020 Questionnaire",
          status: "Archived",
          createdAt: "2020-01-15T10:30:00Z",
          updatedAt: "2020-12-31T23:59:00Z",
        },
      ];
    },

    generateSampleStatistics() {
      return {
        totalQuestionnaires: 6,
        totalApplications: 961,
        activeQuestionnaires: 2,
        archivedQuestionnaires: 4,
        averageQuestions: 37,
        averageCompletionRate: 92.5,
      };
    },

    generateRandomSampleData(count = 6) {
      // Generate dynamic sample data with realistic variance
      const data = [];
      const currentYear = new Date().getFullYear();

      for (let i = 0; i < count; i++) {
        const year = currentYear - i;
        const isRecent = i < 2; // Mark first 2 as recent/active

        // Mix of published and draft statuses for testing
        const statuses = ["published", "draft"];
        const randomStatus =
          statuses[Math.floor(Math.random() * statuses.length)];

        data.push({
          id: i + 1,
          year: year,
          totalQuestions: Math.floor(Math.random() * 20) + 30, // 30-50 questions
          totalApplications: Math.floor(Math.random() * 200) + 50, // 50-250 applications
          applicationsInReview: isRecent ? Math.floor(Math.random() * 50) : 0,
          completed: (function () {
            const total = this.totalApplications - this.applicationsInReview;
            return Math.max(0, total);
          })(),
          description: `Tax Year ${year} Questionnaire`,
          status: randomStatus, // Random mix of published/draft for testing confirmation popup
          createdAt: `${year}-01-15T10:30:00Z`,
          updatedAt: isRecent
            ? new Date().toISOString()
            : `${year}-12-31T23:59:00Z`,
        });
      }

      return data;
    },

    initializeSampleData() {
      // Sample data for demonstration - remove when API is connected
      console.log("Initializing sample questionnaire data...");
      return this.generateSampleQuestionnaires();
    },

    loadRandomSampleData() {
      // Alternative method to load randomized data
      console.log("Loading randomized sample data...");
      return this.generateRandomSampleData();
    },
  },
};

// Combined mixin for questionnaire components
export const questionnaireMixin = {
  mixins: [
    questionnaireErrorMixin,
    questionnaireDataMixin,
    questionnaireAPIMixin,
    questionnaireSampleDataMixin,
  ],
};
