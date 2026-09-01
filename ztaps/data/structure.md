# Data Directory

## Files
- `catalog.json`: Synthetic product catalog (standard, high-value, poisoned items).
- `policy.json`: Business policy rules (MAX_TRANSACTION_LIMIT, ALLOWED_CATEGORIES).
- `ztaps.db`: SQLite database for idempotency cache and transaction audit log (created at runtime).