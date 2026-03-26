<template>
  <v-dialog v-model="isOpen" max-width="600" @input="handleDialogChange">
    <v-card class="dialog-card">
      <v-card-title class="grey lighten-2 d-flex justify-center">
        <v-icon color="red" size="32">mdi-alert</v-icon>
        <span class="ml-2">{{ LABELS.CONFIRM_DELETION }}</span>
      </v-card-title>
      
      <v-card-text class="py-5 text-center text-des">
        <div class="body-1">
          {{ LABELS.DELETE_CONFIRMATION_MESSAGE }}
          <br />
          <strong>{{ LABELS.CANNOT_BE_UNDONE }}</strong>
        </div>
        <v-divider class="my-3"></v-divider>
        <v-row class="pt-2" no-gutters>
          <v-col>
            <v-icon style="color: #1a73e9">mdi-clipboard-text-outline</v-icon>
          </v-col>
        </v-row>
      </v-card-text>
      
      <v-card-actions class="d-flex justify-center pa-2">
        <v-btn
          outlined
          color="grey"
          text
          @click="closeDialog"
          class="dialog-button"
          :ripple="false"
        >
          <span style="color: black">{{ LABELS.CANCEL }}</span>
        </v-btn>
        <v-btn
          color="red"
          dark
          @click="confirmDelete"
          class="dialog-button"
          :ripple="false"
        >
          {{ LABELS.DELETE }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "QuestionnaireDeleteDialog",
  props: {
    value: {
      type: Boolean,
      default: false
    },
    LABELS: {
      type: Object,
      required: true
    }
  },
  computed: {
    isOpen: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('input', val);
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
    
    confirmDelete() {
      this.$emit('confirm');
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

.dialog-button {
  min-width: 120px;
}
</style>
