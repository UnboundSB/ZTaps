from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import razorpay
import uuid
import os

from models import PurchaseIntent, SentinelResponse
from policy_engine import evaluate_intent, PolicyViolationError
from database import insert_audit_record

app = FastAPI(
    title="Z-TAPS",
    description="Zero-Trust Agentic Payment Sentinel",
    version="1.0.0"
)

# Initialize Razorpay Client (Using dummy keys for local hackathon demo if env vars are missing)
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_dummykey123")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "dummysecret456")
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


@app.exception_handler(PolicyViolationError)
async def policy_violation_handler(request: Request, exc: PolicyViolationError):
    """
    Global exception handler for policy violations.
    Gracefully catches the error, formats a 400 response, and ensures it is explainable to the AI agent.
    Note: We do not log to the database here because we need the original intent data which isn't 
    directly accessible in the exception handler without middleware, so we handle logging in the route itself.
    """
    return JSONResponse(
        status_code=400,
        content={"status": "rejected", "transaction_id": None, "reason": str(exc)},
    )


@app.post("/api/v1/authorize-intent", response_model=SentinelResponse)
async def authorize_intent(intent: PurchaseIntent):
    """
    Core endpoint for evaluating purchase intents.
    """
    try:
        # 1. Gatekeeper Evaluation
        evaluate_intent(intent)
        
        # 2. Razorpay Order Creation
        order_data = {
            "amount": intent.amount,
            "currency": "INR",
            "receipt": f"receipt_{uuid.uuid4().hex[:8]}"
        }
        
        # NOTE: If dummy keys are used, this SDK call will fail. 
        # For demo purposes, we will mock the response if dummy keys are detected.
        if RAZORPAY_KEY_ID == "rzp_test_dummykey123":
            order_id = f"order_{uuid.uuid4().hex[:14]}"
        else:
            order = razorpay_client.order.create(data=order_data)
            order_id = order['id']
            
        reason = f"Approved. {intent.item_category} purchase meets policy limits."
        
        # 3. Audit Logging
        insert_audit_record(
            agent_id=intent.agent_id,
            item_category=intent.item_category,
            amount=intent.amount,
            status="approved",
            reason=reason,
            transaction_id=order_id
        )
        
        # 4. Graceful Return
        return SentinelResponse(
            status="approved",
            transaction_id=order_id,
            reason=reason
        )
        
    except PolicyViolationError as e:
        # Log the rejection to the audit ledger before bubbling up to the exception handler
        insert_audit_record(
            agent_id=intent.agent_id,
            item_category=intent.item_category,
            amount=intent.amount,
            status="rejected",
            reason=str(e),
            transaction_id=None
        )
        # Re-raise to let the global exception handler return the 400 HTTP response
        raise e
    except Exception as e:
        # Fallback for unexpected errors (e.g., Razorpay network failure)
        error_msg = f"Unexpected system error: {str(e)}"
        insert_audit_record(
            agent_id=intent.agent_id,
            item_category=intent.item_category,
            amount=intent.amount,
            status="error",
            reason=error_msg,
            transaction_id=None
        )
        return JSONResponse(
            status_code=500,
            content={"status": "error", "transaction_id": None, "reason": error_msg}
        )
