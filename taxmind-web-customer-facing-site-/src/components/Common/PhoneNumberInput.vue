<template>
  <div>
    <span v-if="label" class="textFieldstyle">
      {{ label }} <span v-if="required" class="red--text ml-1">*</span>
    </span>
    <vue-phone-number-input :clearable="!disabled" v-model="phoneNumber" :default-country-code="selectedCountryCode || computedDefaultCountryCode"
      :preferred-countries="preferredCountries" :only-countries="onlyCountries" :translations="translations"
      :error="error" :valid="isValid" :disabled="disabled" @update="onUpdate" color="#1A73E9" valid-color="#4CAF50"
      error-color="#FF5252" class="phone-input-wrapper pt-1" no-country-selector-auto-update />
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import VuePhoneNumberInput from "vue-phone-number-input";
import "vue-phone-number-input/dist/vue-phone-number-input.css";

export default {
  name: "PhoneNumberInput",
  components: {
    VuePhoneNumberInput,
  },
  props: {
    value: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "Phone Number",
    },
    defaultCountryCode: {
      type: String,
      default: "IE", // Ireland as default
    },
    preferredCountries: {
      type: Array,
      default: () => [],
    },
    onlyCountries: {
      type: Array,
      default: () => [],
    },
    error: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      phoneNumber: this.value || "",
      isValid: false,
      phoneData: null,
      selectedCountryCode: null, // Track the selected country code
      translations: {
        countrySelectorLabel: "Country code",
        countrySelectorError: "Choose a country",
        phoneNumberLabel: "Phone number",
        example: "Example:",
      },
    };
  },
  mounted() {
    // Set initial country code based on the phone number
    this.selectedCountryCode = this.computedDefaultCountryCode;
  },
  computed: {
    computedDefaultCountryCode() {
      // If value starts with +, try to detect country code from the number
      if (this.value && this.value.startsWith('+')) {
        // Common country code mappings
        const countryCodeMap = {
          '+353': 'IE', // Ireland
          '+91': 'IN',  // India
          '+44': 'GB',  // UK
          '+1': 'US',   // USA/Canada
          '+61': 'AU',  // Australia
          '+49': 'DE',  // Germany
          '+33': 'FR',  // France
          '+34': 'ES',  // Spain
          '+39': 'IT',  // Italy
          '+86': 'CN',  // China
          '+81': 'JP',  // Japan
        };
        
        // Check for 3-digit country codes first
        const threeDigitCode = this.value.substring(0, 3);
        if (countryCodeMap[threeDigitCode]) {
          return countryCodeMap[threeDigitCode];
        }
        
        // Check for 2-digit country codes
        const twoDigitCode = this.value.substring(0, 2);
        if (countryCodeMap[twoDigitCode]) {
          return countryCodeMap[twoDigitCode];
        }
      }
      
      return this.defaultCountryCode;
    }
  },
  watch: {
    value(newVal) {
      if (newVal !== this.phoneNumber) {
        this.phoneNumber = newVal;
        // Update selected country code when value changes externally
        if (newVal && newVal.startsWith('+')) {
          this.selectedCountryCode = this.computedDefaultCountryCode;
        }
      }
    },
  },
  methods: {
    onUpdate(data) {
      this.phoneData = data;
      this.isValid = data.isValid;

      // If country code changed and we have a selected country, preserve it
      if (this.selectedCountryCode && data.countryCode && data.countryCode !== this.selectedCountryCode) {
        // User is typing/deleting, don't allow auto country change
        // Only update if it's a valid change from user selection
        if (!data.phoneNumber || data.phoneNumber.length === 0) {
          // Allow change if field is empty
          this.selectedCountryCode = data.countryCode;
        } else {
          // Preserve the selected country code
          return;
        }
      } else if (data.countryCode) {
        // Update selected country code when user explicitly selects from dropdown
        this.selectedCountryCode = data.countryCode;
      }

      // Emit the formatted phone number with country code (e.g., +353871234567)
      if (data.isValid && data.formattedNumber) {
        this.$emit("input", data.formattedNumber);
        this.$emit("update:phoneData", data);
      } else {
        // Emit the raw input if not valid
        this.$emit("input", data.phoneNumber || "");
        this.$emit("update:phoneData", data);
      }
    },
  },
};
</script>

<style scoped>
.textFieldstyle {
  font-family: DMSans;
  font-weight: 400;
  font-size: 18px;
  color: #000000;
}

.phone-input-wrapper {
  width: 100%;
}

/* Match Vuetify design */
.phone-input-wrapper>>>.vue-phone-number-input {
  border-radius: 8px;
}

.phone-input-wrapper>>>.select-country-container {
  border-radius: 8px 0 0 8px;
  /* border: 1px solid rgba(0, 0, 0, 0.38); */
  background-color: #ffffff;
  min-height: 40px;
  flex: 0 0 120px;
}

.phone-input-wrapper>>>.select-country-container .country-selector__input {
  border-top-left-radius: 7px !important;
  border-bottom-left-radius: 7px !important;
  border: 1px solid #00000061 !important;
  border-color: #00000061 !important;
}

.phone-input-wrapper>>>.input-tel {
  border-radius: 0 8px 8px 0;
  /* border: 1px solid #999999; */
  border-left: none;
  background-color: #ffffff;
  font-family: opensansregular, DMSans, sans-serif;
  font-size: 16px;
  /* padding: 10px 12px; */
  min-height: 40px;
}

.phone-input-wrapper>>>.input-tel .input-tel__input {
  border-top-right-radius: 7px !important;
  border-bottom-right-radius: 7px !important;
  caret-color: rgb(82, 153, 246) !important;
  border: 1px solid #00000061 !important;
  border-color: #00000061 !important;
}

/* Override success state inline styles */
.phone-input-wrapper>>>.is-valid .input-tel__input {
  border-color: #00000061 !important;
  caret-color: rgb(82, 153, 246) !important;
}

/* Override focused state - remove green color, use blue */
.phone-input-wrapper>>>.is-focused .select-country-container,
.phone-input-wrapper>>>.is-focused .input-tel,
.phone-input-wrapper>>>.is-focused .input-tel__input,
.phone-input-wrapper>>>.is-focused .country-selector__input {
  border-color: #1a73e9 !important;
}

/* Override focused and valid state - keep blue color */
.phone-input-wrapper>>>.is-focused.is-valid .select-country-container,
.phone-input-wrapper>>>.is-focused.is-valid .input-tel,
.phone-input-wrapper>>>.is-focused.is-valid .input-tel__input,
.phone-input-wrapper>>>.is-focused.is-valid .country-selector__input {
  border-color: #1a73e9 !important;
}

/* Override valid state for country selector input */
.phone-input-wrapper>>>.is-valid .country-selector__input {
  border-color: #00000061 !important;
}

/* Override valid state label color - remove green */
.phone-input-wrapper>>>.is-valid .input-tel__label,
.phone-input-wrapper>>>.is-valid .country-selector__label {
  color: rgba(0, 0, 0, 0.6) !important;
}

.phone-input-wrapper>>>.input-tel:focus {
  outline: none;
  border-color: #1a73e9;
  box-shadow: none !important;
}

.phone-input-wrapper>>>.input-tel__input:focus {
  outline: none;
  box-shadow: none !important;
}

.phone-input-wrapper>>>.country-selector__input:focus {
  outline: none;
  box-shadow: none !important;
}

.phone-input-wrapper>>>.select-country-container:hover,
.phone-input-wrapper>>>.input-tel:hover {
  border-color: #000000;
}

/* Error state */
.phone-input-wrapper>>>.has-error .select-country-container,
.phone-input-wrapper>>>.has-error .input-tel,
.phone-input-wrapper>>>.has-error .input-tel__input,
.phone-input-wrapper>>>.has-error .country-selector__input {
  border-color: #ff5252 !important;
}

/* Error state for country selector label */
.phone-input-wrapper>>>.has-error .country-selector__label {
  color: #ff5252 !important;
}

/* Valid state - removed green border */
.phone-input-wrapper>>>.is-valid .select-country-container,
.phone-input-wrapper>>>.is-valid .input-tel {
  /* border-color: #4caf50 !important; */
}

.error-message {
  color: #ff5252;
  font-size: 12px;
  font-family: DMSans;
  margin-top: 4px;
  min-height: 20px;
}

/* Country selector dropdown */
.phone-input-wrapper>>>.country-selector__list {
  border-radius: 8px;
  /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); */
  max-height: 200px;
  overflow-y: auto;
}

.phone-input-wrapper>>>.country-selector__item {
  font-family: DMSans;
  padding: 8px 12px;
}

.phone-input-wrapper>>>.country-selector__item:hover {
  background-color: #f5f5f5;
}

.phone-input-wrapper>>>.country-selector__country-flag {
  margin-right: 8px;
}

/* Disabled state styling */
.phone-input-wrapper>>>.is-disabled .select-country-container,
.phone-input-wrapper>>>.is-disabled .input-tel,
.phone-input-wrapper>>>.is-disabled .input-tel__input,
.phone-input-wrapper>>>.is-disabled .country-selector__input {
  background-color: #ffffff !important;
  color: rgba(0, 0, 0, 0.38) !important;
  cursor: not-allowed !important;
  border-color: rgba(0, 0, 0, 0.26) !important;
}

.phone-input-wrapper>>>.is-disabled .input-tel__label,
.phone-input-wrapper>>>.is-disabled .country-selector__label {
  color: rgba(0, 0, 0, 0.38) !important;
}

.phone-input-wrapper>>>.is-disabled .country-selector__country-flag {
  opacity: 0.5;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .phone-input-wrapper>>>.select-country-container {
    flex: 0 0 100px;
  }
}
</style>
