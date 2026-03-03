import { eq } from 'drizzle-orm';

import { policyTypes } from '@/constants';
import { db, models } from '@/database';

/**
 * Policies Seeder
 * Ensures an initial active policy exists for each required policy type.
 * Idempotent: inserts only when a type has no records.
 */
export const seedPolicies = async () => {
  try {
    console.log('Starting Policies seeding...');

    const types = [
      policyTypes.PRIVACY_POLICY,
      policyTypes.COOKIES_POLICY,
      policyTypes.FEE_STRUCTURE,
      policyTypes.TERMS_CONDITIONS,
    ] as const;

    const defaultContents: Record<(typeof types)[number], string> = {
      [policyTypes.PRIVACY_POLICY]:
        'Default Privacy Policy for TaxMind. Replace with your full content.',
      [policyTypes.COOKIES_POLICY]:
        'Default Cookies Policy for TaxMind. Replace with your full content.',
      [policyTypes.FEE_STRUCTURE]:
        'Default Fee Structure for TaxMind. Replace with your full content.',
      [policyTypes.TERMS_CONDITIONS]:
        'Default Terms & Conditions for TaxMind. Replace with your full content.',
    } as const;

    for (const type of types) {
      // Check if any policy exists for this type
      const existing = await db.query.policies.findFirst({
        where: eq(models.policies.type, type),
        columns: { id: true },
      });

      if (existing) {
        console.log(`✓ Policy entries exist for type: ${type}. Skipping insert.`);
        continue;
      }

      // Insert an initial active policy
      const now = new Date();
      const [inserted] = await db
        .insert(models.policies)
        .values({
          policyNo: 1,
          type,
          content: defaultContents[type],
          version: '1.0',
          effectiveDate: now,
          isActive: true,
          createdAt: now,
        })
        .returning({ id: models.policies.id, type: models.policies.type });

      console.log(`✓ Seeded initial policy for type: ${type} (id: ${inserted.id})`);
    }

    console.log('Policies seeding completed.');
  } catch (error) {
    console.error('✗ Policies seeding failed:', error);
    throw error;
  }
};
