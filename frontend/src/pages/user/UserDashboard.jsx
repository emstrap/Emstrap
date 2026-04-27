import { useEffect, useState } from "react";
import API from "../../services/api";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { API_URL } from "../../services/api";

export default function UserDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchBookings();

    const socket = io(API_URL, { withCredentials: true });

    // Listen for events that should trigger a list refresh
    socket.on("trip_completed", () => {
      toast.success("One of your trips has been completed!");
      fetchBookings();
    });

    socket.on("emergency_cancelled", () => {
      toast.error("An assignment was cancelled.");
      fetchBookings();
    });

    socket.on("ambulance_assigned", () => {
      toast.success("An ambulance has been assigned to your request!");
      fetchBookings();
    });

    // Join user-specific room if available, or just join the general user room
    // For now, these events are usually emitted to request rooms, 
    // so we might need the driver to emit to a 'user_{id}' room as well.
    if (user?._id) {
      socket.emit("join_user", { userId: user._id });
    }

    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  const handleCancel = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[250px]">
        <div>
          <p className="font-bold text-gray-900 dark:text-gray-100">Cancel Booking?</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Are you sure you want to cancel this booking?</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            No, Keep it
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              processCancel(id);
            }}
            className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000, position: 'top-center' });
  };

  const processCancel = async (id) => {
    const loadingToast = toast.loading("Cancelling booking...");
    try {
      await API.put(`/api/bookings/${id}/cancel`);
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "CANCELLED" } : b))
      );
      toast.success("Booking cancelled successfully", { id: loadingToast });
    } catch (err) {
      console.error("Failed to cancel booking", err);
      toast.error("Failed to cancel booking", { id: loadingToast });
    }
  };

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
                    <h3 className={`font-bold text-lg ${b.isEmergency ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {b.ambulanceType} {b.isEmergency ? '⚠️' : 'Ambulance'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      From: {b.pickupLocation?.address || "Selected Location"} <br />
                      {!b.isEmergency && `To: ${b.dropoffLocation?.address || "Selected Hospital"}`}
                    </p>
                    {b.distanceKm && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Distance: {b.distanceKm} km
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-xl text-gray-900 dark:text-gray-100">
                      {b.estimatedPrice > 0 ? `₹${b.estimatedPrice}` : "FREE"}
                    </span>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${b.status === "PENDING" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          b.status === "COMPLETED" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                            b.status === "CANCELLED" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                              "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                        {b.status}
                      </span>
                      {b.status === "PENDING" || b.status === "ACCEPTED" || b.status === "IN_PROGRESS" ? (
                        <div className="flex flex-col items-end gap-2">
                          {(b.status === "PENDING" || b.status === "ACCEPTED" || b.status === "IN_PROGRESS") && b.requestId && (
                            <Link
                              to={b.isEmergency ? `/emergency` : `/tracking/${b.requestId}`}
                              className={`${b.isEmergency ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors text-center w-full`}
                            >
                              Track Live
                            </Link>
                          )}
                          <button
                            onClick={() => handleCancel(b._id)}
                            className="text-red-600 hover:text-red-700 text-xs font-bold underline"
                          >
                            Cancel Booking
                          </button>
                        </div>
                      ) : null}
                    </div>
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
