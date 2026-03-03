<template>
  <v-dialog v-model="dialog" max-width="750" persistent>
    <v-card elevation="0" class="pa-0">
      <!-- Header with blue background -->
      <v-layout wrap>
        <v-flex xs12 class="dialog-header pa-2">
          <v-layout align-center justify-space-between>
            <span class="Head2 white--text">{{ dialogTitle }}</span>
            <v-btn icon @click="close" color="white">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-layout>
        </v-flex>

        <!-- Content -->
        <v-flex xs12 class="px-5 pt-5">
          <!-- User name field -->
          <v-text-field v-model="form.userName" :placeholder="LABELS.USER_NAME" solo flat outlined dense
            :hide-details="true" background-color="white" class="mb-7" />

          <!-- Email address field -->
          <v-text-field v-model="form.email" :placeholder="LABELS.EMAIL" :rules="[rules.required, rules.emailFormat]"
            :error-messages="emailError ? [emailError] : []" solo flat outlined dense background-color="white"
            type="email" @input="validateEmail" :disabled="mode === 'edit'"
            :hint="mode === 'edit' ? 'Email cannot be changed' : ''" persistent-hint />

          <!-- Select role dropdown -->
          <v-select v-model="form.role" :items="roles" item-text="text" item-value="value"
            :placeholder="LABELS.SELECT_ROLE" :loading="$parent.rolesLoading" :disabled="$parent.rolesLoading" solo flat
            outlined dense :hide-details="true" background-color="white" class="mb-6">
            <template v-slot:selection="{ item }">
              {{ item.text }}
            </template>
            <template v-slot:item="{ item }">
              <v-list-item-content>
                <v-list-item-title>{{ item.text }}</v-list-item-title>
                <!-- <v-list-item-subtitle class="text-caption">ID: {{ item.value }}</v-list-item-subtitle> -->
              </v-list-item-content>
            </template>
          </v-select>

          <!-- Divider line -->

          <!-- Action buttons -->
        </v-flex>
        <v-flex xs12 pb-4>
          <v-divider></v-divider>
        </v-flex>
      </v-layout>
      <v-layout wrap justify-space-between align-center px-4 pb-4>
        <v-flex shrink>
          <v-btn text :ripple="false" @click="close" class="buttonText" style="text-transform: none; color: #000">
            {{ LABELS.CANCEL }}
          </v-btn>
        </v-flex>
        <v-flex shrink>
          <v-layout>
            <!-- Save & add new button - only in create mode -->
            <OutlinedButton v-if="!isEditMode" :text="LABELS.SAVE_AND_ADD" :onClick="saveAndAddNew" :disabled="!isValid"
              color="#1A73E9" size="medium" class="mr-3" />
            <!-- Primary action button (Save/Update) -->
            <FilledButton :text="primaryButtonText" :onClick="save" :disabled="!isValid" color="#1A73E9"
              size="medium" />
          </v-layout>
        </v-flex>
      </v-layout>
    </v-card>
  </v-dialog>
</template>

<script>
import FilledButton from "../../../utilities/FilledButton.vue";
import OutlinedButton from "../../../utilities/OutlinedButton.vue";

export default {
  name: "CreateUserDialog",
  components: {
    FilledButton,
    OutlinedButton,
  },
  props: {
    value: { type: Boolean, default: false },
    roles: { type: Array, default: () => [] },
    mode: {
      type: String,
      default: "create",
      validator: (v) => ["create", "edit"].includes(v),
    },
    userData: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      dialog: false, // Initialize to false instead of this.value
      LABELS: {
        CREATE_TITLE: "Create user",
        EDIT_TITLE: "Edit user",
        USER_NAME: "User name",
        EMAIL: "Email address",
        SELECT_ROLE: "Select role name",
        CANCEL: "Cancel",
        SAVE_AND_ADD: "Save & add new",
        SAVE: "Save",
        UPDATE: "Update",
      },
      // Initialize with empty values
      form: {
        userName: "",
        email: "",
        role: null,
      },
      // Email validation
      emailError: null,
      rules: {
        required: value => !!value || 'Required field',
        emailFormat: value => {
          // Common email validation pattern
          const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          return pattern.test(value) || 'Invalid email format';
        }
      },
    };
  },
  mounted() {
    // Reset form and sync dialog state on mount
    this.reset();
    this.dialog = this.value;
    console.log("CreateUserDialog mounted, dialog:", this.dialog);
  },
  watch: {
    value(val) {
      console.log("CreateUserDialog value changed:", val); // Debug log
      this.dialog = val;
    },
    dialog(val) {
      console.log("CreateUserDialog dialog changed:", val); // Debug log
      this.$emit("input", val);
    },
    userData: {
      immediate: true,
      handler(newData) {
        console.log("userData changed:", newData, "mode:", this.mode);
        if (this.mode === "edit" && newData) {
          // Create a new object to ensure Vue reactivity
          this.form = {
            userName: newData.username || newData.userName || "",
            email: newData.email || "",
            role: newData.role.id
              || null,
          };
          console.log("Form updated for edit mode:", this.form);
        } else if (this.mode === "create") {
          // Reset form for create mode
          this.reset();
        }
      },
    },
  },
  computed: {
    isValid() {
      // Check if all fields are filled and email is valid
      return this.form.userName &&
        this.form.email &&
        this.rules.emailFormat(this.form.email) === true &&
        this.form.role;
    },
    dialogTitle() {
      return this.mode === "edit"
        ? this.LABELS.EDIT_TITLE
        : this.LABELS.CREATE_TITLE;
    },
    primaryButtonText() {
      return this.mode === "edit" ? this.LABELS.UPDATE : this.LABELS.SAVE;
    },
    isEditMode() {
      return this.mode === "edit";
    },
  },
  methods: {
    close() {
      this.dialog = false;
      this.reset();
      // Emit close event to parent can reset edit mode
      this.$emit("close");
    },
    reset() {
      if (this.mode === "create") {
        // Create a new object to ensure reactivity
        this.form = {
          userName: "",
          email: "",
          role: null
        };
        // Clear any validation errors
        this.emailError = null;
      }
      // In edit mode, don't reset to empty - keep the original data
    },

    validateEmail() {
      // Validate email format
      if (!this.form.email) {
        this.emailError = null;
        return;
      }

      const result = this.rules.emailFormat(this.form.email);
      this.emailError = result === true ? null : result;
    },
    save() {
      if (!this.isValid) return;

      if (this.mode === "edit") {
        console.log("Emitting update with form data:", this.form);
        this.$emit("update", { ...this.form });
      } else {
        console.log("Emitting save with form data:", this.form);
        this.$emit("save", { ...this.form });
        // Only reset in create mode after saving
        this.$nextTick(() => {
          // this.reset();
        });
      }
    },
    saveAndAddNew() {
      if (!this.isValid) return;
      console.log("Emitting save-and-add with form data:", this.form);
      this.$emit("save-and-add", { ...this.form });

      // Reset the form after emitting the event
      this.$nextTick(() => {
        // this.reset();
      });
    },

  },
};
</script>

<style scoped>
.dialog-header {
  background-color: #1a73e9;
  border-radius: 8px 8px 0 0;
}

.Head2 {
  margin-left: 15px;

}

.divider-line {
  height: 1px;
  background-color: #e6e6e6;
  width: 100%;
}

/* Custom field styling to match Figma exactly */
.v-text-field.v-text-field--solo .v-input__control {
  min-height: 40px;
}

.v-select.v-text-field--solo .v-input__control {
  min-height: 40px;
}

.v-text-field .v-input__slot {
  box-shadow: none !important;
}

.v-select .v-input__slot {
  box-shadow: none !important;
}

.v-dialog>.v-card {
  border-radius: 8px;
}
</style>