"""
Dashboard and CLI Visualization Schemas.

Structured output for the dashboard to display interception logs,
validation results, and Razorpay actions.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from app.core.constants import TransactionState, ActionType, ValidationFlag


class DashboardTransactionItem(BaseModel):
    """Single transaction entry for dashboard display."""
    request_id: str
    timestamp: datetime
    item_name: str
    requested_amount: int  # in paise
    catalog_amount: int
    quantity: int
    total_value: int
    state: TransactionState
    action: Optional[ActionType]
    flags: List[ValidationFlag]
    risk_score: float
    razorpay_order_id: Optional[str]
    razorpay_payment_link_id: Optional[str]
    razorpay_short_url: Optional[str]
    validation_latency_ms: int
    razorpay_latency_ms: int
    total_latency_ms: int


class DashboardMetrics(BaseModel):
    """Aggregated metrics for dashboard."""
    total_requests: int = 0
    approved_orders: int = 0
    escalated_payment_links: int = 0
    rejected_transactions: int = 0
    prompt_injections_blocked: int = 0
    price_hallucinations_blocked: int = 0
    high_value_escalations: int = 0
    avg_validation_latency_ms: float = 0.0
    avg_razorpay_latency_ms: float = 0.0
    avg_total_latency_ms: float = 0.0
    webhook_events_processed: int = 0
    duplicate_webhooks_blocked: int = 0


class DashboardSnapshot(BaseModel):
    """Complete dashboard state snapshot."""
    metrics: DashboardMetrics
    recent_transactions: List[DashboardTransactionItem]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    def to_cli_table_rows(self) -> List[Dict[str, Any]]:
        """Convert transactions to CLI table rows."""
        rows = []
        for txn in self.recent_transactions:
            rows.append({
                "Time": txn.timestamp.strftime("%H:%M:%S"),
                "Request ID": txn.request_id[:12] + "...",
                "Item": txn.item_name[:25],
                "Amount": f"₹{txn.total_value / 100:,.0f}",
                "State": txn.state.value,
                "Action": txn.action.value if txn.action else "N/A",
                "Flags": ", ".join([f.value for f in txn.flags]) if txn.flags else "None",
                "Risk": f"{txn.risk_score:.2f}",
                "Latency": f"{txn.total_latency_ms}ms",
            })
        return rows