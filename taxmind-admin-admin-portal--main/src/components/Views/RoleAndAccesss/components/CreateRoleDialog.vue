<template>
  <div>
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
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
          <v-flex xs12 class="px-6 pt-5">
            <!-- Role name field -->
            <v-layout wrap class="mb-6">
              <v-flex xs12>
                <div class="subHead1 mb-2">{{ LABELS.ROLE_NAME }}</div>
                <v-text-field v-model="form.name" :placeholder="LABELS.ROLE_NAME" solo flat outlined dense
                  :hide-details="true" :disabled="isViewMode" background-color="white"
                  style="font-family: opensansregular" />
              </v-flex>
            </v-layout>

            <!-- Privileges section -->
            <v-layout wrap class="mb-6">
              <v-flex xs12>
                <div class="subHead1 mb-4">{{ LABELS.PRIVILEGES }}</div>

                <!-- Permissions table -->
                <div class="permissions-table">
                  <!-- Table header -->
                  <v-layout class="table-header">
                    <v-flex xs7 sm7 md7 lg7 xl7 class="column-modules pa-3">
                      {{ LABELS.MODULES }}
                    </v-flex>
                    <v-flex xs1 sm1 md1 lg1 xl1 class="column-create pa-2 d-flex justify-center">
                      {{ LABELS.CREATE }}
                    </v-flex>
                    <v-flex xs1 sm1 md1 lg1 xl1 class="column-view pa-2 d-flex justify-center">
                      {{ LABELS.VIEW }}
                    </v-flex>
                    <v-flex xs1 sm1 md1 lg1 xl1 class="column-edit pa-2 d-flex justify-center">
                      {{ LABELS.EDIT }}
                    </v-flex>
                    <v-flex xs2 sm2 md2 lg2 xl2 class="column-delete pa-2 d-flex justify-center">
                      {{ LABELS.DELETE }}
                    </v-flex>
                  </v-layout>

                  <!-- Table rows with scrolling -->
                  <div class="table-body">
                    <v-layout v-for="(module, index) in dynamicModules" :key="module.id" class="table-row" :class="{
                      'has-border': index < dynamicModules.length - 1,
                    }">
                      <!-- Module name with checkbox -->
                      <v-flex xs7 sm7 md7 lg7 xl7 class="column-modules pa-3">
                        <v-layout align-center class="module-content">
                          <v-flex shrink class="mr-3">
                            <v-checkbox dense class="pt-1" :input-value="isModuleFullySelected(module)"
                              @change="toggleAllModulePermissions(module)" :disabled="isViewMode" color="primary"
                              hide-details></v-checkbox>
                          </v-flex>
                          <v-flex class="module-name">{{
                            module.displayName
                          }}</v-flex>
                        </v-layout>
                      </v-flex>

                      <!-- Create permission -->
                      <v-flex xs1 sm1 md1 lg1 xl1 class="column-create pa-2 d-flex justify-center align-center">
                        <v-checkbox v-if="
                          hasPermission(module.modulePermissions, 'create')
                        " dense class="pt-1" :input-value="isPermissionSelected(module.id, 'create')
                          " @change="togglePermission(module.id, 'create')" :disabled="isViewMode" color="primary"
                          hide-details></v-checkbox>
                        <span v-else class="dash-symbol">-</span>
                      </v-flex>

                      <!-- View permission -->
                      <v-flex xs1 sm1 md1 lg1 xl1 class="column-view pa-2 d-flex justify-center align-center">
                        <v-checkbox v-if="hasPermission(module.modulePermissions, 'view')" dense class="pt-1"
                          :input-value="isPermissionSelected(module.id, 'view')"
                          @change="togglePermission(module.id, 'view')" :disabled="isViewMode" color="primary"
                          hide-details></v-checkbox>
                        <span v-else class="dash-symbol">-</span>
                      </v-flex>

                      <!-- Edit permission -->
                      <v-flex xs1 sm1 md1 lg1 xl1 class="column-edit pa-2 d-flex justify-center align-center">
                        <v-checkbox v-if="hasPermission(module.modulePermissions, 'edit')" dense class="pt-1"
                          :input-value="isPermissionSelected(module.id, 'edit')"
                          @change="togglePermission(module.id, 'edit')" :disabled="isViewMode" color="primary"
                          hide-details></v-checkbox>
                        <span v-else class="dash-symbol">-</span>
                      </v-flex>

                      <!-- Delete permission -->
                      <v-flex xs2 sm2 md2 lg2 xl2 class="column-delete pa-2 d-flex justify-center align-center">
                        <v-checkbox v-if="
                          hasPermission(module.modulePermissions, 'delete')
                        " dense class="pt-1" :input-value="isPermissionSelected(module.id, 'delete')
                          " @change="togglePermission(module.id, 'delete')" :disabled="isViewMode" color="primary"
                          hide-details></v-checkbox>
                        <span v-else class="dash-symbol">-</span>
                      </v-flex>
                    </v-layout>
                  </div>
                </div>
              </v-flex>
            </v-layout>
          </v-flex>

          <!-- Divider -->
          <v-flex v-if="!isViewMode" xs12>
            <v-divider></v-divider>
          </v-flex>
        </v-layout>

        <!-- Footer buttons -->
        <v-layout v-if="!isViewMode" wrap justify-space-between align-center px-6 py-4>
          <v-flex shrink>
            <v-btn text :ripple="false" @click="close" class="buttonText" style="text-transform: none; color: #000">
              {{ LABELS.CANCEL }}
            </v-btn>
          </v-flex>
          <v-flex shrink>
            <v-layout>
              <!-- Save & add new button - only in create mode -->
              <OutlinedButton v-if="!isEditMode" :text="LABELS.SAVE_ADD_NEW" :onClick="saveAndAddNew"
                :disabled="!isValid" color="#1A73E9" size="medium" class="mr-3" />
              <!-- Primary action button (Save/Update) -->
              <FilledButton :text="primaryButtonText" :onClick="save" :disabled="!isValid" color="#1A73E9"
                size="medium" />
            </v-layout>
          </v-flex>
        </v-layout>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import FilledButton from "../../../utilities/FilledButton.vue";
import OutlinedButton from "../../../utilities/OutlinedButton.vue";
import { createRole, updateRole } from "@/api/modules/rbac";

export default {
  name: "CreateRoleDialog",
  components: {
    FilledButton,
    OutlinedButton,
  },
  props: {
    value: { type: Boolean, default: false },
    mode: {
      type: String,
      default: "create",
      validator: (v) => ["create", "edit", "view"].includes(v),
    },
    roleData: { type: Object, default: () => ({}) },
    data: { type: Array, default: () => [] }, // API data array containing modules with modulePermissions
    // Expected structure:
    // [
    //   {
    //     id: "module-id",
    //     name: "Module Name",
    //     modulePermissions: [
    //       { permissionName: "view", isActive: true },
    //       { permissionName: "create", isActive: true },
    //       // etc...
    //     ]
    //   }
    // ]
  },
  data() {
    return {
      appLoading: false,
      ServerError: false,
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      dialog: this.value,
      internalMode: this.mode, // Track mode internally to prevent flashing
      LABELS: {
        CREATE_TITLE: "Create role",
        EDIT_TITLE: "Edit role",
        VIEW_TITLE: "View",
        ROLE_NAME: "Role name",
        PRIVILEGES: "Privileges",
        MODULES: "Modules",
        CREATE: "Create",
        VIEW: "View",
        EDIT: "Edit",
        DELETE: "Delete",
        CANCEL: "Cancel",
        SAVE: "Save",
        UPDATE: "Update",
        SAVE_ADD_NEW: "Save & add new",
      },
      form: {
        name: "",
      },
      // Available modules and their permissions (will be populated from API)
      availableModules: [],
      loadingModules: false,
      // Selected permissions for each module
      selectedPermissions: {},
    };
  },
  mounted() {
    // this.fetchModules();
  },
  watch: {
    value(val) {
      this.dialog = val;
      // Reset form only after dialog is fully closed
      if (!val) {
        setTimeout(() => {
          this.reset();
          this.internalMode = "create"; // Reset internal mode after animation
        }, 300); // Wait for dialog close animation
      }
    },
    dialog(val) {
      this.$emit("input", val);
    },
    mode: {
      immediate: true,
      handler(newMode) {
        // Only update internal mode when dialog is open
        if (this.dialog) {
          this.internalMode = newMode;
        }
        
        // Only initialize when dialog is open
        if (!this.dialog) return;
        
        if (newMode === "create") {
          // Reset form for create mode
          this.form = { name: "" };
          this.selectedPermissions = {};
        } else if (
          (newMode === "edit" || newMode === "view") &&
          this.roleData &&
          (this.roleData.name || this.roleData.roleName)
        ) {
          // Initialize form for edit/view mode
          this.form = {
            name: this.roleData.name || this.roleData.roleName || "",
          };
          this.initializePermissions(this.roleData);
        }
      },
    },
    roleData: {
      immediate: true,
      handler(newData) {
        // Only initialize when dialog is open
        if (!this.dialog) return;
        
        if (
          (this.mode === "edit" || this.mode === "view") &&
          newData &&
          (newData.name || newData.roleName)
        ) {
          this.form = {
            name: newData.name || newData.roleName || "",
          };
          this.initializePermissions(newData);
        }
      },
    },
  },
  computed: {
    isValid() {
      return this.form.name;
    },
    dialogTitle() {
      if (this.internalMode === "view") return this.LABELS.VIEW_TITLE;
      return this.internalMode === "edit"
        ? this.LABELS.EDIT_TITLE
        : this.LABELS.CREATE_TITLE;
    },
    primaryButtonText() {
      return this.internalMode === "edit" ? this.LABELS.UPDATE : this.LABELS.SAVE;
    },
    isEditMode() {
      return this.internalMode === "edit";
    },
    isViewMode() {
      return this.internalMode === "view";
    },
    dynamicModules() {
      // If data prop is provided, use it for dynamic module generation
      if (this.data && this.data.length > 0) {
        return this.data.map((item) => ({
          id:
            item.id ||
            item.moduleId ||
            item.name?.toLowerCase().replace(/\s+/g, "-"),
          name: item.name || item.moduleName,
          modulePermissions: item.modulePermissions || [],
          displayName: item.displayName,
        }));
      }

      // Fallback to hardcoded modules if no data provided (for backwards compatibility)
      return this.availableModules.map((module) => ({
        ...module,
        modulePermissions: module.permissions.map((perm) => ({
          permissionName: perm,
          isActive: true,
        })),
      }));
    },
  },
  methods: {
    // Fetch modules from API
    // fetchModules() {
    //   this.loadingModules = true;

    //   listModules()
    //     .then(response => {
    //       this.loadingModules = false;

    //       if (response.data && response.data.data) {
    //         // Map API response to component structure
    //         this.availableModules = response.data.data.map(module => ({
    //           id: module.id,
    //           name: module.name,
    //           displayName: module.displayName,
    //           description: module.description,
    //           isActive: module.isActive,
    //           permissions: module.modulePermissions.map(permission => permission.permissionName)
    //         }));
    //       }
    //     })
    //     .catch(error => {
    //       this.loadingModules = false;
    //       console.error('Error fetching modules:', error);
    //     });
    // },

    hasPermission(modulePermissions, permissionType) {
      // Check if the modulePermissions array contains the specified permission type
      if (!modulePermissions || !Array.isArray(modulePermissions)) {
        return false;
      }
      return modulePermissions.some(
        (permission) => permission.permissionName === permissionType
      );
    },
    close() {
      this.dialog = false;
      // Don't reset immediately - let the watcher handle it after animation
      // Emit close event so parent can reset edit mode
      this.$emit("close");
    },
    reset() {
      if (this.mode === "create") {
        this.form = { name: "" };
        this.selectedPermissions = {};
      }
      // In edit mode, don't reset to empty - keep the original data
    },
    initializePermissions(roleData) {
      // Initialize selectedPermissions based on roleData structure from API
      const permissions = {};

      console.log("Initializing permissions with roleData:", roleData);

      // Handle the new API structure where roleData has modules array
      if (roleData.modules && Array.isArray(roleData.modules)) {
        roleData.modules.forEach((module) => {
          const moduleId = module.id;

          if (!permissions[moduleId]) {
            permissions[moduleId] = {};
          }

          // Loop through permissions in this module
          if (module.permissions && Array.isArray(module.permissions)) {
            module.permissions.forEach((permission) => {
              const permissionType = permission.permissionName;
              permissions[moduleId][permissionType] = true; // Set to true if permission exists in role
            });
          }
        });
      }
      // Fallback for old structure (if still needed)
      else if (
        roleData.modulePermissions &&
        Array.isArray(roleData.modulePermissions)
      ) {
        roleData.modulePermissions.forEach((permission) => {
          let moduleKey = permission.moduleId;

          if (!moduleKey) {
            const foundModule = this.dynamicModules.find(
              (module) =>
                module.name?.toLowerCase().replace(/\s+/g, "-") ===
                permission.moduleName?.toLowerCase().replace(/\s+/g, "-")
            );
            moduleKey = foundModule ? foundModule.id : null;
          }

          if (!moduleKey) {
            moduleKey =
              permission.moduleId ||
              permission.moduleName?.toLowerCase().replace(/\s+/g, "-") ||
              permission.permissionName?.split("-")[0];
          }

          if (!permissions[moduleKey]) {
            permissions[moduleKey] = {};
          }

          const permissionType = permission.permissionName;
          permissions[moduleKey][permissionType] = permission.isActive || false;
        });
      }

      console.log("Initialized permissions:", permissions);
      this.selectedPermissions = permissions;
    },
    togglePermission(moduleId, permissionType) {
      if (!this.selectedPermissions[moduleId]) {
        this.$set(this.selectedPermissions, moduleId, {});
      }

      const currentValue =
        this.selectedPermissions[moduleId][permissionType] || false;
      const newValue = !currentValue;
      
      this.$set(
        this.selectedPermissions[moduleId],
        permissionType,
        newValue
      );

      const module = this.dynamicModules.find(m => m.id === moduleId);
      if (!module) return;

      // When enabling Create, Edit, or Delete -> automatically enable View
      if (newValue && (permissionType === 'create' || permissionType === 'edit' || permissionType === 'delete')) {
        if (this.hasPermission(module.modulePermissions, 'view')) {
          this.$set(
            this.selectedPermissions[moduleId],
            'view',
            true
          );
        }
      }

      // When disabling View -> automatically disable Create, Edit, and Delete
      if (!newValue && permissionType === 'view') {
        const permissionsToDisable = ['create', 'edit', 'delete'];
        permissionsToDisable.forEach(perm => {
          if (this.hasPermission(module.modulePermissions, perm)) {
            this.$set(
              this.selectedPermissions[moduleId],
              perm,
              false
            );
          }
        });
      }
    },
    isPermissionSelected(moduleId, permissionType) {
      return (
        this.selectedPermissions[moduleId] &&
        this.selectedPermissions[moduleId][permissionType]
      );
    },
    isModuleFullySelected(module) {
      // Check if all available permissions for this module are selected (excluding dashes)
      const availablePermissions = this.getAvailablePermissions(module);
      if (availablePermissions.length === 0) return false;

      return availablePermissions.every((permission) =>
        this.isPermissionSelected(module.id, permission)
      );
    },
    isModulePartiallySelected(module) {
      // Check if some but not all permissions are selected
      const availablePermissions = this.getAvailablePermissions(module);
      if (availablePermissions.length === 0) return false;

      const selectedCount = availablePermissions.filter((permission) =>
        this.isPermissionSelected(module.id, permission)
      ).length;

      return selectedCount > 0 && selectedCount < availablePermissions.length;
    },
    getAvailablePermissions(module) {
      // Get list of permissions that are available for this module (have checkboxes, not dashes)
      const permissionTypes = ["create", "view", "edit", "delete"];
      return permissionTypes.filter((permissionType) =>
        this.hasPermission(module.modulePermissions, permissionType)
      );
    },
    toggleAllModulePermissions(module) {
      const availablePermissions = this.getAvailablePermissions(module);
      const isCurrentlyFullySelected = this.isModuleFullySelected(module);

      // Initialize module permissions if not exists
      if (!this.selectedPermissions[module.id]) {
        this.$set(this.selectedPermissions, module.id, {});
      }

      // Toggle all available permissions
      availablePermissions.forEach((permissionType) => {
        this.$set(
          this.selectedPermissions[module.id],
          permissionType,
          !isCurrentlyFullySelected
        );
      });
    },
    async save() {
      if (!this.isValid) return;

      // Collect selected permission IDs
      const modulePermissionIds = [];

      // Debug log to check the structure of modules and permissions
      console.log("Dynamic modules:", this.dynamicModules);

      // Loop through all modules
      this.dynamicModules.forEach((module) => {
        // Get all permissions for this module
        const modulePermissions = module.modulePermissions || [];
        console.log(`Module ${module.name} permissions:`, modulePermissions);

        // Loop through each permission in the module
        modulePermissions.forEach((permission) => {
          // Check if this permission is selected
          const permissionType = permission.permissionName;
          const moduleId = module.id;

          // Debug log for each permission
          console.log(`Permission ${permissionType} for module ${moduleId}:`, {
            id: permission.id,
            isSelected: this.isPermissionSelected(moduleId, permissionType),
          });

          // If the permission is selected and has an ID, add it to the array
          if (
            this.isPermissionSelected(moduleId, permissionType) &&
            permission.id
          ) {
            modulePermissionIds.push(permission.id);
          }
        });
      });

      // Log the final array of selected permission IDs
      console.log("Selected modulePermissionIds:", modulePermissionIds);

      const payload = {
        ...this.form,
        roleName: this.form.name,
        modulePermissionIds: modulePermissionIds,
      };
      delete payload.name;
      this.appLoading = true;
      try {
        if (this.mode === "edit") {
          const roleId = this.roleData.id;
          await updateRole(roleId, payload);
          this.$emit("update", payload);
        } else {
          const response = await createRole(payload);
          this.$emit("save", response.data);
        }

        if (this.mode === "create") {
          this.reset();
        }
        this.close();
        this.appLoading = false;
      } catch (error) {
        console.error("Error saving role:", error);
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "An error occurred while saving the role";
        this.$emit("error", errorMessage);
        this.appLoading = false;
      }
    },
    async saveAndAddNew() {
      if (!this.isValid) return;

      // Collect selected permission IDs
      const modulePermissionIds = [];

      // Loop through all modules
      this.dynamicModules.forEach((module) => {
        // Get all permissions for this module
        const modulePermissions = module.modulePermissions || [];

        // Loop through each permission in the module
        modulePermissions.forEach((permission) => {
          // Check if this permission is selected
          const permissionType = permission.permissionName;
          const moduleId = module.id;

          // If the permission is selected and has an ID, add it to the array
          if (
            this.isPermissionSelected(moduleId, permissionType) &&
            permission.id
          ) {
            modulePermissionIds.push(permission.id);
          }
        });
      });

      // Log the final array of selected permission IDs
      console.log(
        "SaveAndAddNew - Selected modulePermissionIds:",
        modulePermissionIds
      );

      const payload = {
        ...this.form,
        modulePermissionIds: modulePermissionIds,
      };

      try {
        const response = await createRole(payload);
        this.$emit("save-and-add", response.data);
        this.reset();
      } catch (error) {
        console.error("Error saving role:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "An error occurred while saving the role";
        this.$emit("error", errorMessage);
      }
    },
  },
};
</script>

<style scoped>
.dialog-header {
  background-color: #1a73e9;
  border-radius: 8px 8px 0 0;
  min-height: 48px;
  /* Reduced height to match Figma */
}

/* Permissions table - Pixel Perfect based on Figma */
.permissions-table {
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  overflow: hidden;
  background-color: white;
}

.table-header {
  display: flex;
  align-items: stretch;
  /* make all header columns equal height */
  min-height: 42px;
  background-color: transparent;
  /* remove bg, or use white if you prefer */
  border-bottom: 1px solid #e6e6e6;
  font-family: "opensansregular", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 24px;
  color: #1a73e9;
}

/* Make header columns align just like body */
.table-header>.v-flex {
  display: flex;
  align-items: center;
  /* center text vertically */
  border-right: 1px solid #e6e6e6;
}

.table-header>.v-flex:last-child {
  border-right: none;
  /* no border on last column */
}

.table-body {
  max-height: 400px;
  overflow-y: auto;
}

.table-row {
  align-items: center;
  min-height: 48px;
  background-color: white;
}

.table-row.has-border {
  border-bottom: 1px solid #e6e6e6;
}

.table-row:hover {
  background-color: #f8f9fa;
}

/* Ensure vertical lines are visible in hover state */
.table-row:hover .column-modules,
.table-row:hover .column-create,
.table-row:hover .column-view,
.table-row:hover .column-edit {
  border-right-color: #e6e6e6;
  /* Maintain border color on hover */
}

.table-row {
  display: flex;
  align-items: stretch;
  /* important: makes all children fill full row height */
}

.table-row>.v-flex {
  display: flex;
  align-items: center;
  /* keep text/checkbox vertically centered */
  border-right: 1px solid #e6e6e6;
}

.table-row>.v-flex:last-child {
  border-right: none;
  /* remove border on last column */
}

/* Column styling - responsive with Vuetify grid system */
.column-modules {
  align-items: center;
  font-family: "opensansregular", sans-serif;
  font-size: 14px;
  color: #1a73e9;
  font-weight: 400;
  border-right: 1px solid #e6e6e6;
  /* Vertical line separator */
}

.column-create {
  justify-content: center;
  align-items: center;
  font-family: "opensansregular", sans-serif;
  font-size: 14px;
  color: #1a73e9;
  font-weight: 400;
  border-right: 1px solid #e6e6e6;
  /* Vertical line separator */
}

.column-view {
  justify-content: center;
  align-items: center;
  font-family: "opensansregular", sans-serif;
  font-size: 14px;
  color: #1a73e9;
  font-weight: 400;
  border-right: 1px solid #e6e6e6;
  /* Vertical line separator */
}

.Head2 {
  margin-left: 15px;

}

.column-edit {
  justify-content: center;
  align-items: center;
  font-family: "opensansregular", sans-serif;
  font-size: 14px;
  color: #1a73e9;
  font-weight: 400;
  border-right: 1px solid #e6e6e6;
  /* Vertical line separator */
}

.column-delete {
  justify-content: center;
  align-items: center;
  font-family: "opensansregular", sans-serif;
  font-size: 14px;
  color: #1a73e9;
  font-weight: 400;
  /* No right border for last column */
}

/* Module content styling - responsive */
.module-content {
  align-items: center;
  width: 100%;
}

.module-name {
  font-family: "opensansregular", sans-serif;
  font-size: 14px;
  color: #000000;
  font-weight: 400;
  line-height: normal;
}

/* Override column colors for table body rows (module names should be black) */
.table-row .column-modules {
  color: #000000;
  /* Module names are black in rows, not blue */
}

.table-row .column-create,
.table-row .column-view,
.table-row .column-edit,
.table-row .column-delete {
  color: #5f5f5f;
  /* Permission column content is gray */
}

/* Dash symbol styling to match Figma exactly */
.dash-symbol {
  font-family: "opensansregular", sans-serif;
  font-size: 14px;
  color: #5f5f5f;
  font-weight: 400;
  line-height: normal;
  text-align: center;
}

/* Checkbox styling - exact 16x16px as per Figma */
.permissions-table>>>.v-input--checkbox {
  margin: 0;
  padding: 0;
  width: 16px;
  height: 16px;
}

.permissions-table>>>.v-input--checkbox .v-input__control {
  min-height: 16px;
  width: 16px;
  height: 16px;
}

.permissions-table>>>.v-input--checkbox .v-input__slot {
  margin-bottom: 0;
  width: 16px;
  height: 16px;
}

.permissions-table>>>.v-input--checkbox .v-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

/* Remove default margins and center checkboxes perfectly */
.permissions-table>>>.v-input--selection-controls {
  margin-top: 0;
  padding-top: 0;
}

.permissions-table>>>.v-input--selection-controls .v-input__slot {
  margin-bottom: 0;
}

.permissions-table>>>.v-messages {
  display: none;
}

/* Responsive adjustments for smaller screens */
@media (max-width: 960px) {

  .table-header,
  .table-row {
    font-size: 12px;
  }

  .permissions-table {
    overflow-x: auto;
  }
}

@media (max-width: 600px) {

  .table-header,
  .table-row {
    font-size: 11px;
  }

  .column-modules {
    padding-left: 12px;
  }
}

/* Custom field styling to match Figma exactly */
.v-text-field.v-text-field--solo .v-input__control {
  min-height: 40px;
}

.v-text-field .v-input__slot {
  box-shadow: none !important;
}

.v-dialog>.v-card {
  border-radius: 8px;
}

/* View mode styling for disabled fields */
.v-text-field--disabled .v-input__slot {
  background: #f5f5f5 !important;
}

.v-text-field--disabled input {
  color: #5f5f5f !important;
}

/* Disabled checkbox styling to match view mode */
.permissions-table>>>.v-input--checkbox.v-input--is-disabled {
  opacity: 1 !important;
}

.permissions-table>>>.v-input--checkbox.v-input--is-disabled .v-icon {
  color: #1a73e9 !important;
}
</style>