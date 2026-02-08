import { Routes, Route } from "react-router-dom";
import Emergency from "../pages/Emergency/Emergency";
import Login from "../pages/auth/Login"
import Register from "../pages/auth/Register";
import Tracking from "../components/emergency/Tracking";
import UserDashboard from "../pages/User/UserDashboard";
import AmbulanceDashboard from "../pages/Ambulance/AmbulanceDashboard";
import HospitalDashboard from "../pages/Hospital/HospitalDashboard";
import ProtectedRoute from "./ProtectedRoutes";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Emergency />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/tracking" element={<Tracking />} />


      <Route path="/user" element={
        <ProtectedRoute role="user">
          <UserDashboard />
        </ProtectedRoute>
      } />

      <Route path="/ambulance" element={
        <ProtectedRoute role="ambulance">
          <AmbulanceDashboard />
        </ProtectedRoute>
      } />

      <Route path="/hospital" element={
        <ProtectedRoute role="hospital">
          <HospitalDashboard />
        </ProtectedRoute>
      } />

    </Routes>
  );
}
