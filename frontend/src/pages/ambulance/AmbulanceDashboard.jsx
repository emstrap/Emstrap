import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getDriverHistory, acceptEmergency, declineEmergency } from "../../services/api";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function AmbulanceDashboard() {
  const [activeTab, setActiveTab] = useState("active"); // "active" | "accepted" | "rejected"
  const [requests, setRequests] = useState([]); // Actively pending nearby emergencies
  const [acceptedHistory, setAcceptedHistory] = useState([]);
  const [rejectedHistory, setRejectedHistory] = useState([]);
  const [socket, setSocket] = useState(null);

  // Expiry in milliseconds (1 min)
  const EXPIRY_MS = 1 * 60 * 1000;

  const fetchHistory = async () => {
    try {
      const res = await getDriverHistory();
      setRequests(res.data.ongoing);
      setAcceptedHistory(res.data.accepted);
      setRejectedHistory(res.data.rejected);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    }
  };

  useEffect(() => {
    fetchHistory();

    const newSocket = io("http://localhost:5000", { withCredentials: true });
    setSocket(newSocket);

    // Join room
    newSocket.emit("join_ambulance", {});

    newSocket.on("new_emergency_request", (data) => {
      // Add only if not already there to prevent dupes
      setRequests((prev) => {
        if (prev.find(r => r._id === data._id)) return prev;
        return [data, ...prev];
      });
    });

    // If another driver accepted it, remove it from our active list
    newSocket.on("emergency_accepted", (data) => {
      setRequests((prev) => prev.filter(r => r._id !== data.requestId));
    });

    return () => newSocket.close();
  }, []);

  // Cleanup effect: Remove requests older than 10 mins from the Active screen
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      setRequests((prev) =>
        prev.filter(req => {
          const reqTime = new Date(req.createdAt).getTime();
          return (now - reqTime) <= EXPIRY_MS;
        })
      );
    }, 10000); // Check every 10 secs
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (id) => {
    try {
      await acceptEmergency(id);
      toast.success("Emergency accepted!");

      // Move from active requests to accepted History locally
      const requestToMove = requests.find(r => r._id === id);
      if (requestToMove) {
        setAcceptedHistory([requestToMove, ...acceptedHistory]);
      }
      setRequests(requests.filter((r) => r._id !== id));

      if (socket) {
        // Start sending fake location updates for the demo
        setInterval(() => {
          socket.emit("update_location", {
            requestId: id,
            latitude: 12.9716, // dummy coords
            longitude: 77.5946
          });
        }, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error accepting request");
      // If someone else already took it, refresh the board
      if (error.response?.status === 400) {
        fetchHistory();
      }
    }
  };

  const handleDecline = async (id) => {
    try {
      await declineEmergency(id);
      toast.success("Request declined");

      // Move from active context locally
      const requestToMove = requests.find(r => r._id === id);
      if (requestToMove) {
        setRejectedHistory([requestToMove, ...rejectedHistory]);
      }
      setRequests(requests.filter((r) => r._id !== id));
    } catch (error) {
      toast.error("Error declining request");
    }
  };

  // Helper to render cards
  const renderCard = (req, type) => (
    <div key={req._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full uppercase font-bold">Emergency Request</span>
        <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleTimeString()}</span>
      </div>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        Patient needs help immediately at Location [{req.location?.latitude?.toFixed(4)}, {req.location?.longitude?.toFixed(4)}].
      </p>

      {type === "active" && (
        <div className="mt-4 flex max-w-sm gap-2">
          <button
            onClick={() => handleAccept(req._id)}
            className="bg-green-600 hover:bg-green-700 text-white flex-1 py-2 rounded-lg font-semibold transition"
          >
            Accept
          </button>
          <button
            onClick={() => handleDecline(req._id)}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 flex-1 py-2 rounded-lg font-semibold transition"
          >
            Decline
          </button>
        </div>
      )}

      {type === "accepted" && (
        <div className="mt-4 pt-3 border-t dark:border-gray-700 border-dashed text-green-600 font-semibold text-sm">
          ✓ Accepted & Assigned to you
        </div>
      )}

      {type === "rejected" && (
        <div className="mt-4 pt-3 border-t dark:border-gray-700 border-dashed text-gray-500 font-semibold text-sm">
          ✗ You declined this request
        </div>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <Container>
        <div className="mt-10 mb-8 border-b dark:border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Driver Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">View and respond to nearby emergency SOS dispatches.</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl max-w-md">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'active' ? 'bg-white dark:bg-gray-600 text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Active ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab("accepted")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'accepted' ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Accepted ({acceptedHistory.length})
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'rejected' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Declined ({rejectedHistory.length})
          </button>
        </div>

        <div className="space-y-4 max-w-3xl mb-12">
          {activeTab === "active" && (
            <>
              {requests.map((req) => renderCard(req, "active"))}
              {requests.length === 0 && (
                <div className="text-center p-10 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed dark:border-gray-700">
                  <span className="block text-3xl mb-2">🚑</span>
                  No active emergencies.
                </div>
              )}
            </>
          )}

          {activeTab === "accepted" && (
            <>
              {acceptedHistory.slice(0, 2).map((req) => renderCard(req, "accepted"))}
              {acceptedHistory.length > 2 && (
                <Link to="/booking" className="block text-center mt-4 text-red-600 font-semibold hover:underline">
                  View All Accepted History
                </Link>
              )}
              {acceptedHistory.length === 0 && (
                <div className="text-center p-10 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed dark:border-gray-700">
                  No accepted history available.
                </div>
              )}
            </>
          )}

          {activeTab === "rejected" && (
            <>
              {rejectedHistory.slice(0, 2).map((req) => renderCard(req, "rejected"))}
              {rejectedHistory.length > 2 && (
                <Link to="/booking" className="block text-center mt-4 text-gray-600 dark:text-gray-300 font-semibold hover:underline">
                  View All Declined History
                </Link>
              )}
              {rejectedHistory.length === 0 && (
                <div className="text-center p-10 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed dark:border-gray-700">
                  No declined history available.
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </>
  );
}
