import { useEffect, useState, useCallback, useRef } from "react";
import { 
  GoogleMap, 
  useJsApiLoader, 
  MarkerF, 
  DirectionsService, 
  DirectionsRenderer,
  InfoWindowF
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Custom icons - Google Maps markers use simple SVG or URL
const driverIconUrl = "https://cdn-icons-png.flaticon.com/512/3203/3203071.png"; // Ambulance Icon
const userIconUrl = "https://cdn-icons-png.flaticon.com/512/9131/9131529.png"; // Patient/User Icon

const libraries = ["places"];

export default function LiveTrackingMap({ userLocation, driverLocation, height = "400px" }) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "", // User needs to provide this
    libraries: libraries
  });

  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const [showDriverPopup, setShowDriverPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Effect to calculate directions when both locations are available
  useEffect(() => {
    if (isLoaded && userLocation?.lat && driverLocation?.lat) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: new window.google.maps.LatLng(driverLocation.lat, driverLocation.lng),
          destination: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          } else {
            console.error(`error fetching directions ${result}`);
          }
        }
      );
    }
  }, [isLoaded, userLocation, driverLocation]);

  // Effect to fit bounds
  useEffect(() => {
    if (map && (userLocation?.lat || driverLocation?.lat)) {
      const bounds = new window.google.maps.LatLngBounds();
      if (userLocation?.lat) bounds.extend(userLocation);
      if (driverLocation?.lat) bounds.extend(driverLocation);
      
      if (userLocation?.lat && driverLocation?.lat) {
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      } else {
        map.panTo(userLocation?.lat ? userLocation : driverLocation);
        map.setZoom(15);
      }
    }
  }, [map, userLocation, driverLocation]);

  if (!isLoaded) return <div className="w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl flex items-center justify-center" style={{ height }}>
    <p className="text-gray-500 font-medium">Loading Google Maps...</p>
  </div>;

  const center = (userLocation?.lat ? userLocation : null)
    || (driverLocation?.lat ? driverLocation : null)
    || { lat: 20.5937, lng: 78.9629 };

  return (
    <div className={`w-full h-full min-h-[${height}] rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 relative z-0 flex flex-col flex-1`}>
      {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <div className="absolute top-2 left-2 z-10 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-1 rounded text-xs">
          Missing Google Maps API Key
        </div>
      )}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }],
            },
          ],
        }}
      >
        {/* User Marker */}
        {userLocation?.lat && (
          <MarkerF 
            position={userLocation} 
            icon={{
              url: userIconUrl,
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            onClick={() => setShowUserPopup(true)}
          >
            {showUserPopup && (
              <InfoWindowF onCloseClick={() => setShowUserPopup(false)}>
                <div className="text-sm font-medium">Patient Location</div>
              </InfoWindowF>
            )}
          </MarkerF>
        )}

        {/* Driver Marker */}
        {driverLocation?.lat && (
          <MarkerF 
            position={driverLocation} 
            icon={{
              url: driverIconUrl,
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            onClick={() => setShowDriverPopup(true)}
          >
             {showDriverPopup && (
              <InfoWindowF onCloseClick={() => setShowDriverPopup(false)}>
                <div className="text-sm font-medium">Ambulance</div>
              </InfoWindowF>
            )}
          </MarkerF>
        )}

        {/* Route Lines */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#EF4444",
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
