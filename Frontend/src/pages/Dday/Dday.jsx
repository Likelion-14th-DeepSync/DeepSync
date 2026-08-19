import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Target,
  ChevronRight,
  Sparkles,
  Check,
  FlaskConical,
  CloudSun,
  ShieldCheck,
  Plus,
  X,
  Pencil,
} from "lucide-react";

import BottomNav from "../../components/BottomNav";
import { getDdayDashboard } from "../../api/dashboard";
import {
  createSkinGoal,
  updateSkinGoal,
  completeSkinGoal,
  cancelSkinGoal,
} from "../../api/skinGoals";

import "./Dday.css";

const ROUTINE_STORAGE_KEY = "wellness-daily-routines";

const DEFAULT_ROUTINES = [
  {
    id: 1,
    icon: "🌙",
    title: "자정 전에 취침하기",
    desc: "피부 회복을 위해 일정한 수면 시간을 유지해요.",
    done: false,
  },
  {
    id: 2,
    icon: "💧",
    title: "하루 물 1.5L 이상 마시기",
    desc: "충분한 수분 섭취로 피부 컨디션을 관리해요.",
    done: false,
  },
  {
    id: 3,
    icon: "☀️",
    title: "외출 전 자외선 차단제 바르기",
    desc: "붉은기와 피부톤 관리를 도와요.",
    done: false,
  },
];

const SKIN_CONCERNS = [
  {
    value: "TROUBLE",
    label: "트러블",
  },
  {
    value: "REDNESS",
    label: "홍조",
  },
  {
    value: "DRYNESS",
    label: "건조함",
  },
  {
    value: "SKIN_TONE",
    label: "피부톤",
  },
];

function getTodayKey() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadTodayRoutines() {
  try {
    const saved = localStorage.getItem(ROUTINE_STORAGE_KEY);

    if (!saved) {
      return DEFAULT_ROUTINES;
    }

    const parsed = JSON.parse(saved);

    if (parsed.date !== getTodayKey()) {
      return DEFAULT_ROUTINES;
    }

    if (!Array.isArray(parsed.routines)) {
      return DEFAULT_ROUTINES;
    }

    return parsed.routines;
  } catch {
    return DEFAULT_ROUTINES;
  }
}

function getConcernLabel(value) {
  const labels = {
    TROUBLE: "트러블",
    REDNESS: "홍조",
    DRYNESS: "건조함",
    SKIN_TONE: "피부톤",
  };

  return labels[value] ?? value ?? "피부 관리";
}

function getConfidenceLabel(level) {
  const labels = {
    LOW: "낮음",
    MEDIUM: "보통",
    HIGH: "높음",
  };

  return labels[level] ?? level ?? "-";
}

function DDay() {
  const navigate = useNavigate();
  const location = useLocation();

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboard, setDashboard] = useState(null);

  const [managementPlans, setManagementPlans] = useState(() => loadTodayRoutines());

  /*
    goal modal
    create / edit 공용
  */
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalModalMode, setGoalModalMode] = useState("create");

  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);
  const [isCompletingGoal, setIsCompletingGoal] = useState(false);
  const [isCancellingGoal, setIsCancellingGoal] = useState(false);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [goalConcern, setGoalConcern] = useState("TROUBLE");
  const [goalDescription, setGoalDescription] = useState("");

  const active =
    location.pathname === "/my"
      ? "my"
      : location.pathname === "/dday" || location.pathname === "/d-day"
        ? "dday"
        : location.pathname === "/ai"
          ? "ai"
          : location.pathname === "/record"
            ? "record"
            : "home";

  const handleNavChange = (key) => {
    if (key === "home") return navigate("/home");
    if (key === "record") return navigate("/record");
    if (key === "ai") return navigate("/ai");
    if (key === "dday") return navigate("/dday");
    if (key === "my") return navigate("/my");
  };

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError("");

      const response = await getDdayDashboard("SEVEN_DAYS");

      console.log("D-Day 대시보드:", response);

      setDashboard(response.data ?? null);
    } catch (error) {
      console.error("D-Day 대시보드 조회 실패:", error);

      setDashboard(null);

      setDashboardError(
        error.response?.data?.error?.message ?? "D-Day 정보를 불러오지 못했습니다.",
      );
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [location.key]);

  useEffect(() => {
    setManagementPlans(loadTodayRoutines());
  }, [location.key]);

  useEffect(() => {
    localStorage.setItem(
      ROUTINE_STORAGE_KEY,
      JSON.stringify({
        date: getTodayKey(),
        routines: managementPlans,
      }),
    );
  }, [managementPlans]);

  const goal = dashboard?.goal ?? null;

  const skinInsight = dashboard?.skinInsight ?? null;
  const todayAnalysis = skinInsight?.today ?? null;
  const changes = skinInsight?.changes ?? null;

  const activeExperiment = dashboard?.activeExperiment ?? null;
  const experiment = activeExperiment?.experiment ?? null;
  const experimentProgressData = activeExperiment?.progress ?? null;

  const environment = dashboard?.environment ?? null;
  const confidence = dashboard?.confidence ?? null;
  const routineInfo = dashboard?.routine ?? null;

  const currentScore = todayAnalysis?.overallScore ?? null;

  const toggleManagementPlan = (id) => {
    setManagementPlans((prev) =>
      prev.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              done: !plan.done,
            }
          : plan,
      ),
    );
  };

  /*
    새 목표 모달
  */
  const openGoalModal = () => {
    setGoalModalMode("create");

    setGoalTitle("");
    setGoalDate("");
    setGoalConcern("TROUBLE");
    setGoalDescription("");

    setIsGoalModalOpen(true);
  };

  /*
    기존 목표 수정 모달
  */
  const openEditGoalModal = () => {
    if (!goal) return;

    setGoalModalMode("edit");

    setGoalTitle(goal.title ?? "");
    setGoalDate(goal.targetDate ?? "");
    setGoalConcern(goal.targetConcern ?? "TROUBLE");
    setGoalDescription(goal.targetDescription ?? "");

    setIsGoalModalOpen(true);
  };

  const closeGoalModal = () => {
    if (isCreatingGoal || isUpdatingGoal) {
      return;
    }

    setIsGoalModalOpen(false);
  };

  const validateGoalForm = () => {
    const trimmedTitle = goalTitle.trim();
    const trimmedDescription = goalDescription.trim();

    if (!trimmedTitle) {
      alert("목표 이름을 입력해주세요.");
      return false;
    }

    if (!goalDate) {
      alert("목표 날짜를 선택해주세요.");
      return false;
    }

    if (!goalConcern) {
      alert("피부 고민을 선택해주세요.");
      return false;
    }

    if (!trimmedDescription) {
      alert("목표 설명을 입력해주세요.");
      return false;
    }

    if (goalDate < getTodayKey()) {
      alert("오늘 이후 날짜를 선택해주세요.");
      return false;
    }

    return true;
  };

  /*
    목표 생성
  */
  const handleCreateGoal = async () => {
    if (!validateGoalForm()) return;

    try {
      setIsCreatingGoal(true);

      const response = await createSkinGoal({
        title: goalTitle.trim(),
        targetDate: goalDate,
        targetConcern: goalConcern,
        targetDescription: goalDescription.trim(),
      });

      console.log("피부 목표 생성 성공:", response);

      setIsGoalModalOpen(false);

      await fetchDashboard();
    } catch (error) {
      console.error("피부 목표 생성 실패:", error);

      const message = error.response?.data?.error?.message ?? "피부 목표 생성에 실패했습니다.";

      alert(message);
    } finally {
      setIsCreatingGoal(false);
    }
  };

  /*
    목표 수정
  */
  const handleUpdateGoal = async () => {
    if (!goal?.goalId) {
      return;
    }

    if (!validateGoalForm()) return;

    try {
      setIsUpdatingGoal(true);

      const response = await updateSkinGoal(goal.goalId, {
        title: goalTitle.trim(),
        targetDate: goalDate,
        targetConcern: goalConcern,
        targetDescription: goalDescription.trim(),
      });

      console.log("피부 목표 수정 성공:", response);

      setIsGoalModalOpen(false);

      await fetchDashboard();
    } catch (error) {
      console.error("피부 목표 수정 실패:", error);

      const message = error.response?.data?.error?.message ?? "피부 목표 수정에 실패했습니다.";

      alert(message);
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  /*
    목표 완료
  */
  const handleCompleteGoal = async () => {
    if (!goal?.goalId || isCompletingGoal) {
      return;
    }

    const confirmed = window.confirm(`"${goal.title}" 목표를 완료 처리할까요?`);

    if (!confirmed) {
      return;
    }

    try {
      setIsCompletingGoal(true);

      const response = await completeSkinGoal(goal.goalId);

      console.log("피부 목표 완료 성공:", response);

      await fetchDashboard();
    } catch (error) {
      console.error("피부 목표 완료 실패:", error);

      const message = error.response?.data?.error?.message ?? "목표 완료 처리에 실패했습니다.";

      alert(message);
    } finally {
      setIsCompletingGoal(false);
    }
  };

  /*
    목표 취소
  */
  const handleCancelGoal = async () => {
    if (!goal?.goalId || isCancellingGoal) {
      return;
    }

    const confirmed = window.confirm(`"${goal.title}" 목표를 취소할까요?`);

    if (!confirmed) {
      return;
    }

    try {
      setIsCancellingGoal(true);

      const response = await cancelSkinGoal(goal.goalId);

      console.log("피부 목표 취소 성공:", response);

      await fetchDashboard();
    } catch (error) {
      console.error("피부 목표 취소 실패:", error);

      const message = error.response?.data?.error?.message ?? "목표 취소 처리에 실패했습니다.";

      alert(message);
    } finally {
      setIsCancellingGoal(false);
    }
  };

  const experimentPercent =
    experiment?.durationDays && experimentProgressData
      ? Math.min(
          100,
          Math.round((experimentProgressData.currentDay / experiment.durationDays) * 100),
        )
      : 0;

  const experimentCompletionRate =
    typeof experimentProgressData?.completionRate === "number"
      ? experimentProgressData.completionRate <= 1
        ? Math.round(experimentProgressData.completionRate * 100)
        : Math.round(experimentProgressData.completionRate)
      : 0;

  const completedPlanCount = managementPlans.filter((plan) => plan.done).length;

  return (
    <div className="dday-page">
      <div className="dday-phone">
        <main className="dday-scroll">
          {/* HEADER */}
          <header className="dday-header">
            <div>
              <p>나의 피부 목표</p>
              <h1>D-Day</h1>
            </div>

            <button
              type="button"
              className="dday-header-icon"
              onClick={openGoalModal}
              aria-label="피부 목표 추가"
              style={{
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={21} strokeWidth={1.8} />
            </button>
          </header>

          {/* LOADING */}
          {dashboardLoading && (
            <section className="dday-no-schedule">
              <div>
                <strong>D-Day 정보를 불러오는 중이에요</strong>
              </div>
            </section>
          )}

          {/* ERROR */}
          {!dashboardLoading && dashboardError && (
            <section className="dday-no-schedule">
              <div>
                <strong>D-Day 정보를 불러오지 못했어요</strong>
                <span>{dashboardError}</span>
              </div>
            </section>
          )}

          {/* ACTIVE GOAL */}
          {!dashboardLoading && !dashboardError && goal && (
            <>
              <section className="dday-schedule-selector">
                <div>
                  <span className="dday-schedule-selector-label">D-Day 목표</span>

                  <strong>현재 관리 중인 피부 목표예요.</strong>
                </div>

                <button
                  type="button"
                  className="dday-schedule-select"
                  onClick={openEditGoalModal}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  <span>
                    {goal.title} · {goal.targetDate}
                  </span>

                  <Pencil size={14} />
                </button>
              </section>

              <section className="dday-main-card">
                <div className="dday-main-top">
                  <div className="dday-target-icon">
                    <Target size={22} strokeWidth={1.8} />
                  </div>

                  <div className="dday-main-info">
                    <span>다가오는 목표</span>
                    <h2>{goal.title}</h2>
                    <p>{goal.targetDate}</p>
                  </div>
                </div>

                <div className="dday-number">
                  {goal.dayLabel ??
                    (goal.daysRemaining === 0
                      ? "D-Day"
                      : goal.daysRemaining > 0
                        ? `D-${goal.daysRemaining}`
                        : `D+${Math.abs(goal.daysRemaining)}`)}
                </div>

                <p className="dday-message">
                  {goal.targetDescription || `${goal.title}까지 피부 컨디션을 꾸준히 관리해보세요.`}
                </p>

                {/* 수정 / 완료 */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={openEditGoalModal}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      border: "1px solid rgba(255,255,255,0.4)",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.12)",
                      color: "#fff",
                      fontFamily: "inherit",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    목표 수정
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteGoal}
                    disabled={isCompletingGoal}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      border: "none",
                      borderRadius: 10,
                      background: "#fff",
                      color: "#6C5CE7",
                      fontFamily: "inherit",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: isCompletingGoal ? "default" : "pointer",
                      opacity: isCompletingGoal ? 0.65 : 1,
                    }}
                  >
                    {isCompletingGoal ? "처리 중..." : "목표 완료"}
                  </button>
                </div>

                {/* 취소 */}
                <button
                  type="button"
                  onClick={handleCancelGoal}
                  disabled={isCancellingGoal}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: "8px 0",
                    border: "none",
                    background: "transparent",
                    color: "rgba(255,255,255,0.72)",
                    fontFamily: "inherit",
                    fontSize: 11,
                    cursor: isCancellingGoal ? "default" : "pointer",
                  }}
                >
                  {isCancellingGoal ? "취소 처리 중..." : "이 목표 취소하기"}
                </button>
              </section>
            </>
          )}

          {/* NO GOAL */}
          {!dashboardLoading && !dashboardError && !goal && (
            <button type="button" className="dday-no-schedule" onClick={openGoalModal}>
              <div className="dday-no-schedule-icon">
                <CalendarDays size={20} />
              </div>

              <div>
                <strong>등록된 피부 목표가 없어요</strong>

                <span>새로운 목표를 등록하면 D-Day를 확인할 수 있어요.</span>
              </div>

              <ChevronRight size={18} />
            </button>
          )}

          {/* 현재 피부 상태 */}
          <div className="dday-section-heading">
            <h2>현재 피부 상태</h2>
          </div>

          <section className="dday-card dday-score-card">
            <div className="dday-score-top">
              <div>
                <span>현재 피부 점수</span>

                <div className="dday-score-number">
                  <strong>{currentScore === null ? "-" : currentScore}</strong>
                  <span>/ 100</span>
                </div>
              </div>

              {changes?.previous?.overallScoreChange !== undefined &&
                changes?.previous?.overallScoreChange !== null && (
                  <div className="dday-score-percent">
                    {changes.previous.overallScoreChange > 0 ? "+" : ""}
                    {changes.previous.overallScoreChange}
                  </div>
                )}
            </div>

            <div className="dday-progress-track">
              <div
                className="dday-progress-bar"
                style={{
                  width: `${currentScore ?? 0}%`,
                }}
              />
            </div>

            <div className="dday-goal-tag">
              <Sparkles size={15} />

              <span>{goal ? getConcernLabel(goal.targetConcern) : "피부 목표를 설정해보세요"}</span>
            </div>
          </section>

          {/* 생활 실험 */}
          <div className="dday-section-heading">
            <h2>진행 중인 생활 실험</h2>

            {activeExperiment && (
              <button
                type="button"
                onClick={() => navigate(`/experiment/${experiment?.experimentId ?? 1}`)}
              >
                실험 상세 ›
              </button>
            )}
          </div>

          {activeExperiment ? (
            <button
              type="button"
              className="dday-experiment-card"
              onClick={() => navigate(`/experiment/${experiment?.experimentId ?? 1}`)}
            >
              <div className="dday-experiment-header">
                <div className="dday-experiment-title">
                  <div className="dday-experiment-icon">
                    <FlaskConical size={19} />
                  </div>

                  <div>
                    <h3>{experiment?.title ?? "생활 실험"}</h3>

                    <span>{experiment?.durationDays ?? 0}일 실험</span>
                  </div>
                </div>

                <ChevronRight size={19} />
              </div>

              <div className="dday-experiment-day">
                <strong>
                  Day {experimentProgressData?.currentDay ?? 0} / {experiment?.durationDays ?? 0}
                </strong>

                <span>{experimentPercent}%</span>
              </div>

              <div className="dday-progress-track">
                <div
                  className="dday-progress-bar"
                  style={{
                    width: `${experimentPercent}%`,
                  }}
                />
              </div>

              <div className="dday-experiment-stats">
                <div>
                  <span>실천율</span>
                  <strong>{experimentCompletionRate}%</strong>
                </div>

                <div>
                  <span>기록 일수</span>
                  <strong>{experimentProgressData?.recordedDays ?? 0}일</strong>
                </div>

                <div>
                  <span>달성 일수</span>
                  <strong>{experimentProgressData?.achievedDays ?? 0}일</strong>
                </div>
              </div>
            </button>
          ) : (
            <button
              type="button"
              className="dday-experiment-card dday-experiment-empty"
              onClick={() => navigate("/experiment/start")}
            >
              <div className="dday-experiment-title">
                <div className="dday-experiment-icon">
                  <FlaskConical size={19} />
                </div>

                <div>
                  <h3>진행 중인 생활 실험이 없어요</h3>

                  <span>새로운 생활 실험을 시작해 피부 변화를 확인해보세요.</span>
                </div>
              </div>

              <ChevronRight size={19} />
            </button>
          )}

          {/* 환경 */}
          <div className="dday-section-heading">
            <h2>오늘의 환경</h2>
          </div>

          <section className="dday-card">
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <CloudSun size={19} color="#6C5CE7" />

              {environment?.available && environment?.record ? (
                <div style={{ flex: 1 }}>
                  <strong
                    style={{
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    오늘의 환경 데이터
                  </strong>

                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.8,
                      color: "#666",
                    }}
                  >
                    <div>UV {environment.record.uvIndex}</div>
                    <div>온도 {environment.record.temperature}℃</div>
                    <div>습도 {environment.record.humidity}%</div>
                    <div>미세먼지 {environment.record.fineDust}</div>
                  </div>

                  {environment.risks?.length > 0 && (
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 11,
                        color: "#777",
                      }}
                    >
                      {environment.risks.map((risk, index) => (
                        <p key={`${risk.type}-${index}`}>{risk.message}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <strong>오늘 환경 기록이 없어요</strong>

                  <p
                    style={{
                      margin: "5px 0 0",
                      fontSize: 11,
                      color: "#999",
                    }}
                  >
                    환경 데이터가 기록되면 피부 변화와 함께 분석돼요.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 신뢰도 */}
          <div className="dday-section-heading">
            <h2>분석 신뢰도</h2>
          </div>

          <section className="dday-card">
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <ShieldCheck size={19} color="#6C5CE7" />

              <div>
                <strong>
                  {confidence
                    ? `${getConfidenceLabel(confidence.level)} · ${confidence.score}`
                    : "아직 계산되지 않았어요"}
                </strong>

                {confidence?.reasons?.length > 0 && (
                  <p
                    style={{
                      margin: "5px 0 0",
                      fontSize: 11,
                      color: "#888",
                    }}
                  >
                    {confidence.reasons[0]}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 루틴 */}
          <div className="dday-section-heading">
            <h2>목표일까지 관리 계획</h2>

            <span
              style={{
                fontSize: 11,
                color: "#999",
              }}
            >
              {completedPlanCount} / {managementPlans.length} 완료
            </span>
          </div>

          {routineInfo?.available === false && (
            <p
              style={{
                margin: "-6px 0 12px",
                fontSize: 11,
                color: "#999",
              }}
            >
              {routineInfo.message}
            </p>
          )}

          <section className="dday-plan-list">
            {managementPlans.map((plan) => (
              <button
                type="button"
                className="dday-plan-card"
                key={plan.id}
                onClick={() => toggleManagementPlan(plan.id)}
                style={{
                  width: "100%",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div className={`dday-plan-check ${plan.done ? "is-done" : ""}`}>
                  {plan.done && <Check size={15} strokeWidth={2.2} />}
                </div>

                <div className="dday-plan-text">
                  <h3>{plan.title}</h3>
                  <p>{plan.desc}</p>
                </div>
              </button>
            ))}
          </section>

          {/* 안내 */}
          <section className="dday-guide">
            <Sparkles size={18} />

            <p>
              {goal ? (
                <>
                  <strong>
                    {goal.title}까지{" "}
                    {goal.daysRemaining > 0
                      ? `${goal.daysRemaining}일 남았어요.`
                      : goal.daysRemaining === 0
                        ? "오늘이에요."
                        : `${Math.abs(goal.daysRemaining)}일 지났어요.`}
                  </strong>
                  <br />
                  피부 기록과 생활 데이터를 꾸준히 쌓으면 더 정확한 분석을 받을 수 있어요.
                </>
              ) : (
                <>피부 목표를 등록하면 D-Day와 피부 변화를 함께 관리할 수 있어요.</>
              )}
            </p>
          </section>
        </main>

        <BottomNav activeNav={active} onChange={handleNavChange} />

        {/* =========================
            목표 추가 / 수정 모달
        ========================= */}
        {isGoalModalOpen && (
          <div
            onClick={closeGoalModal}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              background: "rgba(0,0,0,0.38)",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 340,
                padding: 20,
                boxSizing: "border-box",
                borderRadius: 20,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: "0 0 4px",
                      fontSize: 18,
                    }}
                  >
                    {goalModalMode === "edit" ? "피부 목표 수정" : "피부 목표 추가"}
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "#999",
                    }}
                  >
                    {goalModalMode === "edit"
                      ? "현재 피부 목표를 수정할 수 있어요."
                      : "중요한 날까지 관리할 목표를 설정해보세요."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeGoalModal}
                  disabled={isCreatingGoal || isUpdatingGoal}
                  style={{
                    width: 32,
                    height: 32,
                    border: "none",
                    borderRadius: "50%",
                    background: "#F5F5F7",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {/* 이름 */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    목표 이름
                  </label>

                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="예: 여행, 면접, 촬영"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px 12px",
                      border: "1px solid #E5E5EA",
                      borderRadius: 11,
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* 날짜 */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    목표 날짜
                  </label>

                  <input
                    type="date"
                    value={goalDate}
                    min={getTodayKey()}
                    onChange={(e) => setGoalDate(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px 12px",
                      border: "1px solid #E5E5EA",
                      borderRadius: 11,
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* 고민 */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    집중 관리 항목
                  </label>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {SKIN_CONCERNS.map((item) => {
                      const selected = goalConcern === item.value;

                      return (
                        <button
                          type="button"
                          key={item.value}
                          onClick={() => setGoalConcern(item.value)}
                          style={{
                            padding: "10px 8px",
                            border: selected ? "1.5px solid #6C5CE7" : "1px solid #E5E5EA",
                            borderRadius: 10,
                            background: selected ? "#F0EDFF" : "#fff",
                            color: selected ? "#6C5CE7" : "#555",
                            fontSize: 12,
                            fontWeight: selected ? 600 : 500,
                            cursor: "pointer",
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 설명 */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    목표 설명
                  </label>

                  <textarea
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    placeholder="예: 여행 전까지 붉은기를 줄이고 피부 컨디션을 관리하고 싶어요."
                    rows={3}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px 12px",
                      border: "1px solid #E5E5EA",
                      borderRadius: 11,
                      resize: "none",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* 저장 */}
                <button
                  type="button"
                  onClick={goalModalMode === "edit" ? handleUpdateGoal : handleCreateGoal}
                  disabled={isCreatingGoal || isUpdatingGoal}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: "13px 0",
                    border: "none",
                    borderRadius: 12,
                    background: "#6C5CE7",
                    color: "#fff",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: isCreatingGoal || isUpdatingGoal ? "default" : "pointer",
                    opacity: isCreatingGoal || isUpdatingGoal ? 0.65 : 1,
                  }}
                >
                  {isCreatingGoal || isUpdatingGoal
                    ? "저장 중..."
                    : goalModalMode === "edit"
                      ? "수정 저장"
                      : "목표 저장"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DDay;
