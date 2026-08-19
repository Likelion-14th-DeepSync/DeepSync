import api from "./axios";

export const getEnvironmentRecords = async () => {
  const response = await api.get("/api/v1/environment-records");
  return response.data;
};

export const getEnvironmentRecord = async (date) => {
  const response = await api.get(`/api/v1/environment-records/${date}`);
  return response.data;
};

export const createEnvironmentRecord = async (payload) => {
  const response = await api.post("/api/v1/environment-records", payload);
  return response.data;
};

export const updateEnvironmentRecord = async (date, payload) => {
  const response = await api.patch(`/api/v1/environment-records/${date}`, payload);
  return response.data;
};
