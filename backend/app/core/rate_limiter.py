import time
from collections import defaultdict
from fastapi import HTTPException, Request
from typing import Dict, List, Tuple

class InMemoryRateLimiter:
    """
    Sliding window rate limiter tracking requests by (key_prefix, identifier).
    Maintains request timestamps within sliding time windows.
    """
    def __init__(self, requests_per_minute: int = 10, window_seconds: int = 60):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = window_seconds
        self.history: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, key: str) -> Tuple[bool, int]:
        now = time.time()
        cutoff = now - self.window_seconds

        # Clean old timestamps
        timestamps = [t for t in self.history[key] if t > cutoff]
        self.history[key] = timestamps

        if len(timestamps) >= self.requests_per_minute:
            retry_after = int(self.window_seconds - (now - timestamps[0]))
            return True, max(1, retry_after)

        self.history[key].append(now)
        return False, 0


# Pre-configured rate limiters for LLM and upload routes
llm_rate_limiter = InMemoryRateLimiter(requests_per_minute=10, window_seconds=60)
upload_rate_limiter = InMemoryRateLimiter(requests_per_minute=5, window_seconds=60)


async def check_rate_limit(request: Request, user_id: str = None, limiter: InMemoryRateLimiter = llm_rate_limiter):
    identifier = user_id or (request.client.host if request.client else "anonymous")
    key = f"{request.url.path}:{identifier}"

    is_limited, retry_after = limiter.is_rate_limited(key)
    if is_limited:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded for {request.url.path}. Please wait {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )
