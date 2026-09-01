# Database Models

## Files
- `__init__.py`: Package initialization.
- `idempotency.py`: SQLModel table for storing processed webhook event IDs (x-razorpay-event-id).
- `transaction.py`: SQLModel table for transaction audit log (state, amounts, flags, timestamps).