from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel

class ProduceBase(SQLModel):
    name : str
    category : str
    # unit : str = "kg"

class ProduceCreate(ProduceBase):
    current_market_price : Optional[float] = None

class ProduceUpdate(SQLModel):
    name : Optional[str] = None
    category : Optional[str] = None
    unit : Optional[str] = None
    current_market_price : Optional[float] = None

class ProduceRead(ProduceBase):
    id : int
    current_market_price : Optional[float] = None
    last_price_update : Optional[datetime] = None

    class Config:
        from_attributes = True