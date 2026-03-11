import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import { loginAPI } from "../../services/api";

import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loginUser, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    try {
      const data = await loginAPI({ email, password });

      loginUser(data);
      toast.success("Login successful!");

      // redirect based on role (mapping DB role to route)
      if (data.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    } catch {
      toast.error("Login failed. Please check your credentials.");
    }
  };
  return (
    <>
      <Navbar />
      <Container>

        <div className="flex justify-center mt-12 mb-12">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl transition-colors dark:border dark:border-gray-700">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              Welcome Back
            </h2>

            <input
              className="w-full border dark:border-gray-700 p-3.5 rounded-xl mb-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="w-full border dark:border-gray-700 p-3.5 rounded-xl mb-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex justify-end mb-6">
              <span
                className="text-sm text-red-500 hover:text-red-600 font-semibold cursor-pointer transition-colors"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </span>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              Login
            </button>
            <p className="text-sm mt-6 text-center text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <span
                className="text-red-500 hover:text-red-600 font-semibold cursor-pointer transition-colors"
                onClick={() => navigate("/register")}
              >
                Register
              </span>
            </p>
          </div>
        </div>

      </Container>
    </>
  );
}

