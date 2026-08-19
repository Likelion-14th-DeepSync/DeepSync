import api from "./axios";

export const getTodayAnalysis = async () => {
  const response = await api.get("/api/v1/analysis/today");
  return response.data;
};

export const getAnalysisFactors = async () => {
  const response = await api.get("/api/v1/analysis/factors");
  return response.data;
};

export const getAnalysisTimeline = async (period = "SEVEN_DAYS") => {
  const response = await api.get("/api/v1/skin-analyses/timeline", {
    params: {
      period,
    },
  });

  return response.data;
};
