# Business Logic Services

## Files
- `__init__.py`: Package initialization.
- `validation.py`: Deterministic Validation Engine - structural, business rules, semantic anomaly detection.
- `razorpay_client.py`: Razorpay SDK wrapper for Orders, Payment Links, and webhook signature verification.
- `idempotency.py`: SQLite-based idempotency cache for webhook event deduplication.
- `catalog.py`: Catalog and policy data loaders (catalog.json, policy.json).

## Subdirectories
- `/llm_judge/`: Lightweight semantic anomaly detection (regex patterns, optional local model).