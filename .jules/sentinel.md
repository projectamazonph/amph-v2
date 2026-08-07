# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-07-16 - Rate-Limit Bypass and Account Lockout via Target Key Pollution
**Vulnerability:** Sensitive authentication endpoints used standard, single-key rate-limiting bound only to user emails. A malicious actor could block legitimate users from signing in or signing up by flooding the rate limiter with target emails from a single IP, causing a widespread Account Lockout Denial of Service (DoS).
**Learning:** Checking or incrementing target-based rate limits before checking client IP rate limits allows IP-blocked attackers to pollute target-based rate limiting buckets and lockout innocent users.
**Prevention:** Always use a dual rate-limiting approach that checks and blocks malicious client IPs first before incrementing or checking target-based keys (such as email). Ensure the IP extraction safely fallback and handle array indexes, and that all calling utilities are asynchronous to support Next.js 15 async headers.
