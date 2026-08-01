import json
import os

from sqlalchemy import text

from database import SessionLocal, engine, Base
from models import Station, Coach, Seat


DEFAULT_STATIONS = [
    {"name": "Colombo Fort", "order_index": 0, "distance_km": 0.0},
    {"name": "Ragama", "order_index": 1, "distance_km": 14.0},
    {"name": "Polgahawela", "order_index": 2, "distance_km": 72.0},
    {"name": "Kandy", "order_index": 3, "distance_km": 118.0},
    {"name": "Nawalapitiya", "order_index": 4, "distance_km": 147.0},
    {"name": "Hatton", "order_index": 5, "distance_km": 174.0},
    {"name": "Nanu Oya", "order_index": 6, "distance_km": 206.0},
    {"name": "Pattipola", "order_index": 7, "distance_km": 224.0},
    {"name": "Ella", "order_index": 8, "distance_km": 271.0},
    {"name": "Badulla", "order_index": 9, "distance_km": 292.0},
]


def _load_json_env(name: str, default_value):
    raw_value = os.getenv(name)
    if not raw_value:
        return default_value

    try:
        return json.loads(raw_value)
    except json.JSONDecodeError:
        return default_value


def _ensure_booking_date_columns():
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE booking_segments ADD COLUMN IF NOT EXISTS travel_date DATE"))
        conn.execute(text("ALTER TABLE waitlist_entries ADD COLUMN IF NOT EXISTS travel_date DATE"))
        conn.execute(text("UPDATE booking_segments SET travel_date = CURRENT_DATE WHERE travel_date IS NULL"))
        conn.execute(text("UPDATE waitlist_entries SET travel_date = CURRENT_DATE WHERE travel_date IS NULL"))

def seed_data():
    Base.metadata.create_all(bind=engine)
    _ensure_booking_date_columns()
    db = SessionLocal()

    if db.query(Station).first():
        db.close()
        return

    stations_data = _load_json_env("SEED_STATIONS_JSON", DEFAULT_STATIONS)
    coach_count = int(os.getenv("COACH_COUNT", "3"))
    seats_per_coach = int(os.getenv("SEATS_PER_COACH", "10"))
    coach_prefix = os.getenv("COACH_PREFIX", "R")

    for station in stations_data:
        db.add(
            Station(
                name=station["name"],
                order_index=int(station["order_index"]),
                distance_km=float(station["distance_km"]),
            )
        )

    for coach_index in range(1, coach_count + 1):
        c_num = f"{coach_prefix}{coach_index}"
        coach = Coach(coach_number=c_num, total_seats=10)
        db.add(coach)
        db.flush()
        coach.total_seats = seats_per_coach
        for seat_num in range(1, seats_per_coach + 1):
            db.add(Seat(coach_id=coach.id, seat_number=seat_num))

    db.commit()
    db.close()

if __name__ == "__main__":
    seed_data()