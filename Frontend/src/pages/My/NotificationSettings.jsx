import { useEffect, useState } from "react";
import { ChevronLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { reminderApi, REMINDER_TYPE } from "../../api/reminder";

const KEY_TO_TYPE = {
  skinCapture: REMINDER_TYPE.SKIN_CAPTURE,
  lifestyleRecord: REMINDER_TYPE.LIFESTYLE_RECORD,
  waterIntake: REMINDER_TYPE.WATER_INTAKE,
  bedtimePreparation: REMINDER_TYPE.BEDTIME_PREPARATION,
  experimentAction: REMINDER_TYPE.EXPERIMENT_ACTION,
  ddayRoutine: REMINDER_TYPE.DDAY_ROUTINE,
};

const DEFAULT_SETTINGS = {
  skinCapture: true,
  lifestyleRecord: true,
  waterIntake: true,
  bedtimePreparation: true,
  experimentAction: true,
  ddayRoutine: true,
};

const STORAGE_KEY = "notification-settings";

const getStoredSettings = () => {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(raw),
    };
  } catch (error) {
    console.error("알림 설정 로드 실패:", error);
    return DEFAULT_SETTINGS;
  }
};

const getSettingsFromServerList = (serverList = [], fallbackSettings = DEFAULT_SETTINGS) => {
  const merged = { ...fallbackSettings };

  Object.entries(KEY_TO_TYPE).forEach(([key, type]) => {
    const entry = serverList.find((r) => r.type === type);
    if (entry) {
      merged[key] = !!entry.enabled;
    }
  });

  return merged;
};

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => getStoredSettings());

  const saveSettings = (nextSettings) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    } catch (error) {
      console.error("알림 설정 저장 실패:", error);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      const storedSettings = getStoredSettings();
      setSettings(storedSettings);

      try {
        const res = await reminderApi.getSettings();
        const serverList = res.data ?? [];

        const nextSettings = getSettingsFromServerList(serverList, storedSettings);

        setSettings(nextSettings);
        saveSettings(nextSettings);
      } catch (err) {
        console.error("알림 설정 로드 실패:", err);
      }
    };

    loadSettings();
  }, []);

  const toggleSetting = async (key) => {
    const reminderType = KEY_TO_TYPE[key];
    const willEnable = !settings[key];
    const nextSettings = {
      ...settings,
      [key]: willEnable,
    };

    // optimistic update: 로컬 상태 + localStorage 즉시 반영 -> 다른 화면 이동 후에도 유지됨
    setSettings(nextSettings);
    saveSettings(nextSettings);

    try {
      if (willEnable) {
        await reminderApi.updateSetting(reminderType, {
          enabled: true,
          reminderTime: "22:00:00",
          daysOfWeek: [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
          ],
          timezone:
            Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul",
        });
      } else {
        await reminderApi.disableSetting(reminderType);
      }
    } catch (err) {
      console.error("알림 설정 변경 실패:", err);

      const revertedSettings = {
        ...settings,
        [key]: !willEnable,
      };

      setSettings(revertedSettings);
      saveSettings(revertedSettings);
    }
  };

  const rows = [
    {
      key: "ddayRoutine",
      title: "D-Day 루틴 알림",
      desc: "목표일까지 맞춤 피부 관리 루틴을 알려드려요.",
    },
    {
      key: "skinCapture",
      title: "피부 촬영 알림",
      desc: "매일 피부 사진을 기록할 수 있도록 알려드려요.",
    },
    {
      key: "lifestyleRecord",
      title: "생활 기록 알림",
      desc: "오늘의 수면, 식습관 등 생활 데이터를 기록해요.",
    },
    {
      key: "experimentAction",
      title: "생활 실험 알림",
      desc: "진행 중인 생활 실험 실천과 기록을 알려드려요.",
    },
    {
      key: "waterIntake",
      title: "물 섭취 알림",
      desc: "충분한 수분 섭취를 잊지 않도록 알려드려요.",
    },
    {
      key: "bedtimePreparation",
      title: "취침 준비 알림",
      desc: "피부 회복을 위한 규칙적인 수면 시간을 도와드려요.",
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
            marginBottom: 20,
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
                borderBottom:
                  index !== rows.length - 1 ? "1px solid #F0F0F0" : "none",
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
                    transform: settings[item.key]
                      ? "translateX(20px)"
                      : "translateX(0)",
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