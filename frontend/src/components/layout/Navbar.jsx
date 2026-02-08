import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          
          <h1 className="text-xl font-bold text-red-600">Emstrap</h1>

          {/* Desktop menu */}
          <div className="hidden md:flex gap-6">
            <Link to="/">Emergency</Link>
            <Link to="/booking">Booking</Link>
            <Link to="/login">Login</Link>
          </div>

          {/* Mobile button */}
          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          <Link to="/">Emergency</Link><br/>
          <Link to="/booking">Booking</Link><br/>
          <Link to="/login">Login</Link>
        </div>
      )}
    </nav>
  );
}
