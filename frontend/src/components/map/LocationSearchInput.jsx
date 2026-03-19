import { useState, useEffect, useRef } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import toast from "react-hot-toast";

const libraries = ["places"];

export default function LocationSearchInput({ label, placeholder, value, onSelect }) {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "", // User needs to provide this
        libraries: libraries
    });

    const [query, setQuery] = useState(value?.address || "");
    const autocompleteRef = useRef(null);

    // Update internal query if value prop changes externally
    useEffect(() => {
        if (value?.address && value.address !== query) {
            setQuery(value.address);
        }
    }, [value]);

    useEffect(() => {
        const el = autocompleteRef.current;
        if (!el || !isLoaded) return;

        const handlePlaceSelect = async (event) => {
            const place = event.place;
            if (!place) return;

            // `place` is a Place instance from Places API (New)
            await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
            
            if (place.location) {
                const lat = place.location.lat();
                const lng = place.location.lng();
                const address = place.formattedAddress || place.displayName;
                
                setQuery(address);
                onSelect({ address, lat, lng });
            }
        };

        el.addEventListener("gmp-placeselect", handlePlaceSelect);
        return () => {
            el.removeEventListener("gmp-placeselect", handlePlaceSelect);
        };
    }, [isLoaded, onSelect]);

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        const loadToast = toast.loading("Finding your location...");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    toast.dismiss(loadToast);
                    if (status === "OK" && results[0]) {
                        const address = results[0].formatted_address;
                        setQuery(address);
                        onSelect({ address, lat, lng });
                        toast.success("Location identified!");
                    } else {
                        // Fallback if Geocoding fails but we have coords
                        const address = `Location [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
                        setQuery(address);
                        onSelect({ address, lat, lng });
                        toast.success("Coordinates found!");
                    }
                });
            },
            (error) => {
                toast.dismiss(loadToast);
                toast.error("Failed to get location. Please enable GPS permissions.");
                console.error(error);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    if (!isLoaded) {
        return (
            <div className="relative">
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">{label}</label>
                <div className="w-full border dark:border-gray-700 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 animate-pulse">
                    Loading Maps...
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">{label}</label>
            <div className="relative flex items-center">
                <gmp-place-autocomplete ref={autocompleteRef} style={{ width: "100%" }}>
                    <input
                        type="text"
                        required
                        slot="input"
                        placeholder={placeholder}
                        value={query}
                        onChange={handleInputChange}
                        className="w-full border dark:border-gray-700 py-3 pl-3 pr-12 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    />
                </gmp-place-autocomplete>

                <button
                    type="button"
                    onClick={handleCurrentLocation}
                    className="absolute right-3 text-gray-400 hover:text-red-500 transition-colors z-10 p-1 flex items-center justify-center bg-transparent group"
                    title="Use Current Location"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}

