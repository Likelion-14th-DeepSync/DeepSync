import api from "./axios";

export const getDdayDashboard = async (period = "SEVEN_DAYS") => {
  const response = await api.get("/api/v1/dashboard/dday", {
    params: {
      period,
    },
  });

  return response.data;
};
