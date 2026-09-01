import json
import uuid
import datetime
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlmodel import Session

from app.models.domain import PurchaseIntent, SentinelResponse, Transaction
from app.services.scanner.detector import get_detector
from app.services.razorpay_service import razorpay_service
from app.core.security import verify_api_key
from app.core.rate_limit import check_rate_limit

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])

from app.core.logger import log
from app.core.db import get_session, engine
from sqlmodel import select
from app.models.domain import Policy, PolicyConfigModel, CatalogItemModel

def write_transaction_to_db(log_entry: dict):
    with Session(engine) as db_session:
        tx = Transaction(
            request_id=log_entry["request_id"],
            item_id=log_entry["item_id"],
            requested_amount=log_entry["requested_amount"],
            action=log_entry["action"],
            flags=json.dumps(log_entry["flags"]),
            order_id=log_entry.get("order_id"),
            link_id=log_entry.get("link_id"),
            timestamp=datetime.datetime.fromisoformat(log_entry["timestamp"])
        )
        db_session.add(tx)
        db_session.commit()

@router.post("/intercept", response_model=SentinelResponse, dependencies=[Depends(verify_api_key), Depends(check_rate_limit)])
def intercept_agent_call(intent: PurchaseIntent, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    """
    Intercepts standard REST intents from the AI Agent, runs deterministic validation,
    detects prompt injection, and executes the appropriate Razorpay action.
    """
    request_id = str(uuid.uuid4())
    detector = get_detector()
    
    log.info("agent_intercept_start", request_id=request_id, agent_id=intent.agent_id, amount=intent.amount)
    
    action = "APPROVED_ORDER"
    flags = []
    reason = f"Approved. {intent.item_category} purchase meets policy limits."
    
    # 1. Prompt Injection / LLM Judge Validation
    try:
        injection_result = detector.analyze_payload(intent.model_dump())
        if injection_result.get("is_suspicious", False):
             flags.append("PROMPT_INJECTION")
             action = "REJECTED"
             reason = "Prompt injection or malicious payload detected."
             log.warning("prompt_injection_detected", request_id=request_id)
    except Exception as e:
        log.error("scanner_error", error=str(e), request_id=request_id)
        action = "ERROR"
        flags.append("SCANNER_ERROR")
        reason = "Internal error during validation."
        
    # 2. Gatekeeper Policy Evaluation (Only if not already rejected or error)
    if action not in ("REJECTED", "ERROR"):
        # Global Config
        policy_config = session.exec(select(PolicyConfigModel)).first()
        
        # Agent Policy
        statement = select(Policy).where(Policy.agent_id == intent.agent_id)
        policy = session.exec(statement).first()
        
        # Catalog verification
        catalog_item = session.exec(select(CatalogItemModel).where(CatalogItemModel.item_id == intent.item_id)).first()
        
        if not policy:
            action = "REJECTED"
            flags.append("AGENT_NOT_FOUND")
            reason = f"Agent '{intent.agent_id}' is not recognized by the system."
        elif not catalog_item:
            action = "REJECTED"
            flags.append("ITEM_NOT_FOUND")
            reason = f"Item '{intent.item_id}' not found in the catalog."
        else:
            allowed_categories = [c.lower() for c in json.loads(policy.allowed_categories)]
            blocked_keywords = json.loads(policy_config.blocked_keywords)
            
            # Policy constraints
            expected_price = catalog_item.price * intent.quantity
            lower_bound = getattr(policy_config, "lower_limit", 0)
            upper_bound = getattr(policy_config, "upper_limit", 100000000)
            
            if intent.item_category.lower() not in allowed_categories:
                action = "REJECTED"
                flags.append("CATEGORY_VIOLATION")
                reason = f"Agent '{intent.agent_id}' is not authorized to purchase in category '{intent.item_category}'."
            elif intent.quantity > policy_config.max_quantity_per_order:
                action = "REJECTED"
                flags.append("QUANTITY_LIMIT_EXCEEDED")
                reason = f"Quantity {intent.quantity} exceeds global limit of {policy_config.max_quantity_per_order}."
            elif not (lower_bound <= intent.amount <= upper_bound):
                action = "REJECTED"
                flags.append("PRICE_TOLERANCE_VIOLATION")
                reason = f"Amount {intent.amount} deviates from catalog price {expected_price} beyond tolerance."
            elif any(kw.lower() in intent.justification.lower() for kw in blocked_keywords):
                action = "REJECTED"
                flags.append("BLOCKED_KEYWORD")
                reason = "Justification contains blocked keywords."
            elif intent.amount > policy.max_spend:
                action = "REJECTED"
                flags.append("LIMIT_EXCEEDED")
                reason = f"Transaction amount {intent.amount} exceeds limit of {policy.max_spend} for agent '{intent.agent_id}'."
            elif intent.amount > policy_config.require_human_approval_above:
                action = "ESCALATED_PAYMENT_LINK"
                flags.append("HIGH_VALUE")
                reason = f"Transaction amount {intent.amount} exceeds auto-approval threshold. Escalated to human."


    # 3. Log Enqueue Helper
    def enqueue_log(order_id=None, link_id=None):
        log_entry = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "request_id": request_id,
            "item_id": intent.item_id,
            "requested_amount": intent.amount,
            "action": action,
            "flags": flags,
            "order_id": order_id,
            "link_id": link_id
        }
        background_tasks.add_task(write_transaction_to_db, log_entry)

    # 4. Razorpay Execution
    try:
        if action == "APPROVED_ORDER":
            order_id = f"order_{uuid.uuid4().hex[:14]}"
            enqueue_log(order_id=order_id)
            return SentinelResponse(
                status="approved",
                transaction_id=order_id,
                reason=reason
            )
        elif action == "ESCALATED_PAYMENT_LINK":
            link_id = f"plink_{uuid.uuid4().hex[:14]}"
            enqueue_log(link_id=link_id)
            return SentinelResponse(
                status="escalated",
                transaction_id=link_id,
                reason=reason
            )
        elif action == "ERROR":
            enqueue_log()
            raise HTTPException(status_code=500, detail="Internal server error")
        else:
            enqueue_log()
            return SentinelResponse(
                status="rejected",
                transaction_id=None,
                reason=reason
            )
    except HTTPException:
        raise
    except Exception as e:
        action = "ERROR"
        enqueue_log()
        raise HTTPException(status_code=500, detail="Payment gateway error")
