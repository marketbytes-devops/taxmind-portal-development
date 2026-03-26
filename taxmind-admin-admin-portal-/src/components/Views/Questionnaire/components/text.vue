<template>
  <v-container>
    <v-select
      v-model="selected"
      :items="items"
      label="Select item"
      outlined
      dense
      class="wrapped-select"
      item-text="name"
      item-value="id"
    >
      <!-- Customize how each item is displayed -->
      <template v-slot:item="{ item }">
        <div class="wrapped-text">
          {{ item.name }}
        </div>
      </template>

      <!-- Customize selected text display -->
      <template v-slot:selection="{ item }">
        <div class="wrapped-text">
          {{ item.name }}
        </div>
      </template>
    </v-select>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      selected: null,
      items: [
        { id: 1, name: "This is a very long item label that should wrap correctly inside the dropdown" },
        { id: 2, name: "Another very long label example to test text wrapping behavior in v-select" },
      ],
    };
  },
};
</script>

<style scoped>
.wrapped-select {
  width: 300px; /* or any fixed width you need */
}

/* Ensure text wraps inside dropdown items */
.wrapped-text {
  white-space: normal !important;
  overflow-wrap: break-word;
  word-break: break-word;
  line-height: 1.2em;
  max-width: 100%;
}

/* Ensure dropdown menu items match textfield width */
.v-menu__content {
  width: auto !important;
  min-width: 100% !important;
}
</style>
