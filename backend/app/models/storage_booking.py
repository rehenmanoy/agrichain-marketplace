from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class StorageBooking(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    farmer_id: int = Field(foreign_key="user.id")
    warehouse_id: int = Field(foreign_key="warehouse.id")
    produce_id: int = Field(foreign_key="produceitem.id")
    quantity_kg: float
    start_date: datetime
    end_date: datetime
    estimated_cost: Optional[float] = None
    status: str = "requested"
    created_at: datetime = Field(default_factory=datetime.utcnow)
