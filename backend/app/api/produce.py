from datetime import datetime
from typing import List , Optional

from fastapi import APIRouter , Depends , HTTPException , status
from sqlmodel import Session , select

from app.core.db import get_session
from app.models.produce import ProduceItem
from app.schemas.produce import ProduceCreate , ProduceRead , ProduceUpdate
from app.services.price_scraper import get_current_market_price

router = APIRouter(prefix="/produce" , tags = ["produce"])

@router.post("/" , response_model= ProduceRead , status_code= status.HTTP_201_CREATED)
async def create_produce(
    data : ProduceCreate,
    db : Session = Depends(get_session),
):
    stmt = select(ProduceItem).where(
        ProduceItem.name == data.name,
        ProduceItem.category == data.category,
    )
    existing = db.exec(stmt).first()
    if existing:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail="Produce  item with this name and category already exists"
        )

    scraped_price = await get_current_market_price(data.name)

    item = ProduceItem(
        name = data.name,
        category= data.category,
        unit = "kg",
        current_market_price=  scraped_price,
        last_price_update=(
            datetime.utcnow() if scraped_price is not None else None
        ),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/" , response_model= List[ProduceRead])
def list_produce(
    db : Session = Depends(get_session),
    category : Optional[str] = None,
):
    stmt = select(ProduceItem)
    if category:
        stmt = stmt.where(ProduceItem.category == category)
    items = db.exec(stmt).all()
    return items

@router.patch("/{produce_id}" , response_model=ProduceRead)
def update_produce(
    produce_id : int,
    data : ProduceUpdate,
    db : Session = Depends(get_session),
):
    item = db.get(ProduceItem , produce_id)
    if not item:
        raise HTTPException(status_code=404 , detail="Produce Item Not Found")
    
    update_data = data.model_dump(exclude_unset= True)
    for key , value in update_data.items():
        setattr(item , key , value)
    
    if "current_market_price" in update_data:
        item.last_price_update = datetime.utcnow()
    
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.post("/{produce_id}/refresh_price" , response_model=ProduceRead)
async def refresh_market_price(
    produce_id : int,
    db: Session = Depends(get_session),
):
    item = db.get(ProduceItem , produce_id)
    if not item:
        raise HTTPException(status_code=404, detail= "Produce Item Not Found")
    
    new_price = await get_current_market_price(item.name)
    if new_price is None:
        raise HTTPException(
            status_code= 502,
            detail="Could not fetch price for this produce"
        )
    item.current_market_price = new_price
    item.last_price_update = datetime.utcnow()

    db.add(item)
    db.commit()
    db.refresh(item)
    return item