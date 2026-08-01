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

def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Station).first():
        db.close()
        return

    for station in DEFAULT_STATIONS:
        db.add(
            Station(
                name=station["name"],
                order_index=int(station["order_index"]),
                distance_km=float(station["distance_km"]),
            )
        )

    for coach_index in range(1, 4):
        c_num = f"R{coach_index}"
        coach = Coach(coach_number=c_num, total_seats=10)
        db.add(coach)
        db.flush()
        for seat_num in range(1, 11):
            db.add(Seat(coach_id=coach.id, seat_number=seat_num))

    db.commit()
    db.close()

if __name__ == "__main__":
    seed_data()