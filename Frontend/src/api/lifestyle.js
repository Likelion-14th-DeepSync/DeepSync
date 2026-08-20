import api from "./axios";

/**
 * 특정 날짜 생활 기록 조회
 * GET /api/v1/lifestyle-records/{date}
 */
export const getLifestyleRecord = async (date) => {
  const response = await api.get(`/api/v1/lifestyle-records/${date}`);

  return response.data;
};

/**
 * 생활 기록 생성
 * POST /api/v1/lifestyle-records
 */
export const createLifestyleRecord = async (payload) => {
  const response = await api.post("/api/v1/lifestyle-records", {
    recordDate: payload.recordDate,

    sleepDurationMinutes: payload.sleepDurationMinutes ?? null,

    bedtime: payload.bedtime ?? null,

    wakeUpTime: payload.wakeUpTime ?? null,

    lateNightMeal: payload.lateNightMeal ?? false,

    waterIntakeMl: payload.waterIntakeMl ?? null,

    sourceType: payload.sourceType ?? "MANUAL",
  });

  return response.data;
};

/**
 * 생활 기록 수정
 * PATCH /api/v1/lifestyle-records/{date}
 */
export const updateLifestyleRecord = async (date, payload) => {
  const response = await api.patch(`/api/v1/lifestyle-records/${date}`, {
    recordDate: date,

    sleepDurationMinutes: payload.sleepDurationMinutes ?? null,

    bedtime: payload.bedtime ?? null,

    wakeUpTime: payload.wakeUpTime ?? null,

    lateNightMeal: payload.lateNightMeal ?? false,

    waterIntakeMl: payload.waterIntakeMl ?? null,

    sourceType: payload.sourceType ?? "MANUAL",
  });

  return response.data;
};
