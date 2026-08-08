# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-07-19 - Account Lockout Denial of Service via Target-Based Bucket Pollution
**Vulnerability:** Standard rate limiting on sensitive endpoints (like sign-in or sign-up) using only target-based identifiers (such as email) allows a malicious actor to continuously hit the rate limiter with a legitimate user's email, locking that user out of their own account (Account Lockout Denial of Service).
**Learning:** Single-key or incorrect-order multi-key rate-limiting can easily be weaponized to lock out legitimate users. If the target-based check is evaluated first or if there's no IP check, an attacker can pollute the target bucket.
**Prevention:** Always implement dual rate-limiting that combines client IP-based keys (safely extracted from headers like `x-forwarded-for` and `x-real-ip` using TS-safe array access fallbacks) and target-based keys (lowercase emails). Crucially, always execute the client IP rate-limiting check before checking or incrementing target-based buckets, ensuring blocked attackers cannot lock out legitimate users.
