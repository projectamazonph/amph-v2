# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-07-17 - Dual-Layer Rate Limiting for Signup and Signin Server Actions
**Vulnerability:** The signup and signin Server Actions used only target-based (email) rate limiting. This left the application vulnerable to distributed credential stuffing attacks, where attackers query different target accounts from a single client IP (or a small set of IPs) without hitting target-based lockout thresholds.
**Learning:** Target-only rate limiting can be bypassed by distributing requests across a wide variety of target keys (e.g., trying a common password against many different usernames/emails).
**Prevention:** Always combine target-based rate limiting with client IP-based rate limiting (dual-layer rate limiting) using the `x-forwarded-for` and `x-real-ip` headers on sensitive authentication actions, allowing graceful degradation if headers are not present.
