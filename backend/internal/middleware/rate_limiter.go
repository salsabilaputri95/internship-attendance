package middleware

import (
	"net/http"
	"sync"
	"time"
)

// RateLimiter is a simple in-memory token bucket per IP rate limiter.
type RateLimiter struct {
	mu       sync.Mutex
	counters map[string]*rateBucket
	limit    int           // max requests
	window   time.Duration // per window duration
}

type rateBucket struct {
	count     int
	resetAt   time.Time
}

// NewRateLimiter creates a rate limiter with a max request count per time window.
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		counters: make(map[string]*rateBucket),
		limit:    limit,
		window:   window,
	}
	// Background cleanup goroutine to avoid unbounded memory growth
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			rl.mu.Lock()
			now := time.Now()
			for ip, bucket := range rl.counters {
				if now.After(bucket.resetAt) {
					delete(rl.counters, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()
	return rl
}

// Limit returns an HTTP middleware that enforces the rate limit per remote IP.
func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := realIP(r)

		rl.mu.Lock()
		bucket, exists := rl.counters[ip]
		now := time.Now()
		if !exists || now.After(bucket.resetAt) {
			bucket = &rateBucket{
				count:   0,
				resetAt: now.Add(rl.window),
			}
			rl.counters[ip] = bucket
		}
		bucket.count++
		count := bucket.count
		rl.mu.Unlock()

		if count > rl.limit {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"success":false,"message":"Terlalu banyak permintaan. Coba lagi dalam beberapa saat (Rate limit exceeded)."}`))
			return
		}

		next.ServeHTTP(w, r)
	})
}

// realIP extracts the real client IP from common proxy headers, falling back to RemoteAddr.
func realIP(r *http.Request) string {
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		return ip
	}
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	return r.RemoteAddr
}
