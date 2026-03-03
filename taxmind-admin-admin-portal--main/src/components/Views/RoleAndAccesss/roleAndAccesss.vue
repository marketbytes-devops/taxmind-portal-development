<template>
  <div class="ma-4">
    <ServerError v-if="ServerError" />
    <vue-element-loading :active="appLoading" spinner="bar-fade-scale" color="#1A73E9" size="60" is-full-screen />
    <v-snackbar v-model="showSnackBar" color="#1A73E9" right :timeout="timeout">
      <v-layout wrap justify-center>
        <v-flex text-left class="align-self-center">
          <span style="color: #ffffff">
            {{ msg }}
          </span>
        </v-flex>
        <v-flex text-right>
          <v-btn small :ripple="false" text @click="showSnackBar = false">
            <v-icon style="color: #ffffff">mdi-close</v-icon>
          </v-btn>
        </v-flex>
      </v-layout>
    </v-snackbar>
    <div class="roleHeader Head1 pa-4">Role & Access</div>
    <v-layout wrap>
      <v-flex xs12>
        <v-card flat class="px-4 pb-4">
          <v-layout wrap>
            <v-flex xs12>
              <v-layout wrap align-center justify-space-between>
                <!-- Tabs -->
                <v-flex align-self-center pt-2>
                  <v-tabs v-model="tab">
                    <v-tab class="Head2">Users</v-tab>
                    <v-tab class="Head2">Roles</v-tab>
                  </v-tabs>
                </v-flex>

                <!-- Search Field (changes based on active tab) -->
                <v-flex align-self-center pt-2 shrink class="mr-2">
                  <v-text-field :value="tab === 0 ? searchQuery : roleSearchQuery"
                    :placeholder="tab === 0 ? 'Search users' : 'Search roles'" prepend-inner-icon="mdi-magnify"
                    hide-details single-line outlined dense class="search-field" @input="
                      tab === 0 ? searchUsers($event) : searchRoles($event)
                      " clearable @click:clear="
                        tab === 0 ? clearUserSearch() : clearRoleSearch()
                        "></v-text-field>
                </v-flex>

                <!-- Create User/Role Button -->
                <v-flex align-self-center pt-2 shrink>
                  <filled-button v-if="canCreate('rbac')" :text="tab === 0 ? LABELS.CREATE_USER : LABELS.CREATE_ROLE"
                    color="#1A73E9" icon="mdi-plus" size="medium"
                    :onClick="tab === 0 ? openCreateUserDialog : openCreateRoleDialog" />
                </v-flex>
              </v-layout>
              <v-tabs-items v-model="tab" class="pt-4">
                <v-tab-item>
                  <users-tab ref="usersTab" :search-query="searchQuery" @view-user="handleViewUser"
                    @edit-user="handleEditUser" @block-user="handleBlockUser" />
                </v-tab-item>
                <v-tab-item>
                  <roles-tab ref="rolesTab" :search-query="roleSearchQuery" @view-role="handleViewRole"
                    @edit-role="handleEditRole" @delete-role="handleDeleteRole" />
                </v-tab-item>
              </v-tabs-items>
            </v-flex>
          </v-layout>

          <!-- Create User Dialog -->
          <CreateUserDialog ref="createUserDialog" v-model="showCreateUserDialog" :roles="availableRoles"
            :mode="editMode ? 'edit' : 'create'" :userData="editingUser" @save="createUser" @update="updateUser"
            @close="resetEditMode" />

          <!-- Create Role Dialog -->
          <CreateRoleDialog v-model="showCreateRoleDialog"
            :mode="viewRoleMode ? 'view' : editRoleMode ? 'edit' : 'create'"
            :roleData="viewRoleMode ? viewingRole : editingRole" :data="moduleData" @save="createRole"
            @save-and-add="createRoleAndAddNew" @update="updateRole" @error="handleRoleError"
            @close="resetEditRoleMode" />

          <!-- Block User Dialog -->
          <BlockUserDialog v-model="showBlockUserDialog" :title="blockDialogData.title"
            :description="blockDialogData.description" :actionText="blockDialogData.actionText"
            :actionColor="blockDialogData.actionColor" @confirm="confirmBlockUser" @cancel="cancelBlockUser" />

          <!-- Delete Role Dialog -->
          <BlockUserDialog v-model="showDeleteRoleDialog" :title="deleteRoleDialogData.title"
            :description="deleteRoleDialogData.description" :actionText="deleteRoleDialogData.actionText"
            :actionColor="deleteRoleDialogData.actionColor" @confirm="confirmDeleteRole" @cancel="cancelDeleteRole" />
        </v-card>
      </v-flex>
    </v-layout>
  </div>
</template>
<script>
import FilledButton from "../../utilities/FilledButton.vue";
import UsersTab from "./components/UsersTab.vue";
import RolesTab from "./components/RolesTab.vue";
import CreateUserDialog from "./components/CreateUserDialog.vue";
import CreateRoleDialog from "./components/CreateRoleDialog.vue";
import BlockUserDialog from "./components/BlockUserDialog.vue";
import permissionMixin from '@/mixins/permissionMixin';
import {
  listAllRoles,
  createAdmin,
  updateAdminProfile,
  blockUnblockAdmin,
  listModules,
  deleteRole,
} from "@/api/modules/rbac";

const LABELS = {
  CREATE_USER: "Create user",
  CREATE_ROLE: "Create role",
};

export default {
  name: "RoleAndAccess",
  mixins: [permissionMixin],
  components: {
    FilledButton,
    UsersTab,
    RolesTab,
    CreateUserDialog,
    CreateRoleDialog,
    BlockUserDialog,
  },
  data() {
    return {
      tab: 0,
      LABELS,
      ServerError: false,
      appLoading: false,
      showSnackBar: false,
      timeout: 5000,
      msg: "",
      searchQuery: "",
      roleSearchQuery: "",
      showCreateUserDialog: false,
      showCreateRoleDialog: false,
      showBlockUserDialog: false,
      showDeleteRoleDialog: false,
      editMode: false,
      editingUser: null,
      editRoleMode: false,
      editingRole: null,
      viewRoleMode: false,
      viewingRole: null,
      blockDialogData: {
        title: "",
        description: "",
        actionText: "Block",
        actionColor: "#D53E3E",
      },
      deleteRoleDialogData: {
        title: "",
        description: "",
        actionText: "Delete",
        actionColor: "#D53E3E",
      },
      currentBlockingUser: null,
      currentDeletingRole: null,
      availableRoles: [],
      rolesLoading: false,
      // Module data fetched from API
      moduleData: [],
      modulesLoading: false,
    };
  },
  created() {
    // Fetch roles and modules when component is created
    this.fetchRoles();
    this.fetchModules();
  },
  methods: {
    fetchRoles() {
      this.rolesLoading = true;
      listAllRoles()
        .then((response) => {
          console.log("Roles fetched:", response);
          if (response && response.data) {
            // Map API response to the format expected by the select component
            this.availableRoles = response.data?.data
              // .filter(role => role.isDeletable) // only keep roles with isDeletable: true
              .map((role) => ({
                text: role.roleName,
                value: role.id,
                // Store the full role object for reference if needed
                roleData: role,
              }));
          }
          this.rolesLoading = false;
        })
        .catch((error) => {
          console.error("Error fetching roles:", error);
          this.rolesLoading = false;
        });
    },
    fetchModules() {
      this.modulesLoading = true;

      listModules()
        .then((response) => {
          this.modulesLoading = false;

          if (response.data && response.data.data) {
            // Debug log to check the structure of the first module's permissions
            if (
              response.data.data.length > 0 &&
              response.data.data[0].modulePermissions.length > 0
            ) {
              console.log(
                "Sample module permission:",
                response.data.data[0].modulePermissions[0]
              );
            }

            // Map API response to the expected format for CreateRoleDialog
            this.moduleData = response.data.data.map((module) => ({
              id: module.id,
              name: module.name,
              displayName: module.displayName,
              description: module.description,
              isActive: module.isActive,
              modulePermissions: module.modulePermissions.map((permission) => ({
                id: permission.id,
                permissionName: permission.permissionName,
                isActive: permission.isActive,
              })),
            }));
          }
        })
        .catch((error) => {
          this.modulesLoading = false;
          console.error("Error fetching modules:", error);
        });
    },
    searchUsers(value) {
      this.searchQuery = value;
    },
    clearUserSearch() {
      this.searchQuery = "";
      if (this.$refs.usersTab) {
        this.$refs.usersTab.handleSearch("");
      }
    },
    searchRoles(value) {
      this.roleSearchQuery = value;
    },
    clearRoleSearch() {
      this.roleSearchQuery = "";
      if (this.$refs.rolesTab) {
        this.$refs.rolesTab.handleSearch("");
      }
    },
    openCreateUserDialog() {
      console.log("Opening create user dialog"); // Debug log
      // First set edit mode and user to null
      this.editMode = false;
      this.editingUser = null;

      // Use nextTick to ensure the component has time to update before showing the dialog
      this.$nextTick(() => {
        this.showCreateUserDialog = true;
      });
    },
    openCreateRoleDialog() {
      console.log("Opening create role dialog"); // Debug log
      this.editRoleMode = false;
      this.viewRoleMode = false;
      this.editingRole = null;
      this.viewingRole = null;
      this.showCreateRoleDialog = true;
    },

    createUser(payload) {
      console.log("Create User:", payload);
      const params = {
        name: payload.userName,
        email: payload.email,
        roleId: payload.role,
      };
      this.appLoading = true;
      // Example of API call implementation:
      createAdmin(params)
        .then((response) => {
          console.log("User updated successfully:", response);
          this.msg = "User updated successfully";
          this.showSnackBar = true;
          // Refresh the users list
          this.refreshUsers();
          this.resetEditMode();
          this.showCreateUserDialog = false;
          this.appLoading = false;
          this.$refs.createUserDialog.reset();
          this.$refs.rolesTab.getRoles();
          // Reset form only on successful API call
        })
        .catch((error) => {
          // this.$refs.createUserDialog.reset();
          this.handleError(error);
          // Keep dialog open on error
          // Do not reset form
        });
    },
    updateUser(payload) {
      console.log("Update User:", payload);

      if (!this.editingUser || !this.editingUser.id) {
        this.handleError({ message: "User ID is missing" });
        return;
      }

      const adminId = this.editingUser.id;
      const profileData = {
        name: payload.userName,
        roleId: payload.role,
        status: true,
        // Don't include email as it's not editable
      };

      this.appLoading = true;
      updateAdminProfile(adminId, profileData)
        .then((response) => {
          console.log("User updated successfully:", response);
          this.msg = "User updated successfully";
          this.showSnackBar = true;
          // Refresh the users list
          this.refreshUsers();
          // Reset form only on successful API call
          this.resetEditMode();
          this.showCreateUserDialog = false;
          this.appLoading = false;
          this.$refs.rolesTab.getRoles();

          this.$refs.createUserDialog.reset();
        })
        .catch((error) => {
          this.handleError(error);
          this.appLoading = false;
          // Keep dialog open on error
          // Do not reset form
        });
    },
    resetEditMode() {
      this.editMode = false;
      this.editingUser = null;
    },
    refreshUsers() {
      // Call the getUsers method in the UsersTab component
      if (this.$refs.usersTab) {
        this.$refs.usersTab.getUsers();
      }
    },
    refreshRoles() {
      // Refresh the roles list and call the getRoles method in the RolesTab component
      this.fetchRoles();
      if (this.$refs.rolesTab) {
        this.$refs.rolesTab.getRoles();
      }
    },
    handleViewUser(user) {
      // TODO: handle view user
      console.log("View User:", user);
    },
    handleEditUser(user) {
      console.log("Edit User:", user);
      this.editMode = true;
      this.editingUser = user;
      this.showCreateUserDialog = true;
    },
    handleBlockUser(user) {
      console.log("Block/Unblock User:", user);

      const isBlocked = user.status === false;
      const action = isBlocked ? "Unblock" : "Block";
      const actionColor = isBlocked ? "#4CAF50" : "#D53E3E"; // Green for unblock, Red for block

      // Set up the dialog data
      this.blockDialogData = {
        title: `Are you sure you want to ${action} \n${user.username || user.name
          }?`,
        description: isBlocked
          ? `User will be able to access the system again. \nDo you want to proceed?`
          : `User will be blocked from accessing the system. \nDo you want to proceed?`,
        actionText: action,
        actionColor: actionColor,
      };

      this.currentBlockingUser = user;
      this.showBlockUserDialog = true;
    },
    confirmBlockUser() {
      if (this.currentBlockingUser && this.currentBlockingUser.id) {
        const isCurrentlyBlocked = this.currentBlockingUser.status === false;
        const newStatus = isCurrentlyBlocked; // If currently blocked, set to true (unblock), otherwise false (block)
        const actionText = isCurrentlyBlocked ? "unblocked" : "blocked";

        console.log(`Confirmed ${actionText} user:`, this.currentBlockingUser);

        this.appLoading = true;
        blockUnblockAdmin(this.currentBlockingUser.id, newStatus)
          .then((response) => {
            console.log(`User ${actionText} successfully:`, response);
            this.msg = `User ${actionText} successfully`;
            this.showSnackBar = true;
            // Refresh the users list
            this.refreshUsers();
            this.appLoading = false;
          })
          .catch((error) => {
            this.handleError(error);
            this.appLoading = false;
          })
          .finally(() => {
            this.currentBlockingUser = null;
            this.showBlockUserDialog = false;
          });
      } else {
        this.msg = "User ID is missing";
        this.showSnackBar = true;
        this.currentBlockingUser = null;
        this.showBlockUserDialog = false;
      }
    },
    cancelBlockUser() {
      this.currentBlockingUser = null;
      this.showBlockUserDialog = false;
    },
    // Role handling methods
    createRole(payload) {
      console.log("Create Role:", payload);
      this.msg = "Role created successfully";
      this.showSnackBar = true;
      // Refresh the roles list
      this.refreshRoles();
      this.showCreateRoleDialog = false;
    },
    createRoleAndAddNew(payload) {
      console.log("Create Role and Add New:", payload);
      this.msg = "Role created successfully";
      this.showSnackBar = true;
      // Refresh the roles list
      this.refreshRoles();
      // Keep dialog open for adding another role
    },
    updateRole(payload) {
      console.log("Update Role:", payload);
      this.msg = "Role updated successfully";
      this.showSnackBar = true;
      // Refresh the roles list
      this.refreshRoles();
      this.showCreateRoleDialog = false;
      this.editRoleMode = false;
      this.editingRole = null;
    },
    resetEditRoleMode() {
      this.editRoleMode = false;
      this.viewRoleMode = false;
      this.editingRole = null;
      this.viewingRole = null;
    },
    handleRoleError(errorMessage) {
      this.msg = errorMessage;
      this.showSnackBar = true;
    },
    handleViewRole(role) {
      console.log("View Role:", role);

      // Use the actual role data from the API
      const viewRoleData = {
        id: role.id,
        name: role.roleName,
        modules: role.modules || [],
      };

      this.viewRoleMode = true;
      this.editRoleMode = false;
      this.viewingRole = viewRoleData;
      this.editingRole = null;
      this.showCreateRoleDialog = true;
    },
    handleEditRole(role) {
      console.log("Edit Role:", role);

      // Use the actual role data from the API
      const editRoleData = {
        id: role.id,
        name: role.roleName,
        modules: role.modules || [],
      };

      this.editRoleMode = true;
      this.viewRoleMode = false;
      this.editingRole = editRoleData;
      this.viewingRole = null;
      this.showCreateRoleDialog = true;
    },
    handleDeleteRole(role) {
      console.log("Delete Role:", role);

      // Set up the dialog data
      this.deleteRoleDialogData = {
        title: `Are you sure you want to Delete \n${role.roleName}?`,
        description:
          "Role data will be permanently removed. \nDo you still want to proceed?",
        actionText: "Delete",
        actionColor: "#D53E3E",
      };

      this.currentDeletingRole = role;
      this.showDeleteRoleDialog = true;
    },
    async confirmDeleteRole() {
      if (this.currentDeletingRole && this.currentDeletingRole.id) {
        console.log("Confirmed delete role:", this.currentDeletingRole);

        this.appLoading = true;
        try {
          await deleteRole(this.currentDeletingRole.id);
          this.msg = "Role deleted successfully";
          this.showSnackBar = true;
          // Refresh the roles list
          this.refreshRoles();
        } catch (error) {
          console.error("Error deleting role:", error);
          this.msg = error.response?.data?.message || "Failed to delete role";
          this.showSnackBar = true;
        } finally {
          this.appLoading = false;
          this.currentDeletingRole = null;
          this.showDeleteRoleDialog = false;
        }
      } else {
        this.msg = "Role ID is missing";
        this.showSnackBar = true;
        this.currentDeletingRole = null;
        this.showDeleteRoleDialog = false;
      }
    },
    cancelDeleteRole() {
      this.currentDeletingRole = null;
      this.showDeleteRoleDialog = false;
    },
    handleError(error) {
      if (error.response.status == 500) {
        this.ServerError = true;
      }

      this.appLoading = false;
      this.msg = error.response?.data?.error || error.message;
      this.showSnackBar = true;
    },
  },
};
</script>
<style scoped>
.v-tab {
  text-transform: none !important;
}

.roleHeader {
  background: #fff;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.05);
  z-index: 1;
  position: relative;
}

.table-wrapper {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.custom-table th,
.custom-table td {
  padding: 12px 16px;
  border: 1px solid #e5e5e5;
  text-align: left;
}

/* ✅ Header styles */
.custom-table th {
  all: unset;
  /* removes default th styles */
  display: table-cell;
  /* restore table-cell layout */
  padding: 12px 16px;
  border: 1px solid #e5e5e5;
  color: #1a73e9;
}

.action-btn {
  background: none;
  border: none;
  font-size: 14px;
  margin-right: 8px;
  cursor: pointer;
}

.action-btn.view {
  color: #1a73e9;
}

.action-btn.edit {
  color: #1a73e9;
}

.action-btn.block {
  color: #d53e3e;
}

.create-btn {
  border-radius: 6px;
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
}

.search-field {
  max-width: 250px;
}
</style>