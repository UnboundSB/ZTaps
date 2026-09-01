"""
Transaction audit log model.

Records every transaction attempt, validation result, and Razorpay action
for audit trail and dashboard visualization.
"""
from datetime import datetime
from typing import Optional
from enum import Enum

from sqlmodel import Field, SQLModel
from app.core.constants import TransactionState, ActionType, ValidationFlag


class TransactionLog(SQLModel, table=True):
    """
    Audit log for all payment transactions processed through Z-TAPS.

    Captures the full lifecycle: interception -> validation -> Razorpay action -> webhook resolution.
    """
    __tablename__ = "transaction_logs"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)

    # Request identification
    request_id: str = Field(index=True, description="Unique request identifier")
    mcp_tool_name: str = Field(description="MCP tool invoked (e.g., create_checkout_order)")

    # Agent payload
    raw_prompt: Optional[str] = Field(default=None, description="Raw AI agent prompt (if available)")
    intercepted_payload: str = Field(description="JSON-RPC payload intercepted from agent")

    # Item details
    item_id: str = Field(index=True, description="Item identifier from catalog")
    item_name: str = Field(description="Item name at time of request")
    requested_price: int = Field(description="Price requested by agent (in paise)")
    catalog_price: int = Field(description="Actual price from catalog (in paise)")
    quantity: int = Field(default=1, description="Quantity requested")
    total_value: int = Field(description="Calculated total value (price * quantity)")

    # Validation results
    state: TransactionState = Field(default=TransactionState.INITIATED, index=True)
    action_taken: Optional[ActionType] = Field(default=None, description="Action taken after validation")
    flags: str = Field(default="", description="Comma-separated validation flags")
    risk_score: float = Field(default=0.0, description="Calculated risk score (0.0 - 1.0)")
    rejection_reason: Optional[str] = Field(default=None, description="Human-readable rejection reason")

    # Razorpay response
    razorpay_order_id: Optional[str] = Field(default=None, description="Razorpay Order ID (if created)")
    razorpay_payment_link_id: Optional[str] = Field(default=None, description="Razorpay Payment Link ID (if created)")
    razorpay_payment_link_url: Optional[str] = Field(default=None, description="Short URL for payment link")
    razorpay_payment_id: Optional[str] = Field(default=None, description="Razorpay Payment ID (from webhook)")

    # Webhook tracking
    webhook_event_id: Optional[str] = Field(default=None, description="Razorpay webhook event ID")
    webhook_processed_at: Optional[datetime] = Field(default=None, description="When webhook was processed")

    # Latency metrics (milliseconds)
    validation_latency_ms: int = Field(default=0, description="Time spent in validation engine")
    razorpay_latency_ms: int = Field(default=0, description="Time spent calling Razorpay API")
    total_latency_ms: int = Field(default=0, description="Total end-to-end latency")


class TransactionLogCreate(SQLModel):
    """Schema for creating a new transaction log entry."""
    request_id: str
    mcp_tool_name: str
    raw_prompt: Optional[str] = None
    intercepted_payload: str
    item_id: str
    item_name: str
    requested_price: int
    catalog_price: int
    quantity: int
    total_value: int