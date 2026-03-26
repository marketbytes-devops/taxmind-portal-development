<template>
  <CreateQuestionaire :mode="'view'" />
</template>

<script>
import CreateQuestionaire from "./createQuestionaire.vue";

export default {
  name: "ViewQuestionnaire",
  components: {
    CreateQuestionaire,
  },
};
</script>

<style scoped>
/* View questionnaire specific styles */
.view-questionnaire-container {
  background-color: #f1f7ff;
  min-height: 100vh;
}
</style>
