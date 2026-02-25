import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";

export default function HospitalDashboard() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const newSocket = io("http://localhost:5000", { withCredentials: true });
    newSocket.emit("join_hospital", {});

    newSocket.on("hospital_alert", (data) => {
      setAlerts((prev) => [data.request, ...prev]);
    });

    return () => newSocket.close();
  }, []);

  return (
    <>
      <Navbar />
      <Container>
        <h1 className="text-3xl font-bold mt-10">Hospital ER Dashboard</h1>
        <p className="text-gray-500 mb-6">Monitoring incoming ambulance arrivals...</p>

        <div className="space-y-4">
          {alerts.map((alert, i) => (
            <div key={i} className="p-4 border border-red-200 rounded-xl bg-red-50">
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full uppercase">Ambulance En Route</span>
              <p className="mt-2 text-sm text-gray-700">An ambulance is arriving soon to your facility.</p>
              <div className="mt-2 bg-white rounded p-2 text-sm shadow inline-block">
                Expected Arrival: ~5 mins
              </div>
            </div>
          ))}

          {alerts.length === 0 && (
            <div className="text-center p-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
              No incoming emergencies right now.
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
