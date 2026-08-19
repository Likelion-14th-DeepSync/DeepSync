import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Moon, Check } from "lucide-react";

import { createExperiment } from "../../api/experiments";

function getTodayKey() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function ExperimentStart() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("자정 전에 취침하기");
  const [startDate, setStartDate] = useState(getTodayKey());
  const [isCreating, setIsCreating] = useState(false);

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
        experimentType: "SLEEP_BEFORE_MIDNIGHT",
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

        <section
          style={{
            marginTop: 24,
            padding: 18,
            borderRadius: 18,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                background: "#F0EDFF",
                color: "#6C5CE7",
              }}
            >
              <Moon size={22} />
            </div>

            <div>
              <strong>자정 전에 취침하기</strong>

              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: "#888",
                }}
              >
                7일 동안 수면 습관과 피부 변화를 관찰해요.
              </p>
            </div>
          </div>

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
              }}
            />
          </div>

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
            {[
              "7일 동안 자정 전에 취침했는지 기록해요.",
              "매일 달성 여부를 체크해요.",
              "실험 종료 후 피부 변화와 함께 비교해요.",
            ].map((text) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "#666",
                }}
              >
                <Check size={15} color="#6C5CE7" />
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
