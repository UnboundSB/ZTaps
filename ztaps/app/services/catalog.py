"""
Catalog and Policy Data Loaders.

Loads and provides access to synthetic catalog.json and policy.json
datasets for validation and pricing reference.
"""
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class CatalogItem(BaseModel):
    """Catalog item schema."""
    item_id: str
    name: str
    description: str
    price: int  # in paise
    currency: str
    category: str
    stock: int
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PolicyConfig(BaseModel):
    """Policy configuration schema."""
    MAX_TRANSACTION_LIMIT: int = 50000
    ALLOWED_CATEGORIES: List[str] = Field(default_factory=lambda: ["electronics", "books", "clothing"])
    MAX_QUANTITY_PER_ORDER: int = 10
    PRICE_TOLERANCE_PERCENT: float = 0.0
    REQUIRE_HUMAN_APPROVAL_ABOVE: int = 25000
    BLOCKED_KEYWORDS: List[str] = Field(default_factory=list)
    SEMANTIC_ANOMALY_THRESHOLD: float = 0.7


class CatalogService:
    """Service for loading and querying catalog and policy data."""

    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or Path(__file__).parent.parent.parent / "data"
        self._catalog: Dict[str, CatalogItem] = {}
        self._policy: Optional[PolicyConfig] = None
        self._load_catalog()
        self._load_policy()

    def _load_catalog(self) -> None:
        """Load catalog from database."""
        from app.core.db import engine
        from sqlmodel import Session, select
        from app.models.domain import CatalogItemModel

        with Session(engine) as session:
            db_items = session.exec(select(CatalogItemModel)).all()
            for db_item in db_items:
                item = CatalogItem(
                    item_id=db_item.item_id,
                    name=db_item.name,
                    description=db_item.description,
                    price=db_item.price,
                    currency=db_item.currency,
                    category=db_item.category,
                    stock=db_item.stock,
                    metadata=json.loads(db_item.metadata_json) if db_item.metadata_json else {},
                )
                self._catalog[item.item_id] = item

    def _load_policy(self) -> None:
        """Load policy from database."""
        from app.core.db import engine
        from sqlmodel import Session, select
        from app.models.domain import PolicyConfigModel

        with Session(engine) as session:
            db_policy = session.exec(select(PolicyConfigModel)).first()
            if not db_policy:
                self._policy = PolicyConfig()
                return

            self._policy = PolicyConfig(
                MAX_TRANSACTION_LIMIT=db_policy.max_transaction_limit,
                ALLOWED_CATEGORIES=json.loads(db_policy.allowed_categories),
                MAX_QUANTITY_PER_ORDER=db_policy.max_quantity_per_order,
                PRICE_TOLERANCE_PERCENT=db_policy.price_tolerance_percent,
                REQUIRE_HUMAN_APPROVAL_ABOVE=db_policy.require_human_approval_above,
                BLOCKED_KEYWORDS=json.loads(db_policy.blocked_keywords),
                SEMANTIC_ANOMALY_THRESHOLD=db_policy.semantic_anomaly_threshold
            )

    def get_item(self, item_id: str) -> Optional[CatalogItem]:
        """Get catalog item by ID."""
        return self._catalog.get(item_id.upper())

    def get_price(self, item_id: str) -> Optional[int]:
        """Get item price in paise."""
        item = self.get_item(item_id)
        return item.price if item else None

    def get_category(self, item_id: str) -> Optional[str]:
        """Get item category."""
        item = self.get_item(item_id)
        return item.category if item else None

    def is_category_allowed(self, category: str) -> bool:
        """Check if category is in allowed list."""
        return category.lower() in [c.lower() for c in self.policy.ALLOWED_CATEGORIES]

    def validate_price(self, item_id: str, requested_price: int) -> bool:
        """
        Validate requested price matches catalog price.

        Prevents discount hallucination attacks where agent requests
        a different price than the catalog.
        """
        catalog_price = self.get_price(item_id)
        if catalog_price is None:
            return False

        tolerance = self.policy.PRICE_TOLERANCE_PERCENT / 100.0
        if tolerance == 0:
            return requested_price == catalog_price

        # Allow small tolerance if configured
        min_price = int(catalog_price * (1 - tolerance))
        max_price = int(catalog_price * (1 + tolerance))
        return min_price <= requested_price <= max_price

    def get_max_transaction_limit(self) -> int:
        """Get maximum transaction limit in paise."""
        return self.policy.MAX_TRANSACTION_LIMIT * 100 if self.policy.MAX_TRANSACTION_LIMIT < 10000 else self.policy.MAX_TRANSACTION_LIMIT

    def get_human_approval_threshold(self) -> int:
        """Get threshold for human approval in paise."""
        return self.policy.REQUIRE_HUMAN_APPROVAL_ABOVE * 100

    def get_blocked_keywords(self) -> List[str]:
        """Get list of blocked keywords for injection detection."""
        return self.policy.BLOCKED_KEYWORDS

    def get_semantic_threshold(self) -> float:
        """Get semantic anomaly threshold."""
        return self.policy.SEMANTIC_ANOMALY_THRESHOLD

    def get_max_quantity(self) -> int:
        """Get maximum quantity per order."""
        return self.policy.MAX_QUANTITY_PER_ORDER

    @property
    def policy(self) -> PolicyConfig:
        """Get policy configuration."""
        if self._policy is None:
            self._load_policy()
        return self._policy

    @property
    def catalog(self) -> Dict[str, CatalogItem]:
        """Get full catalog."""
        return self._catalog

    def list_items(self) -> List[CatalogItem]:
        """List all catalog items."""
        return list(self._catalog.values())


# Singleton instance
_catalog_service: Optional[CatalogService] = None


def get_catalog_service() -> CatalogService:
    """Get or create catalog service singleton."""
    global _catalog_service
    if _catalog_service is None:
        _catalog_service = CatalogService()
    return _catalog_service