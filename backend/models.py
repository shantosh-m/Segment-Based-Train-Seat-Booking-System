from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime, func
from sqlalchemy.orm import relationship
from database import Base

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    order_index = Column(Integer, unique=True, nullable=False)
    distance_km = Column(Float, nullable=False)

class Coach(Base):
    __tablename__ = "coaches"

    id = Column(Integer, primary_key=True, index=True)
    coach_number = Column(String, nullable=False)
    total_seats = Column(Integer, nullable=False)
    
    seats = relationship("Seat", back_populates="coach", cascade="all, delete-orphan")

class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("coaches.id"), nullable=False)
    seat_number = Column(Integer, nullable=False)

    coach = relationship("Coach", back_populates="seats")
    bookings = relationship("BookingSegment", back_populates="seat")

class BookingSegment(Base):
    __tablename__ = "booking_segments"

    id = Column(Integer, primary_key=True, index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False)
    origin_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    destination_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    travel_date = Column(Date, nullable=False)
    passenger_name = Column(String, nullable=False)
    fare = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    seat = relationship("Seat", back_populates="bookings")
    origin = relationship("Station", foreign_keys=[origin_station_id])
    destination = relationship("Station", foreign_keys=[destination_station_id])


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"

    id = Column(Integer, primary_key=True, index=True)
    origin_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    destination_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    travel_date = Column(Date, nullable=False)
    passenger_name = Column(String, nullable=False)
    booking_id = Column(Integer, ForeignKey("booking_segments.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    fulfilled_at = Column(DateTime(timezone=True), nullable=True)

    origin = relationship("Station", foreign_keys=[origin_station_id])
    destination = relationship("Station", foreign_keys=[destination_station_id])