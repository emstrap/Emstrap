import { useState, useEffect } from "react";
import AdminSidebar from "../../components/layout/AdminSidebar";
import { getAdminMetrics } from "../../services/api";
import toast from "react-hot-toast";

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        totalDrivers: 0,
        totalEmergencies: 0,
        activeEmergencies: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await getAdminMetrics();
                if (res.success) setMetrics(res.metrics);
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to load admin metrics");
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    const cards = [
        { title: "Total Users", value: metrics.totalUsers, icon: "👤", color: "bg-blue-500" },
        { title: "Ambulance Drivers", value: metrics.totalDrivers, icon: "🚑", color: "bg-emerald-500" },
        { title: "Total Dispatches", value: metrics.totalEmergencies, icon: "🗺️", color: "bg-purple-500" },
        { title: "Active Emergencies", value: metrics.activeEmergencies, icon: "🚨", color: "bg-red-500" }
    ];

    return (
        <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="hidden md:block shadow-2xl z-10"><AdminSidebar /></div>
            
            <div className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">System Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Real-time platform statistics and health metrics.</p>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse"></div>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {cards.map(card => (
                            <div key={card.title} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:-translate-y-2 transition-transform duration-300">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{card.title}</p>
                                    <p className="text-5xl font-black text-gray-900 dark:text-white mt-3 tracking-tighter">{card.value}</p>
                                </div>
                                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-3xl shadow-lg text-white ${card.color}`}>
                                    {card.icon}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 
                 <div className="mt-12 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 dark:text-white">Admin Privileges Active</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
                        Welcome to the administrative portal. From this highly secure zone, you have unrestricted backend access to modify user roles, demote malicious clients, and oversee every emergency dispatched across the entire network node.
                    </p>
                 </div>
            </div>
        </div>
    );
}
