# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-07-26 - Single-Factor Target Rate Limiting and Distributed Credential Stuffing
**Vulnerability:** The application originally applied rate-limiting solely using lowercase target emails as keys. This allowed an attacker to perform a high-velocity brute-force or credential-stuffing attack by trying thousands of different emails from a single IP address without triggering any lockouts, putting user accounts and server resources at risk.
**Learning:** Target-only rate limits do not restrict requests from an abusive origin/client targeting diverse resources. To fully secure sensitive operations, dual-factor rate limiting is required.
**Prevention:** Implement dual rate-limiting on authentication actions: one layer keyed on the client's IP address (derived from `x-forwarded-for` / `x-real-ip`) to block high-volume scanning/stuffing from a single origin, and a second layer keyed on target credentials to secure specific accounts against targeted brute forcing.
