import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Camera, Info, FlaskConical } from "lucide-react";

import BottomNav from "../../components/BottomNav";
import ReminderCard from "../../components/ReminderCard/ReminderCard";
import TodayReminderModal from "../../components/TodayReminderModal";

import { getMyProfile } from "../../api/user";
import { getDdayDashboard } from "../../api/dashboard";

import "./Home.css";

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

function formatChange(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function getTrend(value) {
  if (value === null || value === undefined || value === 0) {
    return "same";
  }

  return value > 0 ? "up" : "down";
}

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const active =
    location.pathname === "/my"
      ? "my"
      : location.pathname === "/d-day" || location.pathname === "/dday"
        ? "dday"
        : location.pathname === "/ai"
          ? "ai"
          : location.pathname === "/record"
            ? "record"
            : "home";

  const handleNavChange = (key) => {
    if (key === "dday") return navigate("/dday");
    if (key === "ai") return navigate("/ai");
    if (key === "home") return navigate("/home");
    if (key === "record") return navigate("/record");
    if (key === "my") return navigate("/my");
  };

  const [userName, setUserName] = useState("사용자");

  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [routines, setRoutines] = useState(() => loadTodayRoutines());
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  /*
    실제 로그인 회원 정보
  */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getMyProfile();

        console.log("홈 내 프로필:", response);

        const nickname = response.data?.nickname;

        if (nickname) {
          setUserName(nickname);

          localStorage.setItem("deepSyncUserName", nickname);
        }
      } catch (error) {
        console.error("프로필 조회 실패:", error);

        const savedName =
          localStorage.getItem("deepSyncUserName") || localStorage.getItem("wellness-user-name");

        if (savedName) {
          setUserName(savedName);
        }
      }
    };

    fetchProfile();
  }, []);

  /*
    D-Day 통합 대시보드
  */
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setDashboardLoading(true);
        setDashboardError("");

        const response = await getDdayDashboard("SEVEN_DAYS");

        console.log("홈 대시보드:", response);

        setDashboard(response.data ?? null);
      } catch (error) {
        console.error("홈 대시보드 조회 실패:", error);

        setDashboard(null);

        setDashboardError(error.response?.data?.error?.message ?? "홈 정보를 불러오지 못했습니다.");
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboard();
  }, [location.key]);

  /*
    아직 실제 AI 루틴 리스트 API가 없기 때문에
    루틴 체크 상태만 localStorage 유지
  */
  useEffect(() => {
    setRoutines(loadTodayRoutines());
  }, [location.key]);

  useEffect(() => {
    localStorage.setItem(
      ROUTINE_STORAGE_KEY,
      JSON.stringify({
        date: getTodayKey(),
        routines,
      }),
    );
  }, [routines]);

  const goal = dashboard?.goal ?? null;

  const skinInsight = dashboard?.skinInsight ?? null;

  const todayAnalysis = skinInsight?.today ?? null;

  const comparison = skinInsight?.changes?.previous ?? skinInsight?.changes?.baseline ?? null;

  const activeExperiment = dashboard?.activeExperiment ?? null;

  const experiment = activeExperiment?.experiment ?? null;

  const experimentProgressData = activeExperiment?.progress ?? null;

  const hasTodayPhoto = Boolean(todayAnalysis);

  const skinScore = todayAnalysis?.overallScore ?? null;

  const skinChange = comparison?.overallScoreChange ?? null;

  const stats = todayAnalysis
    ? [
        {
          label: "붉은기",
          value: formatChange(comparison?.rednessScoreChange),
          trend: getTrend(comparison?.rednessScoreChange),
        },
        {
          label: "트러블",
          value: formatChange(comparison?.troubleScoreChange),
          trend: getTrend(comparison?.troubleScoreChange),
        },
        {
          label: "건조함",
          value: formatChange(comparison?.drynessScoreChange),
          trend: getTrend(comparison?.drynessScoreChange),
        },
        {
          label: "피부톤 균일도",
          value: formatChange(comparison?.toneUniformityScoreChange),
          trend: getTrend(comparison?.toneUniformityScoreChange),
        },
      ]
    : [];

  const toggleRoutine = (id) => {
    setRoutines((prev) =>
      prev.map((routine) =>
        routine.id === id
          ? {
              ...routine,
              done: !routine.done,
            }
          : routine,
      ),
    );
  };

  const completedRoutineCount = routines.filter((routine) => routine.done).length;

  const routineProgress =
    routines.length === 0 ? 0 : (completedRoutineCount / routines.length) * 100;

  const experimentPercent =
    experiment?.durationDays && experimentProgressData
      ? Math.min(
          100,
          Math.round((experimentProgressData.currentDay / experiment.durationDays) * 100),
        )
      : 0;

  const experimentRate =
    typeof experimentProgressData?.completionRate === "number"
      ? experimentProgressData.completionRate <= 1
        ? Math.round(experimentProgressData.completionRate * 100)
        : Math.round(experimentProgressData.completionRate)
      : 0;
      
  return (
    <div className="home-page">
      <div className="home-phone">
        <main className="home-scroll">
          <header className="home-header">
            <h1 className="home-brand">Wellness Care</h1>

            <button className="home-icon-button" type="button" aria-label="알림"
            onClick={() => setIsReminderOpen(true)}>
              <Bell size={22} />
            </button>
          </header>

          <p className="home-greeting">안녕하세요, {userName}님 👋</p>

          <div className="home-dday-row">
            <span className="home-muted">
              {goal?.title ? `${goal.title}까지` : "피부 목표 D-Day"}
            </span>

            <button
              type="button"
              onClick={() => navigate("/dday")}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <strong className="home-dday">{goal?.dayLabel ?? "-"}</strong>
            </button>
          </div>

          <section className="home-card home-skin-card">
            <div className="home-section-row">
              <h2 className="home-card-title">오늘의 피부 컨디션</h2>

              <Info size={16} className="home-info-icon" />
            </div>

            {dashboardLoading ? (
              <div className="home-empty-analysis">
                <h3>피부 정보를 불러오는 중이에요</h3>
              </div>
            ) : hasTodayPhoto ? (
              <>
                <div className="home-score-row">
                  <span className="home-score">{skinScore}</span>

                  <span className="home-score-max">/ 100</span>
                </div>

                {skinChange !== null && (
                  <p className="home-score-change">
                    {skinChange === 0
                      ? "이전 분석과 동일해요"
                      : `이전보다 ${formatChange(skinChange)}점`}
                  </p>
                )}
              </>
            ) : (
              <div className="home-empty-analysis">
                <div className="home-empty-icon">
                  <Camera size={28} />
                </div>

                <h3>오늘의 피부 사진이 아직 없어요</h3>

                <p>
                  같은 조건에서 얼굴을 촬영하면
                  <br />
                  피부 점수와 변화를 확인할 수 있어요.
                </p>

                {dashboardError && <p>{dashboardError}</p>}
              </div>
            )}

            <button
              type="button"
              className="home-primary-button"
              onClick={() => navigate("/ai?mode=capture&from=home")}
            >
              <Camera size={17} />

              {hasTodayPhoto ? "다시 AI 피부 분석하기" : "AI 피부 분석하기"}
            </button>
          </section>

          {hasTodayPhoto && (
            <div className="home-stats-grid">
              {stats.map((stat) => (
                <div className="home-stat-card" key={stat.label}>
                  <span className="home-stat-label">{stat.label}</span>

                  <strong className={`home-stat-value home-stat-${stat.trend}`}>
                    {stat.value}
                  </strong>

                  <span className="home-stat-caption">이전 분석 대비</span>
                </div>
              ))}
            </div>
          )}

          <div className="home-section-heading">
            <h2>오늘의 AI 루틴</h2>

            <button type="button" onClick={() => navigate("/ai/routine")}>
              전체 보기 ›
            </button>
          </div>

          {dashboard?.routine?.available === false && (
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 11,
                color: "#999",
              }}
            >
              {dashboard.routine.message}
            </p>
          )}

          <div className="home-routine-list">
            {routines.map((routine) => (
              <article className="home-routine-card" key={routine.id}>
                <div className="home-routine-main">
                  <span className="home-routine-icon">{routine.icon}</span>

                  <div>
                    <h3>{routine.title}</h3>
                    <p>{routine.desc}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className={`home-check ${routine.done ? "is-done" : ""}`}
                  onClick={() => toggleRoutine(routine.id)}
                  aria-pressed={routine.done}
                >
                  {routine.done ? "✓" : ""}
                </button>
              </article>
            ))}
          </div>

          <div className="home-routine-progress">
            <div className="home-progress-top">
              <p className="home-progress-label">
                {completedRoutineCount} / {routines.length} 완료
              </p>

              <span className="home-progress-percent">{Math.round(routineProgress)}%</span>
            </div>

            <div className="home-progress-track">
              <div
                className="home-progress-bar"
                style={{
                  width: `${routineProgress}%`,
                }}
              />
            </div>
          </div>

          <div className="home-section-heading">
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
            <section
              className="home-card home-experiment-card home-experiment-clickable"
              onClick={() => navigate(`/experiment/${experiment?.experimentId ?? 1}`)}
            >
              <div className="home-experiment-top">
                <div className="home-experiment-title">
                  <span className="home-experiment-flask">
                    <FlaskConical size={18} />
                  </span>

                  <h3>{experiment?.title ?? "생활 실험"}</h3>
                </div>

                <span className="home-badge">{experiment?.durationDays ?? 0}일 실험</span>
              </div>

              <p className="home-experiment-day">
                Day {experimentProgressData?.currentDay ?? 0} / {experiment?.durationDays ?? 0}
              </p>

              <div className="home-progress-track home-experiment-progress">
                <div
                  className="home-progress-bar"
                  style={{
                    width: `${experimentPercent}%`,
                  }}
                />
              </div>

              <div className="home-experiment-stats">
                <div>
                  <span>실천율</span>

                  <strong>{experimentRate}%</strong>
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
            </section>
          ) : (
            <section className="home-card home-experiment-empty">
              <div className="home-experiment-empty-icon">
                <FlaskConical size={24} />
              </div>

              <h3>생활 실험을 시작해보세요</h3>

              <p>생활 습관을 기록하고 피부 변화를 비교할 수 있어요.</p>

              <button type="button" onClick={() => navigate("/experiment/start")}>
                + 새 실험 시작하기
              </button>
            </section>
          )}

          <ReminderCard />
        </main>

        <BottomNav activeNav={active} onChange={handleNavChange} />

        {/* 오늘의 알림 모달 */}
        <TodayReminderModal
          isOpen={isReminderOpen}
          onClose={() => setIsReminderOpen(false)}
        />
      </div>
    </div>
  );
}

export default Home;
