import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Moon,
  Droplets,
  Sun,
  Utensils,
  Sandwich,
  Sparkles,
  BedDouble,
  Footprints,
  Check,
} from "lucide-react";
import "./ExperimentStart.css";

const EXPERIMENT_OPTIONS = [
  {
    id: "sleep-7h",
    icon: Moon,
    title: "7시간 이상 수면하기",
    desc: "수면 시간과 피부 컨디션 변화를 관찰해요.",
  },
  {
    id: "water-2l",
    icon: Droplets,
    title: "하루 물 2L 마시기",
    desc: "수분 섭취와 건조함 변화를 관찰해요.",
  },
  {
    id: "sunscreen",
    icon: Sun,
    title: "매일 자외선 차단제 사용하기",
    desc: "붉은기와 피부톤 변화를 관찰해요.",
  },
  {
    id: "fastfood",
    icon: Sandwich,
    title: "패스트푸드 줄이기",
    desc: "식습관과 트러블 변화를 관찰해요.",
  },
  {
    id: "no-late-night-food",
    icon: Utensils,
    title: "야식 먹지 않기",
    desc: "야식 여부와 다음 날 피부 상태를 비교해요.",
  },
  {
    id: "mask-pack",
    icon: Sparkles,
    title: "주 3회 진정팩 사용하기",
    desc: "팩 사용과 붉은기·건조함 변화를 관찰해요.",
  },
  {
    id: "sleep-before-midnight",
    icon: BedDouble,
    title: "자정 전에 취침하기",
    desc: "취침 시간과 피부 회복을 관찰해요.",
  },
  {
    id: "walk-30m",
    icon: Footprints,
    title: "하루 30분 이상 활동하기",
    desc: "활동량과 피부 컨디션 변화를 관찰해요.",
  },
];

const DURATIONS = [
  {
    value: 7,
    label: "7일",
    desc: "짧게 확인",
  },
  {
    value: 14,
    label: "14일",
    desc: "패턴 관찰",
  },
  {
    value: 30,
    label: "30일",
    desc: "장기 분석",
  },
];

function ExperimentStart() {
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState([]);
  const [duration, setDuration] = useState(7);

  const toggleExperiment = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      if (prev.length >= 3) {
        return prev;
      }

      return [...prev, id];
    });
  };

  const canStart = selectedIds.length > 0;

  const handleStart = () => {
    if (!canStart) return;

    const selectedHabits = EXPERIMENT_OPTIONS.filter((item) => selectedIds.includes(item.id)).map(
      (item) => ({
        id: item.id,
        title: item.title,
        desc: item.desc,
        completedDays: [],
      }),
    );

    const data = {
      id: 1,
      duration,
      currentDay: 1,
      startDate: new Date().toISOString(),
      status: "active",
      habits: selectedHabits,
    };

    localStorage.setItem("wellness-active-experiment", JSON.stringify(data));

    navigate("/experiment/1");
  };

  return (
    <div className="experiment-start-page">
      <div className="experiment-start-phone">
        <main className="experiment-start-scroll">
          <header className="experiment-start-header">
            <button
              type="button"
              className="experiment-start-back"
              onClick={() => navigate(-1)}
              aria-label="뒤로가기"
            >
              <ChevronLeft size={25} />
            </button>

            <h1>생활 실험 시작</h1>

            <div className="experiment-start-header-space" />
          </header>

          <section className="experiment-start-intro">
            <h2>관찰할 습관을 선택해주세요</h2>

            <p>
              피부 변화와 함께 비교하고 싶은 생활 습관을
              <br />
              최대 3개까지 선택할 수 있어요.
            </p>

            <div className="experiment-selection-count">{selectedIds.length} / 3개 선택</div>
          </section>

          <section className="experiment-start-options">
            {EXPERIMENT_OPTIONS.map((experiment) => {
              const Icon = experiment.icon;
              const selected = selectedIds.includes(experiment.id);

              const limitReached = selectedIds.length >= 3 && !selected;

              return (
                <button
                  key={experiment.id}
                  type="button"
                  className={`experiment-option ${
                    selected ? "is-selected" : ""
                  } ${limitReached ? "is-disabled" : ""}`}
                  onClick={() => toggleExperiment(experiment.id)}
                  disabled={limitReached}
                >
                  <div className="experiment-option-icon">
                    <Icon size={20} strokeWidth={1.8} />
                  </div>

                  <div className="experiment-option-text">
                    <strong>{experiment.title}</strong>
                    <span>{experiment.desc}</span>
                  </div>

                  <div className={`experiment-option-check ${selected ? "is-selected" : ""}`}>
                    {selected && <Check size={14} />}
                  </div>
                </button>
              );
            })}
          </section>

          <section className="experiment-duration-section">
            <h2>실험 기간</h2>

            <div className="experiment-duration-grid">
              {DURATIONS.map((item) => {
                const selected = duration === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    className={`experiment-duration ${selected ? "is-selected" : ""}`}
                    onClick={() => setDuration(item.value)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="experiment-start-ai">
            <Sparkles size={18} />

            <div>
              <strong>AI가 습관별로 따로 관찰해요</strong>

              <p>
                각 습관의 실천 기록과 피부 점수, 붉은기, 트러블 등의 변화를 비교해 연관성을 찾아요.
              </p>
            </div>
          </section>

          <button
            type="button"
            className="experiment-start-button"
            disabled={!canStart}
            onClick={handleStart}
          >
            {selectedIds.length > 0
              ? `${selectedIds.length}개 습관으로 실험 시작하기`
              : "습관을 선택해주세요"}
          </button>
        </main>
      </div>
    </div>
  );
}

export default ExperimentStart;
