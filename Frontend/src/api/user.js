import api from "./axios";

export const getMyProfile = async () => {
  const response = await api.get("/api/v1/members/me");
  return response.data;
};

export const updateMyProfile = async (profileData) => {
  const response = await api.patch("/api/v1/members/me", profileData);
  return response.data;
};
