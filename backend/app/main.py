from fastapi import FastAPI
from app import  models
from app.core.db import create_tables
from app.api import produce
app = FastAPI(title="Farm Project API")


@app.on_event("startup")
def on_startup()-> None:
    create_tables()

app.include_router(produce.router)

@app.get("/")
def read_root():
    return {"message":"FoodTech Backend Is Working"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
