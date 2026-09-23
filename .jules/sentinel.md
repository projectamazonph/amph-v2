# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-08-12 - Account Lockout Denial of Service (DoS) Vulnerability on Authentication Routes
**Vulnerability:** The application originally had single-key rate limiting based solely on target emails, making it susceptible to brute-force attacks from distributed IPs or brute-force targeting multiple accounts, or an attacker flooding a target key's bucket and locking out a legitimate user (Account Lockout DoS).
**Learning:** Rate-limiting authentication server actions only on target-based fields (such as email) allows a single malicious IP to consume/exhaust a legitimate user's rate-limiting bucket. Conversely, rate-limiting only on IP can be bypassed by distributed brute force.
**Prevention:** Always implement a dual rate-limiting mechanism (`rateLimitDual`) checking both client IP and target identifiers. Ensure that client IP checks are performed first to prevent malicious actors from polluting target-based rate-limiting buckets and causing a DoS for legitimate accounts.
