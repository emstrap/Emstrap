import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import UserDashboard from "../user/UserDashboard";
import AmbulanceDashboard from "../ambulance/AmbulanceDashboard";
import HospitalDashboard from "../hospital/HospitalDashboard";
import PoliceDashboard from "../police/PoliceDashboard";

export default function DashboardRouter() {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    switch (user.role) {
        case "user":
            return <UserDashboard />;
        case "ambulance":
        case "ambulance_driver":
            return <AmbulanceDashboard />;
        case "hospital":
        case "hospital_admin":
            return <HospitalDashboard />;
        case "police":
            return <PoliceDashboard />;
        default:
            return <Navigate to="/" replace />;
    }
}
