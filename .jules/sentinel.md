# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-07-17 - Account Lockout Denial of Service via Target-only Rate Limiting
**Vulnerability:** Critical authentication actions (sign-in and sign-up) relied exclusively on target-based (email) rate-limiting buckets. This design allowed malicious actors to lock out legitimate users from their accounts by repeatedly submitting failed authentication requests under the target's email address, causing an Account Lockout Denial of Service (DoS). It also failed to protect against distributed brute-force attacks across many accounts from a single IP.
**Learning:** Rate-limiting designs must account for both IP-based and target-based threats. Additionally, evaluating target-based buckets before IP-based buckets allows blocked IP actors to still pollute and exceed the target's rate-limiting budget.
**Prevention:** Implement dual rate-limiting combining client IP (checked first) and target identifiers. Always block based on the IP rate limit first, bailing out early to prevent malicious, blocked actors from contaminating the target-based rate limits of legitimate users.
