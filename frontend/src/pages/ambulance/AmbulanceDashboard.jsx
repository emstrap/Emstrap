import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../../services/api";
import { getDriverHistory, acceptEmergency, declineEmergency } from "../../services/api";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import LiveTrackingMap from "../../components/map/LiveTrackingMap";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function AmbulanceDashboard() {
  const [requests, setRequests] = useState([]); // Actively pending nearby emergencies
  // "active" state is now represented by mapping over requests in a modal over the map
  // "accepted" history is tracked to route the driver to the user, handled inside the map
  const [acceptedHistory, setAcceptedHistory] = useState([]);
  const [socket, setSocket] = useState(null);

  // Real-time Driver Tracking State
  const [driverLocation, setDriverLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const watchIdRef = useRef(null);

  // Expiry in milliseconds (1 min)
  const EXPIRY_MS = 1 * 60 * 1000;

  const fetchHistory = async () => {
    try {
      const res = await getDriverHistory();
      setRequests(res.data.ongoing);
      setAcceptedHistory(res.data.accepted);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    }
  };

  useEffect(() => {
    fetchHistory();

    const newSocket = io(API_URL, { withCredentials: true });
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

    return () => {
      newSocket.close();
      if (watchIdRef.current) {
        // Clear either interval or watch, depending on what it is
        if (typeof watchIdRef.current === 'number' && watchIdRef.current > 1000) {
          clearInterval(watchIdRef.current);
        } else {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      }
    };
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
        // Driver must join the room to receive user updates and cancellations
        socket.emit("track_request", { requestId: id });

        socket.on("user_location", (data) => {
          if (data.requestId === id) {
            setUserLocation({ lat: data.lat || data.latitude, lng: data.lng || data.longitude });
          }
        });

        socket.on("emergency_cancelled", (data) => {
          if (data.requestId === id) {
            toast.error("The patient has cancelled the emergency request.");
            // Stop tracking and clean up
            if (watchIdRef.current) {
              if (typeof watchIdRef.current === 'number' && watchIdRef.current > 1000) {
                clearInterval(watchIdRef.current);
              } else {
                navigator.geolocation.clearWatch(watchIdRef.current);
              }
            }
            setDriverLocation(null);
            setUserLocation(null);
            fetchHistory(); // refresh the dash to move it out of accepted
            socket.off("user_location");
            socket.off("emergency_cancelled");
          }
        });

        // Start watching actual GPS location
        if (navigator.geolocation) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              const currentLoc = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              };

              setDriverLocation(currentLoc);

              // Broadcast live position to the user
              socket.emit("update_location", {
                requestId: id,
                ...currentLoc
              });
            },
            (err) => {
              console.error("Error watching position", err);
              toast.error("GPS signal lost. Falling back to simulated location...");

              // Fallback to simulated location if watchPosition fails
              watchIdRef.current = setInterval(() => {
                const dummyLoc = {
                  lat: 12.9716 + (Math.random() * 0.005),
                  lng: 77.5946 + (Math.random() * 0.005)
                };
                setDriverLocation(dummyLoc);
                socket.emit("update_location", {
                  requestId: id,
                  ...dummyLoc
                });
              }, 3000);
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
          );
        } else {
          toast.error("Geolocation is not supported by your browser");
        }
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

      setRequests(requests.filter((r) => r._id !== id));
    } catch (error) {
      toast.error("Error declining request");
    }
  };

  // The currently assigned emergency the driver is en route to
  const currentAssignment = acceptedHistory.length > 0 ? acceptedHistory[0] : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      
      {/* Fullscreen Map Area */}
      <div className="relative flex-1 bg-gray-100 dark:bg-gray-900 w-full">
        <LiveTrackingMap
          userLocation={userLocation || (currentAssignment ? { lat: currentAssignment.location?.latitude, lng: currentAssignment.location?.longitude } : null)}
          driverLocation={driverLocation}
          height="100%"
        />

        {/* Floating Accepted Status Header */}
        {currentAssignment && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-md">
             <div className="bg-green-600 shadow-xl rounded-2xl p-3 flex items-center gap-3">
               <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                 🚑
               </div>
               <div className="text-white">
                 <h3 className="font-bold text-base">En Route to Patient</h3>
                 <p className="text-sm opacity-90 truncate">
                   ({currentAssignment.location?.latitude?.toFixed(4)}, {currentAssignment.location?.longitude?.toFixed(4)})
                 </p>
               </div>
               <Link to="/booking-history" className="ml-auto text-xs bg-white text-green-700 px-3 py-1.5 rounded-full font-bold shadow-sm">
                 Details
               </Link>
             </div>
          </div>
        )}

        {/* Incoming Emergency Modal Overlays */}
        {/* We stack them absolute at the bottom like Uber/Rapido */}
        <div className="absolute bottom-6 left-0 w-full px-4 flex flex-col gap-3 z-20 pointer-events-none">
          {requests.map((req) => (
            <div key={req._id} className="mx-auto w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-red-500 overflow-hidden pointer-events-auto transform transition-all translate-y-0 opacity-100 animate-slide-up">
              <div className="bg-red-500 p-2.5 text-center text-white font-bold tracking-widest text-sm animate-pulse">
                🚨 NEW EMERGENCY
              </div>
              <div className="p-4">
                <p className="text-gray-800 dark:text-gray-200 font-medium mb-1">Patient Needs Immediate Help!</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                  <span className="text-xl">📍</span>
                  <span className="truncate">[{req.location?.latitude?.toFixed(4)}, {req.location?.longitude?.toFixed(4)}]</span>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDecline(req._id)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold transition-all"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAccept(req._id)}
                    className="flex-[2] bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-lg shadow-md shadow-green-500/20 transition-all flex justify-center items-center gap-2"
                  >
                    ACCEPT
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Driver Status Chip at the very bottom when no modals */}
          {requests.length === 0 && !currentAssignment && (
             <div className="mx-auto bg-gray-900/80 backdrop-blur-sm text-white px-5 py-3 rounded-full flex items-center gap-3 shadow-lg pointer-events-auto border border-gray-700">
               <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
               <span className="font-semibold tracking-wide text-sm">Online & Looking for requests</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
