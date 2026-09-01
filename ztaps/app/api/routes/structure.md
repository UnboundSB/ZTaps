# API Routes

## Files
- `__init__.py`: Router aggregation and prefix registration.
- `intercept.py`: POST /intercept endpoint for MCP tool call interception and validation.
- `webhook.py`: POST /webhook/razorpay endpoint for async payment updates with HMAC verification.
- `health.py`: GET /health and GET /ready endpoints for liveness/readiness probes.