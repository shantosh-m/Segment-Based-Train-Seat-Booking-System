from datetime import date, datetime
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

# Direct imports from models (eliminates 'models' NameError)
from models import BookingSegment, Coach, Seat, Station, WaitlistEntry

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


def calculate_fare(db: Session, origin_id: int, dest_id: int) -> float:
    orig = db.query(Station).filter(Station.id == origin_id).first()
    dest = db.query(Station).filter(Station.id == dest_id).first()
    if not orig or not dest:
        raise HTTPException(
            status_code=400, detail="Invalid origin or destination station"
        )

    distance = abs(dest.distance_km - orig.distance_km)
    distance_charge = distance * RATE_PER_KM
    journey_multiplier = _journey_multiplier(distance)
    peak_multiplier = _peak_multiplier()
    fare = (
        (BASE_FARE + distance_charge) * journey_multiplier * peak_multiplier
    )
    return round(fare, 2)


def calculate_fare_breakdown(db: Session, origin_id: int, dest_id: int):
    orig = db.query(Station).filter(Station.id == origin_id).first()
    dest = db.query(Station).filter(Station.id == dest_id).first()
    if not orig or not dest:
        raise HTTPException(
            status_code=400, detail="Invalid origin or destination station"
        )

    distance = abs(dest.distance_km - orig.distance_km)
    distance_charge = distance * RATE_PER_KM
    journey_multiplier = _journey_multiplier(distance)
    peak_multiplier = _peak_multiplier()
    final_fare = round(
        (BASE_FARE + distance_charge) * journey_multiplier * peak_multiplier, 2
    )

    return {
        "base_fare": BASE_FARE,
        "distance_km": round(distance, 2),
        "distance_charge": round(distance_charge, 2),
        "multiplier": journey_multiplier,
        "peak_multiplier": peak_multiplier,
        "final_fare": final_fare,
    }


def check_overlap(
    orig_a_idx: int, dest_a_idx: int, orig_b_idx: int, dest_b_idx: int
) -> bool:
    # Segments overlap iff max(orig1, orig2) < min(dest1, dest2)
    start_a, end_a = sorted([orig_a_idx, dest_a_idx])
    start_b, end_b = sorted([orig_b_idx, dest_b_idx])
    return max(start_a, start_b) < min(end_a, end_b)


def get_seats_availability(
    db: Session, origin_id: int, dest_id: int, travel_date: date
):
    orig = db.query(Station).filter(Station.id == origin_id).first()
    dest = db.query(Station).filter(Station.id == dest_id).first()
    if not orig or not dest:
        raise HTTPException(
            status_code=400, detail="Invalid station selection"
        )

    req_start, req_end = sorted([orig.order_index, dest.order_index])

    all_seats = db.query(Seat).join(Coach).all()

    # Query all active bookings for comparison
    booked_seat_ids = set()
    segments = (
        db.query(BookingSegment)
        .filter(BookingSegment.travel_date == travel_date)
        .all()
    )
    for seg in segments:
        seg_orig = db.query(Station).get(seg.origin_station_id)
        seg_dest = db.query(Station).get(seg.destination_station_id)
        if check_overlap(
            req_start, req_end, seg_orig.order_index, seg_dest.order_index
        ):
            booked_seat_ids.add(seg.seat_id)

    results = []
    for seat in all_seats:
        results.append(
            {
                "seat_id": seat.id,
                "seat_number": seat.seat_number,
                "coach_number": seat.coach.coach_number,
                "is_available": seat.id not in booked_seat_ids,
            }
        )
    return results


def find_available_seat_id(
    db: Session, origin_id: int, dest_id: int, travel_date: date
):
    availability = get_seats_availability(
        db, origin_id, dest_id, travel_date
    )
    for seat in availability:
        if seat["is_available"]:
            return seat["seat_id"]
    return None


def create_booking(db: Session, req):
    # Execute inside explicit transaction with Pessimistic Lock
    try:
        # Lock the seat row to serialize concurrent booking requests
        seat = (
            db.query(Seat)
            .with_for_update()
            .filter(Seat.id == req.seat_id)
            .first()
        )
        if not seat:
            raise HTTPException(status_code=404, detail="Seat not found")

        orig = (
            db.query(Station)
            .filter(Station.id == req.origin_station_id)
            .first()
        )
        dest = (
            db.query(Station)
            .filter(Station.id == req.destination_station_id)
            .first()
        )
        if not orig or not dest or orig.id == dest.id:
            raise HTTPException(
                status_code=400, detail="Invalid journey segment"
            )

        req_start, req_end = sorted([orig.order_index, dest.order_index])

        # Check existing bookings for overlap under lock
        existing = (
            db.query(BookingSegment)
            .filter(BookingSegment.seat_id == req.seat_id)
            .all()
        )
        for b in existing:
            if b.travel_date != req.travel_date:
                continue
            b_orig = db.query(Station).get(b.origin_station_id)
            b_dest = db.query(Station).get(b.destination_station_id)
            if check_overlap(
                req_start, req_end, b_orig.order_index, b_dest.order_index
            ):
                raise HTTPException(
                    status_code=409,
                    detail="Seat is already reserved for an overlapping segment of this trip",
                )

        fare = calculate_fare(
            db, req.origin_station_id, req.destination_station_id
        )

        booking = BookingSegment(
            seat_id=req.seat_id,
            origin_station_id=req.origin_station_id,
            destination_station_id=req.destination_station_id,
            travel_date=req.travel_date,
            passenger_name=req.passenger_name,
            fare=fare,
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
            "passenger_name": booking.passenger_name,
        }
    except Exception as e:
        db.rollback()
        raise e


def create_waitlist_entry(db: Session, req):
    try:
        orig = (
            db.query(Station)
            .filter(Station.id == req.origin_station_id)
            .first()
        )
        dest = (
            db.query(Station)
            .filter(Station.id == req.destination_station_id)
            .first()
        )
        if not orig or not dest or orig.id == dest.id:
            raise HTTPException(
                status_code=400, detail="Invalid journey segment"
            )

        existing_availability = get_seats_availability(
            db, req.origin_station_id, req.destination_station_id, req.travel_date
        )
        if any(seat["is_available"] for seat in existing_availability):
            raise HTTPException(
                status_code=400,
                detail="Seats are still available for this segment; book directly instead",
            )

        duplicate = (
            db.query(WaitlistEntry)
            .filter(
                WaitlistEntry.origin_station_id == req.origin_station_id,
                WaitlistEntry.destination_station_id == req.destination_station_id,
                WaitlistEntry.travel_date == req.travel_date,
                WaitlistEntry.passenger_name == req.passenger_name,
                WaitlistEntry.fulfilled_at.is_(None),
            )
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="Passenger is already waitlisted for this segment",
            )

        queue_position = (
            db.query(func.count(WaitlistEntry.id))
            .filter(
                WaitlistEntry.origin_station_id == req.origin_station_id,
                WaitlistEntry.destination_station_id == req.destination_station_id,
                WaitlistEntry.travel_date == req.travel_date,
                WaitlistEntry.fulfilled_at.is_(None),
            )
            .scalar()
            or 0
        ) + 1

        entry = WaitlistEntry(
            origin_station_id=req.origin_station_id,
            destination_station_id=req.destination_station_id,
            travel_date=req.travel_date,
            passenger_name=req.passenger_name,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

        return {
            "waitlist_id": entry.id,
            "passenger_name": entry.passenger_name,
            "origin": orig.name,
            "destination": dest.name,
            "travel_date": entry.travel_date,
            "queue_position": queue_position,
            "created_at": entry.created_at,
        }
    except Exception as e:
        db.rollback()
        raise e


def get_recent_waitlist(db: Session, limit: int = 6):
    entries = (
        db.query(WaitlistEntry)
        .filter(WaitlistEntry.fulfilled_at.is_(None))
        .order_by(WaitlistEntry.created_at.desc())
        .limit(limit)
        .all()
    )

    results = []
    for entry in entries:
        queue_position = (
            db.query(func.count(WaitlistEntry.id))
            .filter(
                WaitlistEntry.origin_station_id == entry.origin_station_id,
                WaitlistEntry.destination_station_id == entry.destination_station_id,
                WaitlistEntry.travel_date == entry.travel_date,
                WaitlistEntry.fulfilled_at.is_(None),
                WaitlistEntry.created_at <= entry.created_at,
            )
            .scalar()
            or 0
        )
        results.append(
            {
                "waitlist_id": entry.id,
                "passenger_name": entry.passenger_name,
                "origin": entry.origin.name,
                "destination": entry.destination.name,
                "travel_date": entry.travel_date,
                "queue_position": queue_position,
                "created_at": entry.created_at,
            }
        )
    return results


def cancel_booking(db: Session, booking_id: int):
    try:
        # 1. Fetch target booking segment
        booking = (
            db.query(BookingSegment)
            .filter(BookingSegment.id == booking_id)
            .first()
        )
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # 2. Extract primitive values BEFORE flushing to avoid DetachedInstanceError
        passenger_name = booking.passenger_name
        travel_date = booking.travel_date

        seat_number = None
        coach_number = None
        if booking.seat:
            seat_number = booking.seat.seat_number
            if booking.seat.coach:
                coach_number = booking.seat.coach.coach_number

        # 3. FIX: Unlink waitlist entries pointing to this booking so deletion doesn't break foreign keys
        db.query(WaitlistEntry).filter(
            WaitlistEntry.booking_id == booking_id
        ).update({"booking_id": None}, synchronize_session=False)

        # 4. Delete and FLUSH immediately so the seat is marked vacant in the DB session
        db.delete(booking)
        db.flush()

        # 5. Fetch all unfulfilled waitlist candidates for this travel date in FIFO order
        candidates = (
            db.query(WaitlistEntry)
            .filter(
                WaitlistEntry.travel_date == travel_date,
                WaitlistEntry.fulfilled_at.is_(None),
            )
            .order_by(WaitlistEntry.created_at.asc())
            .all()
        )

        # 6. Evaluate candidates dynamically using get_seats_availability (Handles all 3 scenarios)
        for entry in candidates:
            avail_seat_id = find_available_seat_id(
                db,
                entry.origin_station_id,
                entry.destination_station_id,
                travel_date,
            )

            if avail_seat_id:
                promoted_fare = calculate_fare(
                    db, entry.origin_station_id, entry.destination_station_id
                )

                promoted_booking = BookingSegment(
                    seat_id=avail_seat_id,
                    origin_station_id=entry.origin_station_id,
                    destination_station_id=entry.destination_station_id,
                    travel_date=travel_date,
                    passenger_name=entry.passenger_name,
                    fare=promoted_fare,
                )
                db.add(promoted_booking)
                db.flush()  # Assigns promoted_booking.id

                # Link waitlist entry to newly created booking & fulfill it
                entry.booking_id = promoted_booking.id
                entry.fulfilled_at = datetime.utcnow()
                break  # First eligible candidate promoted; stop processing

        # 7. Commit atomic transaction
        db.commit()

        return {
            "booking_id": booking_id,
            "passenger_name": passenger_name,
            "seat_number": seat_number,
            "coach_number": coach_number,
            "travel_date": travel_date,
        }

    except Exception as e:
        db.rollback()
        raise e


def get_admin_summary(db: Session):
    total_stations = db.query(func.count(Station.id)).scalar() or 0
    total_coaches = db.query(func.count(Coach.id)).scalar() or 0
    total_seats = db.query(func.count(Seat.id)).scalar() or 0
    total_bookings = db.query(func.count(BookingSegment.id)).scalar() or 0
    waitlist_count = (
        db.query(func.count(WaitlistEntry.id))
        .filter(WaitlistEntry.fulfilled_at.is_(None))
        .scalar()
        or 0
    )
    revenue = (
        db.query(func.coalesce(func.sum(BookingSegment.fare), 0)).scalar() or 0
    )

    unique_seats_used = (
        db.query(func.count(func.distinct(BookingSegment.seat_id))).scalar()
        or 0
    )
    utilization_pct = (
        (unique_seats_used / total_seats * 100) if total_seats else 0
    )

    coach_rows = (
        db.query(
            Coach.coach_number,
            Coach.total_seats,
            func.count(func.distinct(Seat.id)).label("seat_count"),
            func.count(BookingSegment.id).label("booking_count"),
            func.count(func.distinct(BookingSegment.seat_id)).label(
                "unique_seats_used"
            ),
        )
        .join(Seat, Seat.coach_id == Coach.id)
        .outerjoin(BookingSegment, BookingSegment.seat_id == Seat.id)
        .group_by(Coach.id)
        .order_by(Coach.coach_number)
        .all()
    )

    coach_utilization = []
    for (
        coach_number,
        total_seats_per_coach,
        _,
        booking_count,
        unique_used,
    ) in coach_rows:
        coach_utilization.append(
            {
                "coach_number": coach_number,
                "total_seats": total_seats_per_coach,
                "unique_seats_used": unique_used,
                "booking_count": booking_count,
                "utilization_pct": round(
                    (
                        (unique_used / total_seats_per_coach * 100)
                        if total_seats_per_coach
                        else 0
                    ),
                    2,
                ),
            }
        )

    return {
        "total_stations": total_stations,
        "total_coaches": total_coaches,
        "total_seats": total_seats,
        "total_bookings": total_bookings,
        "waitlist_count": waitlist_count,
        "unique_seats_used": unique_seats_used,
        "revenue": round(float(revenue), 2),
        "utilization_pct": round(utilization_pct, 2),
        "coach_utilization": coach_utilization,
    }