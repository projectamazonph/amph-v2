# Sentinel Journal — Critical Security Learnings

## 2026-07-17 - Dual Rate Limiting Prevents Account Lockout DoS
**Vulnerability:** Simple rate limiting on sensitive authentication actions (sign-in/sign-up) based purely on target-specific identifiers (e.g., username/email) enables malicious actors to trigger rate limits for legitimate users. An attacker could flood authentication requests for a specific user email, resulting in an Account Lockout Denial of Service (DoS) for the victim.
**Learning:** Rate limiting must protect both system resources and user experience. Enforcing target-based rate limits before client IP rate limits allows malicious IPs to pollute and exhaust the target's limit bucket.
**Prevention:** Implement a dual rate-limiting utility where client IP-based limits are verified and recorded *before* target-based limits. This ensures that malicious IP addresses are blocked first, preventing them from exhausting the target's quota and preserving account availability for the legitimate owner.

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.
