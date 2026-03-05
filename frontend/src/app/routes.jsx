import { Routes, Route } from "react-router-dom";
import Emergency from "../pages/emergency/Emergency";
import Login from "../pages/auth/Login"
import Register from "../pages/auth/Register";
import Tracking from "../components/emergency/Tracking";
import Booking from "../pages/booking/Booking";
import DashboardRouter from "../pages/dashboard/DashboardRouter";
import UserProfile from "../pages/user/UserProfile";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ProtectedRoute from "./ProtectedRoutes";
import DriverHistory from "../pages/ambulance/DriverHistory";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Emergency />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/tracking" element={<Tracking />} />

      {/* Protected Routes */}
      <Route path="/booking" element={
        <ProtectedRoute >
          <Booking />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardRouter />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      } />
      <Route path="/booking-history" element={
        <ProtectedRoute>
          <DriverHistory />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
