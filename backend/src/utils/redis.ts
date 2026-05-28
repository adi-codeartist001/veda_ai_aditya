import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const redisSubscriber = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', () => {}); // Silent - Redis optional

export const CACHE_TTL = 3600; // 1 hour

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const val = await redis.get(key);
  return val ? (JSON.parse(val) as T) : null;
};

export const cacheSet = async (key: string, data: unknown, ttl = CACHE_TTL): Promise<void> => {
  await redis.setex(key, ttl, JSON.stringify(data));
};

export const cacheDel = async (key: string): Promise<void> => {
  await redis.del(key);
};
