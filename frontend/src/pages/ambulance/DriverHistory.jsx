import { useEffect, useState } from "react";
import API from "../../services/api";
import Navbar from "../../components/layout/Navbar";
import Container from "../../components/layout/Container";
import toast from "react-hot-toast";

export default function DriverHistory() {
    const [acceptedHistory, setAcceptedHistory] = useState([]);
    const [rejectedHistory, setRejectedHistory] = useState([]);
    const [activeTab, setActiveTab] = useState("accepted");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // We know we added a GET /history to emergency.controller.js
                // If not using that, we fetch driver specific bookings
                const res = await API.get("/api/emergency/driver/history");
                setAcceptedHistory(res.data.data?.accepted || []);
                setRejectedHistory(res.data.data?.rejected || []);
            } catch (err) {
                toast.error("Failed to load history");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const renderCard = (req, type) => (
        <div key={req._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm transition-colors">
            <div className="flex justify-between items-start mb-2">
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full uppercase font-bold">Booking History</span>
                <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Emergency Booking at Location [{req.location?.latitude?.toFixed(4)}, {req.location?.longitude?.toFixed(4)}].
            </p>

            {type === "accepted" && (
                <div className="mt-4 pt-3 border-t dark:border-gray-700 border-dashed text-green-600 font-semibold text-sm">
                    ✓ Accepted by you
                </div>
            )}

            {type === "rejected" && (
                <div className="mt-4 pt-3 border-t dark:border-gray-700 border-dashed text-gray-500 font-semibold text-sm">
                    ✗ Declined by you
                </div>
            )}
        </div>
    );

    return (
        <>
            <Navbar />
            <Container>
                <div className="mt-10 mb-8 border-b dark:border-gray-700 pb-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Driver Booking History</h1>
                    <p className="text-gray-500 dark:text-gray-400">All previously accepted and declined emergency dispatch bookings.</p>
                </div>

                <div className="flex space-x-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl max-w-sm">
                    <button
                        onClick={() => setActiveTab("accepted")}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'accepted' ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Accepted ({acceptedHistory.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("rejected")}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'rejected' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Declined ({rejectedHistory.length})
                    </button>
                </div>

                {loading ? (
                    <div className="text-center p-10 text-gray-500">Loading history...</div>
                ) : (
                    <div className="space-y-4 max-w-3xl mb-12">
                        {activeTab === "accepted" && (
                            <>
                                {acceptedHistory.map((req) => renderCard(req, "accepted"))}
                                {acceptedHistory.length === 0 && (
                                    <div className="text-center p-10 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed dark:border-gray-700">
                                        No accepted history available.
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === "rejected" && (
                            <>
                                {rejectedHistory.map((req) => renderCard(req, "rejected"))}
                                {rejectedHistory.length === 0 && (
                                    <div className="text-center p-10 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed dark:border-gray-700">
                                        No declined history available.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </Container>
        </>
    );
}
