import { pgEnum } from 'drizzle-orm/pg-core';

import { applicationStatusesArr } from '@/constants';

// Application status enum - shared between applications and applicationStatusHistories
export const applicationStatuses = pgEnum(
  'application_statuses',
  applicationStatusesArr as [string, ...string[]]
);
