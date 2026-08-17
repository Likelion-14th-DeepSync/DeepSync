import { useMemo, useState } from "react";
import { ChevronLeft, Database, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DAILY_RECORD_KEY = "wellness-daily-records";
const EXPERIMENT_KEY = "wellness-active-experiment";
const TODAY_ANALYSIS_KEY = "wellness-today-skin-analysis";
const SCHEDULE_KEY = "wellness-calendar-schedules";

export default function DataManagement() {
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);

  const dataSummary = useMemo(() => {
    let recordCount = 0;
    let scheduleCount = 0;
    let hasExperiment = false;
    let hasTodayAnalysis = false;

    try {
      const records = JSON.parse(localStorage.getItem(DAILY_RECORD_KEY) || "{}");

      recordCount = Object.keys(records).length;
    } catch {
      recordCount = 0;
    }

    try {
      const schedules = JSON.parse(localStorage.getItem(SCHEDULE_KEY) || "[]");

      scheduleCount = Array.isArray(schedules) ? schedules.length : 0;
    } catch {
      scheduleCount = 0;
    }

    hasExperiment = Boolean(localStorage.getItem(EXPERIMENT_KEY));

    hasTodayAnalysis = Boolean(localStorage.getItem(TODAY_ANALYSIS_KEY));

    return {
      recordCount,
      scheduleCount,
      hasExperiment,
      hasTodayAnalysis,
    };
  }, [refreshKey]);

  const handleDeleteRecordData = () => {
    const confirmed = window.confirm(
      "피부 기록과 생활 기록 데이터를 삭제할까요?\n삭제한 데이터는 복구할 수 없어요.",
    );

    if (!confirmed) return;

    localStorage.removeItem(DAILY_RECORD_KEY);
    localStorage.removeItem(TODAY_ANALYSIS_KEY);

    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteExperiment = () => {
    const confirmed = window.confirm("진행 중인 생활 실험 데이터를 삭제할까요?");

    if (!confirmed) return;

    localStorage.removeItem(EXPERIMENT_KEY);

    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteSchedules = () => {
    const confirmed = window.confirm("등록한 일정과 D-Day 설정을 삭제할까요?");

    if (!confirmed) return;

    localStorage.removeItem(SCHEDULE_KEY);
    localStorage.removeItem("wellness-dday-selected-schedule-id");

    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#E9E9EE",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 390,
          height: 844,
          background: "#F5F5F7",
          borderRadius: 36,
          overflowY: "auto",
          padding: "24px 20px",
          boxSizing: "border-box",
          boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/my")}
            style={{
              width: 36,
              height: 36,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={24} />
          </button>

          <h1
            style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 700,
            }}
          >
            데이터 관리
          </h1>
        </header>

        <section
          style={{
            padding: 18,
            marginBottom: 18,
            borderRadius: 16,
            background: "#F0EDFF",
          }}
        >
          <Database size={25} color="#6C5CE7" />

          <h2
            style={{
              margin: "10px 0 5px",
              fontSize: 15,
            }}
          >
            저장된 데이터
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "#777",
              lineHeight: 1.6,
            }}
          >
            현재 기기에 저장된 Wellness Care 데이터를 관리할 수 있어요.
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#999",
              }}
            >
              기록된 날짜
            </div>

            <strong
              style={{
                display: "block",
                marginTop: 4,
                fontSize: 18,
              }}
            >
              {dataSummary.recordCount}일
            </strong>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#999",
              }}
            >
              등록 일정
            </div>

            <strong
              style={{
                display: "block",
                marginTop: 4,
                fontSize: 18,
              }}
            >
              {dataSummary.scheduleCount}개
            </strong>
          </div>
        </div>

        <h2
          style={{
            margin: "0 0 10px",
            fontSize: 14,
          }}
        >
          데이터 삭제
        </h2>

        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <button type="button" onClick={handleDeleteRecordData} style={rowStyle}>
            <div>
              <strong style={rowTitleStyle}>피부·생활 기록 삭제</strong>

              <span style={rowDescStyle}>사진, 피부 점수, 생활 기록을 삭제해요.</span>
            </div>

            <Trash2 size={17} color="#E35D6A" />
          </button>

          <button type="button" onClick={handleDeleteExperiment} style={rowStyle}>
            <div>
              <strong style={rowTitleStyle}>생활 실험 데이터 삭제</strong>

              <span style={rowDescStyle}>진행 중인 생활 실험을 초기화해요.</span>
            </div>

            <Trash2 size={17} color="#E35D6A" />
          </button>

          <button
            type="button"
            onClick={handleDeleteSchedules}
            style={{
              ...rowStyle,
              borderBottom: "none",
            }}
          >
            <div>
              <strong style={rowTitleStyle}>일정·D-Day 삭제</strong>

              <span style={rowDescStyle}>캘린더에 등록한 일정과 D-Day를 초기화해요.</span>
            </div>

            <Trash2 size={17} color="#E35D6A" />
          </button>
        </div>

        <p
          style={{
            margin: "14px 4px 0",
            fontSize: 10,
            lineHeight: 1.55,
            color: "#999",
          }}
        >
          현재는 MVP용 로컬 저장 데이터입니다. 실제 서비스에서는 서버 데이터 관리 정책에 따라
          처리됩니다.
        </p>
      </div>
    </div>
  );
}

const rowStyle = {
  width: "100%",
  minHeight: 66,
  padding: "13px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  border: "none",
  borderBottom: "1px solid #F0F0F0",
  background: "#fff",
  textAlign: "left",
  cursor: "pointer",
};

const rowTitleStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#222",
};

const rowDescStyle = {
  display: "block",
  marginTop: 3,
  fontSize: 9,
  color: "#999",
};
