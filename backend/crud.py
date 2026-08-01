from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from models import Station, Coach, Seat, BookingSegment, WaitlistEntry
from fastapi import HTTPException, status

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