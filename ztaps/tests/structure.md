# Tests Directory

## Files
- `__init__.py`: Package initialization.
- `conftest.py`: Pytest fixtures (test client, mock Razorpay, sample payloads).
- `test_validation.py`: Unit tests for deterministic validation engine (limits, price divergence, injection).
- `test_webhook.py`: Integration tests for webhook HMAC verification and idempotency.
- `test_razorpay.py`: Tests for Razorpay client wrapper (orders, payment links).