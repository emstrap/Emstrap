import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoutes";

// Lazy-loaded page components for better performance
const Emergency = lazy(() => import("../pages/emergency/Emergency"));
const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/auth/Register"));
const Tracking = lazy(() => import("../components/emergency/Tracking"));
const Booking = lazy(() => import("../pages/booking/Booking"));
const DashboardRouter = lazy(() => import("../pages/dashboard/DashboardRouter"));
const UserProfile = lazy(() => import("../pages/user/UserProfile"));
const VerifyEmail = lazy(() => import("../pages/auth/VerifyEmail"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));
const DriverHistory = lazy(() => import("../pages/ambulance/DriverHistory"));

export default function AppRoutes() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="text-4xl mb-4">🚑</div>
          <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">Loading Emstrap...</div>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/" element={<Emergency />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

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
    </Suspense>
  );
}
