from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class FarmerListing(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    farmer_id: int = Field(foreign_key="user.id")
    produce_id: int = Field(foreign_key="produceitem.id")
    title: str
    description: Optional[str] = None
    price_per_unit: float
    market_price_reference: Optional[float] = None
    available_quantity: float
    region: Optional[str] = None
    pincode: Optional[str] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
