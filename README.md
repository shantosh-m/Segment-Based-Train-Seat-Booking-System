# Segment-Based-Train-Seat-Booking-System

A booking system for Sri Lanka's Colombo Fort-Badulla line - one of the world's most celebrated scenic train journeys - that lets a single reserved seat be booked independently for multiple, non-overlapping legs of the same journey.

Built with **FastAPI**, **SQLAlchemy**, **PostgreSQL**, **React (Vite)**, and **Tailwind CSS**.

## Prerequisites

- Docker & Docker Compose installed on your system.

## Run

The project is designed to start with a single command:

```bash
cp .env.example .env   

docker-compose up --build
```

That brings up Postgres, the FastAPI backend, and the Vite frontend.

## Configurable inventory

The seed data is environment-driven so the route and inventory can grow without code changes.

Supported variables:

- `COACH_COUNT` controls how many coaches are created.
- `SEATS_PER_COACH` controls the number of seats per coach.
- `COACH_PREFIX` controls the coach numbering prefix.
- `SEED_STATIONS_JSON` accepts a JSON array of station objects with `name`, `order_index`, and `distance_km`.

The same variables are available in `.env.example` for local overrides.

## Access

- Passenger booking is open on the main web app.
- Staff-only views such as admin metrics, recent booking history, cancellation, and waitlist review require `STAFF_ACCESS_CODE`.
- The same code is used in the frontend staff login card and the backend API guard.


📐 Core Architecture & Design Decisions

## Concurrency Safety: Pessimistic Row-Level Locking (FOR UPDATE)

implemented pessimistic database locking (Seat.with_for_update()) inside an explicit transaction block during booking creation.

By acquiring SELECT ... FOR UPDATE on the requested Seat row at the start of the transaction, PostgreSQL serializes incoming booking requests for that specific seat. Other concurrent attempts wait cleanly until the active transaction either commits or rolls back, guaranteeing zero double-bookings.

## Dynamic Distance & Tiered Pricing Engine

Fares are computed dynamically based on linear track distance (d), journey distance tiering, and time-based peak factors:


🌟 Extra Credit Features Built

## Automated FIFO Waitlist Engine:

- Passengers attempting to book fully occupied segments can join a queue.

## Staff Security & Role-Based Administrative Tools:

- Protected endpoints guarded by FastAPI dependency header guards (X-Staff-Access).

- Session-persistent staff authentication toggle in the UI (sessionStorage).

- Administrative Snapshot Dashboard showing real-time revenue, total bookings, overall line utilization %, and per-coach utilization breakdown.

## Booking History Audit Log & Search Tools:

- Searchable, sortable passenger reservation history.

- Client-side search filters matching passenger names, routes, coaches, or seat numbers.

- CSV Export utility generating downloadable .csv audit logs directly from the UI.

## Interactive Fare Breakdown UI:

- Interactive UI card surfacing the underlying pricing components (distance charge, length multiplier, peak surcharge) before checkout.
    

## Notes

- Seat occupancy is modeled as segment overlap, so the same physical seat can be reused for non-overlapping legs.
- Booking conflicts are enforced server-side.
- The frontend includes seat availability, seat-map style selection, booking history, cancellation, filters, sorting, CSV export, summary stats, an admin snapshot, a fare breakdown panel, and a waitlist UI for fully booked segments.
- Fare pricing is distance-aware and also applies journey-length and peak-time multipliers.