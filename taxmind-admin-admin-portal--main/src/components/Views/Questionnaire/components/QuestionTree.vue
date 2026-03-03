<template>
  <div class="question-tree" :class="{ 'has-children': hasVisibleChildren }">
    <!-- Question Block -->
    <div class="question-item" :style="indentStyle">
      <!-- Question Text -->
      <div class="question-text-wrapper">
        <div class="question-text">
          <span>{{ question.questionText }}</span>
          <span v-if="question.isRequired" class="required">*</span>
          <v-tooltip v-if="question.helpText" bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-icon
                small
                color="#1A73E9"
                class="ml-2"
                v-bind="attrs"
                v-on="on"
                >mdi-help-circle-outline</v-icon
              >
            </template>
            <span>{{ question.helpText }}</span>
          </v-tooltip>
        </div>
      </div>

      <!-- Input Control -->
      <div class="input-wrapper">
        <!-- Select / Dropdown -->
        <v-select
          v-if="isSelectType"
          :value="modelValue"
          :items="selectItems"
          item-text="label"
          item-value="value"
          outlined
          dense
          class="question-select"
          placeholder="Select"
          @input="onAnswer"
        >
          <template v-slot:append>
            <v-icon size="20" color="#5F5F5F">mdi-chevron-down</v-icon>
          </template>
        </v-select>

        <!-- Radio Group -->
        <v-radio-group
          v-else-if="question.questionType === 'radio'"
          :value="modelValue"
          @change="onAnswer"
          class="question-radio-group"
        >
          <v-radio
            v-for="opt in selectItems"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
            class="question-radio"
          />
        </v-radio-group>

        <!-- Text Input -->
        <v-text-field
          v-else-if="question.questionType === 'text'"
          :value="modelValue"
          outlined
          dense
          placeholder="Enter text"
          class="question-text-field"
          @input="onAnswer"
        />

        <!-- Number Input -->
        <v-text-field
          v-else-if="question.questionType === 'number'"
          :value="modelValue"
          type="number"
          outlined
          dense
          placeholder="Enter number"
          class="question-text-field"
          @input="onAnswer"
        />

        <!-- Date Input -->
        <v-text-field
          v-else-if="question.questionType === 'date'"
          :value="modelValue"
          type="date"
          outlined
          dense
          class="question-text-field"
          @input="onAnswer"
        />

        <!-- Checkbox -->
        <v-checkbox
          v-else-if="question.questionType === 'checkbox'"
          :input-value="modelValue"
          :label="question.checkboxLabel || question.questionText"
          class="question-checkbox"
          @change="onAnswer"
        />

        <!-- Fallback / Unsupported -->
        <div v-else class="unsupported-type grey--text caption">
          Unsupported question type: {{ question.questionType }}
        </div>
      </div>
    </div>

    <!-- Recursive Children -->
    <div v-if="hasVisibleChildren" class="children-wrapper">
      <QuestionTree
        v-for="child in visibleChildren"
        :key="child.id"
        :question="child"
        :responses.sync="responses"
        :depth="depth + 1"
        @answered="handleChildAnswered"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: "QuestionTree",
  props: {
    question: { type: Object, required: true },
    responses: { type: Object, default: () => ({}) },
    depth: { type: Number, default: 0 },
  },
  computed: {
    modelValue() {
      return this.responses[this.question.id] || null;
    },
    isSelectType() {
      return ["dropdown", "select"].includes(this.question.questionType);
    },
    selectItems() {
      if (!this.question.options) return [];
      return this.question.options.map((o) => ({
        label: o.label,
        value: o.value,
      }));
    },
    visibleChildren() {
      if (!this.question.children || !this.question.children.length) return [];
      const answer = this.modelValue;
      return this.question.children.filter(
        (c) => c.showIfParentOptionValue === answer
      );
    },
    hasVisibleChildren() {
      return this.visibleChildren.length > 0;
    },
    indentStyle() {
      // Indent nested levels except root
      return this.depth > 0
        ? { marginLeft: `${Math.min(this.depth * 24, 120)}px` }
        : {};
    },
  },
  methods: {
    onAnswer(value) {
      const prevValue = this.modelValue;
      if (prevValue === value) {
        // No change
        return;
      }
      // If answer changes, purge previously visible subtree responses
      if (
        prevValue !== null &&
        this.question.children &&
        this.question.children.length
      ) {
        const prevChildren = this.question.children.filter(
          (c) => c.showIfParentOptionValue === prevValue
        );
        const idsToClear = [];
        const collect = (q) => {
          idsToClear.push(q.id);
          if (q.children && q.children.length) q.children.forEach(collect);
        };
        prevChildren.forEach(collect);
        idsToClear.forEach((id) => {
          if (this.responses[id] !== undefined)
            this.$delete(this.responses, id);
        });
      }
      this.$set(this.responses, this.question.id, value);
      this.$emit("answered", this.question, value);
    },
    handleChildAnswered(question, value) {
      // Bubble up
      this.$emit("answered", question, value);
    },
  },
};
</script>

<style scoped>
.question-tree {
  width: 100%;
}
.question-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.question-text {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #000;
  display: flex;
  align-items: center;
}
.required {
  color: #d53e3e;
  margin-left: 4px;
}
.input-wrapper {
  max-width: 964px;
}
.children-wrapper {
  margin-top: 8px;
}
.unsupported-type {
  font-style: italic;
}
</style>
