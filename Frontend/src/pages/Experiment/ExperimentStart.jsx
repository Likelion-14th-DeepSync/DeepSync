import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Moon, Check, Droplets, Utensils, Sun, Clock3 } from "lucide-react";

import { createExperiment } from "../../api/experiments";

function getTodayKey() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const EXPERIMENT_OPTIONS = [
  {
    key: "sleep-midnight",
    label: "자정 전 취침",
    shortLabel: "자정 전 취침",
    experimentType: "SLEEP_BEFORE_MIDNIGHT",
    title: "자정 전에 취침하기",
    description: "7일 동안 취침 시간을 기록하며 피부 변화를 관찰해요.",
    Icon: Moon,
    methods: [
      "7일 동안 자정 전에 취침했는지 기록해요.",
      "매일 달성 여부를 자동으로 확인해요.",
      "실험 종료 후 피부 변화와 함께 비교해요.",
    ],
  },
  {
    key: "sleep-7hours",
    label: "7시간 수면",
    shortLabel: "7시간 수면",
    experimentType: "SLEEP_AT_LEAST_7_HOURS",
    title: "하루 7시간 이상 수면하기",
    description: "7일 동안 충분한 수면 시간과 피부 변화를 관찰해요.",
    Icon: Clock3,
    methods: [
      "매일 7시간 이상 수면했는지 기록해요.",
      "수면 시간을 기준으로 달성 여부를 확인해요.",
      "실험 종료 후 피부 변화와 함께 비교해요.",
    ],
  },
  {
    key: "no-night-meal",
    label: "야식 안 먹기",
    shortLabel: "야식 금지",
    experimentType: "NO_LATE_NIGHT_MEAL",
    title: "야식 안 먹기",
    description: "7일 동안 야식 여부를 기록하며 피부 변화를 관찰해요.",
    Icon: Utensils,
    methods: [
      "7일 동안 야식을 먹지 않았는지 기록해요.",
      "매일 식생활 기록을 기준으로 확인해요.",
      "실험 종료 후 피부 변화와 함께 비교해요.",
    ],
  },
  {
    key: "water",
    label: "물 1.5L",
    shortLabel: "수분 섭취",
    experimentType: "WATER_AT_LEAST_1500_ML",
    title: "하루 물 1.5L 이상 마시기",
    description: "7일 동안 수분 섭취량과 피부 변화를 관찰해요.",
    Icon: Droplets,
    methods: [
      "매일 물 1.5L 이상 마셨는지 기록해요.",
      "수분 섭취량을 기준으로 달성 여부를 확인해요.",
      "실험 종료 후 피부 변화와 함께 비교해요.",
    ],
  },
  {
    key: "sunscreen",
    label: "선크림",
    shortLabel: "자외선 관리",
    experimentType: "KEEP_SUNSCREEN_ROUTINE",
    title: "매일 선크림 바르기",
    description: "7일 동안 자외선 차단 습관과 피부 변화를 관찰해요.",
    Icon: Sun,
    methods: [
      "외출 전 자외선 차단제를 발랐는지 기록해요.",
      "매일 실천 여부를 확인해요.",
      "실험 종료 후 피부 변화와 함께 비교해요.",
    ],
  },
];

function ExperimentStart() {
  const navigate = useNavigate();

  const [selectedKey, setSelectedKey] = useState(EXPERIMENT_OPTIONS[0].key);
  const [title, setTitle] = useState(EXPERIMENT_OPTIONS[0].title);
  const [startDate, setStartDate] = useState(getTodayKey());
  const [isCreating, setIsCreating] = useState(false);

  const selectedExperiment =
    EXPERIMENT_OPTIONS.find((item) => item.key === selectedKey) ?? EXPERIMENT_OPTIONS[0];

  const handleSelectExperiment = (item) => {
    setSelectedKey(item.key);

    /*
     * 실험 종류를 선택하면 기본 이름도 함께 변경.
     * 이후 사용자가 이름은 자유롭게 수정 가능.
     */
    setTitle(item.title);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("실험 이름을 입력해주세요.");
      return;
    }

    if (!startDate) {
      alert("시작 날짜를 선택해주세요.");
      return;
    }

    try {
      setIsCreating(true);

      const response = await createExperiment({
        title: title.trim(),

        experimentType: selectedExperiment.experimentType,

        experimentPeriod: "SEVEN_DAYS",

        startDate,
      });

      console.log("생활 실험 생성 성공:", response);

      const experimentId = response.data?.experimentId;

      if (experimentId) {
        navigate(`/experiment/${experimentId}`);
      } else {
        navigate("/dday");
      }
    } catch (error) {
      console.error("생활 실험 생성 실패:", error);

      const message = error.response?.data?.error?.message ?? "생활 실험 생성에 실패했습니다.";

      alert(message);
    } finally {
      setIsCreating(false);
    }
  };

  const SelectedIcon = selectedExperiment.Icon;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 430,
        minHeight: "100vh",
        margin: "0 auto",
        background: "#F8F8FC",
      }}
    >
      <main
        style={{
          padding: "24px 20px 120px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: 0,
            border: "none",
            background: "transparent",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={20} />
          뒤로
        </button>

        <div
          style={{
            marginTop: 24,
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 12,
              color: "#999",
            }}
          >
            7일 생활 실험
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: 24,
            }}
          >
            새 실험 시작하기
          </h1>
        </div>

        {/* 실험 종류 선택 */}
        <section
          style={{
            marginTop: 24,
            padding: 18,
            borderRadius: 18,
            background: "#fff",
          }}
        >
          <strong
            style={{
              display: "block",
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            어떤 생활 습관을 실험할까요?
          </strong>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 9,
            }}
          >
            {EXPERIMENT_OPTIONS.map((item) => {
              const Icon = item.Icon;

              const isSelected = selectedKey === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSelectExperiment(item)}
                  style={{
                    minHeight: 54,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 11px",
                    border: isSelected ? "1.5px solid #6C5CE7" : "1px solid #E8E8EE",
                    borderRadius: 13,
                    background: isSelected ? "#F4F1FF" : "#fff",
                    color: isSelected ? "#6C5CE7" : "#555",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 9,
                      background: isSelected ? "#EAE5FF" : "#F5F5F7",
                    }}
                  >
                    <Icon size={16} />
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 선택한 실험 안내 */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginTop: 18,
              padding: 14,
              borderRadius: 14,
              background: "#F8F7FF",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                borderRadius: 13,
                background: "#F0EDFF",
                color: "#6C5CE7",
              }}
            >
              <SelectedIcon size={21} />
            </div>

            <div>
              <strong
                style={{
                  fontSize: 13,
                }}
              >
                {selectedExperiment.title}
              </strong>

              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: "#888",
                }}
              >
                {selectedExperiment.description}
              </p>
            </div>
          </div>

          {/* 이름 */}
          <div
            style={{
              marginTop: 22,
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: 7,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              실험 이름
            </label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                border: "1px solid #E5E5EA",
                borderRadius: 12,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>

          {/* 날짜 */}
          <div
            style={{
              marginTop: 16,
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: 7,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              시작 날짜
            </label>

            <input
              type="date"
              value={startDate}
              min={getTodayKey()}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                border: "1px solid #E5E5EA",
                borderRadius: 12,
                fontFamily: "inherit",
              }}
            />
          </div>
        </section>

        {/* 실험 방법 */}
        <section
          style={{
            marginTop: 16,
            padding: 18,
            borderRadius: 18,
            background: "#fff",
          }}
        >
          <strong
            style={{
              fontSize: 14,
            }}
          >
            실험 방법
          </strong>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {selectedExperiment.methods.map((text) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "#666",
                }}
              >
                <Check
                  size={15}
                  color="#6C5CE7"
                  style={{
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                />

                {text}
              </div>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating}
          style={{
            width: "100%",
            marginTop: 24,
            padding: "14px 0",
            border: "none",
            borderRadius: 14,
            background: "#6C5CE7",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: isCreating ? "default" : "pointer",
            opacity: isCreating ? 0.65 : 1,
          }}
        >
          {isCreating ? "실험 생성 중..." : "7일 실험 시작하기"}
        </button>
      </main>
    </div>
  );
}

export default ExperimentStart;
