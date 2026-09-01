# App Package

## Files
- `__init__.py`: Package initialization.

## Subdirectories
- `/api/`: HTTP layer - routes, request/response handling.
- `/core/`: Configuration, settings, and application constants.
- `/models/`: Database models (SQLAlchemy/SQLModel) for persistence.
- `/schemas/`: Pydantic v2 schemas for request/response validation and serialization.
- `/services/`: Business logic - validation engine, Razorpay integration, idempotency.
- `/utils/`: Shared utilities (logging, helpers, security functions).