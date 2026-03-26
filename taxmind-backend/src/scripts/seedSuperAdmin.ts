#!/usr/bin/env ts-node
/**
 * Script to seed super admin with all permissions
 * Usage: npm run seed:super-admin
 */
import { seedSuperAdmin } from '../database/seeders/superAdminSeeder';

async function main() {
  try {
    console.log('🚀 Starting Super Admin seeding process...');
    await seedSuperAdmin();
    console.log('✅ Super Admin seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Super Admin seeding failed:', error);
    process.exit(1);
  }
}

// Execute the script
main();
