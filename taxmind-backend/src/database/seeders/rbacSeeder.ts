import { eq } from 'drizzle-orm';

import { db } from '@/database';
import * as models from '@/database/models';
import { initializeModulesAndPermissions } from '@/modules/rbac/services';

/**
 * Seed script to initialize RBAC system with modules and permissions
 */
export const seedRBACSystem = async () => {
  try {
    console.log('Starting RBAC system seeding...');

    // Initialize modules and permissions
    await initializeModulesAndPermissions();

    // Create default roles
    const superAdminRole = await db
      .insert(models.roles)
      .values({
        roleName: 'Super Admin',
      })
      .onConflictDoUpdate({
        target: models.roles.roleName,
        set: {
          updatedAt: new Date(),
        },
      })
      .returning();

    // Get all module permissions with module info
    const allPermissions = await db.query.modulePermissions.findMany({
      where: eq(models.modulePermissions.isActive, true),
      with: {
        module: true,
      },
    });

    // Assign ALL permissions to Super Admin
    const superAdminPersmissions = allPermissions.map((permission) => ({
      roleId: superAdminRole[0].id,
      modulePermissionId: permission.id,
      isEnabled: true,
    }));

    await db
      .insert(models.roleModulePermissions)
      .values(superAdminPersmissions)
      .onConflictDoNothing();

    console.log('RBAC system seeded successfully');
    console.log(`- Super Admin role: ALL permissions`);
    console.log(`- Total ${allPermissions.length} permissions`);
  } catch (error) {
    console.error('Error seeding RBAC system:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedRBACSystem()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
