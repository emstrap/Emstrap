export default function AmbulanceFound() {
  return (
    <div className="text-center mt-16">
      <h2 className="text-3xl font-bold text-green-600">
        Ambulance Found 🚑
      </h2>

      <div className="bg-white shadow-lg rounded-2xl p-6 mt-6 max-w-sm mx-auto">
        <p className="font-semibold">ETA: 6 mins</p>
        <p>Driver: Ravi Kumar</p>
        <p>Vehicle: KA-01-AB-1234</p>
      </div>
    </div>
  );
}
