import { useState, useEffect } from "react";
import AdminSidebar from "../../components/layout/AdminSidebar";
import { getAllEmergencies } from "../../services/api";
import toast from "react-hot-toast";

export default function AdminEmergencies() {
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmergencies = async () => {
            try {
                const res = await getAllEmergencies();
                if (res.success) setEmergencies(res.emergencies);
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to load emergencies log");
            } finally {
                setLoading(false);
            }
        };
        fetchEmergencies();
    }, []);

    // Styling helpers
    const statusColors = {
        pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        accepted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        en_route: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };

    return (
        <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="hidden md:block shadow-2xl z-10"><AdminSidebar /></div>
            
            <div className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Emergency Logs</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Master view of all historical and active dispatch lifecycles.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                       <div className="text-center p-12 text-gray-400">Loading master emergency logs...</div>
                    ) : emergencies.map((em) => (
                        <div key={em._id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center hover:scale-[1.01] transition-transform">
                            
                            {/* Status & Timing */}
                            <div className="flex-1 w-full lg:w-auto">
                                <div className="flex items-center gap-4 mb-3">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[em.status] || statusColors.pending}`}>
                                        {em.status}
                                    </span>
                                    <span className="text-sm text-gray-500 font-medium">
                                        {new Date(em.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </span>
                                </div>
                                
                                <div className="text-gray-600 dark:text-gray-400 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                                    <span className="font-bold">ID:</span> <span className="truncate">{em._id}</span>
                                    <span className="font-bold">Location:</span> <span>[{em.location?.latitude?.toFixed(4)}, {em.location?.longitude?.toFixed(4)}]</span>
                                </div>
                            </div>

                            {/* Patient Info */}
                            <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 w-full lg:w-auto">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Requester (Patient)</h4>
                                {em.user ? (
                                    <>
                                        <div className="font-bold text-gray-900 dark:text-white">{em.user.name}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">{em.user.mobile}</div>
                                    </>
                                ) : (
                                    <div className="text-gray-400 italic">Anonymous / System</div>
                                )}
                            </div>

                            {/* Driver Info */}
                            <div className="flex-1 bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 w-full lg:w-auto">
                                <h4 className="text-xs font-bold text-red-400 dark:text-red-500/80 uppercase tracking-widest mb-2">Assigned Driver</h4>
                                {em.ambulance ? (
                                    <>
                                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">🚑 {em.ambulance.driverName}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">{em.ambulance.phone} • {em.ambulance.vehicleNumber || 'No Plate'}</div>
                                    </>
                                ) : (
                                    <div className="text-gray-400 italic">Awaiting Response</div>
                                )}
                            </div>

                        </div>
                    ))}
                    
                    {!loading && emergencies.length === 0 && (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                            No emergencies recorded in the system yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
