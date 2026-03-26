<template>
  <!-- Backdrop/Overlay -->
  <div
    v-if="visible"
    class="create-questionnaire-overlay"
    @click="handleCancel"
  >
    <v-card class="create-questionnaire-modal" @click.stop :ripple="false">
      <div class="modal-header">
        <h2 class="modal-title">{{ LABELS.CREATE_QUESTIONNAIRE_MODAL }}</h2>
        <v-btn icon small @click="handleCancel" class="close-btn">
          <v-icon color="#FFFFFF" size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="modal-content">
        <div class="form-section">
          <label class="field-label">{{ LABELS.FINANCIAL_YEAR }}</label>
          <v-select
            v-model="financialYear"
            :items="yearOptions"
            item-text="label"
            item-value="value"
            class="outlined-field"
            solo
            flat
            outlined
            dense
            hide-details
            append-icon="mdi-chevron-down"
            placeholder="Select financial year"
          >
            <template v-slot:prepend-inner>
              <v-icon size="16" color="#6B7280">mdi-calendar</v-icon>
            </template>
          </v-select>
        </div>

        <div class="form-section">
          <label class="field-label">{{ LABELS.IMPORT_QUESTION }}</label>
          <div class="radio-group">
            <v-btn
              :class="['radio-btn', { active: importQuestionnaire === false }]"
              @click="importQuestionnaire = false"
              outlined
              depressed
              :ripple="false"
            >
              {{ LABELS.YES }}
            </v-btn>
            <v-btn
              :class="[
                'radio-btn',
                'no-btn',
                { active: importQuestionnaire === true },
              ]"
              @click="handleNoButtonClick"
              outlined
              depressed
              :ripple="false"
            >
              {{ LABELS.NO }}
            </v-btn>
          </div>
        </div>

        <div v-if="!importQuestionnaire" class="form-section">
          <label class="field-label">{{ LABELS.IMPORT_FROM_QUESTION }}</label>
          <v-select
            v-model="importFromYear"
            :items="importYearOptions"
            item-text="label"
            item-value="value"
            class="outlined-field"
            solo
            flat
            outlined
            dense
            hide-details
            append-icon="mdi-chevron-down"
            placeholder="Select year to import from"
          >
            <template v-slot:prepend-inner>
              <v-icon size="16" color="#6B7280">mdi-calendar</v-icon>
            </template>
          </v-select>
        </div>
      </div>

      <div class="button-section">
        <v-btn
          :ripple="false"
          depressed
          color="primary"
          class="proceed-btn"
          block
          @click="handleProceed"
          :disabled="isCreating"
        >
          <span v-if="isCreating && !importQuestionnaire"
            >Importing from {{ importFromYear }}...</span
          >
          <span v-else-if="isCreating && importQuestionnaire"
            >Creating questionnaire...</span
          >
          <span v-else>{{ LABELS.PROCEED }}</span>
        </v-btn>
      </div>

      <v-snackbar v-model="showSnackBar" color="primary" right :timeout="5000">
        <v-layout wrap justify-center>
          <v-flex text-left class="align-self-center">
            <span style="color: white">{{ msg || errorMessage }}</span>
          </v-flex>
          <v-flex text-right>
            <v-btn small :ripple="false" text @click="showSnackBar = false"
              ><v-icon color="white">mdi-close</v-icon></v-btn
            >
          </v-flex>
        </v-layout>
      </v-snackbar>
    </v-card>
  </div>
</template>

<script>
import { questionnaire as questionnaireApi } from "@/api";

export default {
  name: "CreateQuestionnaireModal",
  props: {
    visible: { type: Boolean, default: false },
    LABELS: { type: Object, required: true },
  },
  data() {
    return {
      financialYear: "",
      importQuestionnaire: true,
      importFromYear: "",
      questionnaireId: null,
      isCreating: false,
      showValidationErrors: false,
      missingFields: [],
      yearOptions: [],
      importYearOptions: [],
      errorMessage: null,
      showSnackBar: false,
      msg: "",
      importSuccess: false,
    };
  },
  created() {
    const currentYear = new Date().getFullYear();
    this.importYearOptions = this.makeYearOptions(
      currentYear,
      currentYear - 4,
      true
    );
    this.yearOptions = this.makeYearOptions(
      currentYear + 1,
      currentYear - 4,
      true
    );
  },
  watch: {
    visible(newVal) {
      if (newVal) this._addModalToBody();
      else this._removeModalFromBody();
    },
  },
  beforeDestroy() {
    this._removeModalFromBody(true);
  },
  methods: {
    handleCancel() {
      this.$emit("cancel");
    },
    handleNoButtonClick() {
      this.importQuestionnaire = true;
    },
    async handleProceed() {
      if (this.isCreating) return;
      this.showValidationErrors = false;
      this.missingFields = [];
      if (!this.financialYear)
        this.missingFields.push(this.LABELS.FINANCIAL_YEAR || "Financial Year");
      if (!this.importQuestionnaire && !this.importFromYear)
        this.missingFields.push(
          this.LABELS.IMPORT_FROM_QUESTION || "Import From Year"
        );
      if (this.missingFields.length > 0) {
        this.showValidationErrors = true;
        this.errorMessage = `Please fill: ${this.missingFields.join(", ")}`;
        this.$emit("error", this.errorMessage);
        this.showSnackBar = true;
        this.msg = this.errorMessage;
        return;
      }
      let questionnaireId = this.questionnaireId;
      let importedCategories = null;
      this.errorMessage = null;
      this.importSuccess = false;
      this.isCreating = true;
      try {
        if (!this.importQuestionnaire) {
          const { success, data } = await questionnaireApi.importQuestionnaire({
            importFromTaxYear: this.importFromYear,
            taxYear: this.financialYear,
          });
          if (success && data && data.id) {
            questionnaireId = data.id;
            importedCategories = data.questionCategories || [];
            if (data.importStats) this.importSuccess = true;
          } else {
            const {
              success: createSuccess,
              data: createData,
              message: createMessage,
            } = await questionnaireApi.createQuestionnaire({
              taxYear: this.financialYear,
            });
            if (createSuccess && createData && createData.id)
              questionnaireId = createData.id;
            else {
              this.errorMessage =
                createMessage ||
                "Failed to create questionnaire after import failure";
              this.$emit("error", this.errorMessage);
              this.isCreating = false;
              return;
            }
          }
        } else if (this.importQuestionnaire && !questionnaireId) {
          const { success, data, message } =
            await questionnaireApi.createQuestionnaire({
              taxYear: this.financialYear,
            });
          if (success && data && data.id) questionnaireId = data.id;
          else {
            this.errorMessage = message || "Failed to create new questionnaire";
            this.$emit("error", this.errorMessage);
            this.isCreating = false;
            return;
          }
        }
        this.questionnaireId = questionnaireId;
        if (!questionnaireId) {
          this.errorMessage =
            "Failed to get questionnaire ID. Please try again.";
          this.$emit("error", this.errorMessage);
          this.isCreating = false;
          return;
        }
        const data = {
          financialYear: this.financialYear,
          importQuestionnaire: !this.importQuestionnaire,
          importFromYear: this.importFromYear,
          questionnaireId: questionnaireId,
          importedCategories: importedCategories,
        };
        const routeParams = { id: questionnaireId };
        const queryParams = { import: data.importQuestionnaire };
        if (data.importQuestionnaire && this.importFromYear)
          queryParams.importFrom = this.importFromYear;
        if (importedCategories && importedCategories.length > 0)
          sessionStorage.setItem(
            "importedCategories",
            JSON.stringify(importedCategories)
          );
        this.$router.push({
          name: "createQuestionaire",
          params: routeParams,
          query: queryParams,
        });
        this.$emit("proceed", data);
      } catch (error) {
        this.errorMessage =
          error.message || "An unexpected error occurred. Please try again.";
        this.$emit("error", this.errorMessage);
        this.isCreating = false;
        return;
      }
      this.isCreating = false;
    },
    makeYearOptions(startYear, endYear, descending = true) {
      const years = [];
      if (descending) {
        for (let y = startYear; y >= endYear; y--)
          years.push({ label: String(y), value: y });
      } else {
        for (let y = startYear; y <= endYear; y++)
          years.push({ label: String(y), value: y });
      }
      return years;
    },
    _addModalToBody() {
      try {
        const cnt =
          parseInt(document.body.getAttribute("data-modal-count") || "0", 10) ||
          0;
        document.body.setAttribute("data-modal-count", String(cnt + 1));
        document.body.style.overflow = "hidden";
      } catch (e) {
        console.warn(e);
      }
    },
    _removeModalFromBody(force = false) {
      try {
        const cnt =
          parseInt(document.body.getAttribute("data-modal-count") || "0", 10) ||
          0;
        const next = Math.max(0, cnt - 1);
        if (force) {
          document.body.removeAttribute("data-modal-count");
          document.body.style.overflow = "";
          return;
        }
        if (next <= 0) {
          document.body.removeAttribute("data-modal-count");
          document.body.style.overflow = "";
        } else {
          document.body.setAttribute("data-modal-count", String(next));
        }
      } catch (e) {
        console.warn(e);
      }
    },
  },
};
</script>

<style scoped>
/* Create Questionnaire Modal - Pixel Perfect Design */
.create-questionnaire-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.create-questionnaire-modal {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  width: 460px;
  min-height: 314px;
  max-height: 90vh;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  background: #F1F7FF;
  padding: 0 24px;
}
.modal-title {
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin: 0;
}
.close-btn {
  background: transparent !important;
  box-shadow: none !important;
}
.modal-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  min-height: 200px;
}
.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.field-label {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #5F5F5F;
  margin-bottom: 4px;
}
.outlined-field {
  width: 100%;
  height: 40px;
}
::v-deep(.outlined-field .v-input__slot) {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  height: 40px;
  padding: 0 12px;
  box-shadow: none;
}
::v-deep(.outlined-field.v-input--is-focused .v-input__slot) {
  border-color: #1a73e9 !important;
  box-shadow: 0 0 0 3px rgba(26, 115, 233, 0.08) !important;
}
  .radio-btn {
    width: 100%;
    height: 36px;
    font-size: 13px;
  }

  .proceed-btn {
    height: 44px !important;
    font-size: 15px;
  }
  .radio-btn {
  width: 202px;
  height: 40px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  background-color: transparent;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #5f5f5f;
  text-transform: none;
  letter-spacing: normal;
  box-shadow: none;
  transition: all 0.2s ease;
}

.radio-btn.active {
  background-color: transparent !important;
  border: 2px solid #1a73e9 !important;
  color: #1a73e9 !important;
}

.radio-btn:hover {
  background-color: #f9fafb;
  border-color: #1a73e9;
}

.radio-btn.active:hover {
  background-color: rgba(26, 115, 233, 0.04) !important;
}

::v-deep(.radio-btn .v-btn__content) {
  color: inherit;
}

::v-deep(.radio-btn.active .v-btn__content) {
  color: #1a73e9 !important;
}
.radio-group {
  display: flex;
  gap: 16px;
}

/* rest of styles unchanged for brevity */
</style>
