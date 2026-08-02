import React, { useState } from "react";

export default function App() {
  const [stations, setStations] = useState([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [passengerName, setPassengerName] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-6">
        <main className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-xl backdrop-blur sm:p-8">
            <h2 className="text-xl font-semibold">Colombo-Badulla Segment Booking</h2>
          </div>
        </main>
      </div>
    </div>
  );
}