import time
from typing import Any, Dict, Optional, Tuple

class SimpleCache:
    def __init__(self, ttl_seconds: int = 300):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self.ttl = ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            value, timestamp = self._cache[key]
            if time.time() - timestamp < self.ttl:
                return value
            else:
                del self._cache[key]
        return None

    def set(self, key: str, value: Any):
        self._cache[key] = (value, time.time())

    def clear(self):
        self._cache.clear()

# Global cache instance
stats_cache = SimpleCache(ttl_seconds=600)  # 10 minutes cache for stats
projects_cache = SimpleCache(ttl_seconds=300) # 5 minutes for project lists
