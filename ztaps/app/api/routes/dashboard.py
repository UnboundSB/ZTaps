from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List, Dict
from app.core.db import get_session
from app.core.security import verify_api_key
from app.models.domain import Transaction
import json

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])

@router.get("/data", dependencies=[Depends(verify_api_key)])
def get_dashboard_data(session: Session = Depends(get_session)):
    """Returns the transaction logs for the dashboard visualization."""
    # Fetch all transactions ordered by timestamp descending (newest first)
    db_transactions = session.exec(select(Transaction).order_by(Transaction.timestamp.desc()).limit(100)).all()
    
    transactions = []
    for t in db_transactions:
        # Convert to dictionary matching previous JSON structure
        transactions.append({
            "timestamp": t.timestamp.isoformat(),
            "request_id": t.request_id,
            "item_id": t.item_id,
            "requested_amount": t.requested_amount,
            "action": t.action,
            "flags": json.loads(t.flags),
            "order_id": t.order_id,
            "link_id": t.link_id
        })
    
    # Calculate some basic metrics
    total_requests = len(transactions)
    approved = sum(1 for t in transactions if t.get("action") == "APPROVED_ORDER")
    escalated = sum(1 for t in transactions if t.get("action") == "ESCALATED_PAYMENT_LINK")
    rejected = sum(1 for t in transactions if t.get("action") == "REJECTED")
    
    return {
        "metrics": {
            "total_requests": total_requests,
            "approved": approved,
            "escalated": escalated,
            "rejected": rejected
        },
        "transactions": transactions
    }
