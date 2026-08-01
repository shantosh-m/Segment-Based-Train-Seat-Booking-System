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
