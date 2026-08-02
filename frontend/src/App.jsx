import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowRightLeft,
  ChevronDown,
  KeyRound,
  MapPin,
  LogOut,
  RefreshCw,
  Shield,
  TrainFront,
  Users,
  Wallet,
} from "lucide-react";

const API_BASE = "http://localhost:8000/api/v1";

export default function App() {
  const [stations, setStations] = useState([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [fare, setFare] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [staffAccessCode, setStaffAccessCode] = useState("");
  const [staffLoginInput, setStaffLoginInput] = useState("");
  const [staffLoginError, setStaffLoginError] = useState("");

  const isStaffAuthenticated = Boolean(staffAccessCode);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setTravelDate(today);
  }, []);

  useEffect(() => {
    let isMounted = true;

    axios
      .get(`${API_BASE}/stations`)
      .then((res) => {
        if (isMounted) {
          setStations(res.data);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) {
          setMessage({
            text: "Unable to load stations. Please refresh and try again.",
            type: "error",
          });
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingStations(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSwapRoute = () => {
    if (!origin || !destination) return;
    setOrigin(destination);
    setDestination(origin);
    setSeats([]);
    setFare(null);
    setSelectedSeat(null);
    setMessage({ text: "", type: "" });
  };

  const fetchAvailabilityAndFare = async () => {
    if (!origin || !destination || origin === destination || !travelDate) {
      setMessage({
        text: "Choose two different stations and a travel date to continue.",
        type: "error",
      });
      return;
    }

    setIsLoadingAvailability(true);
    try {
      const availRes = await axios.get(
        `${API_BASE}/seats/availability?origin_id=${origin}&destination_id=${destination}&travel_date=${travelDate}`,
      );
      const fareRes = await axios.get(
        `${API_BASE}/fare?origin_id=${origin}&destination_id=${destination}`,
      );
      setSeats(availRes.data);
      setFare(fareRes.data.fare);
      setSelectedSeat(null);
      setMessage({ text: "", type: "" });
    } catch (err) {
      setMessage({
        text: err.response?.data?.detail || "Error loading seats",
        type: "error",
      });
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const handleStaffLogin = () => {
    const trimmedCode = staffLoginInput.trim();
    if (!trimmedCode) {
      setStaffLoginError("Enter the staff access code.");
      return;
    }
    setStaffAccessCode(trimmedCode);
    setStaffLoginInput("");
    setStaffLoginError("");
  };

  const handleStaffLogout = () => {
    setStaffAccessCode("");
    setStaffLoginInput("");
    setStaffLoginError("");
  };

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
                Reserve the same seat for non-overlapping legs, check fares
                instantly, and manage a route with a cleaner booking flow.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="h-4 w-4" />
                  Route
                </span>
                <span className="text-sm font-medium">Select a route</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  <Users className="h-4 w-4" />
                  Available seats
                </span>
                <span className="text-sm font-medium">
                  {seats.length > 0
                    ? `${seats.filter((s) => s.is_available).length}/${seats.length}`
                    : "Waiting for search"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  <Wallet className="h-4 w-4" />
                  Fare
                </span>
                <span className="text-sm font-medium">
                  {fare ? `LKR ${fare}` : "No fare loaded yet"}
                </span>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                  <Shield className="h-4 w-4" />
                  Staff access
                </div>
                {isStaffAuthenticated ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-sm text-slate-300">
                      Admin tools enabled.
                    </div>
                    <button
                      type="button"
                      onClick={handleStaffLogout}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <input
                      type="password"
                      value={staffLoginInput}
                      onChange={(e) => {
                        setStaffLoginInput(e.target.value);
                        setStaffLoginError("");
                      }}
                      placeholder="Enter staff access code"
                      className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-emerald-300"
                    />
                    <button
                      type="button"
                      onClick={handleStaffLogin}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                    >
                      <KeyRound className="h-4 w-4" />
                      Unlock staff view
                    </button>
                    {staffLoginError && (
                      <div className="text-xs text-rose-300">
                        {staffLoginError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Plan a journey
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pick an origin and destination to load live seat availability.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSwapRoute}
                disabled={!origin || !destination || origin === destination}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Swap
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Origin station
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                    value={origin}
                    onChange={(e) => {
                      setOrigin(e.target.value);
                      setSeats([]);
                      setFare(null);
                      setSelectedSeat(null);
                    }}
                    disabled={isLoadingStations}
                  >
                    <option value="">
                      {isLoadingStations
                        ? "Loading stations..."
                        : "Select origin"}
                    </option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Destination station
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setSeats([]);
                      setFare(null);
                      setSelectedSeat(null);
                    }}
                    disabled={isLoadingStations}
                  >
                    <option value="">
                      {isLoadingStations
                        ? "Loading stations..."
                        : "Select destination"}
                    </option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Travel date
                </label>
                <input
                  type="date"
                  value={travelDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    setTravelDate(e.target.value);
                    setSeats([]);
                    setFare(null);
                    setSelectedSeat(null);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={fetchAvailabilityAndFare}
              disabled={
                !origin ||
                !destination ||
                origin === destination ||
                !travelDate ||
                isLoadingAvailability
              }
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoadingAvailability ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <TrainFront className="h-4 w-4" />
              )}
              {isLoadingAvailability
                ? "Loading seats..."
                : "Check available seats"}
            </button>

            {message.text && (
              <div
                className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${message.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
              >
                {message.text}
              </div>
            )}

            {seats.length > 0 ? (
              <div className="mt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Seat map
                  </h3>
                  <p className="text-sm text-slate-500">
                    Available seats appear in green. Choose one to continue.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {seats.map((seat) => (
                    <button
                      key={seat.seat_id}
                      type="button"
                      disabled={!seat.is_available}
                      onClick={() => setSelectedSeat(seat.seat_id)}
                      className={`rounded-2xl border p-4 text-left transition ${!seat.is_available ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed" : selectedSeat === seat.seat_id ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/20" : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400 hover:bg-emerald-100"}`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                        {seat.coach_number}
                      </div>
                      <div className="mt-2 text-lg font-semibold">
                        Seat {seat.seat_number}
                      </div>
                      <div className="mt-1 text-xs opacity-70">
                        {seat.is_available ? "Available" : "Already reserved"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Select a route and load seat availability to continue.
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}