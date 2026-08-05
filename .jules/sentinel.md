# Sentinel Journal — Critical Security Learnings

## 2026-07-16 - Synchronous Password Hashing Blocks Next.js Event Loop (DoS Risk)
**Vulnerability:** The application used `scryptSync` (synchronous CPU-intensive password hashing) inside Next.js server action handlers for registration and login. Because Node.js runs on a single main event loop, a small number of concurrent authentication requests (or a distributed credential stuffing attack) completely blocks the event loop, starving all other concurrent requests and causing a full Denial of Service (DoS).
**Learning:** Next.js Server Actions and Route Handlers run on Node's main thread by default. Using synchronous cryptography operations (such as `scryptSync` or `pbkdf2Sync`) prevents the server from processing other concurrent connections.
**Prevention:** Always use asynchronous password-hashing implementations (such as async `scrypt` wrapped in a Promise or bcrypt/argon2 async variants) inside Next.js/Node.js web entry points to delegate heavy hashing computations to the Node.js libuv thread pool, keeping the main event loop responsive.

## 2026-08-05 - Missing Client IP-Based Rate Limiting on Authentication Server Actions
**Vulnerability:** The application rate-limited the `signUpAction` and `signInAction` endpoints solely on the target identifier (lowercase email address). An attacker initiating a credential stuffing or password-guessing attack with varied emails from a single IP could bypass the rate limiter completely, leading to account enumeration or large-scale brute-forcing without detection or prevention.
**Learning:** Target-based rate limiting alone is vulnerable to credential stuffing attacks with multiple identities. However, blindly implementing target-based limits alongside IP checks can let blocked attackers pollute the target bucket, causing an Account Lockout Denial of Service (DoS) for legitimate users.
**Prevention:** Use an asynchronous dual rate-limiter (`rateLimitDual`) checking client IP-based limits first before checking target-based limits (e.g., lowercase email). Always perform the client IP check first to prevent blocked actors from locking out legitimate user accounts.
