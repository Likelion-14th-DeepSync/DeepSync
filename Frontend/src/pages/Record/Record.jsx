import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import RecordCalendar from "./RecordCalendar";
import RecordPhoto from "./RecordPhoto";
import RecordChange from "./RecordChange";

function Record() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("calendar"); // calendar | photo | change

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
    if (key === "dday") { navigate("/dday"); return; }
    if (key === "ai") { navigate("/ai"); return; }
    if (key === "home") { navigate("/home"); return; }
    if (key === "record") { navigate("/record"); return; }
    if (key === "my") { navigate("/my"); }
  };

  const tabs = [
    { key: "calendar", label: "캘린더" },
    { key: "photo", label: "사진 기록" },
    { key: "change", label: "변화" },
  ];

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
        {/* 헤더 */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 16 }}>
            기록
          </div>

          {/* 탭 바 */}
          <div style={{ display: "flex", borderBottom: "1px solid #E5E5EA" }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  padding: "10px 0",
                  fontSize: 14,
                  fontWeight: tab === t.key ? 700 : 400,
                  color: tab === t.key ? "#6C5CE7" : "#999",
                  borderBottom: tab === t.key ? "2px solid #6C5CE7" : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 내용 */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {tab === "calendar" && <RecordCalendar />}
          {tab === "photo" && <RecordPhoto />}
          {tab === "change" && <RecordChange />}
        </div>

        <BottomNav activeNav={active} onChange={handleNavChange} />
      </div>
    </div>
  );
}

export default Record;