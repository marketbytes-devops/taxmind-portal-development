<template>
  <v-card elevation="0" flat class="px-4">
    <!-- <v-container fluid class="pa-0"> -->
    <v-layout wrap>
      <v-flex xs12 pb-4>
        <div class="section-title">Questionnaire Overview</div>
      </v-flex>
    </v-layout>

    <!-- Questionnaire Sections -->
    <InitialReview />
    <!-- </v-container> -->
  </v-card>
</template>




<script>

import InitialReview from '../../Applications/InitialReview.vue';
export default {
  name: "QuestionnaireOverview",

  components: {
    InitialReview,
  },

  props: {
    questionnaireData: {
      type: Array,
      default: () => [],
    },
  },

  methods: {
    getAnswerValue(answer) {
      // Handle null, undefined, empty string, or empty array
      if (
        answer === null ||
        answer === undefined ||
        answer === "" ||
        (Array.isArray(answer) && answer.length === 0)
      ) {
        return "-";
      }

      return answer;
    },
  },
};
</script>

<style scoped>
/* Pixel Perfect Design Matching Figma */
.questionnaire-container {
  font-family: "DM Sans", sans-serif;
  background: transparent !important;
  margin-bottom: 24px;
}

.section-title {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: #000000;
  /* margin-bottom: 16px; */
  font-variation-settings: "opsz" 14;
}

.questionnaire-content {
  background: #ffffff !important;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #e5e7eb;
}

.questionnaire-section {
  margin-bottom: 32px;
}

.questionnaire-section:last-child {
  margin-bottom: 0;
}

.section-header {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #1a73e9;
  margin-bottom: 16px;
  font-variation-settings: "opsz" 14;
}

.questions-list {
  margin: 0;
}

.question-answer-row {
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 0;
}

.question-answer-row:last-child {
  border-bottom: none;
}

.question-col {
  padding-right: 24px;
}

.answer-col {
  padding-left: 0;
}

.question-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #5f5f5f;
  font-variation-settings: "opsz" 14;
}

.answer-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #000000;
  text-align: right;
  font-variation-settings: "opsz" 14;
}

/* Responsive Design */
@media (max-width: 768px) {
  .questionnaire-content {
    padding: 16px;
  }

  .question-col {
    padding-right: 0;
    margin-bottom: 8px;
  }

  .answer-col {
    padding-left: 0;
  }

  .answer-text {
    text-align: left;
  }

  .section-title {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .questionnaire-container {
    margin-bottom: 24px;
  }

  .questionnaire-content {
    padding: 12px;
  }

  .questionnaire-section {
    margin-bottom: 24px;
  }

  .question-text,
  .answer-text {
    font-size: 12px;
    line-height: 18px;
  }

  .section-header {
    font-size: 12px;
    margin-bottom: 12px;
  }
}
</style>
