export default function AmbulanceFound({ driverInfo }) {
  return (
    <div className="text-center mt-16">
      <h2 className="text-3xl font-bold text-green-600">
        Ambulance Found 🚑
      </h2>

      <div className="bg-white dark:bg-gray-800 shadow-lg border dark:border-gray-700 rounded-2xl p-6 mt-6 max-w-sm mx-auto">
        <p className="font-semibold text-gray-900 dark:text-gray-100">ETA: {driverInfo?.eta || "5 mins"}</p>
        <p className="text-gray-700 dark:text-gray-300">Driver: {driverInfo?.driverName || "Assigning..."}</p>
        <p className="text-gray-700 dark:text-gray-300">Vehicle: {driverInfo?.vehicleNumber || "Unknown"}</p>
      </div>
    </div>
  );
}
