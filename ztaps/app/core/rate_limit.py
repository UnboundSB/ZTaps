import time
import os
import redis.asyncio as redis
from fastapi import HTTPException, status, Request
from collections import defaultdict
import asyncio

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class RateLimiter:
    def __init__(self, requests_per_second: int = 100):
        self.requests_per_second = requests_per_second
        self.redis = redis.from_url(REDIS_URL, decode_responses=True)

    async def verify(self, request: Request):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Redis sliding window approach
        pipeline = self.redis.pipeline()
        window_start = now - 1.0
        
        # 1. Remove old requests outside the 1 second window
        pipeline.zremrangebyscore(client_ip, 0, window_start)
        
        # 2. Count requests in the current window
        pipeline.zcard(client_ip)
        
        # 3. Add the current request
        pipeline.zadd(client_ip, {str(now): now})
        
        # 4. Set expiry to clean up memory
        pipeline.expire(client_ip, 2)
        
        try:
            results = await pipeline.execute()
            request_count = results[1]
            
            if request_count >= self.requests_per_second:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Try again later."
                )
        except redis.ConnectionError:
            # Fallback for local dev environments where Redis is not running
            pass


# Create singleton
rate_limiter = RateLimiter(requests_per_second=100) # 100 req/sec per IP

async def check_rate_limit(request: Request):
    """Dependency to check rate limits."""
    await rate_limiter.verify(request)
