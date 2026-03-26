import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { db } from '@/database';
import * as models from '@/database/models';

/**
 * Super Admin Seeder
 * Creates a super admin with all permissions for the tax filing system
 * GDPR Compliant with secure defaults
 */
export const seedSuperAdmin = async () => {
  try {
    console.log('Starting Super Admin seeding...');

    // Environment-specific super admin credentials
    const getDefaultCredentials = () => {
      const env = process.env.NODE_ENV || 'local';

      switch (env) {
        case 'production':
          return {
            email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@taxmind.ie',
            password: process.env.SUPER_ADMIN_PASSWORD || 'TaxMind@Prod2025!',
            name: process.env.SUPER_ADMIN_NAME || 'Super Administrator',
          };
        case 'staging':
          return {
            email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@staging.taxmind.ie',
            password: process.env.SUPER_ADMIN_PASSWORD || 'TaxMind@Staging2025!',
            name: process.env.SUPER_ADMIN_NAME || 'Staging Super Admin',
          };

        case 'development':
          return {
            email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@development.taxmind.ie',
            password: process.env.SUPER_ADMIN_PASSWORD || 'TaxMind@Dev2025!',
            name: process.env.SUPER_ADMIN_NAME || 'Development Super Admin',
          };
        default: // local
          return {
            email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@local.taxmind.ie',
            password: process.env.SUPER_ADMIN_PASSWORD || 'TaxMind@Local2025!',
            name: process.env.SUPER_ADMIN_NAME || 'Local Super Admin',
          };
      }
    };

    const { email, password, name } = getDefaultCredentials();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format for super admin');
    }

    // Validate password strength
    const passwordStrengthRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordStrengthRegex.test(password)) {
      throw new Error(
        'Password does not meet security requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)'
      );
    }

    // Hash the password securely
    const salt = await bcrypt.genSalt(12); // Higher salt rounds for security
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get the Super Admin role
    const superAdminRole = await db.query.roles.findFirst({
      where: eq(models.roles.roleName, 'Super Admin'),
    });

    if (!superAdminRole) {
      throw new Error(
        'Super Admin role not found. Please run RBAC seeder first: npm run db:seed:local'
      );
    }

    // Check if super admin already exists
    const existingSuperAdmin = await db.query.admins.findFirst({
      where: eq(models.admins.email, email),
    });

    let adminId: string;

    if (existingSuperAdmin) {
      console.log('Super Admin already exists. Updating credentials...');

      // Update existing super admin with new password and ensure all settings are correct
      const [updatedAdmin] = await db
        .update(models.admins)
        .set({
          password: hashedPassword,
          name: name,
          roleId: superAdminRole.id,
          status: true,
          emailVerifiedAt: new Date(),
          isEmailOtpVerified: true,
          emailOtp: null, // Clear any existing OTP
          emailOtpExpires: null,
          accessToken: null, // Force re-login for security
          refreshToken: null,
          updatedAt: new Date(),
        })
        .where(eq(models.admins.id, existingSuperAdmin.id))
        .returning();

      adminId = updatedAdmin.id;
      console.log('✅ Super Admin updated successfully!');
    } else {
      // Create new super admin
      const [newSuperAdmin] = await db
        .insert(models.admins)
        .values({
          name: name,
          email: email,
          password: hashedPassword,
          roleId: superAdminRole.id,
          status: true,
          emailVerifiedAt: new Date(),
          isEmailOtpVerified: true,
          emailOtp: null,
          emailOtpExpires: null,
          accessToken: null,
          refreshToken: null,
          lastActivityAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      adminId = newSuperAdmin.id;
      console.log('✅ Super Admin created successfully!');
    }

    // Verify super admin has all permissions
    const superAdminPermissions = await db.query.roleModulePermissions.findMany({
      where: eq(models.roleModulePermissions.roleId, superAdminRole.id),
      with: {
        modulePermission: {
          with: {
            module: true,
          },
        },
      },
    });

    // Group permissions by module for better reporting
    const permissionsByModule = superAdminPermissions.reduce(
      (acc, perm) => {
        const moduleName = perm.modulePermission.module?.name || 'Unknown';
        if (!acc[moduleName]) acc[moduleName] = [];
        acc[moduleName].push(perm.modulePermission.permissionName);
        return acc;
      },
      {} as Record<string, string[]>
    );

    console.log('='.repeat(60));
    console.log('🎉 SUPER ADMIN SEEDING COMPLETED');
    console.log('='.repeat(60));
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'local'}`);
    console.log(`👤 Admin ID: ${adminId}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Password: ${password}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🔑 Role: Super Admin (ID: ${superAdminRole.id})`);
    console.log(`✅ Total Permissions: ${superAdminPermissions.length}`);
    console.log('');
    console.log('📋 Permissions by Module:');
    Object.entries(permissionsByModule).forEach(([module, permissions]) => {
      console.log(`  • ${module}: ${permissions.join(', ')}`);
    });
    console.log('='.repeat(60));
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   1. Change the default password after first login!');
    console.log('   2. Use environment variables for production credentials');
    console.log('   3. Ensure proper backup and audit logging');
    console.log('   4. Monitor super admin activities regularly');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedSuperAdmin()
    .then(() => {
      console.log('Super Admin seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Super Admin seeding failed:', error);
      process.exit(1);
    });
}
