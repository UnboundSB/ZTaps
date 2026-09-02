from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.security import verify_api_key
from app.models.domain import Policy
from pydantic import BaseModel, Field
import json

router = APIRouter()

class CategoryLimit(BaseModel):
    name: str
    min: int = Field(ge=0)
    max: int = Field(gt=0)

class PolicyCreateOrUpdate(BaseModel):
    agent_id: str
    max_spend: int = Field(gt=0)
    allowed_categories: list[CategoryLimit]

@router.post("/policy", status_code=status.HTTP_200_OK, dependencies=[Depends(verify_api_key)])
def configure_policy(
    policy_data: PolicyCreateOrUpdate,
    session: Session = Depends(get_session)
):
    """Admin endpoint to create or update an agent's policy dynamically."""
    
    # Check if policy exists
    statement = select(Policy).where(Policy.agent_id == policy_data.agent_id)
    existing_policy = session.exec(statement).first()
    
    cat_json = json.dumps([c.model_dump() for c in policy_data.allowed_categories])
    
    if existing_policy:
        existing_policy.max_spend = policy_data.max_spend
        existing_policy.allowed_categories = cat_json
        session.add(existing_policy)
    else:
        new_policy = Policy(
            agent_id=policy_data.agent_id,
            max_spend=policy_data.max_spend,
            allowed_categories=cat_json
        )
        session.add(new_policy)
        
    session.commit()
    return {"status": "success", "message": f"Policy updated for {policy_data.agent_id}"}


class GlobalConfigUpdate(BaseModel):
    lower_limit: int
    upper_limit: int
    require_human_approval_above: int

@router.post("/config", status_code=status.HTTP_200_OK, dependencies=[Depends(verify_api_key)])
def update_global_config(
    config_data: GlobalConfigUpdate,
    session: Session = Depends(get_session)
):
    """Admin endpoint to update global policy limits."""
    from app.models.domain import PolicyConfigModel
    config = session.exec(select(PolicyConfigModel)).first()
    if config:
        config.lower_limit = config_data.lower_limit
        config.upper_limit = config_data.upper_limit
        config.require_human_approval_above = config_data.require_human_approval_above
        session.add(config)
        session.commit()
    return {"status": "success", "message": "Global config updated"}
