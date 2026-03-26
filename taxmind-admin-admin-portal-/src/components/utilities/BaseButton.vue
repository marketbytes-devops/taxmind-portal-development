<template>
 <div>
     <v-btn
    class="base-btn"
    text block
    @click="$emit('click')"
  >
    <span class="buttonText">{{ label }}</span>
    <v-icon right>mdi-chevron-right</v-icon>
  </v-btn>
  <!-- <v-btn class="base-btn" text block></v-btn> -->
 </div>
</template>

<script>
export default {
  name: "BaseButton",
  props: {
    label: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped>
.base-btn {
  background-color: #F1F7FF !important;
  color: #1A73E9 !important;
  text-transform: none !important; 
}
.base-btn .v-icon {
  color: #1A73E9 !important;
}
</style>
