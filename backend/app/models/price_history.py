from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class PriceHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    produce_id: int = Field(foreign_key="produceitem.id")
    price_per_kg: float
    date: datetime = Field(default_factory=datetime.utcnow)
    source: Optional[str] = None
    market_name: Optional[str] = None
