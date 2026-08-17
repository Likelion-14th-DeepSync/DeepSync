import { useState } from "react";

function RecordCalendar() {
  const [selectedDate, setSelectedDate] = useState(14);

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
  const prevMonthDays = [24, 25, 26, 27, 28, 29, 30, 31];
  const currentMonthDays = Array.from({ length: 31 }, (_, i) => i + 1);

  const dailyRecord = {
    date: "8월 14일 (목)",
    skinScore: 78,
    change: "+4점",
    stats: [
      { label: "붉은기", value: "-6%", trend: "down" },
      { label: "트러블", value: "변화 없음", trend: "same" },
      { label: "피부톤 균일도", value: "+3%", trend: "up" },
    ],
    lifeLog: [
      { icon: "🌙", label: "수면", value: "7시간 12분" },
      { icon: "💧", label: "수분 섭취", value: "1.2 L" },
      { icon: "🍜", label: "야식", value: "없음" },
      { icon: "☀️", label: "UV 지수", value: "높음", link: true },
      { icon: "☁️", label: "미세먼지", value: "보통 (35µg/m³)", link: true },
    ],
  };

  return (
    <div style={{ padding: "16px 20px 20px" }}>
      {/* 달력 */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ cursor: "pointer", color: "#999" }}>‹</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>2026년 8월</span>
          <span style={{ cursor: "pointer", color: "#999" }}>›</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: 12, color: "#999", marginBottom: 8 }}>
          {weekDays.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", rowGap: 10 }}>
          {prevMonthDays.map((d) => (
            <div key={`prev-${d}`} style={{ fontSize: 13, color: "#ccc" }}>{d}</div>
          ))}
          {currentMonthDays.map((d) => (
            <div
              key={d}
              onClick={() => setSelectedDate(d)}
              style={{
                fontSize: 13,
                color: d === selectedDate ? "#fff" : "#333",
                background: d === selectedDate ? "#6C5CE7" : "transparent",
                borderRadius: "50%",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                cursor: "pointer",
              }}
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* 선택된 날짜 기록 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{dailyRecord.date}</span>
        <button style={{ fontSize: 12, color: "#666", background: "#fff", border: "1px solid #E5E5EA", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>
          기록 수정
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 10 }}>오늘의 피부</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "#eee" }} />
          <div>
            <div>
              <span style={{ fontSize: 26, fontWeight: 800, color: "#111" }}>{dailyRecord.skinScore}점</span>
              <span style={{ fontSize: 13, color: "#999" }}> / 100</span>
            </div>
            <div style={{ fontSize: 12, color: "#4CAF50" }}>어제보다 {dailyRecord.change} ↑</div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              {dailyRecord.stats.map((s) => (
                <div key={s.label} style={{ fontSize: 11, color: "#999" }}>
                  {s.label} <span style={{ color: s.trend === "down" ? "#4CAF50" : s.trend === "up" ? "#6C5CE7" : "#999", fontWeight: 600 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 13, color: "#6C5CE7", cursor: "pointer" }}>
          상세 보기 <span>›</span>
        </div>
      </div>

      {/* 생활 기록 */}
      <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 10 }}>생활 기록</div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "4px 16px", marginBottom: 16 }}>
        {dailyRecord.lifeLog.map((item, i) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: i !== dailyRecord.lifeLog.length - 1 ? "1px solid #F0F0F0" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#333" }}>
              <span>{item.icon}</span> {item.label}
            </div>
            <div style={{ fontSize: 13, color: item.link ? "#6C5CE7" : "#666" }}>
              {item.value} {item.link && <span style={{ color: "#6C5CE7" }}>›</span>}
            </div>
          </div>
        ))}
      </div>

      <button
        style={{
          width: "100%",
          background: "#6C5CE7",
          color: "#fff",
          border: "none",
          borderRadius: 14,
          padding: "14px 0",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        + 오늘 생활 기록 추가
      </button>
    </div>
  );
}

export default RecordCalendar;