import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../../services/api";
import { getDriverHistory, acceptEmergency, declineEmergency, cancelEmergency, getHospitals, assignHospital } from "../../services/api";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import LiveTrackingMap from "../../components/map/LiveTrackingMap";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function AmbulanceDashboard() {
  const { user, loginUser } = useAuth();
  const [requests, setRequests] = useState([]); // Actively pending nearby emergencies
  // "active" state is now represented by mapping over requests in a modal over the map
  // "accepted" history is tracked to route the driver to the user, handled inside the map
  const [acceptedHistory, setAcceptedHistory] = useState([]);
  const [socket, setSocket] = useState(null);

  // Hospital picker state
  const [hospitalPickerOpen, setHospitalPickerOpen] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [hospitalLoading, setHospitalLoading] = useState(false);
  const [assigningHospital, setAssigningHospital] = useState(false);

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

  // Sync Room Membership with Driver Status
  useEffect(() => {
    if (!socket || !user) return;

    if (user.driverStatus === 'LIVE') {
      socket.emit("join_ambulance", {});
      fetchHistory(); // Refresh to get active requests when going online
      console.log("Joined ambulance room");
    } else {
      socket.emit("leave_ambulance", {});
      setRequests([]); // Clear pending requests when going offline
      console.log("Left ambulance room");
    }
  }, [user?.driverStatus, socket]);

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
      const res = await acceptEmergency(id);
      const updatedRequest = res.data || res;
      toast.success("Emergency accepted!");

      // Move from active requests to accepted History locally
      setAcceptedHistory([updatedRequest, ...acceptedHistory]);
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
              toast.error("Waiting for live GPS signal...");
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

  const handleCancelAssignment = async () => {
    if (!currentAssignment) return;
    if (!window.confirm("Are you sure you want to cancel this emergency assignment?")) return;

    try {
      await cancelEmergency(currentAssignment._id);
      toast.success("Assignment cancelled successfully");
      
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
      fetchHistory(); // Move it to cancelled state
      if (socket) {
        socket.off("user_location");
        socket.off("emergency_cancelled");
      }
    } catch (err) {
      toast.error("Failed to cancel assignment");
    }
  };

  const openHospitalPicker = async () => {
    setHospitalPickerOpen(true);
    if (hospitals.length === 0) {
      setHospitalLoading(true);
      try {
        const res = await getHospitals();
        setHospitals(res.hospitals || []);
      } catch {
        toast.error("Failed to load hospitals");
      } finally {
        setHospitalLoading(false);
      }
    }
  };

  const handleAssignHospital = async (hospitalId, hospitalName) => {
    if (!currentAssignment) return;
    setAssigningHospital(true);
    try {
      await assignHospital(currentAssignment._id, hospitalId);
      toast.success(`Hospital "${hospitalName}" assigned and notifications sent!`);
      setHospitalPickerOpen(false);
      fetchHistory(); // refresh to show updated hospital
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to assign hospital");
    } finally {
      setAssigningHospital(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = user?.driverStatus === 'LIVE' ? 'OFFLINE' : 'LIVE';
    const loadingToast = toast.loading(`Switching to ${newStatus}...`);
    try {
      const res = await API.put("/auth/profile", { driverStatus: newStatus });
      if (res.data && res.data.user) {
        loginUser({ ...user, driverStatus: res.data.user.driverStatus });
        toast.success(`You are now ${newStatus}`, { id: loadingToast });
      }
    } catch (err) {
      toast.error("Failed to update status", { id: loadingToast });
    }
  };

  // The currently assigned emergency the driver is en route to
  const currentAssignment = acceptedHistory.length > 0 ? acceptedHistory[0] : null;

  return (
    <>
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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-lg">
             <div className="bg-green-600 shadow-xl rounded-2xl p-3 flex items-center gap-3">
               <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse shrink-0">
                 🚑
               </div>
                <div className="text-white flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">
                    En Route: {currentAssignment.hospital?.name || "Select a Hospital"}
                  </h3>
                  <p className="text-sm opacity-90 truncate">
                    {currentAssignment.hospital?.location || "Tap \"Select Hospital\" to assign"}
                  </p>
                </div>
                <div className="flex flex-col gap-1 ml-auto shrink-0">
                  <button
                    onClick={openHospitalPicker}
                    className="text-xs bg-white text-green-700 px-3 py-1.5 rounded-full font-bold shadow-sm text-center hover:bg-green-50 transition-colors"
                  >
                    🏥 {currentAssignment.hospital ? "Change" : "Select"} Hospital
                  </button>
                  <Link to="/booking-history" className="text-xs bg-white/20 text-white px-3 py-1.5 rounded-full font-bold shadow-sm text-center hover:bg-white/30 transition-colors">
                    Details
                  </Link>
                  {currentAssignment.requestType === "BOOKING" && (
                    <button 
                      onClick={handleCancelAssignment}
                      className="text-[10px] bg-red-500 text-white px-3 py-1 rounded-full font-bold shadow-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
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

                {req.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={req.imageUrl}
                      alt="Patient"
                      className="w-full h-48 object-cover rounded-xl shadow-inner border border-gray-100 dark:border-gray-700"
                    />
                  </div>
                )}
                
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
             <button 
               onClick={handleToggleStatus}
               className="mx-auto bg-gray-900/90 hover:bg-black backdrop-blur-sm text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl pointer-events-auto border border-gray-700 transition-all active:scale-95 group"
             >
               {user?.driverStatus === 'LIVE' ? (
                 <>
                   <div className="w-3 h-3 bg-green-500 rounded-full animate-ping group-hover:bg-green-400"></div>
                   <span className="font-bold tracking-wide text-sm uppercase">Go Offline</span>
                 </>
               ) : (
                 <>
                   <div className="w-3 h-3 bg-gray-500 rounded-full group-hover:bg-green-500"></div>
                   <span className="font-bold tracking-wide text-sm uppercase text-gray-300 group-hover:text-white">Go Online</span>
                 </>
               )}
             </button>
          )}
        </div>
      </div>
    </div>

    {/* Hospital Picker Modal */}
    {hospitalPickerOpen && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🏥</div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Select Destination Hospital</h2>
                <p className="text-sm opacity-80 mt-0.5">Patient will be notified of the selected hospital</p>
              </div>
            </div>
            {currentAssignment?.user && (
              <div className="mt-4 bg-white/10 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                  {currentAssignment.user.name?.charAt(0) || "P"}
                </div>
                <div>
                  <p className="font-bold text-sm">{currentAssignment.user.name || "Anonymous Patient"}</p>
                  <p className="text-xs opacity-80">{currentAssignment.user.mobile || currentAssignment.user.email || ""}</p>
                </div>
              </div>
            )}
          </div>

          {/* Hospital List */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {hospitalLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading hospitals...</p>
              </div>
            ) : hospitals.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🏥</div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No hospitals found</p>
                <p className="text-xs text-gray-400 mt-1">Ask admin to add hospitals to the system</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hospitals.map((h) => (
                  <button
                    key={h._id}
                    disabled={assigningHospital}
                    onClick={() => handleAssignHospital(h._id, h.name)}
                    className="w-full text-left p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 group-hover:bg-green-100 dark:group-hover:bg-green-900/50 rounded-2xl flex items-center justify-center text-2xl transition-colors shrink-0">🏥</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">{h.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">📍 {h.location}</p>
                        {h.contact && <p className="text-xs text-gray-400 mt-0.5">📞 {h.contact}</p>}
                      </div>
                      <div className="shrink-0 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5">
            <button
              onClick={() => setHospitalPickerOpen(false)}
              className="w-full py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
