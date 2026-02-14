import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { EmergencyProvider } from "../context/EmergencyContext";
import { AuthProvider } from "../context/AuthContext";
import Footer from "../components/layout/Footer";


export default function App() {
  return (
     <AuthProvider>
      <EmergencyProvider>
        <BrowserRouter>
          <AppRoutes />
          <Footer/>
        </BrowserRouter>
      </EmergencyProvider>
    </AuthProvider>
  );
}
