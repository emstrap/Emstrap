import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  const menuItems = [
    { name: "Overview", path: "/admin/overview", icon: "O" },
    { name: "Users", path: "/admin/users", icon: "U" },
    { name: "Emergencies", path: "/admin/emergencies", icon: "E" },
    { name: "Bookings", path: "/admin/bookings", icon: "B" },
    { name: "Hospitals", path: "/admin/hospitals", icon: "H" },
    { name: "Ambulance", path: "/admin/ambulance", icon: "M" }
  ];

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen flex flex-col shadow-md">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
          <span>A</span> Admin Panel
        </h2>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">System Commander</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold ${isActive
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                }`}
            >
              <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold dark:hover:bg-red-900/20"
        >
          <span className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-sm">X</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
