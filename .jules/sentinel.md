# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-07-31 - Dual Target/IP Rate Limiting for Authentication Server Actions
**Vulnerability:** The application originally rate-limited login and registration server actions purely by email. An attacker performing a distributed credential stuffing or dictionary attack targeting many distinct email addresses could bypass single-email rate limits, or spoof/rotate email addresses to spam the endpoint and abuse backend/database resources.
**Learning:** Purely target-based rate limits (like email) do not prevent distributed brute-force or dictionary attacks across multiple targets. Rate limits should utilize dual indicators (combining both target-based keys like lowercase emails and IP-based keys using headers like X-Forwarded-For or X-Real-IP) to defend in depth against multi-target attacks from single IP addresses.
**Prevention:** Implement a dual-rate limiter that checks target identifiers first, then extracts client IP addresses securely (parsing the first entry of the X-Forwarded-For header or falling back to X-Real-IP), and rate-limits the IP address independently.
