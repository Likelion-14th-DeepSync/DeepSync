import { useEffect, useState } from "react";
import { ChevronLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "wellness-notification-settings";

const DEFAULT_SETTINGS = {
  dailyReminder: true,
  skinReminder: true,
  experimentReminder: true,
  ddayReminder: true,
};

export default function NotificationSettings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(saved),
        });
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  const toggleSetting = (key) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        [key]: !prev[key],
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      return next;
    });
  };

  const rows = [
    {
      key: "dailyReminder",
      title: "오늘의 루틴 알림",
      desc: "오늘의 AI 루틴을 잊지 않도록 알려드려요.",
    },
    {
      key: "skinReminder",
      title: "피부 촬영 알림",
      desc: "매일 피부 사진을 기록할 수 있도록 알려드려요.",
    },
    {
      key: "experimentReminder",
      title: "생활 실험 알림",
      desc: "진행 중인 생활 실험 기록을 알려드려요.",
    },
    {
      key: "ddayReminder",
      title: "D-Day 알림",
      desc: "중요한 일정이 가까워지면 알려드려요.",
    },
  ];

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
            알림 설정
          </h1>
        </header>

        <section
          style={{
            padding: 18,
            marginBottom: 18,
            background: "#F0EDFF",
            borderRadius: 16,
          }}
        >
          <Bell size={24} color="#6C5CE7" />

          <h2
            style={{
              margin: "10px 0 5px",
              fontSize: 15,
            }}
          >
            필요한 알림만 받아보세요
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: 11,
              lineHeight: 1.6,
              color: "#777",
            }}
          >
            피부 기록과 생활 습관 관리를 위한 알림을 각각 설정할 수 있어요.
          </p>
        </section>

        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {rows.map((item, index) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "15px 16px",
                borderBottom: index !== rows.length - 1 ? "1px solid #F0F0F0" : "none",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#222",
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    marginTop: 3,
                    fontSize: 10,
                    lineHeight: 1.45,
                    color: "#999",
                  }}
                >
                  {item.desc}
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleSetting(item.key)}
                aria-pressed={settings[item.key]}
                style={{
                  width: 46,
                  height: 26,
                  padding: 3,
                  border: "none",
                  borderRadius: 999,
                  background: settings[item.key] ? "#6C5CE7" : "#D8D8DE",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#fff",
                    transform: settings[item.key] ? "translateX(20px)" : "translateX(0)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
