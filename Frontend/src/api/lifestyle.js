import api from "./axios";

export const getLifestyleRecord = async (date) => {
  const response = await api.get(`/api/v1/lifestyle-records/${date}`);
  return response.data;
};

export const createLifestyleRecord = async (payload) => {
  const response = await api.post("/api/v1/lifestyle-records", payload);
  return response.data;
};

export const updateLifestyleRecord = async (date, payload) => {
  const response = await api.patch(`/api/v1/lifestyle-records/${date}`, payload);

  return response.data;
};
