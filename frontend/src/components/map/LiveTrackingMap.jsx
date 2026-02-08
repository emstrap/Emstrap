import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";

export default function LiveTrackingMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState(null);

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const userLoc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      setUserLocation(userLoc);

      // Ambulance initial far position
      setAmbulanceLocation({
        lat: userLoc.lat + 0.02,
        lng: userLoc.lng + 0.02,
      });
    });
  }, []);

  // Animate ambulance movement
  useEffect(() => {
    if (!userLocation || !ambulanceLocation) return;

    const interval = setInterval(() => {
      setAmbulanceLocation((prev) => ({
        lat: prev.lat + (userLocation.lat - prev.lat) * 0.05,
        lng: prev.lng + (userLocation.lng - prev.lng) * 0.05,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [userLocation, ambulanceLocation]);

  if (!userLocation) return <p className="text-center mt-10">Getting location...</p>;

  return (
    <MapContainer
      center={userLocation}
      zoom={14}
      className="w-full h-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User Marker */}
      <Marker position={userLocation}>
        <Popup>You are here</Popup>
      </Marker>

      {/* Ambulance Marker */}
      {ambulanceLocation && (
        <Marker position={ambulanceLocation}>
          <Popup>Ambulance 🚑</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
