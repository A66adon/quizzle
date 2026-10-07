package org.dev.quizzle.security;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public final class AuthRateLimiter {
	private static final int CAPACITY = 10000;
	private static final long WINDOW_MS = 15 * 60 * 1000L;
	private final Map<String, Bucket> buckets = new LinkedHashMap<>();
	public synchronized boolean allow(String action, String ip, String email) {
		long now = System.currentTimeMillis();
		buckets.entrySet().removeIf(entry -> now - entry.getValue().start >= WINDOW_MS);
		String normalized=org.dev.quizzle.account.AccountStore.normalizeEmail(email);
		boolean ipAllowed=take(action + ":ip:" + ip, 60, now);
		return ipAllowed & (normalized.isEmpty() || take(action + ":email:" + org.dev.quizzle.account.AccountTokens.digest(normalized), 10, now));
	}
	private boolean take(String key, int limit, long now) {
		Bucket bucket = buckets.get(key);
		if (bucket == null) {
			// Fail closed at capacity; attacker-controlled keys never evict existing restrictions.
			if (buckets.size() >= CAPACITY) return false;
			bucket = new Bucket(now);
			buckets.put(key, bucket);
		}
		return ++bucket.count <= limit;
	}
	int size() { return buckets.size(); }
	private static final class Bucket {
		final long start;
		int count;
		Bucket(long start) { this.start = start; }
	}
}
