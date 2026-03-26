<template>
  <div class="roles-tab">
    <!-- Loading overlay -->
    <v-overlay :value="loading" absolute>
      <v-progress-circular indeterminate color="#1A73E9"></v-progress-circular>
    </v-overlay>

    <div class="table-wrapper">
      <table class="custom-table">
        <thead>
          <tr>
            <th class="buttonText">Sl.No</th>
            <th class="buttonText">Role name</th>
            <th class="buttonText">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(role, i) in roles" :key="role.id || i">
            <td>
              <span v-if="currentPage > 1">{{
                (currentPage - 1) * limit + i + 1
              }}</span>
              <span v-else>{{ i + 1 }}</span>
            </td>
            <td>{{ role.roleName }}</td>
            <td>
              <ActionButton label="View" color="#5F6368" :onClick="() => onView(role)" />
              <ActionButton v-if="canEdit('rbac')" label="Edit" color="#1A73E9" :onClick="() => onEdit(role)" />
              <ActionButton v-if="canDelete('rbac') && role.isDeletable" label="Delete" color="#D53E3E" :onClick="() => onDelete(role)" />
            </td>
          </tr>
          <tr v-if="roles.length === 0">
            <td colspan="3" class="text-center py-4">No roles found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="text-center pt-4" v-if="pages > 1">
      <v-pagination :length="pages" v-model="currentPage" color="#1A73E9" circle></v-pagination>
    </div>
  </div>
</template>

<script>
import ActionButton from "@/components/utilities/ActionButton.vue";
import { listRoles } from "@/api/modules/rbac";
import debounce from "lodash/debounce";
import permissionMixin from '@/mixins/permissionMixin';

export default {
  name: "RolesTab",
  mixins: [permissionMixin],
  components: { ActionButton },
  props: {
    searchQuery: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      roles: [],
      loading: false,
      currentPage: 1,
      limit: 10,
      pages: 1,
      totalRoles: 0,
    };
  },
  watch: {
    searchQuery: {
      handler(val) {
        this.debouncedGetRoles(val);
      },
    },
    currentPage() {
      this.getRoles();
    },
  },
  created() {
    this.debouncedGetRoles = debounce(this.getRoles, 500);
  },
  mounted() {
    this.getRoles();
  },
  methods: {
    getRoles() {
      this.loading = true;

      const params = {
        page: this.currentPage,
        limit: this.limit,
        keyword: this.searchQuery || null,
      };

      listRoles(params)
        .then((response) => {
          this.handleRolesResponse(response);
        })
        .catch((error) => {
          this.handleRolesError(error);
        });
    },

    // Process successful API response
    handleRolesResponse(response) {
      this.loading = false;

      if (!response.data) {
        this.resetRolesData();
        return;
      }

      // Map API response to component data structure
      this.roles = this.mapRolesData(response.data.data || []);

      // Set pagination data
      const total = response.data.metadata?.total || this.roles.length;
      this.totalRoles = total;
      this.pages = Math.ceil(total / this.limit);
    },

    // Map role data from API to component structure
    mapRolesData(rolesData) {
      return rolesData.map((role) => ({
        id: role.id,
        roleName: role.roleName,
        description: role.description || "",
        usersCount: role.usersCount || 0,
        isDeletable: role.isDeletable,
        modules: role.modules || [],
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      }));
    },

    // Handle API error
    handleRolesError(error) {
      this.loading = false;
      console.error("Error fetching roles:", error);
      // Show error message if needed
      this.$parent.handleError && this.$parent.handleError(error);
    },

    // Reset roles data when no data is available
    resetRolesData() {
      this.roles = [];
      this.pages = 0;
      this.totalRoles = 0;
    },
    onView(role) {
      this.$emit("view-role", role);
    },
    onEdit(role) {
      this.$emit("edit-role", role);
    },
    onDelete(role) {
      this.$emit("delete-role", role);
    },
  },
};
</script>

<style scoped>
.roles-tab {
  width: 100%;
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

.custom-table th {
  all: unset;
  display: table-cell;
  padding: 12px 16px;
  border: 1px solid #e5e5e5;
  color: #1a73e9;
}
</style>