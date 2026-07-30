# Sentinel Journal — Critical Security Learnings

## 2026-07-20 - Dual Rate-Limiting Authentication Server Actions
**Vulnerability:** The application only rate-limited `signInAction` and `signUpAction` based on lowercase email keys. This allowed single-IP credential stuffing attacks targeting many different emails concurrently, bypassing email-specific rate limits and risking database/event-loop resource starvation.
**Learning:** Target-only rate-limiting leaves systems open to distributed credential stuffing and IP-wide brute-forcing. Dual rate-limiting (IP-based + target-based email keys) is essential to block high-frequency attacks from single IPs regardless of target email diversity.
**Prevention:** Always implement dual rate-limiting in sensitive user-facing entry points like login or register, utilizing `headers()` from `next/headers` to isolate requests by IP alongside target identifier keys.

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.
