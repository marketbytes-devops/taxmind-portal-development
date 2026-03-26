import { models } from '@/database';

export type User = typeof models.users.$inferSelect;
type File = typeof models.files.$inferSelect;

export type UserWithProfilePhoto = User & {
  profilePhoto: File | null;
};

// --------------------------------------------------

type Admin = typeof models.admins.$inferSelect;

type ModulePermission = {
  id: string;
  permissionName: string;
  displayName: string;
  description: string;
};

type RoleModule = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: ModulePermission[];
};

export type AdminWithRole = Admin & {
  role: { id: string; roleName: string; modules: RoleModule[] };
};
