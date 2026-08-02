import os
from datetime import date

from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import Base, engine, get_db
import models, schemas, crud, seed

Base.metadata.create_all(bind=engine)
seed.seed_data()

app = FastAPI(title="Colombo-Badulla Segment Railway Booking API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/stations", response_model=List[schemas.StationOut])
def list_stations(db: Session = Depends(get_db)):
    return db.query(models.Station).order_by(models.Station.order_index).all()

@app.get("/api/v1/seats/availability", response_model=List[schemas.SeatAvailability])
def get_availability(origin_id: int, destination_id: int, travel_date: date, db: Session = Depends(get_db)):
    return crud.get_seats_availability(db, origin_id, destination_id, travel_date)

@app.get("/api/v1/fare")
def get_fare(origin_id: int, destination_id: int, db: Session = Depends(get_db)):
    fare = crud.calculate_fare(db, origin_id, destination_id)
    breakdown = crud.calculate_fare_breakdown(db, origin_id, destination_id)
    return {"fare": fare, "breakdown": breakdown}

@app.post("/api/v1/bookings", response_model=schemas.BookingResponse)
def create_booking(req: schemas.BookingRequest, db: Session = Depends(get_db)):
    return crud.create_booking(db, req)