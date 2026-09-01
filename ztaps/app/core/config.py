"""
Application Configuration using Pydantic Settings.

Loads environment variables from .env file and provides typed access
to all configuration values used across the application.
"""
import os
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ==========================================
    # Razorpay Credentials
    # ==========================================
    RAZORPAY_KEY_ID: str = Field(..., description="Razorpay Key ID from dashboard")
    RAZORPAY_KEY_SECRET: str = Field(..., description="Razorpay Key Secret from dashboard")
    RAZORPAY_WEBHOOK_SECRET: str = Field(..., description="Webhook secret for HMAC verification")

    # ==========================================
    # Server Configuration
    # ==========================================
    HOST: str = Field(default="0.0.0.0", description="Server bind address")
    PORT: int = Field(default=8000, description="Server port")
    RELOAD: bool = Field(default=True, description="Enable auto-reload in development")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")

    # ==========================================
    # Database Configuration
    # ==========================================
    DATABASE_URL: str = Field(
        default="sqlite:///./data/ztaps.db",
        description="SQLAlchemy database URL"
    )

    # ==========================================
    # Policy Configuration (Defaults - overridden by policy.json)
    # ==========================================
    MAX_TRANSACTION_LIMIT: int = Field(default=50000, description="Maximum transaction amount in paise")
    ALLOWED_CATEGORIES: List[str] = Field(
        default=["electronics", "books", "clothing"],
        description="Allowed product categories"
    )
    MAX_QUANTITY_PER_ORDER: int = Field(default=10, description="Maximum quantity per order")
    PRICE_TOLERANCE_PERCENT: float = Field(default=0.0, description="Price tolerance percentage")
    REQUIRE_HUMAN_APPROVAL_ABOVE: int = Field(default=25000, description="Amount requiring human approval")

    # ==========================================
    # Demo Configuration
    # ==========================================
    MOCK_AGENT_DELAY_MS: int = Field(default=500, description="Delay for mock agent simulation")
    DASHBOARD_REFRESH_SECONDS: int = Field(default=2, description="Dashboard refresh interval")

    @field_validator("ALLOWED_CATEGORIES", mode="before")
    @classmethod
    def parse_categories(cls, v: str | List[str]) -> List[str]:
        """Parse comma-separated string to list."""
        if isinstance(v, str):
            return [cat.strip() for cat in v.split(",") if cat.strip()]
        return v

    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level."""
        valid_levels = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper_v = v.upper()
        if upper_v not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of {valid_levels}")
        return upper_v


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()