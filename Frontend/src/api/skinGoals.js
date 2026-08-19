import api from "./axios";

export const getSkinGoals = async () => {
  const response = await api.get("/api/v1/skin-goals");
  return response.data;
};

export const getActiveSkinGoal = async () => {
  const response = await api.get("/api/v1/skin-goals/active");
  return response.data;
};

export const createSkinGoal = async ({ title, targetDate, targetConcern, targetDescription }) => {
  const response = await api.post("/api/v1/skin-goals", {
    title,
    targetDate,
    targetConcern,
    targetDescription,
  });

  return response.data;
};

export const updateSkinGoal = async (goalId, payload) => {
  const response = await api.patch(`/api/v1/skin-goals/${goalId}`, payload);

  return response.data;
};

export const completeSkinGoal = async (goalId) => {
  const response = await api.patch(`/api/v1/skin-goals/${goalId}/complete`);

  return response.data;
};

export const cancelSkinGoal = async (goalId) => {
  const response = await api.patch(`/api/v1/skin-goals/${goalId}/cancel`);

  return response.data;
};
