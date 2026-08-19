import api from "./axios";

export const REMINDER_TYPE = {
  SKIN_CAPTURE: "SKIN_CAPTURE",
  LIFESTYLE_RECORD: "LIFESTYLE_RECORD",
  WATER_INTAKE: "WATER_INTAKE",
  BEDTIME_PREPARATION: "BEDTIME_PREPARATION",
  EXPERIMENT_ACTION: "EXPERIMENT_ACTION",
  DDAY_ROUTINE: "DDAY_ROUTINE",
};

export const reminderApi = {
  getSettings: async () => {
    const response = await api.get("/api/v1/reminders/settings");
    return response.data;
  },

  updateSetting: async (type, settingData) => {
    const response = await api.put(`/api/v1/reminders/settings/${type}`, settingData);
    return response.data;
  },

  disableSetting: async (type) => {
    const response = await api.patch(`/api/v1/reminders/settings/${type}/disable`);
    return response.data;
  },

  deleteSetting: async (type) => {
    const response = await api.delete(`/api/v1/reminders/settings/${type}`);
    return response.data;
  },

  getTodayReminder: async () => {
    const response = await api.get("/api/v1/reminders/today");
    return response.data;
  },
};