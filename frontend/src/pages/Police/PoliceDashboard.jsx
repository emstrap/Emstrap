import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../../services/api";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";

export default function PoliceDashboard() {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const newSocket = io(API_URL, { withCredentials: true });
        newSocket.emit("join_police", {});

        newSocket.on("police_alert", (data) => {
            setAlerts((prev) => [data.request, ...prev]);
        });

        return () => newSocket.close();
    }, []);

    return (
        <>
            <Navbar />
            <Container>
                <h1 className="text-3xl font-bold mt-10">Police Alert Center</h1>
                <p className="text-gray-500 mb-6">Monitoring emergency dispatches...</p>

                <div className="space-y-4">
                    {alerts.map((alert, i) => (
                        <div key={i} className="p-4 border border-blue-200 rounded-xl bg-blue-50">
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full uppercase">Alert received</span>
                            <p className="mt-2 text-sm text-gray-700">Anambulance was dispatched to an emergency location.</p>
                            <p className="mt-1 text-xs text-gray-500">Location: {alert.location?.latitude}, {alert.location?.longitude}</p>
                        </div>
                    ))}

                    {alerts.length === 0 && (
                        <div className="text-center p-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                            No recent emergency alerts.
                        </div>
                    )}
                </div>
            </Container>
        </>
    );
}
