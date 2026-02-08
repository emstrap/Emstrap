import { useState } from "react";
import { registerAPI } from '../../services/api';
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone:"",
    city:"",
    address: "",
    role: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      await registerAPI(form);
      alert("Registration successful");
      navigate("/login");
    } catch {
      alert("Registration failed");
    }
  };
  return (
    <>
      <Navbar />
      <Container>

        <div className="flex justify-center mt-12">
          <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">
              Register
            </h2>
            <input name="name"
              className="w-full border p-3 rounded-lg mb-4"
              placeholder="Full Name" required
              onChange={handleChange}
            />
            <input name="email"
              className="w-full border p-3 rounded-lg mb-4"
              placeholder="Email" onChange={handleChange} required
            />
            <input name="password"
              className="w-full border p-3 rounded-lg mb-6"
              type="password" required
              placeholder="Password" onChange={handleChange}
            />
            <input name="phone"
              className="w-full border p-3 rounded-lg mb-4"
              placeholder="Phone" onChange={handleChange}
            />
             <input name="city"
              className="w-full border p-3 rounded-lg mb-4"
              placeholder="City" onChange={handleChange}
            />
             <input name="address"
              className="w-full border p-3 rounded-lg mb-4"
              placeholder="Address" onChange={handleChange}
            />
            {/* Role dropdown */}
            <select
              name="role"
              value={form.role}
              className="w-full border p-3 mb-4 rounded"
              onChange={handleChange}
            >
              <option value="">Choose Role</option>
              <option value="user">User</option>
              <option value="ambulance_driver">Ambulance Driver</option>
              <option value="hospital_admin">Hospital Admin</option>
              <option value="police">Police</option>
            </select>

            <button  onClick={handleRegister} className="w-full bg-red-600 text-white py-3 rounded-lg">
              Register
            </button>
            <p className="text-sm mt-4 text-center">
              Already have an account?{" "}
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => navigate("/login")}
              >
                Login
              </span>
            </p>
          </div>
        </div>

      </Container>
    </>
  );
}

