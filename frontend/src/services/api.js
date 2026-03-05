import axios from "axios";


export const API_URL = import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: API_URL,
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

export default API;
