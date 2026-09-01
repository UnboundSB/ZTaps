"""
Application-wide constants.

Centralized constants for error codes, event types, policy keys,
and other fixed values used across the application.
"""
from enum import Enum


class ErrorCode(str, Enum):
    """Standardized error codes for API responses."""
    VALIDATION_FAILED = "VALIDATION_FAILED"
    UNAUTHORIZED_PARAMETER = "UNAUTHORIZED_PARAMETER"
    AMOUNT_EXCEEDS_LIMIT = "AMOUNT_EXCEEDS_LIMIT"
    PRICE_DIVERGENCE = "PRICE_DIVERGENCE"
    PROMPT_INJECTION_DETECTED = "PROMPT_INJECTION_DETECTED"
    CATEGORY_NOT_ALLOWED = "CATEGORY_NOT_ALLOWED"
    QUANTITY_EXCEEDED = "QUANTITY_EXCEEDED"
    ITEM_NOT_FOUND = "ITEM_NOT_FOUND"
    WEBHOOK_SIGNATURE_INVALID = "WEBHOOK_SIGNATURE_INVALID"
    WEBHOOK_DUPLICATE_EVENT = "WEBHOOK_DUPLICATE_EVENT"
    RAZORPAY_API_ERROR = "RAZORPAY_API_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class RazorpayEventType(str, Enum):
    """Razorpay webhook event types we handle."""
    ORDER_CREATED = "order.created"
    ORDER_PAID = "order.paid"
    PAYMENT_CAPTURED = "payment.captured"
    PAYMENT_FAILED = "payment.failed"
    PAYMENT_LINK_CREATED = "payment_link.created"
    PAYMENT_LINK_PAID = "payment_link.paid"
    REFUND_CREATED = "refund.created"
    REFUND_PROCESSED = "refund.processed"


class TransactionState(str, Enum):
    """Internal transaction states."""
    INITIATED = "INITIATED"
    VALIDATED = "VALIDATED"
    FLAGGED = "FLAGGED"
    ORDER_CREATED = "ORDER_CREATED"
    PAYMENT_LINK_CREATED = "PAYMENT_LINK_CREATED"
    PAYMENT_CAPTURED = "PAYMENT_CAPTURED"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    REFUNDED = "REFUNDED"


class ActionType(str, Enum):
    """Action taken after validation."""
    APPROVED_ORDER = "APPROVED_ORDER"
    ESCALATED_PAYMENT_LINK = "ESCALATED_PAYMENT_LINK"
    REJECTED = "REJECTED"


class ValidationFlag(str, Enum):
    """Validation flags for suspicious activity."""
    HIGH_VALUE = "HIGH_VALUE"
    PRICE_MISMATCH = "PRICE_MISMATCH"
    PROMPT_INJECTION = "PROMPT_INJECTION"
    UNAUTHORIZED_PARAMS = "UNAUTHORIZED_PARAMS"
    CATEGORY_VIOLATION = "CATEGORY_VIOLATION"
    QUANTITY_VIOLATION = "QUANTITY_VIOLATION"


# MCP Tool Definitions
MCP_TOOL_CREATE_CHECKOUT_ORDER = "create_checkout_order"

# Required parameters for create_checkout_order
REQUIRED_MCP_PARAMS = {"item_id", "quantity", "amount"}

# Allowed parameters (strict allowlist)
ALLOWED_MCP_PARAMS = {"item_id", "quantity", "amount", "currency", "customer_id"}

# HTTP Headers
RAZORPAY_SIGNATURE_HEADER = "X-Razorpay-Signature"
RAZORPAY_EVENT_ID_HEADER = "X-Razorpay-Event-Id"

# Currency
DEFAULT_CURRENCY = "INR"
PAISE_MULTIPLIER = 100  # 1 INR = 100 paise