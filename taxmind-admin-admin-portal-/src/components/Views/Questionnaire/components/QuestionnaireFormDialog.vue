<template>
  <v-dialog v-model="isOpen" max-width="600px" @input="handleDialogChange">
    <v-card rounded="lg">
      <v-card-title>
        <span class="carousaladdedit">{{ dialogTitle }}</span>
        <v-spacer></v-spacer>
        <v-btn color="red" icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-form ref="questionnaireForm">
          <v-layout wrap justify-center px-2>
            <v-flex xs12 pt-4>
              <span class="label">
                {{ LABELS.YEAR }}
                <v-icon size="10px" color="red">mdi-asterisk</v-icon>
              </span>
              <v-text-field
                v-model="formData.year"
                :placeholder="LABELS.ENTER_YEAR"
                class="pt-2"
                solo
                flat
                outlined
                dense
                :hide-details="true"
                background-color="white"
                type="number"
                min="2020"
                max="2030"
              ></v-text-field>
            </v-flex>

            <v-flex xs12 pt-4>
              <span class="label">
                {{ LABELS.DESCRIPTION }}
              </span>
              <v-textarea
                v-model="formData.description"
                :placeholder="LABELS.ENTER_DESCRIPTION"
                class="pt-2"
                solo
                flat
                outlined
                dense
                :hide-details="true"
                background-color="white"
                rows="3"
              ></v-textarea>
            </v-flex>
          </v-layout>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="py-4 justify-end headline grey lighten-2">
        <v-btn
          outlined
          color="grey"
          text
          @click="closeDialog"
          :ripple="false"
        >
          <span style="color: black">{{ LABELS.CANCEL }}</span>
        </v-btn>
        <v-btn
          color="primary"
          dark
          :ripple="false"
          depressed
          @click="validateAndSubmit"
          class="carousaladdedit"
        >
          <span style="text-transform: none">{{ LABELS.SAVE }}</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "QuestionnaireFormDialog",
  props: {
    value: {
      type: Boolean,
      default: false
    },
    editMode: {
      type: Boolean,
      default: false
    },
    initialData: {
      type: Object,
      default: () => ({
        year: "",
        description: ""
      })
    },
    LABELS: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      formData: {
        year: "",
        description: ""
      }
    };
  },
  computed: {
    isOpen: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('input', val);
      }
    },
    dialogTitle() {
      return this.editMode ? this.LABELS.EDIT_QUESTIONNAIRE : this.LABELS.ADD_QUESTIONNAIRE;
    }
  },
  watch: {
    value(newVal) {
      if (newVal) {
        this.resetForm();
        this.formData = { ...this.initialData };
      }
    }
  },
  methods: {
    handleDialogChange(value) {
      this.$emit('input', value);
    },
    
    closeDialog() {
      this.$emit('input', false);
      this.$emit('close');
    },
    
    resetForm() {
      this.formData = {
        year: "",
        description: ""
      };
      if (this.$refs.questionnaireForm) {
        this.$refs.questionnaireForm.resetValidation();
      }
    },
    
    validateAndSubmit() {
      if (!this.formData.year) {
        this.$emit('error', this.LABELS.YEAR_REQUIRED);
        return;
      }

      const year = parseInt(this.formData.year);
      if (isNaN(year) || year < 2020 || year > 2030) {
        this.$emit('error', this.LABELS.YEAR_MUST_BE_VALID);
        return;
      }

      this.$emit('submit', { ...this.formData });
    }
  }
};
</script>

<style scoped>
.dialog-card {
  font-family: 'Inter', sans-serif;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.label {
  font-family: 'opensansregular', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #212121;
}
</style>
