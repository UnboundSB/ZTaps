"""
MCP (Model Context Protocol) Tool Call Schemas.

Defines the JSON-RPC 2.0 structure for tool calls from AI agents
and the expected parameter schemas for the create_checkout_order tool.
"""
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator
from app.core.constants import REQUIRED_MCP_PARAMS, ALLOWED_MCP_PARAMS


class MCPToolParams(BaseModel):
    """
    Parameters for the create_checkout_order MCP tool.

    Strict schema validation - only allowed parameters are accepted.
    Extra parameters will cause validation failure (security feature).
    """
    item_id: str = Field(..., min_length=1, max_length=64, description="Unique item identifier from catalog")
    quantity: int = Field(..., ge=1, le=100, description="Quantity to purchase")
    amount: int = Field(..., ge=1, description="Amount in paise (smallest currency unit)")
    currency: str = Field(default="INR", pattern="^[A-Z]{3}$", description="ISO 4217 currency code")
    customer_id: Optional[str] = Field(default=None, max_length=64, description="Optional customer identifier")

    @field_validator("item_id")
    @classmethod
    def validate_item_id_format(cls, v: str) -> str:
        """Validate item_id follows expected format."""
        if not v.startswith(("ITEM_", "item_")):
            raise ValueError("item_id must follow format ITEM_<TYPE>_<ID>")
        return v.upper()


class MCPToolCall(BaseModel):
    """
    JSON-RPC 2.0 tool call request from AI Agent.

    This is the structure intercepted by the /intercept endpoint.
    """
    jsonrpc: str = Field(default="2.0", pattern="^2\\.0$")
    id: Union[str, int, None] = Field(default=None, description="Request ID for correlation")
    method: str = Field(..., description="MCP method name (e.g., tools/call)")
    params: Dict[str, Any] = Field(..., description="Tool call parameters")

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        """Ensure method is a tools/call variant."""
        if not v.startswith("tools/"):
            raise ValueError("Method must be a tools/* call")
        return v


class MCPToolCallParams(BaseModel):
    """Parameters inside the tool call (name + arguments)."""
    name: str = Field(..., description="Tool name (e.g., create_checkout_order)")
    arguments: Dict[str, Any] = Field(..., description="Tool arguments")

    @field_validator("name")
    @classmethod
    def validate_tool_name(cls, v: str) -> str:
        """Validate tool name is supported."""
        if v != "create_checkout_order":
            raise ValueError(f"Unsupported tool: {v}. Only 'create_checkout_order' is supported.")
        return v

    @field_validator("arguments")
    @classmethod
    def validate_arguments(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """
        Strict parameter validation - reject any unauthorized parameters.

        This is a critical security control: agents must not be able to inject
        arbitrary parameters that could bypass validation or affect downstream systems.
        """
        # Check for unauthorized parameters
        provided_keys = set(v.keys())
        unauthorized = provided_keys - ALLOWED_MCP_PARAMS
        if unauthorized:
            raise ValueError(f"Unauthorized parameters: {sorted(unauthorized)}. Allowed: {sorted(ALLOWED_MCP_PARAMS)}")

        # Check required parameters
        missing = REQUIRED_MCP_PARAMS - provided_keys
        if missing:
            raise ValueError(f"Missing required parameters: {sorted(missing)}")

        return v


class MCPResponse(BaseModel):
    """Standard JSON-RPC 2.0 response."""
    jsonrpc: str = "2.0"
    id: Union[str, int, None] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None


class MCPError(BaseModel):
    """JSON-RPC 2.0 error object."""
    code: int
    message: str
    data: Optional[Dict[str, Any]] = None


def create_mcp_error(request_id: Union[str, int, None], code: int, message: str, data: Optional[Dict] = None) -> MCPResponse:
    """Create a standardized MCP error response."""
    return MCPResponse(
        id=request_id,
        error=MCPError(code=code, message=message, data=data).model_dump()
    )


def create_mcp_success(request_id: Union[str, int, None], result: Dict[str, Any]) -> MCPResponse:
    """Create a standardized MCP success response."""
    return MCPResponse(id=request_id, result=result)