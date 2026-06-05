import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const hasRedis = process.env.UPSTASH_REDIS_REST_URL?.startsWith('https://');

if (!hasRedis && process.env.NODE_ENV === 'production') {
  console.warn('[ratelimit] UPSTASH_REDIS_REST_URL is not configured — rate limiting is DISABLED');
}

export const ratelimit = hasRedis
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: false,
    })
  : null;
