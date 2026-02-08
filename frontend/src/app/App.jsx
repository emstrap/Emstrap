import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { EmergencyProvider } from "../context/EmergencyContext";
import { AuthProvider } from "../context/AuthContext";
export default function App() {
  return (
     <AuthProvider>
      <EmergencyProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </EmergencyProvider>
    </AuthProvider>
  );
}
