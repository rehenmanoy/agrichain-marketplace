from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    buyer_id: int = Field(foreign_key="user.id")
    listing_id: int = Field(foreign_key="farmerlisting.id")
    quantity: float
    total_price: float
    delivery_address: str
    pincode: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
