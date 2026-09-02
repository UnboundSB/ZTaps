from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field
from pydantic import BaseModel
from datetime import datetime
import json
from sqlalchemy import Column, String
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.types import JSON

class Policy(SQLModel, table=True):
    """Dynamic policy engine table per agent."""
    id: Optional[int] = Field(default=None, primary_key=True)
    agent_id: str = Field(index=True, unique=True)
    max_spend: int
    allowed_categories: str # JSON list of objects: [{"name": "hardware", "min": 0, "max": 200000}]

class PurchaseIntent(BaseModel):
    agent_id: str
    item_id: str
    quantity: int = Field(default=1, gt=0)
    item_category: str
    amount: int = Field(gt=0)
    justification: str

class SentinelResponse(BaseModel):
    status: str
    transaction_id: Optional[str] = None
    reason: str

class Transaction(SQLModel, table=True):
    """Database model for telemetry logs."""
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: str = Field(index=True)
    item_id: str = Field(index=True)
    requested_amount: int
    action: str = Field(index=True)  # APPROVED_ORDER, REJECTED, ESCALATED_PAYMENT_LINK
    flags: str  # JSON list of flags
    order_id: Optional[str] = None
    link_id: Optional[str] = None


class CatalogItemModel(SQLModel, table=True):
    """Database model for the catalog."""
    __tablename__ = "catalog_item"
    item_id: str = Field(primary_key=True)
    name: str
    description: str
    price: int  # in paise
    currency: str = Field(default="INR")
    category: str
    stock: int = Field(default=0)
    metadata_json: str = Field(default="{}")


class PolicyConfigModel(SQLModel, table=True):
    """Database model for the singleton policy config."""
    __tablename__ = "policy_config"
    id: int = Field(default=1, primary_key=True) # Singleton
    max_transaction_limit: int = Field(default=50000)
    allowed_categories: str = Field(default='["electronics", "books", "clothing"]')
    max_quantity_per_order: int = Field(default=10)
    price_tolerance_percent: float = Field(default=0.0)
    require_human_approval_above: int = Field(default=25000)
    blocked_keywords: str = Field(default='[]')
    semantic_anomaly_threshold: float = Field(default=0.7)
    lower_limit: int = Field(default=0)
    upper_limit: int = Field(default=100000000)

class WebhookEvent(SQLModel, table=True):
    """Tracks processed webhooks for idempotency."""
    __tablename__ = "webhook_event"
    event_id: str = Field(primary_key=True)
    processed_at: datetime = Field(default_factory=datetime.utcnow)
