import { useEffect, useState, useMemo } from "react";
import { getPoliceEmergencies } from "../../services/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import toast from "react-hot-toast";

const createCustomIcon = (emoji) => L.divIcon({
    html: `<div class="bg-white rounded-full p-2 text-xl shadow-lg border-2 border-[#ff3b30] flex items-center justify-center">${emoji}</div>`,
    className: "custom-leaflet-icon",
    iconSize: [44, 44],
    iconAnchor: [22, 22]
});

const emergencyIcon = createCustomIcon("🚨");

export default function LiveMap() {
    const [alerts, setAlerts] = useState([]);
    
    useEffect(() => {
        const fetchInitialState = async () => {
            try {
                const res = await getPoliceEmergencies();
                if (res.success) {
                    setAlerts(res.emergencies.filter(a => a.status === "PENDING" || a.status === "AMBULANCE_ACCEPTED"));
                }
            } catch (err) {
                toast.error("Failed to map live fleet.");
            }
        };

        fetchInitialState();
    }, []);

    const computedCenter = useMemo(() => {
        if (alerts.length > 0 && alerts[0].location) {
            return [alerts[0].location.latitude, alerts[0].location.longitude];
        }
        return [20.5937, 78.9629];
    }, [alerts]);

    return (
        <div className="h-[calc(100vh-8rem)] w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 relative bg-white dark:bg-gray-900">
            <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-gray-200 dark:border-gray-700 p-3 rounded-xl shadow-lg flex items-center gap-3">
                 <span className="text-red-500 animate-pulse text-2xl">📡</span>
                 <div>
                     <h3 className="text-gray-900 dark:text-white font-bold tracking-widest uppercase text-sm">Sector Override</h3>
                     <p className="text-gray-500 dark:text-gray-400 text-xs font-mono">LIVE . SATELLITE</p>
                 </div>
            </div>

            <MapContainer 
                center={computedCenter} 
                zoom={12} 
                style={{ height: '100%', width: '100%' }}
            >
                {/* Switch back to generic map for light/dark comp */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> CartoDB'
                />

                {alerts.map(alert => {
                    if (!alert.location) return null;
                    return (
                        <Marker 
                            key={alert._id} 
                            position={[alert.location.latitude, alert.location.longitude]}
                            icon={emergencyIcon}
                        >
                            <Popup className="rounded-2xl">
                                <div className="font-sans text-center">
                                    <p className="font-bold text-gray-900 border-b pb-2 mb-2">Active Target</p>
                                    <p className="text-xs text-gray-600 font-mono">Coord: {alert.location.latitude.toFixed(3)}, {alert.location.longitude.toFixed(3)}</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
