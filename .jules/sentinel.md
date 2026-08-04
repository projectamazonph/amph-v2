# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-07-16 - Account Lockout Denial of Service (DoS) via Single Target Rate Limiting
**Vulnerability:** Relying solely on target-based identifiers (such as the target email) for rate limiting sensitive endpoints allowed a malicious actor to systematically lock out legitimate users by flooding attempts on their emails (Account Lockout DoS), and allowed distributed brute-force attacks by bypassing target-based limitations using various IPs.
**Learning:** Single target-based rate limiting is vulnerable to malicious target bucket pollution. Enforcing client IP checks alongside target checks prevents lockout of legitimate users.
**Prevention:** Implement and enforce asynchronous dual rate-limiting (`rateLimitDual`) where client IP limits are checked and recorded first before checking target-based buckets. Always safely parse headers like `x-forwarded-for` and `x-real-ip` to fetch client IPs.
