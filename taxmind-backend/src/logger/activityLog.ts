import { activityLogEntityNamesArr } from '@/constants';
import { db, models } from '@/database';

import logger from '.';

type ActivityLogData = {
  entityName: (typeof activityLogEntityNamesArr)[number];
  entityId: string;
  action: 'insert' | 'update' | 'delete';
  modifiedUserId: string;
  oldData: unknown;
  newData: unknown;
};

export const activityLog = async (data: ActivityLogData) => {
  try {
    await db.insert(models.activityLogs).values(data);
  } catch (error) {
    console.error(error);
    logger.error((error as Error).message);
  }
};
