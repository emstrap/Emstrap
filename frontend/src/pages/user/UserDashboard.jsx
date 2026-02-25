import { useEffect, useState } from "react";
import API from "../../services/api";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function UserDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await API.get("/api/bookings");
        setBookings(res.data.data);
      } catch (err) {
        console.error("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <>
      <Navbar />
      <Container>
        <div className="flex justify-between items-center mt-10 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Bookings</h1>
          {user ? (
            <Link
              to="/booking"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              + New Booking
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Login to Book
            </Link>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading bookings...</p>
        ) : (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center p-10 bg-gray-50 dark:bg-gray-800 border border-dashed dark:border-gray-700 rounded-xl text-gray-400 dark:text-gray-500 transition-colors">
                You have no scheduled bookings.
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 transition-colors">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{b.ambulanceType} Ambulance</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      From: {b.pickupLocation?.address || "Selected Location"} <br />
                      To: {b.dropoffLocation?.address || "Selected Hospital"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Distance: {b.distanceKm} km
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-xl text-gray-900 dark:text-gray-100">₹{b.estimatedPrice}</span>
                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${b.status === "PENDING" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      b.status === "COMPLETED" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Container>
    </>
  );
}
