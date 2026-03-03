<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h2>RBAC System Usage Examples</h2>

        <!-- Example 1: Using PermissionWrapper -->
        <v-card class="mb-4">
          <v-card-title>Example 1: Permission Wrapper</v-card-title>
          <v-card-text>
            <PermissionWrapper module-name="users" permission="view">
              <p>This content is only visible if user has 'view' permission for 'users' module</p>
            </PermissionWrapper>

            <PermissionWrapper module-name="users" permission="edit">
              <v-alert type="info">
                You can edit users because you have edit permission!
              </v-alert>
            </PermissionWrapper>
          </v-card-text>
        </v-card>

        <!-- Example 2: Using PermissionButton -->
        <v-card class="mb-4">
          <v-card-title>Example 2: Permission Buttons</v-card-title>
          <v-card-text>
            <div class="d-flex flex-wrap gap-2">
              <PermissionButton module-name="users" permission="create" color="success" icon-name="mdi-plus"
                @click="handleCreate">
                Create User
              </PermissionButton>

              <PermissionButton module-name="users" permission="edit" color="primary" icon-name="mdi-pencil" outlined
                @click="handleEdit">
                Edit User
              </PermissionButton>

              <PermissionButton module-name="users" permission="delete" color="error" icon-name="mdi-delete" text
                @click="handleDelete">
                Delete User
              </PermissionButton>
            </div>
          </v-card-text>
        </v-card>

        <!-- Example 3: Using Mixin Methods -->
        <v-card class="mb-4">
          <v-card-title>Example 3: Using Mixin Methods</v-card-title>
          <v-card-text>
            <v-simple-table>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Can View</th>
                    <th>Can Edit</th>
                    <th>Can Delete</th>
                    <th>Can Create</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="module in testModules" :key="module">
                    <td>{{ module }}</td>
                    <td>
                      <v-icon :color="canView(module) ? 'success' : 'error'">
                        {{ canView(module) ? 'mdi-check' : 'mdi-close' }}
                      </v-icon>
                    </td>
                    <td>
                      <v-icon :color="canEdit(module) ? 'success' : 'error'">
                        {{ canEdit(module) ? 'mdi-check' : 'mdi-close' }}
                      </v-icon>
                    </td>
                    <td>
                      <v-icon :color="canDelete(module) ? 'success' : 'error'">
                        {{ canDelete(module) ? 'mdi-check' : 'mdi-close' }}
                      </v-icon>
                    </td>
                    <td>
                      <v-icon :color="canCreate(module) ? 'success' : 'error'">
                        {{ canCreate(module) ? 'mdi-check' : 'mdi-close' }}
                      </v-icon>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card-text>
        </v-card>

        <!-- Example 4: User Role Information -->
        <v-card class="mb-4">
          <v-card-title>Example 4: User Role Information</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <strong>Role Name:</strong> {{ userRole?.roleName || 'Not Available' }}
              </v-col>
              <v-col cols="6">
                <strong>Is Super Admin:</strong>
                <v-chip :color="isSuperAdmin ? 'success' : 'default'" small>
                  {{ isSuperAdmin ? 'Yes' : 'No' }}
                </v-chip>
              </v-col>
            </v-row>

            <v-divider class="my-3"></v-divider>

            <strong>Accessible Modules:</strong>
            <v-chip-group column>
              <v-chip v-for="module in accessibleModules" :key="module" small color="primary" outlined>
                {{ module }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import permissionMixin from '@/mixins/permissionMixin';
import PermissionWrapper from '@/components/common/PermissionWrapper.vue';
import PermissionButton from '@/components/Common/PermissionButton.vue';

export default {
  name: 'RBACExample',
  components: {
    PermissionWrapper,
    PermissionButton
  },
  mixins: [permissionMixin],

  data() {
    return {
      testModules: [
        'users',
        'applications',
        'dashboard',
        'tax_credits',
        'rbac',
        'payments'
      ]
    };
  },

  methods: {
    handleCreate() {
      this.$toast.success('Create action triggered');
    },

    handleEdit() {
      this.$toast.success('Edit action triggered');
    },

    handleDelete() {
      this.$toast.success('Delete action triggered');
    }
  }
};
</script>

<style scoped>
.gap-2>* {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>
