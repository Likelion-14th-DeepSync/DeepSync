import { useEffect, useState } from "react";
import { X, Bell, CheckCircle2, Clock } from "lucide-react";
import { reminderApi } from "../api/reminder";

const TYPE_TITLES = {
  DDAY_ROUTINE: "D-Day 루틴 알림",
  SKIN_CAPTURE: "피부 촬영 알림",
  LIFESTYLE_RECORD: "생활 기록 알림",
  EXPERIMENT_ACTION: "생활 실험 알림",
  WATER_INTAKE: "물 섭취 알림",
  BEDTIME_PREPARATION: "취침 준비 알림",
};

// MY 페이지에서 주로 사용하는 로컬 스토리지 키 후보들
const STORAGE_KEYS = [
  "notification-settings",
  "wellness-notification-settings",
  "notificationSettings",
  "reminderSettings"
];

// 카멜케이스 <-> API 대문자 타입 매핑
const LOCAL_TYPE_MAP = {
  ddayRoutine: "DDAY_ROUTINE",
  skinCapture: "SKIN_CAPTURE",
  lifestyleRecord: "LIFESTYLE_RECORD",
  experimentAction: "EXPERIMENT_ACTION",
  waterIntake: "WATER_INTAKE",
  bedtimePreparation: "BEDTIME_PREPARATION",
  // 단어 변형 대응
  skinAnalysis: "SKIN_CAPTURE",
  routineReminder: "DDAY_ROUTINE",
  ddayAlert: "DDAY_ROUTINE",
};

function getEnabledReminderTypes() {
  if (typeof window === "undefined") {
    return new Set(Object.values(LOCAL_TYPE_MAP));
  }

  try {
    let settings = null;

    for (const key of STORAGE_KEYS) {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        settings = JSON.parse(raw);
        break;
      }
    }

    if (!settings || typeof settings !== "object") {
      return new Set(Object.values(LOCAL_TYPE_MAP));
    }

    const enabledSet = new Set();

    Object.entries(settings).forEach(([key, value]) => {
      if (Boolean(value)) {
        if (LOCAL_TYPE_MAP[key]) {
          enabledSet.add(LOCAL_TYPE_MAP[key]);
        }
        if (TYPE_TITLES[key]) {
          enabledSet.add(key);
        }
      }
    });

    return enabledSet.size > 0 ? enabledSet : new Set(Object.values(LOCAL_TYPE_MAP));
  } catch (error) {
    console.error("알림 설정 로드 실패:", error);
    return new Set(Object.values(LOCAL_TYPE_MAP));
  }
}

export default function TodayReminderModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchToday = async () => {
      try {
        setLoading(true);
        const res = await reminderApi.getTodayReminder();
        const enabledTypes = getEnabledReminderTypes();

        // MY 화면에서 토글이 켜져 있는(enabledTypes에 포함된) 알림 항목만 필터링
        const filteredItems = (res.data?.items ?? []).filter((item) => {
          if (!item?.type) return false;
          return enabledTypes.has(item.type);
        });

        setData({
          ...(res.data ?? {}),
          items: filteredItems,
        });
      } catch (err) {
        console.error("오늘 알림 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchToday();
  }, [isOpen]);

  if (!isOpen) return null;

  const items = data?.items ?? [];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(2px)",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 340,
          background: "#fff",
          borderRadius: 24,
          padding: "22px 20px",
          boxSizing: "border-box",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* 상단 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#F0EDFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={17} color="#6C5CE7" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>오늘의 알림</h2>
              <span style={{ fontSize: 11, color: "#888" }}>오늘 예정된 루틴 & 알림</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              border: "none",
              borderRadius: "50%",
              background: "#F5F5F7",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} color="#666" />
          </button>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#888", fontSize: 13 }}>
            알림을 불러오는 중...
          </div>
        )}

        {/* 활성화된 알림이 없을 때 */}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <CheckCircle2 size={36} color="#A8A8B3" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#444" }}>
              오늘 예정된 알림이 없어요
            </p>
            <span style={{ fontSize: 11, color: "#999", marginTop: 4, display: "block" }}>
              MY &gt; 알림 설정에서 알림을 켤 수 있어요.
            </span>
          </div>
        )}

        {/* 활성화된 알림 목록 */}
        {!loading && items.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxHeight: 280,
              overflowY: "auto",
            }}
          >
            {items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "#F9F9FB",
                  border: "1px solid #F0F0F3",
                }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: 13, color: "#222" }}>
                    {TYPE_TITLES[item.type] || item.title || item.type}
                  </strong>
                  <span style={{ fontSize: 11, color: "#888" }}>
                    {item.message || "설정된 시간에 맞춰 실천해 보세요."}
                  </span>
                </div>

                {item.reminderTime && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "#6C5CE7",
                      fontWeight: 600,
                      background: "#F0EDFF",
                      padding: "4px 8px",
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={12} />
                    <span>{item.reminderTime.substring(0, 5)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}