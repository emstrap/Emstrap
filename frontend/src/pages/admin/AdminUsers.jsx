import { useState, useEffect } from "react";
import AdminSidebar from "../../components/layout/AdminSidebar";
import { getAllUsers, updateUserRole } from "../../services/api";
import toast from "react-hot-toast";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const res = await getAllUsers();
            if (res.success) setUsers(res.users);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load users database");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        const loadingToast = toast.loading("Updating role...");
        try {
            const res = await updateUserRole(userId, newRole);
            if (res.success) {
                toast.success("Role successfully updated!", { id: loadingToast });
                // Optimistic Local Update
                setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
            }
        } catch (error) {
            toast.error("Failed to update user role", { id: loadingToast });
        }
    };

    // Styling helpers
    const roleColors = {
        admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200",
        ambulance_driver: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
        ambulance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
        user: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
    };

    return (
        <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="hidden md:block shadow-2xl z-10"><AdminSidebar /></div>
            
            <div className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">User Management</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Promote or demote global user accounts.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200">
                        Total Accounts: {users.length}
                    </div>
                </header>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">
                                    <th className="p-5 font-bold">User Identity</th>
                                    <th className="p-5 font-bold">Mobile / Email</th>
                                    <th className="p-5 font-bold">Join Date</th>
                                    <th className="p-5 font-bold w-48">Current Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-400">Loading master database...</td></tr>
                                ) : users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 shadow-inner">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-bold text-gray-900 dark:text-white">{user.name}</div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-gray-600 dark:text-gray-400 text-sm">
                                            <div className="font-medium text-gray-800 dark:text-gray-300">{user.mobile}</div>
                                            <div>{user.email}</div>
                                        </td>
                                        <td className="p-5 text-gray-600 dark:text-gray-400 text-sm">
                                            {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="p-5">
                                            <select 
                                                value={user.role} 
                                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                className={`appearance-none w-full border font-bold text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-opacity-50 transition-all cursor-pointer ${roleColors[user.role] || roleColors.user} hover:brightness-95`}
                                            >
                                                <option value="user">USER (Patient)</option>
                                                <option value="ambulance_driver">AMBULANCE DRIVER</option>
                                                <option value="admin">ADMINISTRATOR</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
