import { useEmergency } from "../../context/EmergencyContext";
import LiveTrackingMap from "../map/LiveTrackingMap";

export default function AmbulanceFound({ driverInfo, onCancel }) {
  const { location: userLocation } = useEmergency();

  return (
    <div className="text-center mt-16">
      <h2 className="text-3xl font-bold text-green-600">
        Ambulance Found 🚑
      </h2>

      <div className="bg-white dark:bg-gray-800 shadow-lg border dark:border-gray-700 rounded-2xl p-6 mt-6 max-w-sm mx-auto z-10 relative">
        <p className="font-semibold text-gray-900 dark:text-gray-100">ETA: {driverInfo?.eta || "5 mins"}</p>
        <p className="text-gray-700 dark:text-gray-300">Driver: {driverInfo?.driverName || "Assigning..."}</p>
        <p className="text-gray-700 dark:text-gray-300">Vehicle: {driverInfo?.vehicleNumber || "Unknown"}</p>
      </div>

      <div className="mt-6 w-full max-w-3xl mx-auto -mt-6 pt-6 -z-10 relative" style={{ height: "50vh", minHeight: "400px" }}>
        <LiveTrackingMap
          userLocation={userLocation}
          driverLocation={driverInfo?.location}
          height="100%"
        />
      </div>

      <div className="mt-10 mb-10 w-full max-w-sm mx-auto">
        <button
          onClick={onCancel}
          className="w-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-4 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shadow-sm"
        >
          Cancel Emergency
        </button>
      </div>
    </div>
  );
}
