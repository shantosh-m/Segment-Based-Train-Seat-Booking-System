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
