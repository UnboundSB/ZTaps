import razorpay
import hmac
import hashlib
import json
import logging
import uuid
from typing import Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

class RazorpayService:
    def __init__(self):
        self.use_mock = self._check_should_mock()
        
        if not self.use_mock:
            self.client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
        else:
            self.client = None
            logger.info("Initializing RazorpayService in MOCK mode due to missing or dummy credentials.")
            
        self.webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET

    def _check_should_mock(self) -> bool:
        """Determines if the mock agent should be used based on available credentials."""
        key_id = settings.RAZORPAY_KEY_ID
        key_secret = settings.RAZORPAY_KEY_SECRET
        
        if not key_id or not key_secret:
            return True
        if "dummy" in key_id.lower() or "dummy" in key_secret.lower():
            return True
        return False

    def create_order(self, amount_paise: int, currency: str = "INR", receipt: str = None, notes: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Create a standard Razorpay order.
        Used for the 'Safe' execution flow.
        """
        data = {
            "amount": amount_paise,
            "currency": currency,
        }
        if receipt:
            data["receipt"] = receipt
        if notes:
            data["notes"] = notes

        try:
            if self.use_mock:
                logger.info("Using mock Razorpay order due to dummy/missing credentials.")
                return {"id": f"order_mock_{uuid.uuid4().hex[:8]}", "amount": amount_paise, "status": "created"}
            
            order = self.client.order.create(data=data)
            logger.info(f"Created Razorpay order: {order.get('id')}")
            return order
        except Exception as e:
            logger.error(f"Failed to create Razorpay order: {e}")
            raise

    def create_payment_link(self, amount_paise: int, currency: str = "INR", description: str = "Escalated Payment", reference_id: str = None, notes: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Create a Razorpay payment link.
        Used for the 'Escalation' flow when human approval is required.
        """
        data = {
            "amount": amount_paise,
            "currency": currency,
            "description": description,
        }
        if reference_id:
            data["reference_id"] = reference_id
        if notes:
            data["notes"] = notes

        try:
            if self.use_mock:
                logger.info("Using mock Razorpay payment link due to dummy/missing credentials.")
                return {"id": f"plink_mock_{uuid.uuid4().hex[:8]}", "short_url": "https://rzp.io/i/mocklink"}
                
            payment_link = self.client.payment_link.create(data)
            logger.info(f"Created Razorpay payment link: {payment_link.get('id')}")
            return payment_link
        except Exception as e:
            logger.error(f"Failed to create Razorpay payment link: {e}")
            raise

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify the HMAC signature of incoming webhooks.
        """
        if self.use_mock:
            # In mock mode, we assume all webhooks are "valid" if we trigger them internally, 
            # or just skip verification.
            return True
            
        try:
            self.client.utility.verify_webhook_signature(
                payload.decode('utf-8'),
                signature,
                self.webhook_secret
            )
            return True
        except razorpay.errors.SignatureVerificationError:
            logger.warning("Webhook signature verification failed.")
            return False
        except Exception as e:
            logger.error(f"Error during webhook verification: {e}")
            return False

razorpay_service = RazorpayService()
