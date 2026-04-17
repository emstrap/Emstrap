import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import { API_URL, getAlerts, getErrorMessage, getStats } from "../../services/api";
import AdminDetailGrid from "../../components/admin/AdminDetailGrid";
import AdminModal from "../../components/admin/AdminModal";
import { formatDate, getStatusBadgeClasses } from "../../components/admin/admin.utils";

export default function HospitalDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    totalHospitals: 0,
    totalBookings: 0,
  });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const [alertsRes, statsRes] = await Promise.all([getAlerts(), getStats()]);
      if (alertsRes.success) setAlerts(alertsRes.alerts || []);
      if (statsRes.success) setStats(statsRes.stats || {});
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load hospital dashboard data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const socketUrl = API_URL || window.location.origin;
    const newSocket = io(socketUrl, { withCredentials: true });
    newSocket.emit("join_hospital", {});

    newSocket.on("hospital_alert", (data) => {
      setAlerts((prev) => [data.request, ...prev]);
    });

    return () => newSocket.close();
  }, []);

  const getAlertDetails = (alert) => ({
    Status: alert.status,
    "Patient Name": alert.user?.name,
    "Patient Email": alert.user?.email,
    "Patient Mobile": alert.user?.mobile,
    Location: alert.location,
    Ambulance: alert.ambulance,
    "Image URL": alert.imageUrl,
    "Created Date": formatDate(alert.createdAt),
    "Updated Date": formatDate(alert.updatedAt),
    "Alert ID": alert._id,
  });

  return (
    <>
      <Navbar />
      <Container>
        <h1 className="text-3xl font-bold mt-10">Hospital ER Dashboard</h1>
        <p className="text-gray-500 mb-6">Monitoring incoming ambulance arrivals with live backend data.</p>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            ["Total Alerts", stats.totalAlerts],
            ["Active Alerts", stats.activeAlerts],
            ["Hospitals", stats.totalHospitals],
            ["Bookings", stats.totalBookings],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-gray-900">{value || 0}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center p-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
              Loading live emergency alerts...
            </div>
          ) : alerts.map((alert) => (
            <button
              type="button"
              key={alert._id}
              onClick={() => setSelectedAlert(alert)}
              className="block w-full text-left p-4 border border-red-200 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
            >
              <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${getStatusBadgeClasses(alert.status)}`}>
                {alert.status || "PENDING"}
              </span>
              <p className="mt-2 text-sm text-gray-700">
                {alert.user?.name ? `${alert.user.name} needs emergency support.` : "Emergency alert received."}
              </p>
              <div className="mt-2 bg-white rounded p-2 text-sm shadow inline-block">
                Created: {formatDate(alert.createdAt)}
              </div>
            </button>
          ))}

          {!loading && alerts.length === 0 && (
            <div className="text-center p-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
              No incoming emergencies right now.
            </div>
          )}
        </div>
      </Container>

      {selectedAlert ? (
        <AdminModal title="Alert Details" subtitle="Full emergency alert details from backend" onClose={() => setSelectedAlert(null)}>
          <AdminDetailGrid data={getAlertDetails(selectedAlert)} />
        </AdminModal>
      ) : null}
    </>
  );
}
