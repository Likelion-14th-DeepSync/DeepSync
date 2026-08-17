import { useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import "./ReminderCard.css";

function ReminderCard() {
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem("wellness-shoot-reminder-enabled") === "true";
  });

  const [time, setTime] = useState(() => {
    return localStorage.getItem("wellness-shoot-reminder-time") || "20:00";
  });

  const timerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("wellness-shoot-reminder-enabled", String(enabled));

    localStorage.setItem("wellness-shoot-reminder-time", time);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!enabled) return;

    scheduleReminder();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, time]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();

    return permission === "granted";
  };

  const handleToggle = async () => {
    if (!enabled) {
      await requestNotificationPermission();
    }

    setEnabled((prev) => !prev);
  };

  const scheduleReminder = () => {
    const now = new Date();

    const [hour, minute] = time.split(":").map(Number);

    const target = new Date();

    target.setHours(hour, minute, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();

    timerRef.current = setTimeout(() => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Wellness Care", {
          body: "오늘의 피부 촬영 시간이에요 📷 같은 시간에 기록해보세요.",
        });
      }

      scheduleReminder();
    }, delay);
  };

  return (
    <section className="reminder-card">
      <div className="reminder-top">
        <div>
          <h2>다음 촬영 리마인더</h2>

          <p>매일 같은 시간에 촬영하면 더 정확한 분석이 가능해요.</p>
        </div>

        <button
          type="button"
          className={`reminder-toggle ${enabled ? "is-enabled" : ""}`}
          onClick={handleToggle}
          aria-label="촬영 알림 켜기 또는 끄기"
        >
          <span />
        </button>
      </div>

      <div className={`reminder-time-box ${!enabled ? "is-disabled" : ""}`}>
        <div className="reminder-icon">
          {enabled ? <Bell size={18} strokeWidth={1.8} /> : <BellOff size={18} strokeWidth={1.8} />}
        </div>

        <div className="reminder-time-content">
          <span>촬영 시간</span>

          <strong>매일</strong>
        </div>

        <input
          type="time"
          value={time}
          disabled={!enabled}
          onChange={(e) => setTime(e.target.value)}
          aria-label="촬영 알림 시간"
        />
      </div>

      <div className="reminder-status">
        {enabled ? `매일 ${time}에 알려드릴게요.` : "촬영 리마인더가 꺼져 있어요."}
      </div>
    </section>
  );
}

export default ReminderCard;
