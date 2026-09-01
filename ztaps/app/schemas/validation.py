"""
Validation Result Schemas.

Defines the output of the Deterministic Validation Engine including
flags, risk scores, and the recommended action.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.core.constants import ValidationFlag, ActionType


class ValidationCheck(BaseModel):
    """Individual validation check result."""
    check_name: str = Field(description="Name of the validation check")
    passed: bool = Field(description="Whether the check passed")
    flag: Optional[ValidationFlag] = Field(default=None, description="Flag raised if check failed")
    details: str = Field(description="Human-readable details")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional check-specific data")


class ValidationResult(BaseModel):
    """
    Complete validation result from the Deterministic Validation Engine.

    Contains all check results, aggregated flags, risk score, and the
    recommended action for the Razorpay Execution layer.
    """
    request_id: str = Field(description="Unique request identifier")
    is_valid: bool = Field(description="Overall validation result")
    action: ActionType = Field(description="Recommended action")
    risk_score: float = Field(ge=0.0, le=1.0, description="Aggregated risk score (0.0 = safe, 1.0 = critical)")
    flags: List[ValidationFlag] = Field(default_factory=list, description="All flags raised during validation")
    checks: List[ValidationCheck] = Field(default_factory=list, description="Individual check results")
    rejection_reason: Optional[str] = Field(default=None, description="Primary reason for rejection if invalid")
    requires_human_approval: bool = Field(default=False, description="Whether human-in-the-loop is required")

    def add_check(self, check: ValidationCheck) -> None:
        """Add a check result and update aggregated state."""
        self.checks.append(check)
        if not check.passed and check.flag:
            if check.flag not in self.flags:
                self.flags.append(check.flag)
            self.is_valid = False
            # Update risk score based on flags
            self.risk_score = min(1.0, self.risk_score + 0.2)

    def finalize(self, high_value_threshold: int, total_value: int) -> None:
        """Finalize validation result and determine action."""
        # Determine action based on flags and risk
        if ValidationFlag.PROMPT_INJECTION in self.flags:
            self.action = ActionType.REJECTED
            self.rejection_reason = "Prompt injection detected in payload"
        elif ValidationFlag.PRICE_MISMATCH in self.flags:
            self.action = ActionType.REJECTED
            self.rejection_reason = "Requested price diverges from catalog"
        elif ValidationFlag.UNAUTHORIZED_PARAMS in self.flags:
            self.action = ActionType.REJECTED
            self.rejection_reason = "Unauthorized parameters in request"
        elif ValidationFlag.CATEGORY_VIOLATION in self.flags:
            self.action = ActionType.REJECTED
            self.rejection_reason = "Item category not allowed"
        elif ValidationFlag.QUANTITY_VIOLATION in self.flags:
            self.action = ActionType.REJECTED
            self.rejection_reason = "Quantity exceeds maximum allowed"
        elif ValidationFlag.HIGH_VALUE in self.flags or total_value > high_value_threshold:
            self.action = ActionType.ESCALATED_PAYMENT_LINK
            self.requires_human_approval = True
        else:
            self.action = ActionType.APPROVED_ORDER

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/serialization."""
        return {
            "request_id": self.request_id,
            "is_valid": self.is_valid,
            "action": self.action.value,
            "risk_score": self.risk_score,
            "flags": [f.value for f in self.flags],
            "checks": [c.model_dump() for c in self.checks],
            "rejection_reason": self.rejection_reason,
            "requires_human_approval": self.requires_human_approval,
        }