import api from "./axios";

/* =========================================================
   피부 분석 API
========================================================= */

/**
 * 피부 분석 요청
 * POST /api/v1/skin-images/{imageId}/analyses
 */
export const requestSkinAnalysis = async (imageId) => {
  console.log("🔥 requestSkinAnalysis 함수 진입:", imageId);

  const response = await api.post(`/api/v1/skin-images/${imageId}/analyses`);

  console.log("🔥 requestSkinAnalysis 서버 응답:", response.data);

  return response.data;
};

/**
 * 피부 분석 시작
 * PATCH /api/v1/skin-analyses/{analysisId}/start
 */
export const startSkinAnalysis = async (analysisId) => {
  console.log("🔥 startSkinAnalysis 함수 진입:", analysisId);

  const response = await api.patch(`/api/v1/skin-analyses/${analysisId}/start`);

  console.log("🔥 startSkinAnalysis 서버 응답:", response.data);

  return response.data;
};

/**
 * 피부 분석 결과 저장
 * PATCH /api/v1/skin-analyses/{analysisId}/result
 */
export const completeSkinAnalysis = async (analysisId, result) => {
  console.log("🔥 completeSkinAnalysis 함수 진입:", {
    analysisId,
    result,
  });

  const response = await api.patch(`/api/v1/skin-analyses/${analysisId}/result`, result);

  console.log("🔥 completeSkinAnalysis 서버 응답:", response.data);

  return response.data;
};

/**
 * 피부 분석 실패
 */
export const failSkinAnalysis = async (analysisId, reason) => {
  const response = await api.patch(`/api/v1/skin-analyses/${analysisId}/failure`, {
    reason,
  });

  return response.data;
};

/**
 * analysisId로 조회
 */
export const getSkinAnalysis = async (analysisId) => {
  const response = await api.get(`/api/v1/skin-analyses/${analysisId}`);

  return response.data;
};

/**
 * imageId로 분석 결과 조회
 */
export const getSkinAnalysisByImage = async (imageId) => {
  const response = await api.get(`/api/v1/skin-images/${imageId}/analysis`);

  return response.data;
};

/**
 * 최신 피부 분석
 */
export const getLatestSkinAnalysis = async () => {
  const response = await api.get("/api/v1/skin-analyses/latest");

  return response.data;
};

/**
 * 기간별 피부 분석
 */
export const getSkinAnalyses = async (startDate, endDate) => {
  const response = await api.get("/api/v1/skin-analyses", {
    params: {
      startDate,
      endDate,
    },
  });

  return response.data;
};

/* =========================================================
   개인 분석 API
========================================================= */

export const recalculateAnalysisFactors = async (periodDays = 7) => {
  const response = await api.post("/api/v1/analysis/factors/recalculate", null, {
    params: {
      periodDays,
    },
  });

  return response.data;
};

export const getAnalysisFactors = async () => {
  const response = await api.get("/api/v1/analysis/factors");

  return response.data;
};

export const getAnalysisFactor = async (factor) => {
  const response = await api.get(`/api/v1/analysis/factors/${factor}`);

  return response.data;
};

export const getTodayAnalysis = async () => {
  const response = await api.get("/api/v1/analysis/today");

  return response.data;
};

/**
 * 피부 분석 7/30/90일 타임라인 조회
 * GET /api/v1/skin-analyses/timeline?period=SEVEN_DAYS
 */
export const getAnalysisTimeline = async (period = "SEVEN_DAYS") => {
  const response = await api.get("/api/v1/skin-analyses/timeline", {
    params: {
      period,
    },
  });

  return response.data;
};
