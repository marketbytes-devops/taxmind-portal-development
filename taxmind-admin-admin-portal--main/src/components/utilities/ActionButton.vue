<template>
  <v-btn
    class="action-btn"
    :style="{
      color: color,
      borderColor: color,
      backgroundColor: backgroundColor
    }"
    @click="onClick"
    text
    variant="outlined"
    size="small"
  >
    {{ label }}
  </v-btn>
</template>

<script>
export default {
  name: "ActionButton",
  props: {
    label: { type: String, required: true },
    color: { type: String, default: "#1A73E9" },
    background: { type: String, default: "light" }, // "light" or "transparent"
    onClick: { type: Function, required: true }
  },
  computed: {
    backgroundColor() {
      return this.background === "light"
        ? this.hexToRGBA(this.color, 0.1) // faint background like your screenshot
        : "transparent";
    }
  },
  methods: {
    // HEX → RGBA converter
    hexToRGBA(hex, alpha) {
      let r = 0, g = 0, b = 0;
      if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
      } else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
      }
      return `rgba(${+r},${+g},${+b},${alpha})`;
    }
  }
};
</script>

<style scoped>
.action-btn {
  text-transform: none; /* prevent uppercase */
  font-size: 14px;
  font-weight: 500;
  margin-right: 8px;
  /* border: 1px solid; */
  min-width: 64px;
  padding: 4px 12px;
}
</style>
