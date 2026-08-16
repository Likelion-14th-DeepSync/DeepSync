import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";

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
          : "home";

  const handleNavChange = (key) => {
    if (key === "dday") { navigate("/dday"); return; }
    if (key === "ai") { navigate("/ai"); return; }
    if (key === "home") { navigate("/home"); return; }
    if (key === "record") { navigate("/record"); return; }
    if (key === "my") { navigate("/my"); }
  };

  // 👇 나중에 API 연동하면 이 부분을 fetch 해온 데이터로 교체하면 됨
  const userName = "김민재";
  const dDay = 14;
  const skinScore = 78;
  const skinChange = "+4점";
  const stats = [
    { label: "붉은기", value: "-6%", trend: "down" },
    { label: "트러블", value: "변화 없음", trend: "same" },
    { label: "피부톤 균일도", value: "+3%", trend: "up" },
  ];
  const routines = [
    { icon: "🌙", title: "자정 전에 취침하기", desc: "수면이 피부 회복에 도움을 줘요.", done: true },
    { icon: "💧", title: "오후 2시 전에 물 1L 마시기", desc: "수분 섭취는 피부 컨디션에 중요해요.", done: false },
  ];
  const dailyMission = {
    icon: "☀️",
    title: "외출 전 자외선 차단제 바르기",
    desc: "UV 차단은 피부톤 유지에 도움을 줘요.",
    progress: "1 / 3 완료",
    progressPercent: 33,
  };
  const experiment = {
    title: "7시간 이상 수면",
    badge: "7일 실험",
    day: "Day 4 / 7",
    progressPercent: 57,
    rate: "75%",
    scoreChange: "+4점",
    confidence: "보통",
  };
  const nextShoot = { time: "오늘 20:00" };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#E9E9EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: 390,
          height: 844,
          background: "#F5F5F7",
          borderRadius: 36,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* 스크롤되는 콘텐츠 영역 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 12px" }}>
          {/* 상단 헤더 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>Wellness Care</div>
            <div style={{ fontSize: 20 }}>🔔</div>
          </div>

          {/* 인사말 */}
          <div style={{ fontSize: 16, color: "#333", marginBottom: 8 }}>
            안녕하세요, {userName}님 👋
          </div>

          {/* D-Day */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#888" }}>면접까지 D-Day</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#6C5CE7" }}>D - {dDay}</div>
          </div>

          {/* 피부 컨디션 카드 */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>오늘의 피부 컨디션</div>
              <div style={{ color: "#aaa" }}>ⓘ</div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "8px 0" }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: "#111" }}>{skinScore}</span>
              <span style={{ fontSize: 14, color: "#999" }}>/ 100</span>
            </div>
            <div style={{ fontSize: 12, color: "#4CAF50", marginBottom: 16 }}>
              어제보다 {skinChange} ↑
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
              📷 AI 피부 분석하기
            </button>
          </div>

          {/* 통계 3개 박스 */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            {stats.map((s) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  background: "#fff",
                  borderRadius: 14,
                  padding: "12px 8px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{s.label}</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: s.trend === "down" ? "#4CAF50" : s.trend === "up" ? "#6C5CE7" : "#333",
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>어제 대비</div>
              </div>
            ))}
          </div>

          {/* 오늘의 AI 루틴 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>오늘의 AI 루틴</div>
            <div style={{ fontSize: 12, color: "#6C5CE7" }}>전체 보기 ›</div>
          </div>
          {routines.map((r) => (
            <div
              key={r.title}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#fff",
                borderRadius: 14,
                padding: "14px 16px",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 20 }}>{r.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{r.desc}</div>
                </div>
              </div>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: r.done ? "none" : "2px solid #ddd",
                  background: r.done ? "#6C5CE7" : "transparent",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                }}
              >
                {r.done ? "✓" : ""}
              </div>
            </div>
          ))}

          {/* 스크롤 아래 영역 — 오늘의 미션 카드 */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginTop: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "#FFF3D6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                {dailyMission.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{dailyMission.title}</div>
                <div style={{ fontSize: 12, color: "#999" }}>{dailyMission.desc}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{dailyMission.progress}</div>
            <div style={{ height: 6, background: "#eee", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  width: `${dailyMission.progressPercent}%`,
                  height: "100%",
                  background: "#6C5CE7",
                }}
              />
            </div>
          </div>

          {/* 진행 중인 생활 실험 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>진행 중인 생활 실험</div>
            <div style={{ fontSize: 12, color: "#6C5CE7" }}>실험 상세 ›</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🌙</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{experiment.title}</span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: "#6C5CE7",
                  background: "#F0EDFE",
                  padding: "4px 10px",
                  borderRadius: 20,
                }}
              >
                {experiment.badge}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6C5CE7", marginBottom: 6 }}>{experiment.day}</div>
            <div style={{ height: 6, background: "#eee", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
              <div
                style={{
                  width: `${experiment.progressPercent}%`,
                  height: "100%",
                  background: "#6C5CE7",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "#999" }}>실천율</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{experiment.rate}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#999" }}>피부 점수 변화</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{experiment.scoreChange}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#999" }}>신뢰도</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{experiment.confidence}</div>
              </div>
            </div>
          </div>

          {/* 다음 촬영 리마인더 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>다음 촬영 리마인더</div>
            <div style={{ fontSize: 12, color: "#666" }}>{nextShoot.time} 🔔</div>
          </div>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>
            매일 같은 시간에 촬영하면 더 정확한 분석이 가능해요.
          </div>
        </div>

        <BottomNav activeNav={active} onChange={handleNavChange} />
      </div>
    </div>
  );
}

export default Home;