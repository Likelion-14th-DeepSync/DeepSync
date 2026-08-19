import api from "./axios";

export const getExperiments = async () => {
  const response = await api.get("/api/v1/experiments");
  return response.data;
};

export const getActiveExperiment = async () => {
  const response = await api.get("/api/v1/experiments/active");
  return response.data;
};

export const getExperiment = async (id) => {
  const response = await api.get(`/api/v1/experiments/${id}`);
  return response.data;
};

export const getExperimentProgress = async (id) => {
  const response = await api.get(`/api/v1/experiments/${id}/progress`);
  return response.data;
};

export const getExperimentResult = async (id) => {
  const response = await api.get(`/api/v1/experiments/${id}/result`);
  return response.data;
};

export const createExperiment = async ({ title, experimentType, experimentPeriod, startDate }) => {
  const response = await api.post("/api/v1/experiments", {
    title,
    experimentType,
    experimentPeriod,
    startDate,
  });

  return response.data;
};

export const updateDailyCheck = async (id, date, { achieved, note }) => {
  const response = await api.put(`/api/v1/experiments/${id}/daily-checks/${date}`, {
    achieved,
    note,
  });

  return response.data;
};

export const cancelExperiment = async (id) => {
  const response = await api.patch(`/api/v1/experiments/${id}/cancel`);
  return response.data;
};

export const completeExperiment = async (id) => {
  const response = await api.post(`/api/v1/experiments/${id}/complete`);
  return response.data;
};
