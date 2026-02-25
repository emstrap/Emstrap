import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function LocationSearchInput({ label, placeholder, value, onSelect }) {
    const [query, setQuery] = useState(value?.address || "");
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);

    // Update internal query if value prop changes externally
    useEffect(() => {
        if (value?.address && value.address !== query) {
            setQuery(value.address);
        }
    }, [value]);

    const searchLocations = async (text) => {
        if (!text || text.length < 2) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            // Use Photon API (built on Nominatim) which supports autocomplete/partial matching natively
            const res = await axios.get(`https://photon.komoot.io/api/`, {
                params: {
                    q: text,
                    limit: 5,
                    // Bounding box for India (West, South, East, North)
                    bbox: "68.116667,6.766667,97.383333,35.666667"
                },
            });
            // Photon returns a GeoJSON FeatureCollection
            setSuggestions(res.data.features || []);
            setShowDropdown(true);
        } catch (err) {
            console.error("Geocoding failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        // Lower debounce since Photon is faster and meant for typing
        debounceRef.current = setTimeout(() => {
            searchLocations(val);
        }, 300);
    };

    const buildDisplayName = (properties) => {
        const parts = [];
        if (properties.name) parts.push(properties.name);
        if (properties.street) parts.push(properties.street);
        if (properties.city || properties.town || properties.village) parts.push(properties.city || properties.town || properties.village);
        if (properties.state) parts.push(properties.state);
        return parts.join(", ");
    };

    const handleSelect = (feature) => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates; // [lon, lat]
        const displayName = buildDisplayName(props) || "Selected Location";

        setQuery(displayName);
        setShowDropdown(false);

        // Pass precise lat/lng and formatted address back to parent
        onSelect({
            address: displayName,
            lat: parseFloat(coords[1]), // Geometry puts Lon first
            lng: parseFloat(coords[0])
        });
    };

    return (
        <div className="relative">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">{label}</label>
            <input
                type="text"
                required
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
                onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="w-full border dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            />
            {loading && <span className="absolute right-3 top-10 text-xs text-gray-400 dark:text-gray-500">Loading...</span>}

            {showDropdown && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((feature, idx) => {
                        const props = feature.properties;
                        const mainText = props.name || props.street || props.city;
                        const subText = buildDisplayName(props);

                        return (
                            <li
                                key={idx}
                                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-0 text-sm transition-colors"
                                onClick={() => handleSelect(feature)}
                            >
                                <div className="font-semibold text-gray-800 dark:text-gray-200">{mainText}</div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs truncate">{subText}</div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
