import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md transition-colors relative z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <Link to="/">
            <img src={logo} alt="AmbuGo Logo" className="h-15 sm:h-12 object-contain" />
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex gap-6 items-center">
            {user && (
              <Link to="/dashboard" className="text-gray-700 dark:text-gray-200 hover:text-red-600 transition-colors">
                Dashboard
              </Link>
            )}
            {(!user || user.role === 'user') && (
              <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-red-600 transition-colors">
                Emergency
              </Link>
            )}
            {(user?.role === 'ambulance' || user?.role === 'ambulance_driver') && (
              <Link to="/booking-history" className="text-gray-700 dark:text-gray-200 hover:text-red-600 transition-colors">
                Booking History
              </Link>
            )}
            {(!user || user?.role === 'user') && (
              <button
                onClick={() => navigate(user ? "/booking" : "/login")}
                className="text-gray-700 dark:text-gray-200 hover:text-red-600 transition-colors"
              >Booking
              </button>
            )}
            {!user ? (
              <Link to="/login" className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-full font-medium transition-colors">
                Login
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                  className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center hover:bg-red-700 transition"
                  title={user?.name || "User"}
                >
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Profile
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()} // prevent blur
                      onClick={toggleTheme}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); logoutUser(); navigate("/"); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 font-semibold rounded-b-xl"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile button */}
          <button
            className="md:hidden text-gray-800 dark:text-gray-100 text-2xl"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col pt-16 md:hidden ${open ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-2xl"
        >
          ✕
        </button>

        <div className="flex flex-col px-6">
          {!user ? (
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="text-lg font-medium text-gray-700 dark:text-gray-200 hover:text-red-600 transition-colors"
              >
                Emergency
              </Link>
              <button
                onClick={() => { setOpen(false); navigate(user ? "/booking" : "/login"); }}
                className="text-lg font-medium text-left text-gray-700 dark:text-gray-200 hover:text-red-600 transition-colors"
              >
                {user?.role === 'ambulance' || user?.role === 'ambulance_driver' ? 'Booking History' : 'Booking'}
              </button>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-medium transition-colors text-center"
              >
                Login
              </Link>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex flex-col items-center justify-center border-b dark:border-gray-800 pb-6 mb-4">
                <div className="w-16 h-16 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-3xl mb-3 shadow-md">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <p className="font-semibold text-lg text-gray-900 dark:text-white truncate w-full text-center">{user?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-full text-center">{user?.email}</p>
              </div>

              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => { setOpen(false); navigate("/profile"); }}
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors text-lg"
                >
                  Profile
                </button>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors text-lg block"
                >
                  Dashboard
                </Link>

                {user?.role === 'user' && (
                  <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors text-lg block"
                  >
                    Emergency
                  </Link>
                )}
                <button
                  onClick={() => { setOpen(false); navigate(user ? "/booking" : "/login"); }}
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors text-lg"
                >
                  {user?.role === 'ambulance' || user?.role === 'ambulance_driver' ? 'Booking History' : 'Booking'}
                </button>

                <button
                  onClick={() => { setOpen(false); toggleTheme(); }}
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors text-lg"
                >
                  {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
                </button>

                <div className="pt-4 mt-4 border-t dark:border-gray-800 pb-4">
                  <button
                    onClick={() => { setOpen(false); logoutUser(); navigate("/"); }}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors text-lg"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
