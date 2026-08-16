function RecordPhoto() {
  const photos = [
    { date: "8/14 (목)", score: 78 },
    { date: "8/13 (수)", score: 74 },
    { date: "8/12 (화)", score: 73 },
    { date: "8/11 (월)", score: 72 },
    { date: "8/10 (일)", score: 71 },
    { date: "8/9 (토)", score: 71 },
  ];

  return (
    <div style={{ padding: "16px 20px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>사진 기록</span>
        <span style={{ fontSize: 12, color: "#6C5CE7" }}>전체 보기 ›</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
        {photos.map((p) => (
          <div key={p.date} style={{ textAlign: "center" }}>
            <div style={{ width: "100%", aspectRatio: "1", borderRadius: 10, background: "#ddd", marginBottom: 6 }} />
            <div style={{ fontSize: 11, color: "#999" }}>{p.date}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{p.score}점</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
          borderRadius: 14,
          padding: "12px 16px",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, color: "#666" }}>
          피부 사진을 매일 기록하면 더 정확한 변화 분석이 가능해요!
        </div>
        <button
          style={{
            background: "#6C5CE7",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
            marginLeft: 8,
            cursor: "pointer",
          }}
        >
          📷 사진 촬영
        </button>
      </div>

      {/* 사진 비교 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>사진 비교</span>
        <span style={{ fontSize: 12, color: "#6C5CE7" }}>자세히 보기 ›</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, background: "#fff", borderRadius: 16, padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 90, height: 90, borderRadius: 12, background: "#ddd", marginBottom: 6 }} />
          <div style={{ fontSize: 11, color: "#999" }}>8월 7일 (목)</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>71점</div>
        </div>
        <span style={{ fontSize: 18, color: "#999" }}>→</span>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 90, height: 90, borderRadius: 12, background: "#ddd", marginBottom: 6 }} />
          <div style={{ fontSize: 11, color: "#999" }}>8월 14일 (목)</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6C5CE7" }}>78점</div>
        </div>
      </div>
    </div>
  );
}

export default RecordPhoto;