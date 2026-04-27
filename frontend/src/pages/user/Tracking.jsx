import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API, { API_URL } from "../../services/api";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import LiveTrackingMap from "../../components/map/LiveTrackingMap";

export default function Tracking() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [driverInfo, setDriverInfo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!requestId) return;

    // 1. Get initial location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("GPS error", err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    // 2. Connect Socket
    const newSocket = io(API_URL, { withCredentials: true });
    newSocket.emit("track_request", { requestId });

    newSocket.on("ambulance_assigned", (data) => {
      setDriverInfo(data);
    });

    newSocket.on("ambulance_location", (data) => {
      setDriverInfo((prev) => {
        const info = prev || {};
        return {
          ...info,
          location: { lat: data.lat || data.latitude, lng: data.lng || data.longitude }
        };
      });
    });

    newSocket.on("emergency_cancelled", () => {
      toast.error("This request was cancelled.");
      navigate("/dashboard");
    });

    setSocket(newSocket);

    // 3. Start watching user location and emitting it
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const currentLoc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          newSocket.emit("update_user_location", {
            requestId,
            ...currentLoc
          });
          setUserLocation({ lat: currentLoc.latitude, lng: currentLoc.longitude });
        },
        (err) => console.error("GPS error", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }

    return () => {
      newSocket.disconnect();
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [requestId, navigate]);

  return (
    <>
      <Navbar />
      <Container>
        <div className="mt-10 mb-6">
          <button 
            onClick={() => navigate("/dashboard")}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-4"
          >
            ← Back to Bookings
          </button>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Map Area */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden shadow-inner h-[60vh] relative">
              <LiveTrackingMap
                userLocation={userLocation}
                driverLocation={driverInfo?.location}
                height="100%"
              />
              
              {!driverInfo?.location && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                  <div className="bg-white dark:bg-gray-900 px-6 py-3 rounded-full shadow-xl animate-pulse flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                    <span className="font-bold text-sm">Waiting for driver signal...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Status Panel */}
            <div className="w-full lg:w-80 space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border dark:border-gray-800">
                <h2 className="text-xl font-black mb-4">Ambulance Details</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-2xl">🚑</div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Vehicle Number</p>
                      <p className="font-bold text-lg">{driverInfo?.vehicleNumber || "Assigned"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-2xl">👤</div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Driver Name</p>
                      <p className="font-bold text-lg">{driverInfo?.driverName || "On the way"}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-gray-800">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-green-600">En Route to your location</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20">
                <p className="text-xs opacity-80 uppercase font-bold tracking-wider">Estimated Arrival</p>
                <p className="text-4xl font-black mt-1">{driverInfo?.eta || "5-8 mins"}</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
