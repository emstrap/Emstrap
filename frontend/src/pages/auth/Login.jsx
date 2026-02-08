import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import { loginAPI } from "../../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const data = await loginAPI({ email, password });

      loginUser(data);

      // redirect based on role
      if (data.role === "user") navigate("/user");
      if (data.role === "ambulance") navigate("/ambulance");
      if (data.role === "hospital") navigate("/hospital");
      if (data.role === "police") navigate("/police");
      if (data.role === "admin") navigate("/admin");
    } catch {
      alert("Login failed");
    }
  };
  return (
    <>
      <Navbar />
      <Container>

        <div className="flex justify-center mt-12">
          <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">
              Login
            </h2>

            <input
              className="w-full border p-3 rounded-lg mb-4"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="w-full border p-3 rounded-lg mb-6"
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleLogin} className="w-full bg-red-600 text-white py-3 rounded-lg">
              Login
            </button>
            <p className="text-sm mt-4 text-center">
              Don't have an account?{" "}
              <span
                className="text-blue-600 cursor-pointer"
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

