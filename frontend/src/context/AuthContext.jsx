import { createContext, useContext, useState, useEffect } from "react";

import API from "../services/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session via HttpOnly Cookie using /auth/me
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data);
      } catch (err) {
        setUser(null); // No valid session
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const loginUser = (data) => {
    // We no longer save token or user to localStorage; the cookie manages the session
    // Just save the user obj in React state
    setUser(data);
  };

  const logoutUser = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed", err);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
