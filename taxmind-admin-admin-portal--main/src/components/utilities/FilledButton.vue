<template>
  <v-btn
    class="filled-btn"
    :class="[size, { 'full-width': fullWidth }]"
    @click="handleClick"
    :disabled="disabled"
    :loading="loading"
     :block="block || fullWidth"
    :ripple="false"
    depressed
     :style="buttonStyle" 
  >
    <v-icon v-if="icon" left :size="iconSize" color="white">
      {{ icon }}
    </v-icon>
    {{ text }}
  </v-btn>
</template>

<script>
export default {
  name: "FilledButton",
  props: {
    text: {
      type: String,
      required: true,
    },
    onClick: {
      type: Function,
      required: true,
    },
    icon: {
      type: String,
      default: null,
    },
    size: {
      type: String,
      default: "medium",
      validator: (value) => ["small", "medium", "large"].includes(value),
    },
    fullWidth: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: null,
    },
  },
  computed: {
    iconSize() {
      // Fixed to 20px for consistency with Figma design
      return "20";
    },
    buttonStyle() {
    const base = this.disabled ? "#9e9e9e" : (this.color || "#1a73e9");
    return {
      "--btn-bg": base,
      "--btn-bg-hover": this.darken(base, 30),
      "--btn-bg-active": this.darken(base, 50),
      color: "white"
    };
  }
  },
 methods: {
  handleClick() {
    if (!this.disabled && !this.loading) {
      this.onClick();
    }
  },
  darken(hex, amount = 20) {
    let col = hex.replace("#", "");
    if (col.length === 3) col = col.split("").map(c => c+c).join("");
    let r = parseInt(col.substring(0,2),16);
    let g = parseInt(col.substring(2,4),16);
    let b = parseInt(col.substring(4,6),16);
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    return `rgb(${r}, ${g}, ${b})`;
  }
},
};
</script>

<style scoped>
/* Filled Button - Pixel Perfect from Figma Save Button */
.filled-btn {
  border-radius: 6px !important;
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  border: none !important;
  color: white !important;
  /* background-color: #1a73e9 !important; */
  transition: all 0.2s ease !important;
  box-sizing: border-box !important;
}

.filled-btn:hover {
  background-color: #1557b7 !important;
  border: none !important;
}

.filled-btn:focus {
  background-color: #1557b7 !important;
  border: none !important;
}

.filled-btn:active {
  background-color: #0f4691 !important;
  border: none !important;
}

.filled-btn:before {
  background-color: transparent !important;
}

/* Size Variants - Pixel Perfect */
.filled-btn.small {
  height: 32px !important;
  min-width: 120px !important;
  font-size: 13px !important;
  padding: 0 16px !important;
}

.filled-btn.medium {
  height: 36px !important;
  min-width: 95px !important;
  font-size: 14px !important;
  padding: 0 16px !important;
  line-height: 24px !important;
}

.filled-btn.large {
  height: 40px !important;
  min-width: 137px !important;
  font-size: 16px !important;
  padding: 0 20px !important;
}

/* Full Width Variant */
.filled-btn.full-width {
  width: 100% !important;
  min-width: auto !important;
}

/* Disabled State */
.filled-btn:disabled {
  border: none !important;
  color: white !important;
  background-color: #9e9e9e !important;
}

/* Loading State */
.filled-btn.v-btn--loading {
  border: none !important;
  color: white !important;
  /* background-color: #1a73e9 !important; */
}

/* Deep Styling for Vuetify Components - Pixel Perfect */
::v-deep(.filled-btn) {
  border: none !important;
  /* background-color: #1a73e9 !important; */
}

::v-deep(.filled-btn .v-btn__content) {
  color: white !important;
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
}

::v-deep(.filled-btn .v-icon) {
  color: white !important;
  font-size: 20px !important;
  width: 20px !important;
  height: 20px !important;
}

::v-deep(.filled-btn:disabled) {
  border: none !important;
  background-color: #9e9e9e !important;
}

::v-deep(.filled-btn:disabled .v-btn__content) {
  color: white !important;
}

::v-deep(.filled-btn:disabled .v-icon) {
  color: white !important;
}

/* Loading Spinner Color */
::v-deep(.filled-btn .v-btn__loader) {
  color: white !important;
}

/* Remove Vuetify default ripple and overlay effects */
::v-deep(.filled-btn .v-ripple__container) {
  display: none !important;
}

::v-deep(.filled-btn .v-btn__overlay) {
  display: none !important;
}
.filled-btn {
  background-color: var(--btn-bg) !important;
}

.filled-btn:hover {
  background-color: var(--btn-bg-hover) !important;
}

.filled-btn:focus {
  background-color: var(--btn-bg-hover) !important;
}

.filled-btn:active {
  background-color: var(--btn-bg-active) !important;
}

</style>
