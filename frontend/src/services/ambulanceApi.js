import API from "./api";

export const getAmbulances = async () => {
  const res = await API.get("/api/ambulances");
  return res.data;
};

export const getAmbulanceById = async (id) => {
  const res = await API.get(`/api/ambulances/${id}`);
  return res.data;
};

export const addAmbulance = async (payload) => {
  const res = await API.post("/api/ambulances", payload);
  return res.data;
};

export const updateAmbulance = async (id, payload) => {
  const res = await API.put(`/api/ambulances/${id}`, payload);
  return res.data;
};

export const deleteAmbulance = async (id) => {
  const res = await API.delete(`/api/ambulances/${id}`);
  return res.data;
};
