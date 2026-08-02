from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from models import Station, Coach, Seat, BookingSegment, WaitlistEntry
from fastapi import HTTPException, status

BASE_FARE = 100.0
RATE_PER_KM = 5.0
SHORT_JOURNEY_MULTIPLIER = 1.0
MEDIUM_JOURNEY_MULTIPLIER = 1.12
LONG_JOURNEY_MULTIPLIER = 1.25
PEAK_MULTIPLIER = 1.08

def _journey_multiplier(distance_km: float) -> float:
    if distance_km <= 50:
        return SHORT_JOURNEY_MULTIPLIER
    if distance_km <= 150:
        return MEDIUM_JOURNEY_MULTIPLIER
    return LONG_JOURNEY_MULTIPLIER

def _peak_multiplier() -> float:
    now = datetime.now()
    if now.weekday() >= 5:
        return PEAK_MULTIPLIER
    if 7 <= now.hour < 9 or 16 <= now.hour < 19:
        return PEAK_MULTIPLIER
    return 1.0

def check_overlap(orig_a_idx: int, dest_a_idx: int, orig_b_idx: int, dest_b_idx: int) -> bool:
    start_a, end_a = sorted([orig_a_idx, dest_a_idx])
    start_b, end_b = sorted([orig_b_idx, dest_b_idx])
    return max(start_a, start_b) < min(end_a, end_b)

def get_seats_availability(db: Session, origin_id: int, dest_id: int, travel_date: date):
    orig = db.query(Station).filter(Station.id == origin_id).first()
    dest = db.query(Station).filter(Station.id == dest_id).first()
    if not orig or not dest:
        raise HTTPException(status_code=400, detail="Invalid station selection")

    req_start, req_end = sorted([orig.order_index, dest.order_index])
    all_seats = db.query(Seat).join(Coach).all()
    
    booked_seat_ids = set()
    segments = db.query(BookingSegment).filter(BookingSegment.travel_date == travel_date).all()
    for seg in segments:
        seg_orig = db.query(Station).get(seg.origin_station_id)
        seg_dest = db.query(Station).get(seg.destination_station_id)
        if check_overlap(req_start, req_end, seg_orig.order_index, seg_dest.order_index):
            booked_seat_ids.add(seg.seat_id)

    results = []
    for seat in all_seats:
        results.append({
            "seat_id": seat.id,
            "seat_number": seat.seat_number,
            "coach_number": seat.coach.coach_number,
            "is_available": seat.id not in booked_seat_ids
        })
    return results

def calculate_fare(db: Session, origin_id: int, dest_id: int) -> float:
    orig = db.query(Station).filter(Station.id == origin_id).first()
    dest = db.query(Station).filter(Station.id == dest_id).first()
    if not orig or not dest:
        raise HTTPException(status_code=400, detail="Invalid origin or destination station")
    
    distance = abs(dest.distance_km - orig.distance_km)
    distance_charge = distance * RATE_PER_KM
    journey_multiplier = _journey_multiplier(distance)
    peak_multiplier = _peak_multiplier()
    fare = (BASE_FARE + distance_charge) * journey_multiplier * peak_multiplier
    return round(fare, 2)

def calculate_fare_breakdown(db: Session, origin_id: int, dest_id: int):
    orig = db.query(Station).filter(Station.id == origin_id).first()
    dest = db.query(Station).filter(Station.id == dest_id).first()
    if not orig or not dest:
        raise HTTPException(status_code=400, detail="Invalid origin or destination station")

    distance = abs(dest.distance_km - orig.distance_km)
    distance_charge = distance * RATE_PER_KM
    journey_multiplier = _journey_multiplier(distance)
    peak_multiplier = _peak_multiplier()
    final_fare = round((BASE_FARE + distance_charge) * journey_multiplier * peak_multiplier, 2)

    return {
        "base_fare": BASE_FARE,
        "distance_km": round(distance, 2),
        "distance_charge": round(distance_charge, 2),
        "multiplier": journey_multiplier,
        "peak_multiplier": peak_multiplier,
        "final_fare": final_fare,
    }

def create_booking(db: Session, req):
    # Execute inside explicit transaction with Pessimistic Lock
    try:
        # Lock the seat row to serialize concurrent booking requests
        seat = db.query(Seat).with_for_update().filter(Seat.id == req.seat_id).first()
        if not seat:
            raise HTTPException(status_code=404, detail="Seat not found")

        orig = db.query(Station).filter(Station.id == req.origin_station_id).first()
        dest = db.query(Station).filter(Station.id == req.destination_station_id).first()
        if not orig or not dest or orig.id == dest.id:
            raise HTTPException(status_code=400, detail="Invalid journey segment")

        req_start, req_end = sorted([orig.order_index, dest.order_index])

        # Check existing bookings for overlap under lock
        existing = db.query(BookingSegment).filter(BookingSegment.seat_id == req.seat_id).all()
        for b in existing:
            if b.travel_date != req.travel_date:
                continue
            b_orig = db.query(Station).get(b.origin_station_id)
            b_dest = db.query(Station).get(b.destination_station_id)
            if check_overlap(req_start, req_end, b_orig.order_index, b_dest.order_index):
                raise HTTPException(
                    status_code=409, 
                    detail="Seat is already reserved for an overlapping segment of this trip"
                )

        fare = calculate_fare(db, req.origin_station_id, req.destination_station_id)

        booking = BookingSegment(
            seat_id=req.seat_id,
            origin_station_id=req.origin_station_id,
            destination_station_id=req.destination_station_id,
            travel_date=req.travel_date,
            passenger_name=req.passenger_name,
            fare=fare
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)

        return {
            "booking_id": booking.id,
            "seat_id": seat.id,
            "seat_number": seat.seat_number,
            "coach_number": seat.coach.coach_number,
            "origin": orig.name,
            "destination": dest.name,
            "travel_date": booking.travel_date,
            "fare": fare,
            "passenger_name": booking.passenger_name
        }
    except Exception as e:
        db.rollback()
        raise e