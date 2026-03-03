<template>
  <div v-if="hasRequiredPermission">
    <slot></slot>
  </div>
</template>

<script>
import permissionMixin from '@/mixins/permissionMixin';

export default {
  name: 'PermissionWrapper',
  mixins: [permissionMixin],
  props: {
    moduleName: {
      type: String,
      required: true
    },
    permission: {
      type: String,
      required: true,
      validator: value => ['view', 'edit', 'delete', 'create'].includes(value)
    },
    // Alternative: check for any permission in the module
    anyPermission: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    hasRequiredPermission() {
      if (this.anyPermission) {
        return this.hasAnyPermission(this.moduleName);
      }
      return this.hasPermission(this.moduleName, this.permission);
    }
  }
};
</script>
