from datetime import date, datetime

from pydantic import BaseModel

class StationOut(BaseModel):
    id: int
    name: str
    order_index: int
    distance_km: float

    class Config:
        from_attributes = True

class SeatAvailability(BaseModel):
    seat_id: int
    seat_number: int
    coach_number: str
    is_available: bool

class BookingRequest(BaseModel):
    seat_id: int
    origin_station_id: int
    destination_station_id: int
    travel_date: date
    passenger_name: str

class BookingResponse(BaseModel):
    booking_id: int
    seat_id: int
    seat_number: int
    coach_number: str
    origin: str
    destination: str
    travel_date: date
    fare: float
    passenger_name: str


class BookingCancelResponse(BaseModel):
    booking_id: int
    passenger_name: str
    seat_number: int
    coach_number: str
    travel_date: date


class WaitlistRequest(BaseModel):
    origin_station_id: int
    destination_station_id: int
    travel_date: date
    passenger_name: str


class WaitlistResponse(BaseModel):
    waitlist_id: int
    passenger_name: str
    origin: str
    destination: str
    travel_date: date
    queue_position: int
    created_at: datetime

