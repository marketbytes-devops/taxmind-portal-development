import { serviceHandler } from '@/utils/serviceHandler';

export const testFn = serviceHandler(async (req, res) => {
  res.send({ message: 'Test function executed successfully' });
});
