import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import { loginAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loginUser, logoutUser, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") navigate("/admin");
    }
  }, [user, loading, navigate]);

  const handleAdminLogin = async () => {
    try {
      const data = await loginAPI({ email, password });

      // STRICT ROLE GAURD
      if (data.role !== "admin") {
          toast.error("Unauthorized: You do not have Administrative Privileges.");
          logoutUser(); // Immediately revoke the session locally and on the server
          return;
      }

      loginUser(data);
      toast.success("Admin Authorization Confirmed");
      navigate("/admin");
    } catch {
      toast.error("Authentication failed. Invalid master credentials.");
    }
  };

  return (
    <>
      <Navbar />
      <Container>
        <div className="flex justify-center mt-16 mb-12">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-red-500 dark:border-red-900/50">
            <div className="text-center mb-8">
                <span className="text-5xl block animate-pulse">🛑</span>
                <h2 className="text-2xl font-black mt-4 text-gray-900 dark:text-white uppercase tracking-wider">
                  Admin Terminal
                </h2>
                <p className="text-xs font-bold text-red-500 tracking-widest uppercase mt-2">Restricted Access Zone</p>
            </div>

            <input
              className="w-full border-2 border-gray-200 dark:border-gray-700 p-3.5 rounded-xl mb-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors font-mono"
              placeholder="ADMIN_IDENTITY (Email)"
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="w-full border-2 border-gray-200 dark:border-gray-700 p-3.5 rounded-xl mb-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors font-mono"
              type="password"
              placeholder="PASSPHRASE"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={handleAdminLogin}
              className="w-full bg-red-600 hover:bg-black text-white font-black tracking-[0.2em] py-4 rounded-xl transition-all shadow-lg hover:shadow-red-500/50 flex justify-center items-center gap-2"
            >
              AUTHENTICATE
            </button>
          </div>
        </div>
      </Container>
    </>
  );
}
