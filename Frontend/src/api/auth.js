import api from "./axios";

export const signup = async (signupData) => {
  const response = await api.post("/api/v1/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await api.post("/api/v1/auth/login", loginData);
  return response.data;
};
