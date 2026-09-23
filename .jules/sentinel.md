# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-07-19 - Single-Key Identifier Rate Limiting Enables Account Lockout DoS
**Vulnerability:** Authentication server actions (`signUpAction`, `signInAction`) previously rate-limited requests solely by target email (`signup:email` or `signin:email`). An attacker could trigger lockout for target emails without affecting their own capacity, or launch distributed credential stuffing from a single IP address across many accounts.
**Learning:** Single-key rate limiting indexed by target identifier creates an asymmetric attack vector where attackers cause Denial of Service against victim accounts (Account Lockout DoS).
**Prevention:** Use dual rate limiting (`rateLimitDual`) on sensitive authentication actions: evaluate client IP rate limits first before checking target identifier limits. Checking IP limits first prevents blocked attacker IPs from consuming or polluting target-based rate limit buckets.
