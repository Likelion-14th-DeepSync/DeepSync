import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Target, ChevronRight, Sparkles, Check, FlaskConical } from "lucide-react";
import BottomNav from "../../components/BottomNav";
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

function DDay() {
  const navigate = useNavigate();

  const location = useLocation();

  const [activeExperiment, setActiveExperiment] = useState(null);

  const [schedules, setSchedules] = useState([]);

  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  /*
    홈의 오늘 AI 루틴과 동일한 데이터
  */
  const [managementPlans, setManagementPlans] = useState(() => loadTodayRoutines());

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

  /*
    데이터 불러오기
  */
  useEffect(() => {
    try {
      const savedExperiment = localStorage.getItem("wellness-active-experiment");

      setActiveExperiment(savedExperiment ? JSON.parse(savedExperiment) : null);
    } catch {
      setActiveExperiment(null);
    }

    try {
      const savedSchedules = localStorage.getItem("wellness-calendar-schedules");

      const parsedSchedules = savedSchedules ? JSON.parse(savedSchedules) : [];

      setSchedules(parsedSchedules);

      const savedSelectedId = localStorage.getItem("wellness-dday-selected-schedule-id");

      if (
        savedSelectedId &&
        parsedSchedules.some((schedule) => String(schedule.id) === savedSelectedId)
      ) {
        setSelectedScheduleId(savedSelectedId);
      } else if (parsedSchedules.length > 0) {
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const sorted = [...parsedSchedules].sort(
          (a, b) => new Date(`${a.date}T00:00:00`) - new Date(`${b.date}T00:00:00`),
        );

        const upcoming =
          sorted.find((schedule) => new Date(`${schedule.date}T00:00:00`) >= today) ?? sorted[0];

        const id = String(upcoming.id);

        setSelectedScheduleId(id);

        localStorage.setItem("wellness-dday-selected-schedule-id", id);
      }
    } catch {
      setSchedules([]);
      setSelectedScheduleId(null);
    }

    /*
      홈에서 변경된 루틴을 D-Day 진입 시 다시 읽기
    */
    setManagementPlans(loadTodayRoutines());
  }, [location.key]);

  /*
    D-Day에서 체크해도 홈과 동기화
  */
  useEffect(() => {
    localStorage.setItem(
      ROUTINE_STORAGE_KEY,
      JSON.stringify({
        date: getTodayKey(),
        routines: managementPlans,
      }),
    );
  }, [managementPlans]);

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

  const selectedSchedule = schedules.find(
    (schedule) => String(schedule.id) === String(selectedScheduleId),
  );

  const handleScheduleChange = (event) => {
    const id = event.target.value;

    setSelectedScheduleId(id);

    localStorage.setItem("wellness-dday-selected-schedule-id", id);
  };

  /*
    선택 일정 기준 D-Day 계산
  */
  const dDayInfo = useMemo(() => {
    if (!selectedSchedule) {
      return null;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(`${selectedSchedule.date}T00:00:00`);

    targetDate.setHours(0, 0, 0, 0);

    const difference = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let label;

    if (difference > 0) {
      label = `D - ${difference}`;
    } else if (difference === 0) {
      label = "D-Day";
    } else {
      label = `D + ${Math.abs(difference)}`;
    }

    return {
      label,
      difference,
    };
  }, [selectedSchedule]);

  const goal = {
    targetScore: 85,
    currentScore: 78,
    concern: "붉은기 완화",
  };

  const progress = (goal.currentScore / goal.targetScore) * 100;

  const experimentProgress = activeExperiment
    ? (activeExperiment.currentDay / activeExperiment.duration) * 100
    : 0;

  const totalCompletions =
    activeExperiment?.habits?.reduce((sum, habit) => sum + (habit.completedDays?.length ?? 0), 0) ??
    0;

  const totalPossible = activeExperiment?.habits?.length
    ? activeExperiment.habits.length * Math.max(activeExperiment.currentDay, 1)
    : 1;

  const experimentRate = Math.round((totalCompletions / totalPossible) * 100);

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
              onClick={() => navigate("/record?tab=calendar")}
              aria-label="기록 캘린더로 이동"
              style={{
                border: "none",
                cursor: "pointer",
              }}
            >
              <CalendarDays size={21} strokeWidth={1.8} />
            </button>
          </header>

          {/* 일정 있음 */}
          {schedules.length > 0 ? (
            <>
              {/* 기준 일정 선택 */}
              <section className="dday-schedule-selector">
                <div>
                  <span className="dday-schedule-selector-label">D-Day 기준 일정</span>

                  <strong>어떤 일정까지 관리할까요?</strong>
                </div>

                <select
                  value={selectedScheduleId ?? ""}
                  onChange={handleScheduleChange}
                  className="dday-schedule-select"
                >
                  {schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.title} · {schedule.date}
                    </option>
                  ))}
                </select>
              </section>

              {/* 메인 D-Day */}
              {selectedSchedule && dDayInfo && (
                <section className="dday-main-card">
                  <div className="dday-main-top">
                    <div className="dday-target-icon">
                      <Target size={22} strokeWidth={1.8} />
                    </div>

                    <div className="dday-main-info">
                      <span>다가오는 목표</span>

                      <h2>{selectedSchedule.title}</h2>

                      <p>{selectedSchedule.date}</p>
                    </div>
                  </div>

                  <div className="dday-number">{dDayInfo.label}</div>

                  <p className="dday-message">
                    {selectedSchedule.title}
                    까지 피부 컨디션을
                    <br />
                    꾸준히 관리해보세요.
                  </p>
                </section>
              )}
            </>
          ) : (
            <button
              type="button"
              className="dday-no-schedule"
              onClick={() => navigate("/record?tab=calendar")}
            >
              <div className="dday-no-schedule-icon">
                <CalendarDays size={20} />
              </div>

              <div>
                <strong>등록된 일정이 없어요</strong>

                <span>기록 캘린더에서 중요한 일정을 추가해주세요.</span>
              </div>

              <ChevronRight size={18} />
            </button>
          )}

          {/* 목표 피부 상태 */}
          <div className="dday-section-heading">
            <h2>목표 피부 상태</h2>
          </div>

          <section className="dday-card dday-score-card">
            <div className="dday-score-top">
              <div>
                <span>현재 피부 점수</span>

                <div className="dday-score-number">
                  <strong>{goal.currentScore}</strong>

                  <span>/ {goal.targetScore} 목표</span>
                </div>
              </div>

              <div className="dday-score-percent">{Math.min(100, Math.round(progress))}%</div>
            </div>

            <div className="dday-progress-track">
              <div
                className="dday-progress-bar"
                style={{
                  width: `${Math.min(100, progress)}%`,
                }}
              />
            </div>

            <div className="dday-goal-tag">
              <Sparkles size={15} />

              <span>{goal.concern}</span>
            </div>
          </section>

          {/* 생활 실험 */}
          <div className="dday-section-heading">
            <h2>진행 중인 생활 실험</h2>

            {activeExperiment && (
              <button type="button" onClick={() => navigate("/experiment/1")}>
                실험 상세 ›
              </button>
            )}
          </div>

          {activeExperiment ? (
            <button
              type="button"
              className="dday-experiment-card"
              onClick={() => navigate("/experiment/1")}
            >
              <div className="dday-experiment-header">
                <div className="dday-experiment-title">
                  <div className="dday-experiment-icon">
                    <FlaskConical size={19} />
                  </div>

                  <div>
                    <h3>{activeExperiment.habits.length}개 습관 관찰 중</h3>

                    <span>{activeExperiment.duration}일 실험</span>
                  </div>
                </div>

                <ChevronRight size={19} />
              </div>

              <div className="dday-experiment-habits">
                {activeExperiment.habits.map((habit) => (
                  <span key={habit.id}>{habit.title}</span>
                ))}
              </div>

              <div className="dday-experiment-day">
                <strong>
                  Day {activeExperiment.currentDay} / {activeExperiment.duration}
                </strong>

                <span>{Math.round(experimentProgress)}%</span>
              </div>

              <div className="dday-progress-track">
                <div
                  className="dday-progress-bar"
                  style={{
                    width: `${experimentProgress}%`,
                  }}
                />
              </div>

              <div className="dday-experiment-stats">
                <div>
                  <span>실천율</span>

                  <strong>{experimentRate}%</strong>
                </div>

                <div>
                  <span>피부 점수 변화</span>

                  <strong className="dday-positive">관찰 중</strong>
                </div>

                <div>
                  <span>AI 분석</span>

                  <strong>{activeExperiment.currentDay < 3 ? "데이터 부족" : "진행 중"}</strong>
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
                  <h3>새 생활 실험 시작하기</h3>

                  <span>최대 3개의 습관을 선택해 피부 변화를 비교해보세요.</span>
                </div>
              </div>

              <ChevronRight size={19} />
            </button>
          )}

          {/* =========================
              목표일까지 관리 계획
          ========================= */}

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

          {/* AI 안내 */}
          <section className="dday-guide">
            <Sparkles size={18} />

            <p>
              {selectedSchedule && dDayInfo ? (
                <>
                  <strong>
                    {selectedSchedule.title}
                    까지 {dDayInfo.difference > 0 ? `${dDayInfo.difference}일` : "오늘"} 남았어요.
                  </strong>
                  <br />
                  최근 피부 기록을 기준으로 오늘 실천할 {managementPlans.length}
                  가지 관리 계획을 추천했어요.
                </>
              ) : (
                <>D-Day 일정을 선택하면 목표일까지 필요한 관리 계획을 추천해드려요.</>
              )}
            </p>
          </section>
        </main>

        <BottomNav activeNav={active} onChange={handleNavChange} />
      </div>
    </div>
  );
}

export default DDay;
