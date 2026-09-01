import logging
from fastapi import APIRouter, Request, Header, HTTPException, Depends
from sqlmodel import Session, select
from app.core.db import get_session
from app.models.domain import Transaction, WebhookEvent
from app.services.razorpay_service import razorpay_service

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)

@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(..., description="Razorpay HMAC Signature"),
    x_razorpay_event_id: str = Header(..., description="Razorpay Event ID"),
    session: Session = Depends(get_session)
):
    """
    Webhook receiver for Razorpay events.
    Verifies signature and processes payment events idempotently.
    """
    # 1. Idempotency Check
    existing_event = session.exec(select(WebhookEvent).where(WebhookEvent.event_id == x_razorpay_event_id)).first()
    if existing_event:
        logger.info(f"Event {x_razorpay_event_id} already processed. Skipping.")
        return {"status": "ok", "message": "already processed"}

    # 2. Signature Verification
    body = await request.body()
    is_valid = razorpay_service.verify_webhook_signature(body, x_razorpay_signature)
    
    if not is_valid:
        logger.error("Invalid webhook signature")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # 3. Process Event
    try:
        payload = await request.json()
        event = payload.get("event")
        
        if event == "payment.captured":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            logger.info(f"Payment Captured! ID: {payment_entity.get('id')}, Amount: {payment_entity.get('amount')}")
            # Update transaction state to CAPTURED
            order_id = payment_entity.get('order_id')
            if order_id:
                tx = session.exec(select(Transaction).where(Transaction.order_id == order_id)).first()
                if tx:
                    tx.action = "CAPTURED"
                    session.add(tx)
            
        elif event == "order.paid":
            order_entity = payload.get("payload", {}).get("order", {}).get("entity", {})
            logger.info(f"Order Paid! ID: {order_entity.get('id')}")
            order_id = order_entity.get('id')
            if order_id:
                tx = session.exec(select(Transaction).where(Transaction.order_id == order_id)).first()
                if tx:
                    tx.action = "CAPTURED"
                    session.add(tx)

        # 4. Mark as processed
        new_event = WebhookEvent(event_id=x_razorpay_event_id)
        session.add(new_event)
        session.commit()
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
