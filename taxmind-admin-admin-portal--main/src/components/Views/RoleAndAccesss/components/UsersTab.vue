<template>
  <div class="users-tab">
    <!-- Loading overlay -->
    <v-overlay :value="loading" absolute>
      <v-progress-circular indeterminate color="#1A73E9"></v-progress-circular>
    </v-overlay>

    <div class="table-wrapper">
      <table class="custom-table">
        <thead>
          <tr>
            <th class="buttonText">Sl.No</th>
            <th class="buttonText">User name</th>
            <th class="buttonText">Email address</th>
            <th class="buttonText">Role name</th>
            <th class="buttonText">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, i) in filteredUsers" :key="i">
            <td>
              <span v-if="currentPage > 1">{{ (currentPage - 1) * limit + i + 1 }}</span>
              <span v-else>{{ i + 1 }}</span>
            </td>
            <td>{{ user.name || user.username }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role.roleName }}</td>
            <td>
              <!-- <ActionButton
                label="View"
                color="#5F6368"
                :onClick="() => onView(user)"
              /> -->
              <ActionButton v-if="canEdit('rbac')" label="Edit" color="#1A73E9" :onClick="() => onEdit(user)" />
              <ActionButton v-if="canDelete('rbac')" :label="user.status === false ? 'Unblock' : 'Block'"
                :color="user.status === false ? '#4CAF50' : '#D53E3E'" :onClick="() => onBlock(user)" />
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="5" class="text-center py-4">No users found</td>
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
import { listUsers } from "@/api/modules/rbac";
import debounce from "lodash/debounce";
import permissionMixin from '@/mixins/permissionMixin';

export default {
  name: "UsersTab",
  mixins: [permissionMixin],
  components: { ActionButton },
  props: {
    searchQuery: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      users: [],
      loading: false,
      currentPage: 1,
      limit: 10,
      pages: 0,
      totalUsers: 0
    };
  },
  computed: {
    filteredUsers() {
      if (!this.searchQuery) {
        return this.users;
      }

      const query = this.searchQuery.toLowerCase();
      return this.users.filter(user =>
        (user.name || user.username || '').toLowerCase().includes(query) ||
        (user.email || '').toLowerCase().includes(query) ||
        (user.role || '').toLowerCase().includes(query)
      );
    }
  },
  watch: {
    searchQuery() {
      this.currentPage = 1;
      this.debouncedGetUsers();
    },
    currentPage() {
      this.getUsers();
    }
  },
  created() {
    this.debouncedGetUsers = debounce(this.getUsers, 500);
  },
  mounted() {
    this.getUsers();
  },
  methods: {
    getUsers() {
      this.loading = true;

      const params = {
        page: this.currentPage,
        limit: this.limit,
        keyword: this.searchQuery || null
      };

      listUsers(params)
        .then(response => {
          this.loading = false;

          if (response.data) {
            // Map API response to component data structure
            this.users = (response.data.data || []).map(user => ({
              id: user.id,
              username: user.name,
              name: user.name,
              email: user.email,
              role: user.role || 'User', // Default role if not provided
              status: user.status
            }));

            // Set pagination data
            const total = response.data.metadata?.total || this.users.length;
            this.totalUsers = total;
            this.pages = Math.ceil(total / this.limit);
          } else {
            this.users = [];
            this.pages = 0;
            this.totalUsers = 0;
          }
        })
        .catch(error => {
          this.loading = false;
          console.error('Error fetching users:', error);
          // Show error message if needed
        });
    },
    onView(user) {
      this.$emit("view-user", user);
    },
    onEdit(user) {
      this.$emit("edit-user", user);
    },
    onBlock(user) {
      this.$emit("block-user", user);
    },
  },
};
</script>

<style scoped>
.users-tab {
  width: 100%;
  position: relative;
}

.table-wrapper {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
  min-height: 200px;
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

.text-center {
  text-align: center;
}
</style>