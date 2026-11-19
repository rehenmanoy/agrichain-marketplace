from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class ProduceItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    category: str
    unit: str = "kg"
    current_market_price: Optional[float] = None
    last_price_update: Optional[datetime] = None
