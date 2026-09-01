"""
Idempotency model for webhook deduplication.

Stores processed Razorpay event IDs to ensure exactly-once processing
of webhook events. Uses SQLite for local persistence.
"""
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class IdempotencyKey(SQLModel, table=True):
    """
    Idempotency key storage for webhook event deduplication.

    Each Razorpay webhook includes an `x-razorpay-event-id` header.
    We store this to prevent duplicate processing of the same event.
    """
    __tablename__ = "idempotency_keys"  # type: ignore[assignment]

    event_id: str = Field(primary_key=True, description="Razorpay event ID (x-razorpay-event-id)")
    event_type: str = Field(description="Type of Razorpay event (e.g., payment.captured)")
    processed_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when event was processed")
    payload_hash: str = Field(description="SHA256 hash of the webhook payload for integrity")
    response_status: int = Field(description="HTTP response status returned to Razorpay")


class IdempotencyKeyCreate(SQLModel):
    """Schema for creating a new idempotency key record."""
    event_id: str
    event_type: str
    payload_hash: str
    response_status: int