# Security Policy

## Privacy Design

Thunai handles data from vulnerable rural citizens. We take this seriously:

- **Phone numbers** are hashed (SHA-256, truncated to 32 chars) before any storage. Raw numbers are never persisted.
- **Consent prompt** is played at the start of every IVR call. Users must press 1 to continue.
- **No LLM** in the data path — no user data is sent to any external AI service.
- **In-memory fallback** ensures no MongoDB means no persistent storage at all.

## Reporting Vulnerabilities

If you discover a security issue, **do not** open a public GitHub issue.

Email: murali18a@sona.edu.in

We will respond within 48 hours and work with you on a fix before public disclosure.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | ✅        |
| 1.x     | ❌        |

## Dependencies

We use `npm audit` in CI. The known `scmp` deprecation warning is tracked — it's a transitive dependency from Twilio and does not affect security.
