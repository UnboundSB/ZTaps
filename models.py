from pydantic import BaseModel, Field, field_validator


class PurchaseIntent(BaseModel):
    """
    Represents an incoming purchase intent from an autonomous agent.
    """
    agent_id: str = Field(..., description="Unique identifier for the AI agent")
    item_category: str = Field(..., description="Category of the item being purchased (e.g., 'software', 'hardware')")
    amount: int = Field(..., description="Amount of the transaction in lowest currency denominator (e.g., paise)")
    justification: str = Field(..., description="Agent's plain-English explanation for this purchase")

    @field_validator("amount")
    @classmethod
    def validate_amount_positive(cls, v: int) -> int:
        """Ensures the amount is strictly positive."""
        if v <= 0:
            raise ValueError("Amount must be strictly greater than 0.")
        return v


class SentinelResponse(BaseModel):
    """
    The standardized response sent back to the agent.
    """
    status: str = Field(..., description="'approved' or 'rejected'")
    transaction_id: str | None = Field(None, description="The Razorpay order ID if approved, otherwise null")
    reason: str = Field(..., description="A plain-English explanation of the decision")
