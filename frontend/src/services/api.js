import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true // Extremely important to let cookies route through Origin
});

// REGISTER API
export const registerAPI = async (userData) => {
  const res = await API.post("/auth/register", userData);
  return res.data;
};

// LOGIN API
export const loginAPI = async (credentials) => {
  const res = await API.post("/auth/login", credentials);
  return res.data;
};

// VERIFY EMAIL API
export const verifyEmailAPI = async (token) => {
  const res = await API.get(`/auth/verify-email/${token}`);
  return res.data;
};

// EMERGENCY APIs
export const getDriverHistory = async () => {
  const res = await API.get("/api/emergency/driver/history");
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

export default API;
