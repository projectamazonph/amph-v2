# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-07-17 - Dual Rate-Limiting Ordering Prevents Account Lockout DoS
**Vulnerability:** Legacy rate-limiting checked only target-based identifiers (e.g. email) on authentication routes. This allowed attackers to perform distributed credential stuffing attacks by varying target emails. Furthermore, checking target buckets first meant malicious IP-blocked actors could still spam and fill target-based buckets, locking out or blocking legitimate users.
**Learning:** Target-only rate-limiting leaves endpoints exposed to distributed attacks. When adding IP-based rate-limiting alongside target-based rate-limiting, the client IP check must be executed and enforced *before* the target-based check.
**Prevention:** Implement `rateLimitDual` which performs the IP bucket verification first. If the client IP is blocked, return immediately without recording a hit in the target-based bucket, ensuring legitimate users' targets are not polluted or blocked by malicious IPs.
