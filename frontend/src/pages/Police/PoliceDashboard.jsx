import { useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";
import { API_URL, getPoliceEmergencies } from "../../services/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const createCustomIcon = (emoji) => L.divIcon({
    html: `<div class="bg-white rounded-full p-1.5 text-lg shadow-md border-2 border-[#ff3b30] flex items-center justify-center">${emoji}</div>`,
    className: "custom-leaflet-icon",
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

const emergencyIcon = createCustomIcon("🚨");
const mapCenter = [20.5937, 78.9629]; 

export default function PoliceDashboard() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    
    // Derived states
    const activeAlerts = alerts.filter(a => a.status === "PENDING" || a.status === "AMBULANCE_ACCEPTED");
    const activeCount = activeAlerts.length;

    useEffect(() => {
        const fetchInitialState = async () => {
            try {
                const res = await getPoliceEmergencies();
                if (res.success) {
                    setAlerts(res.emergencies);
                }
            } catch (err) {
                toast.error("Failed to load command center history.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialState();

        const socket = io(API_URL, { withCredentials: true });
        
        socket.on("connect", () => socket.emit("join_police", {}));

        socket.on("police_alert", (data) => {
            const req = data.request;
            if (!req) return;
            
            setAlerts(prev => {
                const exists = prev.find(a => a._id === req._id);
                if (exists) return prev.map(a => a._id === req._id ? req : a);
                return [req, ...prev];
            });
        });

        // Add handler for emergency status updates
        socket.on("emergency_cancelled", ({ requestId }) => {
            setAlerts(prev => prev.map(a => a._id === requestId ? { ...a, status: "CANCELLED" } : a));
        });

        return () => socket.close();
    }, []);

    const computedCenter = useMemo(() => {
        if (activeAlerts.length > 0 && activeAlerts[0].location) {
            return [activeAlerts[0].location.latitude, activeAlerts[0].location.longitude];
        }
        return mapCenter;
    }, [activeAlerts]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">

            {/* MAIN DASHBOARD BLOCK - MAP */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden shadow-sm min-h-[400px]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center z-10 shrink-0">
                    <h2 className="font-bold text-gray-900 dark:text-white tracking-wide">Incident Geolocation</h2>
                    <span className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest bg-red-100 dark:bg-red-900/20 px-3 py-1 rounded-full">Automated Tracking</span>
                </div>
                
                <div className="flex-1 relative z-0">
                    <MapContainer 
                        center={computedCenter} 
                        zoom={11} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> CartoDB'
                        />

                        {activeAlerts.map(alert => {
                            if (!alert.location) return null;
                            return (
                                <Marker 
                                    key={alert._id} 
                                    position={[alert.location.latitude, alert.location.longitude]}
                                    icon={emergencyIcon}
                                >
                                    <Popup className="rounded-2xl">
                                        <div className="font-sans text-center">
                                            <p className="font-bold text-gray-900 border-b pb-2 mb-2">Distress Signal</p>
                                            <p className="text-xs text-gray-600 mb-2 font-mono">ID: {alert._id.toString().slice(-6)}</p>
                                            <p className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-red-600 text-white tracking-widest inline-block whitespace-nowrap">
                                                Active Dispath
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>
            </div>

            {/* RIGHT SIDEBAR - ACTIVE EMERGENCIES */}
            <div className="w-full lg:w-96 shrink-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col h-[calc(100vh-8rem)]">
                 <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-2xl shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-red-500 text-xl animate-pulse">🚨</span>
                        <h2 className="font-bold text-gray-900 dark:text-white tracking-wide">Active Emergencies</h2>
                    </div>
                    {activeCount > 0 && (
                        <span className="text-red-500 text-xs font-black bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded-lg tracking-widest uppercase">{activeCount} LIVE</span>
                    )}
                 </div>

                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {loading ? (
                         <div className="text-gray-500 text-center text-sm py-10 animate-pulse">Syncing signals...</div>
                     ) : activeAlerts.length === 0 ? (
                         <div className="text-gray-500 text-center text-sm py-10">No active emergencies in your sector.</div>
                     ) : (
                         activeAlerts.map(alert => (
                             <div key={alert._id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500/50 transition-colors shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                     <p className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest">E-{alert._id.toString().slice(-4)}</p>
                                     <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
                                         {alert.status === "PENDING" ? 'AWAITING' : 'DISPATCHED'}
                                     </span>
                                </div>
                                
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Medical Emergency</h3>
                                
                                <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-xs mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 text-gray-500 mt-0.5"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" /></svg>
                                    <span className="leading-snug truncate">
                                        [{alert.location?.latitude?.toFixed(4)}, {alert.location?.longitude?.toFixed(4)}]
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-gray-500 text-[10px] font-mono tracking-widest uppercase">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {new Date(alert.createdAt).toLocaleTimeString()}
                                </div>
                             </div>
                         ))
                     )}
                 </div>
            </div>
        </div>
    );
}
