import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Camera, Info, FlaskConical } from "lucide-react";
import BottomNav from "../../components/BottomNav";
import ReminderCard from "../../components/ReminderCard/ReminderCard";
import "./Home.css";

const ROUTINE_STORAGE_KEY = "wellness-daily-routines";
const SCHEDULE_STORAGE_KEY = "wellness-calendar-schedules";
const DDAY_STORAGE_KEY = "wellness-dday-selected-schedule-id";

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

function calculateHomeDday() {
  try {
    const savedSchedules = localStorage.getItem(SCHEDULE_STORAGE_KEY);

    const schedules = savedSchedules ? JSON.parse(savedSchedules) : [];

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return {
        label: "-",
        title: "피부 목표 D-Day",
      };
    }

    const selectedId = localStorage.getItem(DDAY_STORAGE_KEY);

    let selectedSchedule = schedules.find((schedule) => String(schedule.id) === String(selectedId));

    /*
      선택된 D-Day 일정이 없다면
      가장 가까운 미래 일정을 자동 사용
    */
    if (!selectedSchedule) {
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const sorted = [...schedules].sort(
        (a, b) => new Date(`${a.date}T00:00:00`) - new Date(`${b.date}T00:00:00`),
      );

      selectedSchedule =
        sorted.find((schedule) => new Date(`${schedule.date}T00:00:00`) >= today) ?? sorted[0];

      if (selectedSchedule) {
        localStorage.setItem(DDAY_STORAGE_KEY, String(selectedSchedule.id));
      }
    }

    if (!selectedSchedule) {
      return {
        label: "-",
        title: "피부 목표 D-Day",
      };
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(`${selectedSchedule.date}T00:00:00`);

    targetDate.setHours(0, 0, 0, 0);

    const diff = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let label;

    if (diff > 0) {
      label = `D-${diff}`;
    } else if (diff === 0) {
      label = "D-Day";
    } else {
      label = `D+${Math.abs(diff)}`;
    }

    return {
      label,
      title: `${selectedSchedule.title}까지`,
    };
  } catch {
    return {
      label: "-",
      title: "피부 목표 D-Day",
    };
  }
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

  const [skinAnalysis, setSkinAnalysis] = useState(null);

  const [activeExperiment, setActiveExperiment] = useState(null);

  const [routines, setRoutines] = useState(() => loadTodayRoutines());

  const [homeDday, setHomeDday] = useState(() => calculateHomeDday());

  useEffect(() => {
    const savedName =
      localStorage.getItem("wellness-user-name") || localStorage.getItem("deepSyncUserName");

    if (savedName) {
      setUserName(savedName);
    }

    try {
      const savedAnalysis = localStorage.getItem("wellness-today-skin-analysis");

      setSkinAnalysis(savedAnalysis ? JSON.parse(savedAnalysis) : null);
    } catch {
      setSkinAnalysis(null);
    }

    try {
      const savedExperiment = localStorage.getItem("wellness-active-experiment");

      setActiveExperiment(savedExperiment ? JSON.parse(savedExperiment) : null);
    } catch {
      setActiveExperiment(null);
    }

    /*
      D-Day / 루틴을 다른 화면에서 바꾼 후
      홈으로 돌아오면 최신 상태 다시 읽기
    */
    setRoutines(loadTodayRoutines());

    setHomeDday(calculateHomeDday());
  }, [location.key]);

  /*
    루틴 변경될 때마다 저장
  */
  useEffect(() => {
    localStorage.setItem(
      ROUTINE_STORAGE_KEY,
      JSON.stringify({
        date: getTodayKey(),
        routines,
      }),
    );
  }, [routines]);

  const hasTodayPhoto = Boolean(skinAnalysis);

  const skinScore = skinAnalysis?.score ?? null;

  const skinChange = skinAnalysis?.change ?? null;

  const stats = skinAnalysis?.stats ?? [
    {
      label: "붉은기",
      value: "-6%",
      trend: "down",
    },
    {
      label: "트러블",
      value: "변화 없음",
      trend: "same",
    },
    {
      label: "피부톤 균일도",
      value: "+3%",
      trend: "up",
    },
  ];

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

  return (
    <div className="home-page">
      <div className="home-phone">
        <main className="home-scroll">
          {/* 상단 헤더 */}
          <header className="home-header">
            <h1 className="home-brand">Wellness Care</h1>

            <button className="home-icon-button" type="button" aria-label="알림">
              <Bell size={22} />
            </button>
          </header>

          {/* 인사말 */}
          <p className="home-greeting">안녕하세요, {userName}님 👋</p>

          {/* D-Day */}
          <div className="home-dday-row">
            <span className="home-muted">{homeDday.title}</span>

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
              <strong className="home-dday">{homeDday.label}</strong>
            </button>
          </div>

          {/* 오늘의 피부 */}
          <section className="home-card home-skin-card">
            <div className="home-section-row">
              <h2 className="home-card-title">오늘의 피부 컨디션</h2>

              <Info size={16} className="home-info-icon" />
            </div>

            {hasTodayPhoto ? (
              <>
                <div className="home-score-row">
                  <span className="home-score">{skinScore}</span>

                  <span className="home-score-max">/ 100</span>
                </div>

                <p className="home-score-change">어제보다 {skinChange} ↑</p>
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

          {/* 피부 세부 지표 */}
          {hasTodayPhoto && (
            <div className="home-stats-grid">
              {stats.map((stat) => (
                <div className="home-stat-card" key={stat.label}>
                  <span className="home-stat-label">{stat.label}</span>

                  <strong className={`home-stat-value home-stat-${stat.trend}`}>
                    {stat.value}
                  </strong>

                  <span className="home-stat-caption">어제 대비</span>
                </div>
              ))}
            </div>
          )}

          {/* 오늘의 AI 루틴 */}
          <div className="home-section-heading">
            <h2>오늘의 AI 루틴</h2>

            <button type="button" onClick={() => navigate("/ai/routine")}>
              전체 보기 ›
            </button>
          </div>

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

          {/* 루틴 진행률 */}
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

          {/* 생활 실험 */}
          <div className="home-section-heading">
            <h2>진행 중인 생활 실험</h2>

            {activeExperiment && (
              <button type="button" onClick={() => navigate("/experiment/1")}>
                실험 상세 ›
              </button>
            )}
          </div>

          {activeExperiment ? (
            <section
              className="home-card home-experiment-card home-experiment-clickable"
              onClick={() => navigate("/experiment/1")}
            >
              <div className="home-experiment-top">
                <div className="home-experiment-title">
                  <span className="home-experiment-flask">
                    <FlaskConical size={18} />
                  </span>

                  <h3>{activeExperiment.habits.length}개 습관 관찰 중</h3>
                </div>

                <span className="home-badge">{activeExperiment.duration}일 실험</span>
              </div>

              <div className="home-experiment-habits">
                {activeExperiment.habits.map((habit) => (
                  <span key={habit.id}>{habit.title}</span>
                ))}
              </div>

              <p className="home-experiment-day">
                Day {activeExperiment.currentDay} / {activeExperiment.duration}
              </p>

              <div className="home-progress-track home-experiment-progress">
                <div
                  className="home-progress-bar"
                  style={{
                    width: `${experimentProgress}%`,
                  }}
                />
              </div>

              <div className="home-experiment-stats">
                <div>
                  <span>실천율</span>

                  <strong>{experimentRate}%</strong>
                </div>

                <div>
                  <span>피부 점수 변화</span>

                  <strong>관찰 중</strong>
                </div>

                <div>
                  <span>AI 분석</span>

                  <strong>{activeExperiment.currentDay < 3 ? "데이터 부족" : "진행 중"}</strong>
                </div>
              </div>
            </section>
          ) : (
            <section className="home-card home-experiment-empty">
              <div className="home-experiment-empty-icon">
                <FlaskConical size={24} />
              </div>

              <h3>생활 실험을 시작해보세요</h3>

              <p>최대 3개의 생활 습관을 선택하고 피부 변화를 비교할 수 있어요.</p>

              <button type="button" onClick={() => navigate("/experiment/start")}>
                + 새 실험 시작하기
              </button>
            </section>
          )}

          <ReminderCard />
        </main>

        <BottomNav activeNav={active} onChange={handleNavChange} />
      </div>
    </div>
  );
}

export default Home;
