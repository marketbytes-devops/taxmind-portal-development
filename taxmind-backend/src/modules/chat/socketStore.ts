// import { redisConnection } from '@/integrations/redis';

// const KEY_PREFIX = 'socket';
// const USER_SET = `${KEY_PREFIX}:users`; // set of userIds
// const ADMIN_SET = `${KEY_PREFIX}:admins`; // set of adminIds

// const userKey = (userId: string) => `${KEY_PREFIX}:user:${userId}`; // hash of socketIds
// const adminKey = (adminId: string) => `${KEY_PREFIX}:admin:${adminId}`; // hash of socketIds

// // Add socket id
// export async function addSocket(role: 'user' | 'admin', id: string, socketId: string) {
//   const key = role === 'admin' ? adminKey(id) : userKey(id);
//   await redisConnection.hset(key, socketId, Date.now().toString());
//   await redisConnection.expire(key, 60 * 60 * 6); // 6h TTL (refreshed by reconnects)
//   await redisConnection.sadd(role === 'admin' ? ADMIN_SET : USER_SET, id);
// }

// // Remove socket id
// export async function removeSocket(role: 'user' | 'admin', id: string, socketId: string) {
//   const key = role === 'admin' ? adminKey(id) : userKey(id);
//   await redisConnection.hdel(key, socketId);
//   const len = await redisConnection.hlen(key);
//   if (len === 0) {
//     await redisConnection.del(key);
//     await redisConnection.srem(role === 'admin' ? ADMIN_SET : USER_SET, id);
//   }
// }

// // Get all socket IDs for an id
// export async function getSocketIds(role: 'user' | 'admin', id: string) {
//   const key = role === 'admin' ? adminKey(id) : userKey(id);
//   const entries = await redisConnection.hkeys(key);
//   return entries;
// }

// export async function getAllAdminSocketIds() {
//   const adminIds = await redisConnection.smembers(ADMIN_SET);
//   if (!adminIds.length) return [] as string[];
//   const pipeline = redisConnection.pipeline();
//   adminIds.forEach((a) => pipeline.hkeys(adminKey(a)));
//   const results = await pipeline.exec();
//   const sockets: string[] = [];
//   results?.forEach((res) => {
//     if (res && res[1]) sockets.push(...(res[1] as string[]));
//   });
//   return sockets;
// }
