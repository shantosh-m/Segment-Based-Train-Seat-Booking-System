import React, { useEffect, useMemo, useState } from "react";
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
  const [passengerName, setPassengerName] = useState("");
  const [fare, setFare] = useState(null);
  const [fareBreakdown, setFareBreakdown] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentWaitlist, setRecentWaitlist] = useState([]);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingSort, setBookingSort] = useState("newest");
  const [recentBookingsLimit, setRecentBookingsLimit] = useState(6);
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [waitlistPassengerName, setWaitlistPassengerName] = useState("");
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingWaitlist, setIsLoadingWaitlist] = useState(true);
  const [adminSummary, setAdminSummary] = useState(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isWaitlisting, setIsWaitlisting] = useState(false);
  const [cancelingBookingId, setCancelingBookingId] = useState(null);
  const [staffAccessCode, setStaffAccessCode] = useState(
    () => sessionStorage.getItem("staff_access_code") || "",
  );
  const [staffLoginInput, setStaffLoginInput] = useState("");
  const [staffLoginError, setStaffLoginError] = useState("");

  const isStaffAuthenticated = Boolean(staffAccessCode);

  const originStation = useMemo(
    () => stations.find((station) => String(station.id) === String(origin)),
    [stations, origin],
  );

  const destinationStation = useMemo(
    () =>
      stations.find((station) => String(station.id) === String(destination)),
    [stations, destination],
  );

  const selectedSeatDetails = useMemo(
    () => seats.find((seat) => seat.seat_id === selectedSeat),
    [seats, selectedSeat],
  );

  const getStaffRequestConfig = () => ({
    headers: {
      "X-Staff-Access": staffAccessCode,
    },
  });

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

  useEffect(() => {
    let isMounted = true;

    if (!isStaffAuthenticated) {
      setAdminSummary(null);
      setIsLoadingAdmin(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingAdmin(true);
    axios
      .get(`${API_BASE}/admin/summary`, getStaffRequestConfig())
      .then((res) => {
        if (isMounted) {
          setAdminSummary(res.data);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingAdmin(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isStaffAuthenticated, staffAccessCode]);

  useEffect(() => {
    let isMounted = true;

    if (!isStaffAuthenticated) {
      setRecentBookings([]);
      setIsLoadingBookings(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingBookings(true);
    axios
      .get(
        `${API_BASE}/bookings/recent?limit=${recentBookingsLimit}`,
        getStaffRequestConfig(),
      )
      .then((res) => {
        if (isMounted) {
          setRecentBookings(res.data);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingBookings(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isStaffAuthenticated, recentBookingsLimit, staffAccessCode]);

  useEffect(() => {
    let isMounted = true;

    if (!isStaffAuthenticated) {
      setRecentWaitlist([]);
      setIsLoadingWaitlist(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingWaitlist(true);
    axios
      .get(`${API_BASE}/waitlist/recent?limit=6`, getStaffRequestConfig())
      .then((res) => {
        if (isMounted) {
          setRecentWaitlist(res.data);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingWaitlist(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isStaffAuthenticated, staffAccessCode]);

  const refreshRecentBookings = async () => {
    if (!isStaffAuthenticated) return;
    setIsLoadingBookings(true);
    try {
      const refreshedBookings = await axios.get(
        `${API_BASE}/bookings/recent?limit=${recentBookingsLimit}`,
        getStaffRequestConfig(),
      );
      setRecentBookings(refreshedBookings.data);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const refreshRecentWaitlist = async () => {
    if (!isStaffAuthenticated) return;
    setIsLoadingWaitlist(true);
    try {
      const refreshedWaitlist = await axios.get(
        `${API_BASE}/waitlist/recent?limit=6`,
        getStaffRequestConfig(),
      );
      setRecentWaitlist(refreshedWaitlist.data);
    } finally {
      setIsLoadingWaitlist(false);
    }
  };

  const refreshAdminSummary = async () => {
    if (!isStaffAuthenticated) return;
    try {
      const refreshedSummary = await axios.get(
        `${API_BASE}/admin/summary`,
        getStaffRequestConfig(),
      );
      setAdminSummary(refreshedSummary.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStaffLogin = async () => {
    const trimmedCode = staffLoginInput.trim();
    if (!trimmedCode) {
      setStaffLoginError("Enter the staff access code.");
      return;
    }

    try {
      await axios.get(`${API_BASE}/admin/summary`, {
        headers: { "X-Staff-Access": trimmedCode },
      });
      sessionStorage.setItem("staff_access_code", trimmedCode);
      setStaffAccessCode(trimmedCode);
      setStaffLoginInput("");
      setStaffLoginError("");
      setMessage({ text: "Staff access enabled.", type: "success" });
    } catch (err) {
      setStaffLoginError(
        err.response?.data?.detail || "Invalid staff access code.",
      );
    }
  };

  const handleStaffLogout = () => {
    sessionStorage.removeItem("staff_access_code");
    setStaffAccessCode("");
    setStaffLoginInput("");
    setStaffLoginError("");
    setAdminSummary(null);
    setRecentBookings([]);
    setRecentWaitlist([]);
    setExpandedBookingId(null);
    setIsLoadingAdmin(false);
    setIsLoadingBookings(false);
    setIsLoadingWaitlist(false);
    setMessage({ text: "Staff access disabled.", type: "success" });
  };

  const loadMoreRecentBookings = async () => {
    setRecentBookingsLimit((currentLimit) => currentLimit + 6);
  };

  const resetRecentBookingsView = () => {
    setBookingSearch("");
    setBookingSort("newest");
    setExpandedBookingId(null);
    setRecentBookingsLimit(6);
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
      setFareBreakdown(fareRes.data.breakdown);
      setSelectedSeat(null);
      setPassengerName("");
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

  const handleSwapRoute = () => {
    if (!origin || !destination) return;
    setOrigin(destination);
    setDestination(origin);
    setSeats([]);
    setFare(null);
    setFareBreakdown(null);
    setSelectedSeat(null);
    setPassengerName("");
    setWaitlistPassengerName("");
    setMessage({ text: "", type: "" });
  };

  const handleBooking = async () => {
    if (!selectedSeat || !passengerName.trim()) {
      setMessage({
        text: "Enter a passenger name before confirming the booking.",
        type: "error",
      });
      return;
    }

    setIsBooking(true);
    try {
      const res = await axios.post(`${API_BASE}/bookings`, {
        seat_id: selectedSeat,
        origin_station_id: parseInt(origin),
        destination_station_id: parseInt(destination),
        travel_date: travelDate,
        passenger_name: passengerName,
      });
      setMessage({
        text: `Successfully booked Seat ${res.data.seat_number} (${res.data.coach_number}) for LKR ${res.data.fare}!`,
        type: "success",
      });
      setPassengerName("");
      setWaitlistPassengerName("");
      setExpandedBookingId(res.data.booking_id);
      await refreshRecentBookings();
      await fetchAvailabilityAndFare();
      await refreshAdminSummary();
    } catch (err) {
      setMessage({
        text:
          err.response?.data?.detail ||
          "Booking failed. Seat may have been taken.",
        type: "error",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!waitlistPassengerName.trim()) {
      setMessage({
        text: "Enter a passenger name before joining the waitlist.",
        type: "error",
      });
      return;
    }

    if (!origin || !destination || origin === destination || !travelDate) {
      setMessage({
        text: "Select a valid route and travel date before joining the waitlist.",
        type: "error",
      });
      return;
    }

    setIsWaitlisting(true);
    try {
      const res = await axios.post(`${API_BASE}/waitlist`, {
        origin_station_id: parseInt(origin),
        destination_station_id: parseInt(destination),
        travel_date: travelDate,
        passenger_name: waitlistPassengerName,
      });
      setMessage({
        text: `Added ${res.data.passenger_name} to the waitlist for ${res.data.origin} to ${res.data.destination} (queue #${res.data.queue_position}).`,
        type: "success",
      });
      setWaitlistPassengerName("");
      await refreshRecentWaitlist();
      await refreshAdminSummary();
    } catch (err) {
      setMessage({
        text: err.response?.data?.detail || "Unable to join the waitlist.",
        type: "error",
      });
    } finally {
      setIsWaitlisting(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const booking = recentBookings.find(
      (item) => item.booking_id === bookingId,
    );
    if (!booking) return;

    const confirmed = window.confirm(
      `Cancel booking for ${booking.passenger_name} (${booking.coach_number}-${booking.seat_number})?`,
    );
    if (!confirmed) return;

    setCancelingBookingId(bookingId);
    try {
      await axios.delete(
        `${API_BASE}/bookings/${bookingId}`,
        getStaffRequestConfig(),
      );
      setMessage({
        text: `Cancelled booking for ${booking.passenger_name}.`,
        type: "success",
      });
      if (expandedBookingId === bookingId) {
        setExpandedBookingId(null);
      }
      await refreshRecentBookings();
      await refreshRecentWaitlist();
      if (origin && destination && origin !== destination) {
        await fetchAvailabilityAndFare();
      }
      await refreshAdminSummary();
    } catch (err) {
      setMessage({
        text: err.response?.data?.detail || "Cancellation failed.",
        type: "error",
      });
    } finally {
      setCancelingBookingId(null);
    }
  };

  const availableSeatCount = seats.filter((seat) => seat.is_available).length;

  const filteredRecentBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();
    if (!query) return recentBookings;

    return recentBookings.filter((booking) => {
      const haystack = [
        booking.passenger_name,
        booking.origin,
        booking.destination,
        booking.travel_date,
        booking.coach_number,
        String(booking.seat_number),
        String(booking.fare),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [bookingSearch, recentBookings]);

  const sortedRecentBookings = useMemo(() => {
    const bookings = [...filteredRecentBookings];

    switch (bookingSort) {
      case "oldest":
        return bookings.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at),
        );
      case "fare-high":
        return bookings.sort((a, b) => b.fare - a.fare);
      case "fare-low":
        return bookings.sort((a, b) => a.fare - b.fare);
      case "newest":
      default:
        return bookings.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
    }
  }, [bookingSort, filteredRecentBookings]);

  const bookingSummary = useMemo(() => {
    const totalBookings = sortedRecentBookings.length;
    const totalRevenue = sortedRecentBookings.reduce(
      (sum, booking) => sum + Number(booking.fare || 0),
      0,
    );
    const averageFare = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    return {
      totalBookings,
      totalRevenue,
      averageFare,
    };
  }, [sortedRecentBookings]);

  const journeySummary =
    originStation && destinationStation
      ? `${originStation.name} to ${destinationStation.name}`
      : "Select a route to see live availability";

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
                <span className="text-sm font-medium">{journeySummary}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  <Users className="h-4 w-4" />
                  Available seats
                </span>
                <span className="text-sm font-medium">
                  {seats.length > 0
                    ? `${availableSeatCount}/${seats.length}`
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
                      setPassengerName("");
                      setWaitlistPassengerName("");
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
                      setPassengerName("");
                      setWaitlistPassengerName("");
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
                    setFareBreakdown(null);
                    setSelectedSeat(null);
                    setPassengerName("");
                    setWaitlistPassengerName("");
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
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Seat map
                    </h3>
                    <p className="text-sm text-slate-500">
                      Available seats appear in green. Choose one to continue.
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <div className="font-medium text-slate-900">
                      {journeySummary}
                    </div>
                    <div>LKR {fare}</div>
                    <div>{travelDate || "No travel date selected"}</div>
                  </div>
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

                {selectedSeat && selectedSeatDetails && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Confirm booking
                      </h3>
                      <p className="text-sm text-slate-500">
                        You are booking {selectedSeatDetails.coach_number} seat{" "}
                        {selectedSeatDetails.seat_number} for {journeySummary}{" "}
                        on {travelDate}.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <input
                        type="text"
                        value={passengerName}
                        onChange={(e) => setPassengerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleBooking();
                          }
                        }}
                        placeholder="Enter passenger full name"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleBooking}
                        disabled={isBooking}
                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                      >
                        {isBooking ? "Booking..." : "Confirm & Pay"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Select a route and load seat availability to continue.
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section
              className={
                isStaffAuthenticated
                  ? "rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8"
                  : "hidden"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Admin snapshot
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Live operational metrics for coaches, seats, bookings, and
                    revenue.
                  </p>
                </div>
              </div>

              {isLoadingAdmin ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Loading admin metrics...
                </div>
              ) : adminSummary ? (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        Bookings
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {adminSummary.total_bookings}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        Revenue
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        LKR {adminSummary.revenue.toFixed(0)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        Seats used
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {adminSummary.unique_seats_used}/
                        {adminSummary.total_seats}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        Utilization
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {adminSummary.utilization_pct.toFixed(0)}%
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        Waitlist
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {adminSummary.waitlist_count}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {adminSummary.coach_utilization.map((coach) => (
                      <div
                        key={coach.coach_number}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {coach.coach_number}
                            </div>
                            <div className="text-xs text-slate-500">
                              {coach.unique_seats_used}/{coach.total_seats}{" "}
                              unique seats used
                            </div>
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            <div className="font-semibold text-slate-900">
                              {coach.booking_count} bookings
                            </div>
                            <div>
                              {coach.utilization_pct.toFixed(0)}% utilized
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Admin metrics are unavailable.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Waitlist
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Join a queue when a segment is fully booked, and review the
                    most recent requests.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  Selected route
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {journeySummary} on {travelDate || "no date selected"}
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  {seats.length > 0 && availableSeatCount === 0
                    ? "This segment is fully booked. You can still join the waitlist."
                    : "If the selected segment becomes full, passengers can be queued here."}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={waitlistPassengerName}
                  onChange={(e) => setWaitlistPassengerName(e.target.value)}
                  placeholder="Passenger name for waitlist"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleJoinWaitlist}
                  disabled={
                    isWaitlisting ||
                    !origin ||
                    !destination ||
                    origin === destination ||
                    !travelDate
                  }
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
                >
                  {isWaitlisting ? "Joining..." : "Join waitlist"}
                </button>
              </div>

              <div
                className={isStaffAuthenticated ? "mt-6 space-y-3" : "hidden"}
              >
                {isLoadingWaitlist ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    Loading waitlist entries...
                  </div>
                ) : recentWaitlist.length > 0 ? (
                  recentWaitlist.map((entry) => (
                    <div
                      key={entry.waitlist_id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {entry.passenger_name}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {entry.origin} to {entry.destination}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {entry.travel_date}
                          </div>
                        </div>
                        <div className="text-right text-sm text-slate-500">
                          <div className="font-semibold text-slate-900">
                            Queue #{entry.queue_position}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    No active waitlist entries yet.
                  </div>
                )}
              </div>
            </section>

            <section
              className={
                isStaffAuthenticated
                  ? "rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8"
                  : "hidden"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Recent bookings
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    A quick audit trail of the latest reservations made through
                    the system.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search bookings
                </label>
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Passenger, route, coach, or seat"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    Visible
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {bookingSummary.totalBookings}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    Revenue
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    LKR {bookingSummary.totalRevenue.toFixed(0)}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    Avg fare
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    LKR {bookingSummary.averageFare.toFixed(0)}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Sort by
                </label>
                <select
                  value={bookingSort}
                  onChange={(e) => setBookingSort(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="fare-high">Fare high to low</option>
                  <option value="fare-low">Fare low to high</option>
                </select>
              </div>

              <button
                type="button"
                onClick={resetRecentBookingsView}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Reset booking view
              </button>

              <div className="mt-6 space-y-4">
                {isLoadingBookings ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    Loading booking history...
                  </div>
                ) : sortedRecentBookings.length > 0 ? (
                  sortedRecentBookings.map((booking) => (
                    <div
                      key={booking.booking_id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedBookingId(
                            expandedBookingId === booking.booking_id
                              ? null
                              : booking.booking_id,
                          )
                        }
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {booking.passenger_name}
                            </div>
                            <div className="mt-1 text-sm text-slate-500">
                              {booking.origin} to {booking.destination}
                            </div>
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            <div className="font-semibold text-slate-900">
                              {booking.coach_number}-{booking.seat_number}
                            </div>
                            <div>LKR {booking.fare}</div>
                          </div>
                        </div>
                      </button>

                      {expandedBookingId === booking.booking_id && (
                        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 sm:grid-cols-2">
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Passenger
                            </div>
                            <div className="mt-1 font-medium text-slate-900">
                              {booking.passenger_name}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Route
                            </div>
                            <div className="mt-1 font-medium text-slate-900">
                              {booking.origin} to {booking.destination}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Coach / Seat
                            </div>
                            <div className="mt-1 font-medium text-slate-900">
                              {booking.coach_number}-{booking.seat_number}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Fare
                            </div>
                            <div className="mt-1 font-medium text-slate-900">
                              LKR {booking.fare}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Travel date
                            </div>
                            <div className="mt-1 font-medium text-slate-900">
                              {booking.travel_date}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {new Date(booking.created_at).toLocaleString()}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCancelBooking(booking.booking_id)
                          }
                          disabled={cancelingBookingId === booking.booking_id}
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancelingBookingId === booking.booking_id
                            ? "Cancelling..."
                            : "Cancel"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    {bookingSearch.trim()
                      ? "No bookings match that search."
                      : "No bookings yet. The first reservation will appear here."}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={loadMoreRecentBookings}
                disabled={isLoadingBookings}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                {isLoadingBookings ? "Loading..." : "Load more bookings"}
              </button>
            </section>

            {fareBreakdown && (
              <section className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8">
                <h2 className="text-xl font-semibold text-slate-900">
                  Fare breakdown
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Distance, journey-length tiering, and peak-time pricing all
                  factor into the final price.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      Distance
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {fareBreakdown.distance_km} km
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      Base fare
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      LKR {fareBreakdown.base_fare}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      Journey tier
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      x{fareBreakdown.multiplier}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      Peak factor
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      x{fareBreakdown.peak_multiplier}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-950 bg-slate-950 p-4 text-white">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">
                    Final fare
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    LKR {fareBreakdown.final_fare}
                  </div>
                </div>
              </section>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}