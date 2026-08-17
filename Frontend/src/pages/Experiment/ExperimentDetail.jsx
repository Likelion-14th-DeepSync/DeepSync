import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Check,
  Sparkles,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import "./ExperimentDetail.css";

function ExperimentDetail() {
  const navigate = useNavigate();

  const [experiment, setExperiment] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("wellness-active-experiment");

    if (!saved) {
      setExperiment(null);
      return;
    }

    try {
      setExperiment(JSON.parse(saved));
    } catch {
      setExperiment(null);
    }
  }, []);

  const saveExperiment = (updated) => {
    setExperiment(updated);

    localStorage.setItem("wellness-active-experiment", JSON.stringify(updated));
  };

  const toggleHabit = (habitId) => {
    if (!experiment) return;

    const updatedHabits = experiment.habits.map((habit) => {
      if (habit.id !== habitId) {
        return habit;
      }

      const alreadyDone = habit.completedDays.includes(experiment.currentDay);

      return {
        ...habit,
        completedDays: alreadyDone
          ? habit.completedDays.filter((day) => day !== experiment.currentDay)
          : [...habit.completedDays, experiment.currentDay],
      };
    });

    saveExperiment({
      ...experiment,
      habits: updatedHabits,
    });
  };

  const progress = experiment
    ? Math.min(100, (experiment.currentDay / experiment.duration) * 100)
    : 0;

  const allCompletedCount = experiment
    ? experiment.habits.reduce((sum, habit) => sum + habit.completedDays.length, 0)
    : 0;

  const possibleCount = experiment
    ? experiment.habits.length * Math.max(experiment.currentDay, 1)
    : 1;

  const practiceRate = Math.round((allCompletedCount / possibleCount) * 100);

  const aiObservations = useMemo(() => {
    if (!experiment) return [];

    return experiment.habits.map((habit) => {
      if (experiment.currentDay < 3) {
        return {
          id: habit.id,
          title: habit.title,
          result: "아직 데이터를 모으고 있어요.",
          confidence: "데이터 부족",
        };
      }

      switch (habit.id) {
        case "sleep-7h":
          return {
            id: habit.id,
            title: habit.title,
            result: "7시간 이상 수면한 날에는 피부 점수가 더 높은 경향이 관찰되고 있어요.",
            confidence: "보통",
          };

        case "water-2l":
          return {
            id: habit.id,
            title: habit.title,
            result: "수분 섭취량이 충분했던 날에는 건조함 지표가 개선되는 경향이 보여요.",
            confidence: "낮음",
          };

        case "fastfood":
          return {
            id: habit.id,
            title: habit.title,
            result: "패스트푸드 섭취가 적은 날 이후 트러블 점수가 조금 낮게 관찰됐어요.",
            confidence: "낮음",
          };

        case "sunscreen":
          return {
            id: habit.id,
            title: habit.title,
            result: "자외선 차단제를 사용한 날에는 붉은기와 피부톤 변화가 비교적 안정적이었어요.",
            confidence: "보통",
          };

        case "no-late-night-food":
          return {
            id: habit.id,
            title: habit.title,
            result: "야식을 먹지 않은 다음 날 피부 컨디션이 조금 더 높은 경향이 있어요.",
            confidence: "낮음",
          };

        case "mask-pack":
          return {
            id: habit.id,
            title: habit.title,
            result: "진정팩을 사용한 날 이후 붉은기가 감소하는 경향을 관찰하고 있어요.",
            confidence: "낮음",
          };

        case "sleep-before-midnight":
          return {
            id: habit.id,
            title: habit.title,
            result: "자정 전에 취침한 날에는 다음 날 피부 점수가 더 안정적인 경향이 있어요.",
            confidence: "보통",
          };

        case "walk-30m":
          return {
            id: habit.id,
            title: habit.title,
            result: "활동량이 충분했던 날과 피부 컨디션 사이의 패턴을 관찰하고 있어요.",
            confidence: "낮음",
          };

        default:
          return {
            id: habit.id,
            title: habit.title,
            result: "피부 데이터와 생활 기록의 관계를 분석하고 있어요.",
            confidence: "낮음",
          };
      }
    });
  }, [experiment]);

  if (!experiment) {
    return (
      <div className="experiment-detail-page">
        <div className="experiment-detail-phone">
          <main className="experiment-detail-empty">
            <Sparkles size={32} />

            <h1>진행 중인 생활 실험이 없어요</h1>

            <p>생활 습관을 선택하고 피부 변화를 직접 관찰해보세요.</p>

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
            <span className="experiment-detail-badge">{experiment.duration}일 실험</span>

            <h2>{experiment.habits.length}개의 습관 관찰 중</h2>

            <p>선택한 생활 습관과 피부 변화의 연관성을 AI가 함께 관찰하고 있어요.</p>

            <div className="experiment-detail-day">
              <strong>
                Day {experiment.currentDay} / {experiment.duration}
              </strong>

              <span>{Math.round(progress)}%</span>
            </div>

            <div className="experiment-detail-progress-track">
              <div
                className="experiment-detail-progress-bar"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </section>

          <section className="experiment-detail-section">
            <h2>오늘의 실천</h2>

            <div className="experiment-habit-list">
              {experiment.habits.map((habit) => {
                const done = habit.completedDays.includes(experiment.currentDay);

                return (
                  <button
                    type="button"
                    key={habit.id}
                    className={`experiment-habit-card ${done ? "is-done" : ""}`}
                    onClick={() => toggleHabit(habit.id)}
                  >
                    <div>
                      <strong>{habit.title}</strong>
                      <span>{done ? "오늘 실천 완료" : "완료했다면 체크해주세요."}</span>
                    </div>

                    <div className="experiment-detail-check">{done && <Check size={16} />}</div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="experiment-detail-section">
            <h2>현재까지의 변화</h2>

            <div className="experiment-detail-summary">
              <div>
                <TrendingUp size={18} />
                <span>피부 점수 변화</span>
                <strong>+4점</strong>
              </div>

              <div>
                <BarChart3 size={18} />
                <span>전체 실천율</span>
                <strong>{practiceRate}%</strong>
              </div>

              <div>
                <ShieldCheck size={18} />
                <span>관찰 데이터</span>
                <strong>Day {experiment.currentDay}</strong>
              </div>
            </div>
          </section>

          <section className="experiment-detail-section">
            <div className="experiment-detail-section-title">
              <h2>AI 관찰</h2>
              <Sparkles size={18} />
            </div>

            <div className="experiment-ai-list">
              {aiObservations.map((observation) => (
                <article key={observation.id} className="experiment-ai-card">
                  <div className="experiment-ai-card-top">
                    <strong>{observation.title}</strong>

                    <span>{observation.confidence}</span>
                  </div>

                  <p>{observation.result}</p>
                </article>
              ))}
            </div>

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
        </main>
      </div>
    </div>
  );
}

export default ExperimentDetail;
