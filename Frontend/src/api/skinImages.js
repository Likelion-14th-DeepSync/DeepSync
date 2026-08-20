import api from "./axios";

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const getSkinImages = async ({ startDate, endDate } = {}) => {
  const today = new Date();

  const defaultEndDate = formatLocalDate(today);

  const start = new Date(today);
  start.setFullYear(start.getFullYear() - 1);

  const defaultStartDate = formatLocalDate(start);

  const response = await api.get("/api/v1/skin-images", {
    params: {
      startDate: startDate ?? defaultStartDate,
      endDate: endDate ?? defaultEndDate,
    },
  });

  return response.data;
};

export const getSkinImage = async (imageId) => {
  const response = await api.get(`/api/v1/skin-images/${imageId}`);

  return response.data;
};

export const uploadSkinImage = async (file, metadata) => {
  const formData = new FormData();

  formData.append("image", file);

  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], {
      type: "application/json",
    }),
  );

  const response = await api.post("/api/v1/skin-images", formData);

  return response.data;
};

export const checkSkinImageQuality = async (imageId) => {
  const response = await api.post(`/api/v1/skin-images/${imageId}/quality-check`);

  return response.data;
};

export const getSkinImageQuality = async (imageId) => {
  const response = await api.get(`/api/v1/skin-images/${imageId}/quality`);

  return response.data;
};

export const getSkinImageFile = async (imageId) => {
  const response = await api.get(`/api/v1/skin-images/${imageId}/file`, {
    responseType: "blob",
  });

  return response.data;
};

export const deleteSkinImage = async (imageId) => {
  await api.delete(`/api/v1/skin-images/${imageId}`);
};
