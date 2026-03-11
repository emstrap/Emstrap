import { useState } from "react";
import { registerAPI } from '../../services/api';
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";

import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    address: "",
    role: "",
    vehicleNumber: "",
  });

  const [status, setStatus] = useState("idle");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setStatus("loading");
    try {
      await registerAPI(form);
      setStatus("success");
    } catch {
      setStatus("idle");
      toast.error("Registration failed. Please try again.");
    }
  };
  return (
    <>
      <Navbar />
      <Container>

        <div className="flex justify-center mt-12 mb-12">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl transition-colors dark:border dark:border-gray-700">
            {status === "success" ? (
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Email Sent!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  We've sent a verification link to your email. Please check your inbox and verify your email address to continue.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                  Create Account
                </h2>
                <input name="name"
                  className="w-full border dark:border-gray-700 p-3.5 rounded-xl mb-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  placeholder="Full Name" required
                  onChange={handleChange}
                  disabled={status === "loading"}
                />
                <input name="email"
                  className="w-full border dark:border-gray-700 p-3.5 rounded-xl mb-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  placeholder="Email" onChange={handleChange} required
                  disabled={status === "loading"}
                />
                <input name="password"
                  className="w-full border dark:border-gray-700 p-3.5 rounded-xl mb-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  type="password" required
                  placeholder="Password" onChange={handleChange}
                  disabled={status === "loading"}
                />
                <input name="city"
                  className="w-full border dark:border-gray-700 p-3.5 rounded-xl mb-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  placeholder="City" onChange={handleChange}
                  disabled={status === "loading"}
                />
                <input name="address"
                  className="w-full border dark:border-gray-700 p-3.5 rounded-xl mb-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  placeholder="Address" onChange={handleChange}
                  disabled={status === "loading"}
                />
                {/* Role dropdown */}
                <select
                  name="role"
                  value={form.role}
                  className="w-full border dark:border-gray-700 p-3.5 mb-6 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors appearance-none"
                  onChange={handleChange}
                  disabled={status === "loading"}
                >
                  <option value="">Choose Role</option>
                  <option value="user">User</option>
                  <option value="ambulance_driver">Ambulance Driver</option>
                  <option value="hospital_admin">Hospital Admin</option>
                  <option value="police">Police</option>
                </select>

                {form.role === "ambulance_driver" && (
                  <input name="vehicleNumber"
                    className="w-full border dark:border-gray-700 p-3.5 rounded-xl mb-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    placeholder="Vehicle Number (e.g. MH-12-AB-3456)" onChange={handleChange} required
                    disabled={status === "loading"}
                  />
                )}

                <button
                  onClick={handleRegister}
                  disabled={status === "loading"}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 rounded-xl flex justify-center items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : "Register"}
                </button>
                <p className="text-sm mt-6 text-center text-gray-600 dark:text-gray-400">
                  Already have an account?{" "}
                  <span
                    className="text-red-500 hover:text-red-600 font-semibold cursor-pointer transition-colors"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </span>
                </p>
              </>
            )}
          </div>
        </div>

      </Container>
    </>
  );
}

