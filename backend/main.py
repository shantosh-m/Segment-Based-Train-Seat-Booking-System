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