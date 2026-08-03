# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-07-16 - Target Lockout DoS via Improper Dual Rate-Limiting Order
**Vulnerability:** When implementing dual rate-limiting (checking both target-based keys like emails, and client IP), validating/incrementing the target-based bucket before the IP-based bucket allowed IP-blocked attackers to programmatically lock out arbitrary legitimate users from authentication endpoints (Account Lockout DoS) since target hits were still being registered before the IP restriction failed the request.
**Learning:** Checking and mutating target limits prior to enforcing IP limits leaks rate-limit state increments to blocked IP addresses.
**Prevention:** Always evaluate and enforce the IP-based rate limit first. Doing so blocks malicious IP addresses at the perimeter and prevents them from registering hits in or polluting any target-based buckets.
