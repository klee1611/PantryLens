import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = process.env.UPSTASH_REDIS_REST_URL?.startsWith('https://')
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: false,
    })
  : null;
