import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
});

// attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
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

export default API;
