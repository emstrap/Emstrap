import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

// Custom icons
const driverIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3203/3203071.png", // Ambulance Icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/9131/9131529.png", // Patient/User Icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});


// Auto-fit bounds component
function FitBounds({ userLoc, driverLoc }) {
  const map = useMap();

  useEffect(() => {
    if (userLoc?.lat && driverLoc?.lat) {
      const bounds = L.latLngBounds([userLoc, driverLoc]);
      // Pad bounds so markers aren't on the very edge
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (userLoc?.lat) {
      map.setView(userLoc, 15);
    } else if (driverLoc?.lat) {
      map.setView(driverLoc, 15);
    }
  }, [map, userLoc, driverLoc]);

  return null;
}

// Routing Machine Component
function Routing({ userLoc, driverLoc }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !userLoc?.lat || !driverLoc?.lat) return;

    if (!routingControlRef.current) {
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(driverLoc.lat, driverLoc.lng),
          L.latLng(userLoc.lat, userLoc.lng)
        ],
        lineOptions: {
          styles: [{ color: "#EF4444", weight: 5, fillOpacity: 0.8 }] // Red line
        },
        createMarker: () => null, // We provide our own distinct markers
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: false,
        showAlternatives: false,
        show: false // Hide the step-by-step turn instructions box
      }).addTo(map);
    } else {
      // Update waypoints if driver moves
      routingControlRef.current.setWaypoints([
        L.latLng(driverLoc.lat, driverLoc.lng),
        L.latLng(userLoc.lat, userLoc.lng)
      ]);
    }

    return () => {
      // Cleanup routing control on unmount
      if (routingControlRef.current && map) {
        try {
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (e) {
          console.error("Cleanup error routing control", e);
        }
      }
    };
  }, [map, userLoc, driverLoc]);

  return null;
}

export default function LiveTrackingMap({ userLocation, driverLocation, height = "400px" }) {
  // Default center if nothing provided
  const center = (userLocation?.lat ? userLocation : null)
    || (driverLocation?.lat ? driverLocation : null)
    || { lat: 20.5937, lng: 78.9629 };

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 relative z-0">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height, width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* User Marker */}
        {userLocation?.lat && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>Patient Location</Popup>
          </Marker>
        )}

        {/* Driver Marker */}
        {driverLocation?.lat && (
          <Marker position={driverLocation} icon={driverIcon}>
            <Popup>Ambulance</Popup>
          </Marker>
        )}

        <FitBounds userLoc={userLocation} driverLoc={driverLocation} />

        {userLocation?.lat && driverLocation?.lat && (
          <Routing userLoc={userLocation} driverLoc={driverLocation} />
        )}
      </MapContainer>
    </div>
  );
}
