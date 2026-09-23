# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-08-06 - Test Pollution from Persistent In-Memory Rate Limit Buckets
**Vulnerability:** When introducing asynchronous dual rate-limiting (`rateLimitDual`) to critical Server Actions, in-memory sliding-window buckets persisted across test executions. This caused sequential unit tests using identical email/identifier payloads to exceed rate limits and fail unexpectedly.
**Learning:** In Next.js Server Actions, in-memory rate limiters maintain static module-scope state. In a testing suite, successive actions on the same entity or test user will inadvertently trigger rate limit blocks.
**Prevention:** Always export a state reset helper (e.g., `resetRateLimits()`) to clear rate-limiting maps in `beforeEach` hooks, ensuring complete isolation between test runs and preventing test pollution.
