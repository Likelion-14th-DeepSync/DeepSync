function RecordChange() {
  const indicators = [
    { label: "붉은기", value: "-8%", trend: "down" },
    { label: "트러블", value: "-3%", trend: "down" },
    { label: "피부톤 균일도", value: "+4%", trend: "up" },
    { label: "모공 (피부결)", value: "+2%", trend: "up" },
  ];

  const correlations = [
    { pair: "수면 시간 ↔ 붉은기", level: "연관성 높음", dots: 3 },
    { pair: "UV 지수 ↔ 피부톤 균일도", level: "연관성 보통", dots: 2 },
    { pair: "야식 여부 ↔ 피부 점수", level: "연관성 보통", dots: 2 },
    { pair: "수분 섭취 ↔ 피부 점수", level: "연관성 낮음", dots: 1 },
    { pair: "미세먼지 ↔ 트러블", level: "연관성 낮음", dots: 1 },
  ];

  const summary = "수면 시간이 충분했던 날, 피부 컨디션이 더 좋은 경향을 보여요. 😊";

  return (
    <div style={{ padding: "16px 20px 20px" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 12 }}>
        주요 지표 변화 (7일 기준)
      </div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "4px 16px", marginBottom: 20 }}>
        {indicators.map((item, i) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: i !== indicators.length - 1 ? "1px solid #F0F0F0" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#333" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6C5CE7" }} />
              {item.label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: item.trend === "down" ? "#4CAF50" : "#6C5CE7" }}>
              {item.value} {item.trend === "down" ? "↓" : "↑"} <span style={{ color: "#ccc" }}>›</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>생활 요인과의 연관성</span>
        <span style={{ fontSize: 12, color: "#6C5CE7" }}>자세히 보기 ›</span>
      </div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "4px 16px", marginBottom: 20 }}>
        {correlations.map((item, i) => (
          <div
            key={item.pair}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: i !== correlations.length - 1 ? "1px solid #F0F0F0" : "none",
            }}
          >
            <span style={{ fontSize: 13, color: "#333" }}>{item.pair}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#999" }}>{item.level}</span>
              <span style={{ fontSize: 10, color: "#6C5CE7" }}>{"●".repeat(item.dots)}{"○".repeat(3 - item.dots)}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#fff", borderRadius: 16, padding: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 6 }}>이번 주 요약</div>
          <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{summary}</div>
        </div>
        <div style={{ fontSize: 18, color: "#6C5CE7" }}>📊</div>
      </div>
    </div>
  );
}

export default RecordChange;