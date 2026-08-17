import { Home as HomeIcon, ClipboardList, Sparkles, Calendar, User } from "lucide-react";

const NAV_ITEMS = [
  { key: "home", label: "홈", icon: HomeIcon },
  { key: "record", label: "기록", icon: ClipboardList },
  { key: "ai", label: "AI", icon: Sparkles, isCenter: true },
  { key: "dday", label: "D-Day", icon: Calendar },
  { key: "my", label: "마이", icon: User },
];

export default function BottomNav({ activeNav = "home", onChange }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: 82,

        background: "#fff",
        borderTop: "1px solid #ECECEC",

        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",

        padding: "10px 4px 18px",
        boxSizing: "border-box",

        zIndex: 10,
      }}
    >
      {NAV_ITEMS.map(({ key, label, icon: Icon, isCenter }) => {
        const isActive = activeNav === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange?.(key)}
            aria-label={label}
            style={{
              width: 56,

              display: "flex",
              flexDirection: "column",
              alignItems: "center",

              gap: 4,

              marginTop: isCenter ? -26 : 0,

              padding: 0,

              background: "none",
              border: "none",

              cursor: "pointer",

              color: isActive ? "#6C5CE7" : "#767676",

              fontSize: 10,
              fontWeight: 600,

              fontFamily: "inherit",
            }}
          >
            {isCenter ? (
              <span
                style={{
                  width: 52,
                  height: 52,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  borderRadius: "50%",

                  /* AI 버튼은 항상 보라색 */
                  background: "#6C5CE7",

                  border: "4px solid #fff",

                  boxSizing: "border-box",

                  boxShadow: "0 6px 16px rgba(108, 92, 231, 0.30)",
                }}
              >
                <Icon size={20} strokeWidth={1.9} color="#fff" />
              </span>
            ) : (
              <Icon size={22} strokeWidth={1.8} color={isActive ? "#6C5CE7" : "#767676"} />
            )}

            <span
              style={{
                color: isCenter ? (isActive ? "#6C5CE7" : "#767676") : "inherit",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
