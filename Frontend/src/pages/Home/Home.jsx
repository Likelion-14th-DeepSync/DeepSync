import { useLocation, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  ClipboardList,
  Sparkles,
  Calendar,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "home", label: "홈", icon: HomeIcon },
  { key: "record", label: "기록", icon: ClipboardList },
  { key: "ai", label: "AI", icon: Sparkles, isCenter: true },
  { key: "dday", label: "D-Day", icon: Calendar },
  { key: "my", label: "마이", icon: User },
];

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const active = location.pathname === "/d-day" || location.pathname === "/dday" ? "dday" : "home";

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
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            fontWeight: "700",
            color: "#111",
          }}
        >
          Home
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            background: "#fff",
            borderTop: "1px solid #ECECEC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "10px 4px 24px",
            zIndex: 10,
          }}
        >
          {NAV_ITEMS.map(({ key, label, icon: Icon, isCenter }) => {
            const isActive = active === key;

            return (
              <button
                key={key}
                onClick={() => {
                  if (key === "dday") {
                    navigate("/d-day");
                    return;
                  }

                  if (key === "home") {
                    navigate("/home");
                  }
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: isActive ? "#6C5CE7" : "#767676",
                  fontSize: 10,
                  fontWeight: 600,
                  width: 56,
                  marginTop: isCenter ? -26 : 0,
                }}
              >
                {isCenter ? (
                  <span
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: isActive ? "#6C5CE7" : "#A5A5A5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
                      border: "4px solid #fff",
                    }}
                  >
                    <Icon size={20} color="#fff" />
                  </span>
                ) : (
                  <Icon size={22} color={isActive ? "#6C5CE7" : "#767676"} />
                )}
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Home;
