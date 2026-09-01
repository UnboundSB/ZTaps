"""
Razorpay API Request/Response Schemas.

Typed schemas for Razorpay Orders, Payment Links, and Webhook payloads.
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime


# ==========================================
# Order Schemas
# ==========================================
class RazorpayOrderRequest(BaseModel):
    """Request payload for creating a Razorpay Order."""
    amount: int = Field(..., ge=1, description="Amount in paise")
    currency: str = Field(default="INR", pattern="^[A-Z]{3}$")
    receipt: Optional[str] = Field(default=None, max_length=40, description="Receipt ID for your reference")
    partial_payment: bool = Field(default=False, description="Allow partial payments")
    notes: Optional[Dict[str, str]] = Field(default=None, description="Key-value notes")


class RazorpayOrderResponse(BaseModel):
    """Response from Razorpay Order creation."""
    id: str = Field(description="Razorpay Order ID (e.g., order_ABC123)")
    entity: str = Field(default="order")
    amount: int
    amount_paid: int
    amount_due: int
    currency: str
    receipt: Optional[str] = None
    offer_id: Optional[str] = None
    status: str = Field(description="Order status: created, attempted, paid")
    attempts: int = 0
    notes: List[Dict[str, str]] = []
    created_at: int = Field(description="Unix timestamp")


# ==========================================
# Payment Link Schemas
# ==========================================
class PaymentLinkCustomer(BaseModel):
    """Customer details for payment link."""
    name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None, pattern=r"^[^@]+@[^@]+\.[^@]+$")
    contact: Optional[str] = Field(default=None, pattern=r"^\+?[1-9]\d{1,14}$")


class PaymentLinkNotify(BaseModel):
    """Notification settings for payment link."""
    sms: bool = True
    email: bool = True


class PaymentLinkReminder(BaseModel):
    """Reminder settings for payment link."""
    enable: bool = True
    interval: int = Field(default=1, ge=1, le=7, description="Reminder interval in days")


class RazorpayPaymentLinkRequest(BaseModel):
    """Request payload for creating a Razorpay Payment Link."""
    amount: int = Field(..., ge=1, description="Amount in paise")
    currency: str = Field(default="INR", pattern="^[A-Z]{3}$")
    description: str = Field(..., max_length=255, description="Description shown to customer")
    customer: Optional[PaymentLinkCustomer] = None
    notify: Optional[PaymentLinkNotify] = None
    reminder_enable: bool = True
    notes: Optional[Dict[str, str]] = Field(default=None, description="Key-value notes")
    callback_url: Optional[str] = Field(default=None, description="URL to redirect after payment")
    callback_method: str = Field(default="get", pattern="^(get|post)$")


class RazorpayPaymentLinkResponse(BaseModel):
    """Response from Razorpay Payment Link creation."""
    id: str = Field(description="Payment Link ID (e.g., plink_ABC123)")
    entity: str = Field(default="payment_link")
    amount: int
    amount_paid: int
    currency: str
    description: str
    reference_id: Optional[str] = None
    status: str = Field(description="Status: created, paid, expired, cancelled")
    short_url: str = Field(description="Short URL for customer to pay")
    customer: Optional[PaymentLinkCustomer] = None
    created_at: int
    expire_by: Optional[int] = None
    notes: List[Dict[str, str]] = []


# ==========================================
# Webhook Schemas
# ==========================================
class WebhookPaymentEntity(BaseModel):
    """Payment entity within webhook payload."""
    id: str
    entity: str
    amount: int
    currency: str
    status: str
    order_id: Optional[str] = None
    method: Optional[str] = None
    captured: bool = False
    description: Optional[str] = None
    created_at: int


class WebhookOrderEntity(BaseModel):
    """Order entity within webhook payload."""
    id: str
    entity: str
    amount: int
    currency: str
    status: str
    attempts: int
    created_at: int


class RazorpayWebhookPayload(BaseModel):
    """
    Generic Razorpay webhook payload.

    The actual structure varies by event type. We use a flexible model
    and validate specific fields per event type in the handler.
    """
    event: str = Field(description="Event type (e.g., payment.captured)")
    account_id: str
    payload: Dict[str, Any] = Field(description="Event-specific payload")
    created_at: int


# ==========================================
# Unified Response for Agent
# ==========================================
class AgentCheckoutResponse(BaseModel):
    """
    Response returned to the AI Agent after interception and validation.

    Contains either an order_id (approved) or short_url (escalated).
    """
    success: bool
    action: str = Field(description="APPROVED_ORDER or ESCALATED_PAYMENT_LINK")
    order_id: Optional[str] = Field(default=None, description="Razorpay Order ID if approved")
    payment_link_id: Optional[str] = Field(default=None, description="Payment Link ID if escalated")
    short_url: Optional[str] = Field(default=None, description="Payment link URL for human approval")
    message: str = Field(description="Human-readable message for the agent")
    validation_flags: List[str] = Field(default_factory=list, description="Flags raised during validation")