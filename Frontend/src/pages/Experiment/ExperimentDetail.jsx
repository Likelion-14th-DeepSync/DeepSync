import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Check,
  Sparkles,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Moon,
} from "lucide-react";

import {
  getExperiment,
  getExperimentProgress,
  getExperimentResult,
  cancelExperiment,
  completeExperiment,
} from "../../api/experiments";

import "./ExperimentDetail.css";

function getTodayKey() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getExperimentTypeLabel(type) {
  const labels = {
    SLEEP_BEFORE_MIDNIGHT: "자정 전에 취침하기",
    SLEEP_AT_LEAST_7_HOURS: "하루 7시간 이상 수면하기",
    NO_LATE_NIGHT_MEAL: "야식 안 먹기",
    WATER_AT_LEAST_1500_ML: "하루 물 1.5L 이상 마시기",
    KEEP_SUNSCREEN_ROUTINE: "매일 선크림 바르기",
  };

  return labels[type] ?? type ?? "생활 실험";
}

function getStatusLabel(status) {
  const labels = {
    SCHEDULED: "시작 예정",
    ACTIVE: "진행 중",
    COMPLETED: "완료",
    CANCELLED: "취소",
  };

  return labels[status] ?? status ?? "-";
}

function getSourceLabel(sourceType) {
  const labels = {
    AUTO: "자동 판정",
    MANUAL: "수동 기록",
  };

  return labels[sourceType] ?? sourceType ?? "-";
}

function ExperimentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [experiment, setExperiment] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const todayKey = getTodayKey();

  const fetchExperimentData = useCallback(async () => {
    if (!id) {
      setErrorMessage("실험 ID가 없습니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const [experimentResponse, progressResponse] = await Promise.all([
        getExperiment(id),
        getExperimentProgress(id),
      ]);

      console.log("생활 실험 상세:", experimentResponse);
      console.log("생활 실험 진행률:", progressResponse);

      const experimentData = experimentResponse.data ?? null;
      const progress = progressResponse.data ?? null;

      setExperiment(experimentData);
      setProgressData(progress);

      if (experimentData?.status === "COMPLETED") {
        try {
          const resultResponse = await getExperimentResult(id);

          console.log("생활 실험 결과:", resultResponse);

          setResult(resultResponse.data ?? null);
        } catch (resultError) {
          console.error("실험 결과 조회 실패:", resultError);
          setResult(null);
        }
      } else {
        setResult(null);
      }
    } catch (error) {
      console.error("생활 실험 조회 실패:", error);

      setExperiment(null);
      setProgressData(null);

      setErrorMessage(
        error.response?.data?.error?.message ?? "생활 실험 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExperimentData();
  }, [fetchExperimentData]);

  const todayCheck = useMemo(() => {
    if (!Array.isArray(progressData?.dailyChecks)) {
      return null;
    }

    return progressData.dailyChecks.find((check) => check.recordDate === todayKey) ?? null;
  }, [progressData, todayKey]);

  const todayAchieved = Boolean(todayCheck?.achieved);

  const progressPercent = useMemo(() => {
    if (!progressData) {
      return 0;
    }

    if (progressData.durationDays > 0) {
      return Math.min(100, Math.round((progressData.currentDay / progressData.durationDays) * 100));
    }

    return 0;
  }, [progressData]);

  const practiceRate = useMemo(() => {
    if (typeof progressData?.completionRate !== "number") {
      return 0;
    }

    if (progressData.completionRate <= 1) {
      return Math.round(progressData.completionRate * 100);
    }

    return Math.round(progressData.completionRate);
  }, [progressData]);

  const handleCancel = async () => {
    if (!experiment || isProcessing) {
      return;
    }

    const confirmed = window.confirm("이 생활 실험을 취소할까요?");

    if (!confirmed) {
      return;
    }

    try {
      setIsProcessing(true);

      const response = await cancelExperiment(id);

      console.log("생활 실험 취소:", response);

      await fetchExperimentData();
    } catch (error) {
      console.error("생활 실험 취소 실패:", error);

      alert(error.response?.data?.error?.message ?? "생활 실험 취소에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!experiment || isProcessing) {
      return;
    }

    const confirmed = window.confirm("이 생활 실험을 완료 처리할까요?");

    if (!confirmed) {
      return;
    }

    try {
      setIsProcessing(true);

      const response = await completeExperiment(id);

      console.log("생활 실험 완료:", response);

      await fetchExperimentData();
    } catch (error) {
      console.error("생활 실험 완료 실패:", error);

      alert(error.response?.data?.error?.message ?? "생활 실험 완료에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resultScoreChange = useMemo(() => {
    if (!result?.scoreChanges) {
      return null;
    }

    return result.scoreChanges.overall?.change ?? null;
  }, [result]);

  if (loading) {
    return (
      <div className="experiment-detail-page">
        <div className="experiment-detail-phone">
          <main className="experiment-detail-empty">
            <Sparkles size={32} />
            <h1>생활 실험을 불러오는 중이에요</h1>
            <p>잠시만 기다려주세요.</p>
          </main>
        </div>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="experiment-detail-page">
        <div className="experiment-detail-phone">
          <main className="experiment-detail-empty">
            <Sparkles size={32} />

            <h1>생활 실험을 찾을 수 없어요</h1>

            <p>{errorMessage || "진행 중인 생활 실험이 없거나 종료된 실험이에요."}</p>

            <button type="button" onClick={() => navigate("/experiment/start")}>
              새 실험 시작하기
            </button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="experiment-detail-page">
      <div className="experiment-detail-phone">
        <main className="experiment-detail-scroll">
          <header className="experiment-detail-header">
            <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
              <ChevronLeft size={25} />
            </button>

            <h1>생활 실험</h1>

            <div />
          </header>

          <section className="experiment-detail-hero">
            <span className="experiment-detail-badge">{experiment.durationDays}일 실험</span>

            <h2>{experiment.title}</h2>

            <p>
              {getExperimentTypeLabel(experiment.experimentType)}을 실천하며 피부 변화를 관찰하고
              있어요.
            </p>

            <div
              style={{
                marginTop: 10,
                fontSize: 11,
                color: "#777",
              }}
            >
              {experiment.startDate} ~ {experiment.endDate}
              {" · "}
              {getStatusLabel(experiment.status)}
            </div>

            <div className="experiment-detail-day">
              <strong>
                Day {progressData?.currentDay ?? 0} /{" "}
                {progressData?.durationDays ?? experiment.durationDays}
              </strong>

              <span>{progressPercent}%</span>
            </div>

            <div className="experiment-detail-progress-track">
              <div
                className="experiment-detail-progress-bar"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </section>

          {experiment.status === "ACTIVE" && (
            <section className="experiment-detail-section">
              <h2>오늘의 실천</h2>

              <div className="experiment-habit-list">
                <div
                  className={`experiment-habit-card ${todayAchieved ? "is-done" : ""}`}
                  style={{
                    cursor: "default",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 11,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#F0EDFF",
                        color: "#6C5CE7",
                        flexShrink: 0,
                      }}
                    >
                      <Moon size={17} />
                    </div>

                    <div>
                      <strong>{experiment.title}</strong>

                      <span>
                        {todayCheck
                          ? todayAchieved
                            ? "오늘 생활 기록을 기준으로 실천 완료로 판정됐어요."
                            : "오늘 생활 기록을 기준으로 미달성으로 판정됐어요."
                          : "아직 오늘 생활 기록이 없어요."}
                      </span>
                    </div>
                  </div>

                  <div className="experiment-detail-check">
                    {todayAchieved && <Check size={16} />}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  padding: "12px 13px",
                  borderRadius: 12,
                  background: "#F0EDFF",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    marginBottom: 5,
                    fontSize: 11,
                    color: "#6C5CE7",
                  }}
                >
                  자동 판정 실험
                </strong>

                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    lineHeight: 1.55,
                    color: "#777",
                  }}
                >
                  이 실험은 생활 기록을 통해 자동으로 판정됩니다. 관련 생활 기록을 입력하면 오늘의
                  실천 여부에 자동으로 반영돼요.
                </p>
              </div>

              {!todayCheck && (
                <button
                  type="button"
                  onClick={() => navigate("/record?tab=calendar&action=lifestyle")}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: "12px 0",
                    border: "none",
                    borderRadius: 12,
                    background: "#6C5CE7",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  오늘 생활 기록 입력하기
                </button>
              )}

              {todayCheck && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "11px 12px",
                    borderRadius: 12,
                    background: "#fff",
                    fontSize: 10,
                    color: "#888",
                  }}
                >
                  <div>
                    판정 방식: <strong>{getSourceLabel(todayCheck.sourceType)}</strong>
                  </div>

                  {todayCheck.actualValue && (
                    <div style={{ marginTop: 4 }}>실제 기록: {todayCheck.actualValue}</div>
                  )}

                  {todayCheck.note && <div style={{ marginTop: 4 }}>{todayCheck.note}</div>}
                </div>
              )}
            </section>
          )}

          <section className="experiment-detail-section">
            <h2>현재 진행 상황</h2>

            <div className="experiment-detail-summary">
              <div>
                <TrendingUp size={18} />
                <span>실천율</span>
                <strong>{practiceRate}%</strong>
              </div>

              <div>
                <BarChart3 size={18} />
                <span>기록 일수</span>
                <strong>{progressData?.recordedDays ?? 0}일</strong>
              </div>

              <div>
                <ShieldCheck size={18} />
                <span>달성 일수</span>
                <strong>{progressData?.achievedDays ?? 0}일</strong>
              </div>
            </div>
          </section>

          <section className="experiment-detail-section">
            <h2>일별 실천 기록</h2>

            {progressData?.dailyChecks?.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {progressData.dailyChecks.map((check) => (
                  <div
                    key={check.checkId ?? check.recordDate}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 13,
                      background: "#fff",
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          display: "block",
                          fontSize: 12,
                        }}
                      >
                        {check.recordDate}
                      </strong>

                      <span
                        style={{
                          display: "block",
                          marginTop: 3,
                          fontSize: 10,
                          color: "#999",
                        }}
                      >
                        {getSourceLabel(check.sourceType)}
                        {check.actualValue ? ` · ${check.actualValue}` : ""}
                      </span>

                      {check.note && (
                        <span
                          style={{
                            display: "block",
                            marginTop: 3,
                            fontSize: 10,
                            color: "#999",
                          }}
                        >
                          {check.note}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: check.achieved ? "#6C5CE7" : "#999",
                      }}
                    >
                      {check.achieved ? "달성" : "미달성"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: "#fff",
                  fontSize: 11,
                  color: "#999",
                  textAlign: "center",
                }}
              >
                아직 자동 판정된 생활 기록이 없어요.
              </div>
            )}
          </section>

          <section className="experiment-detail-section">
            <div className="experiment-detail-section-title">
              <h2>AI 관찰</h2>
              <Sparkles size={18} />
            </div>

            {experiment.status !== "COMPLETED" ? (
              <div className="experiment-ai-list">
                <article className="experiment-ai-card">
                  <div className="experiment-ai-card-top">
                    <strong>{getExperimentTypeLabel(experiment.experimentType)}</strong>

                    <span>{(progressData?.recordedDays ?? 0) < 3 ? "데이터 부족" : "관찰 중"}</span>
                  </div>

                  <p>
                    {(progressData?.recordedDays ?? 0) < 3
                      ? "생활 기록과 피부 데이터를 조금 더 모으면 변화 경향을 분석할 수 있어요."
                      : "생활 실천 기록과 피부 변화 사이의 연관성을 분석하고 있어요."}
                  </p>
                </article>
              </div>
            ) : result ? (
              <div className="experiment-ai-list">
                <article className="experiment-ai-card">
                  <div className="experiment-ai-card-top">
                    <strong>실험 결과</strong>
                    <span>완료</span>
                  </div>

                  <p>총 {result.evaluatedDays ?? 0}일의 기록을 기반으로 피부 변화를 분석했어요.</p>
                </article>

                {result.scoreChanges?.redness && (
                  <article className="experiment-ai-card">
                    <div className="experiment-ai-card-top">
                      <strong>붉은기</strong>

                      <span>
                        {result.scoreChanges.redness.change > 0 ? "+" : ""}
                        {result.scoreChanges.redness.change}
                      </span>
                    </div>

                    <p>
                      이전 {result.scoreChanges.redness.before} → 이후{" "}
                      {result.scoreChanges.redness.after}
                    </p>
                  </article>
                )}

                {result.scoreChanges?.trouble && (
                  <article className="experiment-ai-card">
                    <div className="experiment-ai-card-top">
                      <strong>트러블</strong>

                      <span>
                        {result.scoreChanges.trouble.change > 0 ? "+" : ""}
                        {result.scoreChanges.trouble.change}
                      </span>
                    </div>

                    <p>
                      이전 {result.scoreChanges.trouble.before} → 이후{" "}
                      {result.scoreChanges.trouble.after}
                    </p>
                  </article>
                )}

                {result.scoreChanges?.dryness && (
                  <article className="experiment-ai-card">
                    <div className="experiment-ai-card-top">
                      <strong>건조함</strong>

                      <span>
                        {result.scoreChanges.dryness.change > 0 ? "+" : ""}
                        {result.scoreChanges.dryness.change}
                      </span>
                    </div>

                    <p>
                      이전 {result.scoreChanges.dryness.before} → 이후{" "}
                      {result.scoreChanges.dryness.after}
                    </p>
                  </article>
                )}

                {resultScoreChange !== null && (
                  <article className="experiment-ai-card">
                    <div className="experiment-ai-card-top">
                      <strong>종합 피부 점수</strong>

                      <span>
                        {resultScoreChange > 0 ? "+" : ""}
                        {resultScoreChange}
                      </span>
                    </div>
                  </article>
                )}
              </div>
            ) : (
              <div className="experiment-ai-list">
                <article className="experiment-ai-card">
                  <p>실험 결과를 불러올 수 없어요.</p>
                </article>
              </div>
            )}

            <p className="experiment-ai-notice">
              관찰 결과는 생활 습관과 피부 데이터 사이의 연관성을 보여주며 직접적인 원인을 의미하지
              않습니다.
            </p>
          </section>

          <button
            type="button"
            className="experiment-detail-change"
            onClick={() => navigate("/record")}
          >
            피부 변화 기록 보기
          </button>

          {experiment.status === "ACTIVE" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginTop: 12,
              }}
            >
              <button
                type="button"
                onClick={handleCancel}
                disabled={isProcessing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "12px 0",
                  border: "1px solid #E5E5EA",
                  borderRadius: 13,
                  background: "#fff",
                  color: "#777",
                  fontFamily: "inherit",
                  cursor: isProcessing ? "default" : "pointer",
                  opacity: isProcessing ? 0.6 : 1,
                }}
              >
                <XCircle size={16} />
                실험 취소
              </button>

              <button
                type="button"
                onClick={handleComplete}
                disabled={isProcessing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "12px 0",
                  border: "none",
                  borderRadius: 13,
                  background: "#6C5CE7",
                  color: "#fff",
                  fontFamily: "inherit",
                  cursor: isProcessing ? "default" : "pointer",
                  opacity: isProcessing ? 0.6 : 1,
                }}
              >
                <CheckCircle2 size={16} />
                실험 완료
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ExperimentDetail;
