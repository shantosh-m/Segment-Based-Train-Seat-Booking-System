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

STAFF_ACCESS_CODE = os.getenv("STAFF_ACCESS_CODE", "staff123")

def require_staff_access(x_staff_access: str | None = Header(default=None, alias="X-Staff-Access")):
    if x_staff_access != STAFF_ACCESS_CODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required",
        )

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

@app.post("/api/v1/waitlist", response_model=schemas.WaitlistResponse)
def create_waitlist(req: schemas.WaitlistRequest, db: Session = Depends(get_db)):
    return crud.create_waitlist_entry(db, req)


@app.get(
    "/api/v1/bookings/recent",
    response_model=List[schemas.BookingHistoryItem],
    dependencies=[Depends(require_staff_access)],
)
def list_recent_bookings(limit: int = 6, db: Session = Depends(get_db)):
    recent_bookings = (
        db.query(models.BookingSegment)
        .order_by(models.BookingSegment.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "booking_id": booking.id,
            "passenger_name": booking.passenger_name,
            "coach_number": booking.seat.coach.coach_number,
            "seat_number": booking.seat.seat_number,
            "origin": booking.origin.name,
            "destination": booking.destination.name,
            "travel_date": booking.travel_date,
            "fare": booking.fare,
            "created_at": booking.created_at,
        }
        for booking in recent_bookings
    ]


@app.get(
    "/api/v1/waitlist/recent",
    response_model=List[schemas.WaitlistResponse],
    dependencies=[Depends(require_staff_access)],
)
def list_recent_waitlist(limit: int = 6, db: Session = Depends(get_db)):
    return crud.get_recent_waitlist(db, limit)
