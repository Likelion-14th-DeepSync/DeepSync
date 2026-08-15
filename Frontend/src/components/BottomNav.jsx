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

export default function BottomNav({ activeNav = "home", onChange }) {
  return (
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
        const isActive = activeNav === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange?.(key)}
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
  );
}
