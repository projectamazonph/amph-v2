# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-08-12 - Account Lockout Denial of Service via Target-Based Rate Limiting
**Vulnerability:** In rate-limiting security models, applying rate limits solely based on a target-based identifier (such as email) allows a malicious actor to flood sensitive authentication endpoints (like sign-in or sign-up) with requests. This consumes the rate-limiting quota for target users, locking out legitimate users from accessing their accounts.
**Learning:** Standard single rate-limiting keys based on sensitive target details are vulnerable to target lockout DoS.
**Prevention:** Always implement asynchronous dual rate-limiting (`rateLimitDual`) combining client IP checks (first) and target-based checks (second) to prevent IP-blocked actors from polluting target-based buckets.
