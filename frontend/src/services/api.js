import axios from "axios";


export const API_URL = import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: API_URL,
  withCredentials: true // Extremely important to let cookies route through Origin
});

// AUTH APIs
export const registerAPI = async (userData) => {
  const res = await API.post("/auth/register", userData);
  return res.data;
};

export const loginAPI = async (userData) => {
  const res = await API.post("/auth/login", userData);
  return res.data;
};

export const setupAdmin = async (userData) => {
  const res = await API.post("/auth/setup-admin", userData);
  return res.data;
};

export const logout = async () => {
  const res = await API.post("/auth/logout");
  return res.data;
};

// VERIFY EMAIL API
export const verifyEmailAPI = async (token) => {
  const res = await API.get(`/auth/verify-email/${token}`);
  return res.data;
};

// FORGOT PASSWORD API
export const forgotPasswordAPI = async (email) => {
  const res = await API.post("/auth/forgot-password", { email });
  return res.data;
};

// RESET PASSWORD API
export const resetPasswordAPI = async (token, password) => {
  const res = await API.put(`/auth/reset-password/${token}`, { password });
  return res.data;
};

// EMERGENCY APIs
export const getDriverHistory = async (filter = "24h") => {
  const res = await API.get(`/api/emergency/driver/history?filter=${filter}`);
  return res.data;
};

export const acceptEmergency = async (id) => {
  const res = await API.put(`/api/emergency/${id}/accept`);
  return res.data;
};

export const declineEmergency = async (id) => {
  const res = await API.put(`/api/emergency/${id}/decline`);
  return res.data;
};

export const cancelEmergency = async (id) => {
  const res = await API.put(`/api/emergency/${id}/cancel`);
  return res.data;
};

// ADMIN APIs
export const getAdminMetrics = async () => {
  const res = await API.get("/api/admin/metrics");
  return res.data;
};

export const getAllUsers = async () => {
  const res = await API.get("/api/admin/users");
  return res.data;
};

export const updateUserRole = async (userId, role) => {
  const res = await API.put(`/api/admin/users/${userId}/role`, { role });
  return res.data;
};

export const getAllEmergencies = async () => {
  const res = await API.get("/api/admin/emergencies");
  return res.data;
};

// POLICE APIs
export const getPoliceEmergencies = async () => {
  const res = await API.get("/api/police/emergencies");
  return res.data;
};

export default API;
