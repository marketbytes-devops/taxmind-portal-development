<template>
  <v-btn
    v-if="hasRequiredPermission"
    v-bind="$attrs"
    v-on="$listeners"
    :color="color"
    :disabled="disabled"
    :loading="loading"
    :outlined="outlined"
    :text="text"
    :fab="fab"
    :icon="icon"
    :small="small"
    :large="large"
    :x-small="xSmall"
    :x-large="xLarge"
    :class="buttonClass"
  >
    <v-icon v-if="iconName && !iconRight" :left="!!$slots.default" :color="iconColor">
      {{ iconName }}
    </v-icon>
    <slot></slot>
    <v-icon v-if="iconName && iconRight" :right="!!$slots.default" :color="iconColor">
      {{ iconName }}
    </v-icon>
  </v-btn>
</template>

<script>
import permissionMixin from '@/mixins/permissionMixin';

export default {
  name: 'PermissionButton',
  mixins: [permissionMixin],
  inheritAttrs: false,
  props: {
    // Permission props
    moduleName: {
      type: String,
      required: true
    },
    permission: {
      type: String,
      required: true,
      validator: value => ['view', 'edit', 'delete', 'create'].includes(value)
    },
    
    // Button styling props
    color: {
      type: String,
      default: 'primary'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    outlined: {
      type: Boolean,
      default: false
    },
    text: {
      type: Boolean,
      default: false
    },
    fab: {
      type: Boolean,
      default: false
    },
    icon: {
      type: Boolean,
      default: false
    },
    small: {
      type: Boolean,
      default: false
    },
    large: {
      type: Boolean,
      default: false
    },
    xSmall: {
      type: Boolean,
      default: false
    },
    xLarge: {
      type: Boolean,
      default: false
    },
    
    // Icon props
    iconName: {
      type: String,
      default: null
    },
    iconColor: {
      type: String,
      default: null
    },
    iconRight: {
      type: Boolean,
      default: false
    },
    
    // Additional styling
    buttonClass: {
      type: [String, Array, Object],
      default: null
    }
  },

  computed: {
    hasRequiredPermission() {
      return this.hasPermission(this.moduleName, this.permission);
    }
  }
};
</script>

<style scoped>
/* Add any custom button styles here */
</style>
