<template>
  <v-btn
    class="ghost-btn"
    :class="[size, { 'full-width': fullWidth }]"
    @click="handleClick"
    :disabled="disabled"
    :loading="loading"
    :ripple="false"
    depressed
    text
  >
    <v-icon v-if="icon" left :size="iconSize" color="#1A73E9">
      {{ icon }}
    </v-icon>
    {{ text }}
  </v-btn>
</template>

<script>
export default {
  name: "GhostButton",
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
  },
  computed: {
    iconSize() {
      // Fixed to 20px for consistency with Figma design
      return "20";
    },
  },
  methods: {
    handleClick() {
      if (!this.disabled && !this.loading) {
        this.onClick();
      }
    },
  },
};
</script>

<style scoped>
/* Ghost Button - Semi-transparent background style */
.ghost-btn {
  border-radius: 6px !important;
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  border: none !important;
  color: #1a73e9 !important;
  background-color: rgba(26, 115, 233, 0.1) !important;
  transition: all 0.2s ease !important;
  box-sizing: border-box !important;
}

.ghost-btn:hover {
  background-color: rgba(26, 115, 233, 0.15) !important;
  border: none !important;
}

.ghost-btn:focus {
  background-color: rgba(26, 115, 233, 0.2) !important;
  border: none !important;
}

.ghost-btn:active {
  background-color: rgba(26, 115, 233, 0.25) !important;
  border: none !important;
}

.ghost-btn:before {
  background-color: transparent !important;
}

/* Size Variants - Pixel Perfect */
.ghost-btn.small {
  height: 32px !important;
  min-width: 120px !important;
  font-size: 13px !important;
  padding: 0 16px !important;
}

.ghost-btn.medium {
  height: 36px !important;
  min-width: 150px !important;
  font-size: 14px !important;
  padding: 0 16px !important;
  line-height: 24px !important;
}

.ghost-btn.large {
  height: 40px !important;
  min-width: 160px !important;
  font-size: 16px !important;
  padding: 0 20px !important;
}

/* Full Width Variant */
.ghost-btn.full-width {
  width: 100% !important;
  min-width: auto !important;
}

/* Disabled State */
.ghost-btn:disabled {
  border: none !important;
  color: #9e9e9e !important;
  background-color: rgba(158, 158, 158, 0.1) !important;
}

/* Loading State */
.ghost-btn.v-btn--loading {
  border: none !important;
  color: #1a73e9 !important;
  background-color: rgba(26, 115, 233, 0.1) !important;
}

/* Deep Styling for Vuetify Components - Pixel Perfect */
::v-deep(.ghost-btn) {
  border: none !important;
  background-color: rgba(26, 115, 233, 0.1) !important;
}

::v-deep(.ghost-btn .v-btn__content) {
  color: #1a73e9 !important;
  font-family: "DM Sans", sans-serif !important;
  font-weight: 500 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
}

::v-deep(.ghost-btn .v-icon) {
  color: #1a73e9 !important;
  font-size: 20px !important;
  width: 20px !important;
  height: 20px !important;
}

::v-deep(.ghost-btn:disabled) {
  border: none !important;
  background-color: rgba(158, 158, 158, 0.1) !important;
}

::v-deep(.ghost-btn:disabled .v-btn__content) {
  color: #9e9e9e !important;
}

::v-deep(.ghost-btn:disabled .v-icon) {
  color: #9e9e9e !important;
}

/* Loading Spinner Color */
::v-deep(.ghost-btn .v-btn__loader) {
  color: #1a73e9 !important;
}

/* Remove Vuetify default ripple and overlay effects */
::v-deep(.ghost-btn .v-ripple__container) {
  display: none !important;
}

::v-deep(.ghost-btn .v-btn__overlay) {
  display: none !important;
}
</style>
