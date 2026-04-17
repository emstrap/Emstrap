import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import { adminLoginAPI, getErrorMessage } from "../../services/api";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { loginUser, logoutUser, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") navigate("/admin");
    }
  }, [user, loading, navigate]);

  const handleAdminLogin = async (event) => {
    event?.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter both admin email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await adminLoginAPI({ email: email.trim().toLowerCase(), password });

      if (data.user?.role !== "admin") {
          toast.error("Unauthorized: You do not have Administrative Privileges.");
          logoutUser(); // Immediately revoke the session locally and on the server
          return;
      }

      loginUser(data);
      toast.success(data.message || "Admin Authorization Confirmed");
      navigate("/admin");
    } catch (error) {
      toast.error(getErrorMessage(error, "Authentication failed. Invalid master credentials."));
    } finally {
      setSubmitting(false);
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

            <form onSubmit={handleAdminLogin}>
              <input
                className="w-full border-2 border-gray-200 dark:border-gray-700 p-3.5 rounded-xl mb-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors font-mono"
                placeholder="ADMIN_IDENTITY (Email)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                className="w-full border-2 border-gray-200 dark:border-gray-700 p-3.5 rounded-xl mb-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors font-mono"
                type="password"
                placeholder="PASSPHRASE"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-black text-white font-black tracking-[0.2em] py-4 rounded-xl transition-all shadow-lg hover:shadow-red-500/50 flex justify-center items-center gap-2 disabled:opacity-60"
              >
                {submitting ? "AUTHENTICATING..." : "AUTHENTICATE"}
              </button>
            </form>
          </div>
        </div>
      </Container>
    </>
  );
}
