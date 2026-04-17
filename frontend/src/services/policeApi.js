import API from "./api";

export const getPolice = async () => {
  const res = await API.get("/api/police");
  return res.data;
};

export const getPoliceById = async (id) => {
  const res = await API.get(`/api/police/${id}`);
  return res.data;
};

export const addPolice = async (payload) => {
  const res = await API.post("/api/police", payload);
  return res.data;
};

export const updatePolice = async (id, payload) => {
  const res = await API.put(`/api/police/${id}`, payload);
  return res.data;
};

export const deletePolice = async (id) => {
  const res = await API.delete(`/api/police/${id}`);
  return res.data;
};
