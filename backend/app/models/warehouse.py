from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class Warehouse(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id")
    name: str
    location: str
    pincode: str
    region: Optional[str] = None
    total_capacity_kg: float
    available_capacity_kg: float
    rent_per_kg_per_day: float
    has_cold_storage: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
