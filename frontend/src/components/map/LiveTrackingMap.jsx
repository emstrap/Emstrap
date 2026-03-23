import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// Custom icons - Leaflet markers use standard URL
const driverIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3203/3203071.png", // Ambulance Icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/9131/9131529.png", // Patient/User Icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

// Helper component to auto-fit map bounds tightly over patient and driver
function MapBoundsFit({ userLocation, driverLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation?.lat && driverLocation?.lat) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [driverLocation.lat, driverLocation.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (userLocation?.lat) {
      map.setView([userLocation.lat, userLocation.lng], 15);
    } else if (driverLocation?.lat) {
      map.setView([driverLocation.lat, driverLocation.lng], 15);
    }
  }, [map, userLocation, driverLocation]);
  return null;
}

export default function LiveTrackingMap({ userLocation, driverLocation, height = "400px" }) {
  const [routeCoords, setRouteCoords] = useState(null);

  useEffect(() => {
    let active = true;
    
    const fetchRoute = async () => {
      // We only execute routing if both vectors are valid
      if (userLocation?.lat && driverLocation?.lat) {
        try {
           // Overly important mapping difference: ORS strictly takes [lng, lat] syntax!
           const start = `${driverLocation.lng},${driverLocation.lat}`;
           const end = `${userLocation.lng},${userLocation.lat}`;
           const apiKey = import.meta.env.VITE_ORS_API_KEY;

           if (!apiKey) {
               console.warn("Missing VITE_ORS_API_KEY. Navigation routing line will not render natively");
               return;
           }

           const res = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start}&end=${end}`);
           if (!res.ok) throw new Error("ORS Routing Calculation Failure");
           const data = await res.json();
           
           if (data.features && data.features.length > 0 && active) {
              const geometry = data.features[0].geometry.coordinates;
              // React-Leaflet Polyline strictly accepts [lat, lng] array maps, so we reverse it!
              const leafletCoords = geometry.map(coord => [coord[1], coord[0]]);
              setRouteCoords(leafletCoords);
           }
        } catch (error) {
           console.error("Failed to fetch Live ORS Map routing:", error);
        }
      } else {
        setRouteCoords(null);
      }
    };

    fetchRoute();
    
    // Prevent fetching race condition
    return () => { active = false; };
  }, [userLocation, driverLocation]);

  const center = userLocation?.lat ? [userLocation.lat, userLocation.lng] 
               : driverLocation?.lat ? [driverLocation.lat, driverLocation.lng] 
               : [20.5937, 78.9629]; // Default Geographic India point map

  return (
    <div className={`w-full min-h-[${height}] rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 relative z-0 flex flex-col flex-1`} style={{ height, minHeight: height }}>
      
      {/* Visual Overlay Error Warning */}
      {!import.meta.env.VITE_ORS_API_KEY && (
         <div className="absolute top-2 left-2 z-[1000] bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-1 rounded text-xs opacity-90 shadow">
            Missing OpenRouteService API Key (Line disabled)
         </div>
      )}

      {/* Primary Leaflet Container Engine Node */}
      <MapContainer 
         center={center} 
         zoom={13} 
         style={{ width: "100%", height: "100%", minHeight: "100%" }} 
         scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Bind Custom Auto Map Resizer Engine Module Component Hook */}
        <MapBoundsFit userLocation={userLocation} driverLocation={driverLocation} />

        {/* User Patient Marker View */}
        {userLocation?.lat && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
             <Popup>Patient Location</Popup>
          </Marker>
        )}

        {/* Emergency Driver Marker View */}
        {driverLocation?.lat && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
             <Popup>Ambulance Driver Live</Popup>
          </Marker>
        )}

        {/* Dynamic ORS Red Polyline Route Draw Render View */}
        {routeCoords && (
          <Polyline positions={routeCoords} color="#EF4444" weight={5} opacity={0.8} dashArray="10, 10" />
        )}
      </MapContainer>
    </div>
  );
}
