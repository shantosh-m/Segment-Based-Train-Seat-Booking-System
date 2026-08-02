import React, { useState } from "react";
import { MapPin, TrainFront, Users, Wallet } from "lucide-react";

export default function App() {
  const [stations, setStations] = useState([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [seats, setSeats] = useState([]);
  const [fare, setFare] = useState(null);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-6">
        <header className="overflow-hidden rounded-[2rem] border border-white/60 bg-slate-950 text-white shadow-2xl shadow-slate-900/10">
          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1.6fr_1fr] lg:px-10 lg:py-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
                <TrainFront className="h-4 w-4" />
                Colombo Fort to Badulla line
              </div>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Segment-based seat booking for scenic rail journeys.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Reserve the same seat for non-overlapping legs, check fares instantly, and manage a route with a cleaner booking flow.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="h-4 w-4" /> Route
                </span>
                <span className="text-sm font-medium">Select a route</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  <Users className="h-4 w-4" /> Available seats
                </span>
                <span className="text-sm font-medium">Waiting for search</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  <Wallet className="h-4 w-4" /> Fare
                </span>
                <span className="text-sm font-medium">No fare loaded yet</span>
              </div>
            </div>
          </div>
        </header>
      </div>
    </div>
  );
}