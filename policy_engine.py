from models import PurchaseIntent

class PolicyViolationError(Exception):
    """Base exception for policy violations."""
    pass

class LimitExceededError(PolicyViolationError):
    """Raised when an agent attempts to spend more than their limit."""
    pass

class CategoryDeniedError(PolicyViolationError):
    """Raised when an agent attempts to purchase an unauthorized category."""
    pass
    
class AgentNotFoundError(PolicyViolationError):
    """Raised when an unknown agent attempts a transaction."""
    pass


# Mock Merchant Policy Database
POLICY_DB = {
    "agent_001": {
        "max_spend": 50000, # 500.00 INR in paise
        "allowed_categories": ["software", "cloud_services"]
    },
    "agent_002": {
        "max_spend": 1000000, # 10000.00 INR
        "allowed_categories": ["hardware", "software", "office_supplies"]
    }
}

def evaluate_intent(intent: PurchaseIntent):
    """
    Evaluates a purchase intent against the strict merchant policy.
    
    Args:
        intent (PurchaseIntent): The incoming intent to evaluate.
        
    Raises:
        AgentNotFoundError: If the agent is not in the policy DB.
        CategoryDeniedError: If the category is not authorized.
        LimitExceededError: If the amount exceeds the agent's limit.
    """
    policy = POLICY_DB.get(intent.agent_id)
    
    if not policy:
        raise AgentNotFoundError(f"Agent '{intent.agent_id}' is not recognized by the system.")
        
    if intent.item_category not in policy["allowed_categories"]:
        raise CategoryDeniedError(
            f"Agent '{intent.agent_id}' is not authorized to purchase in category '{intent.item_category}'."
        )
        
    if intent.amount > policy["max_spend"]:
        raise LimitExceededError(
            f"Transaction amount {intent.amount} exceeds limit of {policy['max_spend']} for agent '{intent.agent_id}'."
        )
