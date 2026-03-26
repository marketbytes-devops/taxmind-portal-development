import { seedPolicies } from './policiesSeeder';
import { seedQuestionnaires } from './questionnaireSeeder';
import { seedRBACSystem } from './rbacSeeder';
import { seedSiteContents } from './siteContentsSeeder';
import { seedSuperAdmin } from './superAdminSeeder';

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Seed RBAC system first (modules, permissions, roles)
    await seedRBACSystem();

    // Seed initial policies (privacy, cookies, fee, terms)
    await seedPolicies();

    // Seed site contents (global configuration)
    await seedSiteContents();

    // Seed sample questionnaire (draft, categories, questions)
    await seedQuestionnaires();

    // Seed super admin
    await seedSuperAdmin();

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
