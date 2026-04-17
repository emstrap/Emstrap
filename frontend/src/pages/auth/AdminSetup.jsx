import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { setupAdmin } from "../../services/api";
import { getErrorMessage } from "../../services/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import toast from "react-hot-toast";

export default function AdminSetup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mobile, setMobile] = useState("");
    
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSetup = async () => {
        try {
            const data = await setupAdmin({ name, email, password, mobile });
            loginUser(data);
            toast.success(data.message || "Admin setup successful! You are now logged in as the Master Admin.");
            navigate("/admin");
        } catch (error) {
            toast.error(getErrorMessage(error, "Setup failed. Check inputs or if an Admin already exists."));
        }
    };

    return (
        <>
            <Navbar />
            <Container>
                <div className="flex justify-center mt-12 mb-12">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl transition-colors dark:border dark:border-gray-700">
                        <div className="text-center mb-6">
                            <span className="text-5xl border-4 border-red-500 rounded-full p-2 inline-block shadow-lg bg-red-50 dark:bg-red-900/20">🛡️</span>
                            <h2 className="text-3xl font-black mt-4 text-gray-900 dark:text-white uppercase tracking-wider">
                                System Init
                            </h2>
                            <p className="text-sm font-bold text-red-500 tracking-widest uppercase mt-2">Master Admin Configuration</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                className="w-full border dark:border-gray-700 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 transition-colors"
                                placeholder="Admin Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <input
                                className="w-full border dark:border-gray-700 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 transition-colors"
                                placeholder="Admin Auth Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <input
                                className="w-full border dark:border-gray-700 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 transition-colors"
                                placeholder="Secure Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <input
                                className="w-full border dark:border-gray-700 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 transition-colors"
                                placeholder="Emergency Contact (10 Digits)"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleSetup}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest py-3.5 rounded-xl transition-colors mt-8 shadow-md"
                        >
                            CREATE MASTER ADMIN
                        </button>
                    </div>
                </div>
            </Container>
        </>
    );
}
