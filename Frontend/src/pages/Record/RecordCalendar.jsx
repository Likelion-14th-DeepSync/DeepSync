import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CalendarDays, ClipboardList, X, CloudSun } from "lucide-react";

import {
  getLifestyleRecord,
  createLifestyleRecord,
  updateLifestyleRecord,
} from "../../api/lifestyle";

import {
  getEnvironmentRecord,
  createEnvironmentRecord,
  updateEnvironmentRecord,
} from "../../api/environment";

const SCHEDULE_STORAGE_KEY = "wellness-calendar-schedules";
const DDAY_STORAGE_KEY = "wellness-dday-selected-schedule-id";
const DAILY_RECORD_STORAGE_KEY = "wellness-daily-records";
const TODAY_ANALYSIS_STORAGE_KEY = "wellness-today-skin-analysis";

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function RecordCalendar() {
  const navigate = useNavigate();

  const today = new Date();

  const currentYear = 2026;
  const currentMonth = 8;

  const isCurrentCalendarMonth =
    today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth;

  const initialSelectedDate = isCurrentCalendarMonth ? today.getDate() : 1;

  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);

  const [scheduleTitle, setScheduleTitle] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [dailyRecords, setDailyRecords] = useState({});

  const [isLifeLogModalOpen, setIsLifeLogModalOpen] = useState(false);
  const [isSavingLifeLog, setIsSavingLifeLog] = useState(false);

  const [sleepHour, setSleepHour] = useState("7");
  const [sleepMinute, setSleepMinute] = useState("0");
  const [bedtime, setBedtime] = useState("23:30");
  const [wakeUpTime, setWakeUpTime] = useState("06:30");
  const [waterAmount, setWaterAmount] = useState("1.5");
  const [lateSnack, setLateSnack] = useState("없음");

  const [environmentRecord, setEnvironmentRecord] = useState(null);
  const [isEnvironmentModalOpen, setIsEnvironmentModalOpen] = useState(false);
  const [isSavingEnvironment, setIsSavingEnvironment] = useState(false);

  const [uvIndex, setUvIndex] = useState("0");
  const [temperature, setTemperature] = useState("20");
  const [humidity, setHumidity] = useState("50");
  const [fineDust, setFineDust] = useState("0");

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
  const prevMonthDays = [27, 28, 29, 30, 31];
  const currentMonthDays = Array.from({ length: 31 }, (_, index) => index + 1);

  useEffect(() => {
    try {
      const savedSchedules = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      setSchedules(savedSchedules ? JSON.parse(savedSchedules) : []);
    } catch {
      setSchedules([]);
    }
  }, []);

  useEffect(() => {
    let records = {};

    try {
      const savedRecords = localStorage.getItem(DAILY_RECORD_STORAGE_KEY);
      records = savedRecords ? JSON.parse(savedRecords) : {};
    } catch {
      records = {};
    }

    try {
      const savedTodayAnalysis = localStorage.getItem(TODAY_ANALYSIS_STORAGE_KEY);

      if (savedTodayAnalysis) {
        const analysis = JSON.parse(savedTodayAnalysis);
        const todayKey = getLocalDateKey();
        const previousRecord = records[todayKey] ?? {};

        records[todayKey] = {
          ...previousRecord,
          date: todayKey,
          skinScore: analysis.score ?? previousRecord.skinScore ?? 78,
          change: analysis.change ?? previousRecord.change ?? "+4점",

          // photoDataUrl은 localStorage 용량 때문에 저장하지 않음
          photoDataUrl: null,

          imageId: analysis.imageId ?? previousRecord.imageId ?? null,

          capturedAt: analysis.capturedAt ?? previousRecord.capturedAt ?? new Date().toISOString(),

          stats: analysis.stats ??
            previousRecord.stats ?? [
              {
                label: "붉은기",
                value: "-6%",
                trend: "down",
              },
              {
                label: "트러블",
                value: "변화 없음",
                trend: "same",
              },
              {
                label: "피부톤 균일도",
                value: "+3%",
                trend: "up",
              },
            ],

          lifeLog: previousRecord.lifeLog ?? [],
        };

        localStorage.setItem(DAILY_RECORD_STORAGE_KEY, JSON.stringify(records));
      }
    } catch {
      // 기존 기록 유지
    }

    setDailyRecords(records);
  }, []);

  const selectedDateKey = useMemo(() => {
    return `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(selectedDate).padStart(
      2,
      "0",
    )}`;
  }, [selectedDate]);

  const selectedDateObject = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, selectedDate);
  }, [selectedDate]);

  const todayStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const isFutureDate = selectedDateObject.getTime() > todayStart.getTime();
  const isToday = selectedDateObject.getTime() === todayStart.getTime();

  useEffect(() => {
    const fetchEnvironmentRecord = async () => {
      if (isFutureDate) {
        setEnvironmentRecord(null);
        return;
      }

      try {
        const response = await getEnvironmentRecord(selectedDateKey);
        setEnvironmentRecord(response.data ?? null);
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("환경 기록 조회 실패:", error);
        }
        setEnvironmentRecord(null);
      }
    };

    fetchEnvironmentRecord();
  }, [selectedDateKey, isFutureDate]);

  const selectedRecord = dailyRecords[selectedDateKey] ?? null;

  const hasSkinRecord = Boolean(selectedRecord?.skinScore || selectedRecord?.photoDataUrl);

  const hasLifeLog = Array.isArray(selectedRecord?.lifeLog) && selectedRecord.lifeLog.length > 0;

  const hasDailyRecord = (day) => {
    const key = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(
      2,
      "0",
    )}`;

    const record = dailyRecords[key];

    if (!record) return false;

    return Boolean(record.skinScore || record.photoDataUrl || record.lifeLog?.length);
  };

  const selectedSchedules = schedules.filter((schedule) => schedule.date === selectedDateKey);

  const hasSchedule = (day) => {
    const key = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(
      2,
      "0",
    )}`;

    return schedules.some((schedule) => schedule.date === key);
  };

  const handleSaveSchedule = () => {
    const title = scheduleTitle.trim();

    if (!title) {
      alert("일정 이름을 입력해주세요.");
      return;
    }

    const newSchedule = {
      id: Date.now(),
      title,
      date: selectedDateKey,
      createdAt: new Date().toISOString(),
    };

    const updated = [...schedules, newSchedule];

    setSchedules(updated);
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updated));

    const selectedDday = localStorage.getItem(DDAY_STORAGE_KEY);

    if (!selectedDday) {
      localStorage.setItem(DDAY_STORAGE_KEY, String(newSchedule.id));
    }

    setScheduleTitle("");
  };

  const handleDeleteSchedule = (id) => {
    const updated = schedules.filter((schedule) => schedule.id !== id);

    setSchedules(updated);
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updated));

    const selectedDday = localStorage.getItem(DDAY_STORAGE_KEY);

    if (String(id) === selectedDday) {
      if (updated.length > 0) {
        localStorage.setItem(DDAY_STORAGE_KEY, String(updated[0].id));
      } else {
        localStorage.removeItem(DDAY_STORAGE_KEY);
      }
    }
  };

  const selectedDateLabel = `${currentMonth}월 ${selectedDate}일`;

  const handleDetailClick = () => {
    navigate("/record?tab=change");
  };

  const handleTodayCapture = () => {
    navigate("/ai?mode=capture&from=record");
  };

  const openLifeLogModal = async () => {
    if (isFutureDate) return;

    try {
      const response = await getLifestyleRecord(selectedDateKey);
      const data = response.data;

      if (data) {
        const totalMinutes = data.sleepDurationMinutes ?? 420;

        setSleepHour(String(Math.floor(totalMinutes / 60)));
        setSleepMinute(String(totalMinutes % 60));
        setBedtime(data.bedtime ?? "23:30");
        setWakeUpTime(data.wakeUpTime ?? "06:30");
        setWaterAmount(String((data.waterIntakeMl ?? 1500) / 1000));
        setLateSnack(data.lateNightMeal ? "먹음" : "없음");
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("생활 기록 조회 실패:", error);
      }

      const lifeLog = selectedRecord?.lifeLog ?? [];

      const sleep = lifeLog.find((item) => item.type === "sleep");
      const bedtimeItem = lifeLog.find((item) => item.type === "bedtime");
      const wakeItem = lifeLog.find((item) => item.type === "wakeUp");
      const water = lifeLog.find((item) => item.type === "water");
      const snack = lifeLog.find((item) => item.type === "lateSnack");

      setSleepHour(String(sleep?.hour ?? 7));
      setSleepMinute(String(sleep?.minute ?? 0));
      setBedtime(bedtimeItem?.value ?? "23:30");
      setWakeUpTime(wakeItem?.value ?? "06:30");
      setWaterAmount(String(water?.amount ?? 1.5));
      setLateSnack(snack?.value ?? "없음");
    }

    setIsLifeLogModalOpen(true);
  };

  const handleSaveLifeLog = async () => {
    const hour = Number(sleepHour);
    const minute = Number(sleepMinute);
    const waterLiter = Number(waterAmount);

    if (Number.isNaN(hour) || hour < 0 || hour > 24) {
      alert("수면 시간을 확인해주세요.");
      return;
    }

    if (Number.isNaN(minute) || minute < 0 || minute > 59) {
      alert("수면 분을 확인해주세요.");
      return;
    }

    if (Number.isNaN(waterLiter) || waterLiter < 0) {
      alert("수분 섭취량을 확인해주세요.");
      return;
    }

    if (!bedtime || !wakeUpTime) {
      alert("취침 시간과 기상 시간을 입력해주세요.");
      return;
    }

    const sleepDurationMinutes = hour * 60 + minute;
    const waterIntakeMl = Math.round(waterLiter * 1000);
    const lateNightMeal = lateSnack === "먹음";

    const normalizeTime = (time) => {
      if (!time) return null;

      return time.length === 5 ? `${time}:00` : time;
    };

    const payload = {
      recordDate: selectedDateKey,
      sleepDurationMinutes,
      bedtime: normalizeTime(bedtime),
      wakeUpTime: normalizeTime(wakeUpTime),
      lateNightMeal,
      waterIntakeMl,
      sourceType: "MANUAL",
    };

    console.log("🔥 생활 기록 저장 payload:", payload);

    try {
      setIsSavingLifeLog(true);

      let existingRecord = null;

      try {
        const getResponse = await getLifestyleRecord(selectedDateKey);

        existingRecord = getResponse?.data ?? null;

        console.log("✅ 기존 생활 기록 조회:", existingRecord);
      } catch (getError) {
        if (getError.response?.status !== 404) {
          throw getError;
        }
      }

      if (existingRecord) {
        console.log("🔥 생활 기록 PATCH 시작");

        const response = await updateLifestyleRecord(selectedDateKey, payload);

        console.log("✅ 생활 기록 수정 성공:", response);
      } else {
        console.log("🔥 생활 기록 POST 시작");

        const response = await createLifestyleRecord(payload);

        console.log("✅ 생활 기록 생성 성공:", response);
      }

      const lifeLog = [
        {
          type: "sleep",
          icon: "🌙",
          label: "수면",
          hour,
          minute,
          value: `${hour}시간 ${minute}분`,
        },
        {
          type: "bedtime",
          icon: "🛏️",
          label: "취침",
          value: bedtime,
        },
        {
          type: "wakeUp",
          icon: "⏰",
          label: "기상",
          value: wakeUpTime,
        },
        {
          type: "water",
          icon: "💧",
          label: "수분 섭취",
          amount: waterLiter,
          value: `${waterLiter} L`,
        },
        {
          type: "lateSnack",
          icon: "🍜",
          label: "야식",
          value: lateSnack,
        },
      ];

      const previousRecord = dailyRecords[selectedDateKey] ?? {
        date: selectedDateKey,
      };

      const updatedRecord = {
        ...previousRecord,
        date: selectedDateKey,
        lifeLog,
      };

      const updatedRecords = {
        ...dailyRecords,
        [selectedDateKey]: updatedRecord,
      };

      setDailyRecords(updatedRecords);

      localStorage.setItem(DAILY_RECORD_STORAGE_KEY, JSON.stringify(updatedRecords));

      setIsLifeLogModalOpen(false);

      alert("생활 기록이 저장되었습니다.");
    } catch (error) {
      console.error("❌ 생활 기록 저장 실패:", error);

      console.error("❌ status:", error.response?.status);

      console.error("❌ server data:", error.response?.data);

      console.error("❌ request payload:", payload);

      const message =
        error.response?.data?.error?.message ??
        error.response?.data?.message ??
        error.message ??
        "생활 기록 저장에 실패했습니다.";

      alert(message);
    } finally {
      setIsSavingLifeLog(false);
    }
  };

  const openEnvironmentModal = async () => {
    if (isFutureDate) return;

    try {
      const response = await getEnvironmentRecord(selectedDateKey);
      const data = response.data;

      setEnvironmentRecord(data ?? null);
      setUvIndex(String(data?.uvIndex ?? 0));
      setTemperature(String(data?.temperature ?? 20));
      setHumidity(String(data?.humidity ?? 50));
      setFineDust(String(data?.fineDust ?? 0));
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("환경 기록 조회 실패:", error);
      }

      setEnvironmentRecord(null);
      setUvIndex("0");
      setTemperature("20");
      setHumidity("50");
      setFineDust("0");
    }

    setIsEnvironmentModalOpen(true);
  };

  const handleSaveEnvironment = async () => {
    const parsedUv = Number(uvIndex);
    const parsedTemperature = Number(temperature);
    const parsedHumidity = Number(humidity);
    const parsedFineDust = Number(fineDust);

    if (Number.isNaN(parsedUv) || parsedUv < 0 || parsedUv > 20) {
      alert("UV 지수는 0~20 사이로 입력해주세요.");
      return;
    }

    if (Number.isNaN(parsedTemperature) || parsedTemperature < -60 || parsedTemperature > 60) {
      alert("온도는 -60~60℃ 사이로 입력해주세요.");
      return;
    }

    if (Number.isNaN(parsedHumidity) || parsedHumidity < 0 || parsedHumidity > 100) {
      alert("습도는 0~100% 사이로 입력해주세요.");
      return;
    }

    if (Number.isNaN(parsedFineDust) || parsedFineDust < 0) {
      alert("미세먼지 값을 확인해주세요.");
      return;
    }

    const payload = {
      recordDate: selectedDateKey,
      uvIndex: parsedUv,
      temperature: parsedTemperature,
      humidity: parsedHumidity,
      fineDust: parsedFineDust,
      sourceType: "MANUAL",
    };

    try {
      setIsSavingEnvironment(true);

      let savedData = null;

      try {
        await getEnvironmentRecord(selectedDateKey);

        const response = await updateEnvironmentRecord(selectedDateKey, payload);
        savedData = response.data ?? payload;
        console.log("환경 기록 수정 성공:", response);
      } catch (error) {
        if (error.response?.status === 404) {
          const response = await createEnvironmentRecord(payload);
          savedData = response.data ?? payload;
          console.log("환경 기록 생성 성공:", response);
        } else {
          throw error;
        }
      }

      setEnvironmentRecord(savedData);
      setIsEnvironmentModalOpen(false);

      alert("환경 기록이 저장되었습니다.");
    } catch (error) {
      console.error("환경 기록 저장 실패:", error);
      alert(error.response?.data?.error?.message ?? "환경 기록 저장에 실패했습니다.");
    } finally {
      setIsSavingEnvironment(false);
    }
  };

  return (
    <div
      style={{
        padding: "16px 20px 20px",
      }}
    >
      {/* 달력 */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span style={{ cursor: "pointer", color: "#999" }}>‹</span>

          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111",
            }}
          >
            2026년 8월
          </span>

          <span style={{ cursor: "pointer", color: "#999" }}>›</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            textAlign: "center",
            fontSize: 12,
            color: "#999",
            marginBottom: 8,
          }}
        >
          {weekDays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            textAlign: "center",
            rowGap: 10,
          }}
        >
          {prevMonthDays.map((day) => (
            <div
              key={`prev-${day}`}
              style={{
                fontSize: 13,
                color: "#ccc",
              }}
            >
              {day}
            </div>
          ))}

          {currentMonthDays.map((day) => {
            const selected = selectedDate === day;
            const scheduleExists = hasSchedule(day);
            const recordExists = hasDailyRecord(day);

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(day)}
                style={{
                  width: 30,
                  height: 30,
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  borderRadius: "50%",
                  background: selected ? "#6C5CE7" : "transparent",
                  color: selected ? "#fff" : "#333",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {day}

                {scheduleExists && !selected && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -5,
                      left: 10,
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "#6C5CE7",
                    }}
                  />
                )}

                {recordExists && !selected && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -5,
                      right: 10,
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "#4CAF50",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 일정 추가 */}
      <div
        style={{
          padding: 16,
          marginBottom: 18,
          background: "#fff",
          borderRadius: 16,
        }}
      >
        <div
          style={{
            marginBottom: 4,
            fontSize: 14,
            fontWeight: 700,
            color: "#111",
          }}
        >
          일정 추가
        </div>

        <div
          style={{
            marginBottom: 12,
            fontSize: 11,
            color: "#999",
          }}
        >
          {currentYear}년 {currentMonth}월 {selectedDate}일
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={scheduleTitle}
            placeholder="예: 면접, 발표, 여행"
            onChange={(e) => setScheduleTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveSchedule();
              }
            }}
            style={{
              minWidth: 0,
              flex: 1,
              padding: "10px 12px",
              boxSizing: "border-box",
              border: "1px solid #E5E5EA",
              borderRadius: 10,
              outline: "none",
              fontSize: 12,
            }}
          />

          <button
            type="button"
            onClick={handleSaveSchedule}
            style={{
              padding: "0 15px",
              border: "none",
              borderRadius: 10,
              background: "#6C5CE7",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            추가
          </button>
        </div>

        {selectedSchedules.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 7,
              marginTop: 13,
            }}
          >
            {selectedSchedules.map((schedule) => (
              <div
                key={schedule.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 10px",
                  borderRadius: 10,
                  background: "#F7F6FF",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#444",
                  }}
                >
                  📅 {schedule.title}
                </span>

                <button
                  type="button"
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#aaa",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 10 }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#111",
          }}
        >
          {selectedDateLabel}
          {isToday ? " · 오늘" : ""}
        </span>
      </div>

      {/* 피부 기록 */}
      <div
        style={{
          marginBottom: 10,
          fontSize: 15,
          fontWeight: 700,
          color: "#111",
        }}
      >
        피부 기록
      </div>

      {hasSkinRecord ? (
        <div
          style={{
            padding: 16,
            marginBottom: 20,
            background: "#fff",
            borderRadius: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {selectedRecord.photoDataUrl ? (
              <img
                src={selectedRecord.photoDataUrl}
                alt="피부 기록"
                style={{
                  width: 56,
                  height: 56,
                  flex: "0 0 56px",
                  objectFit: "cover",
                  borderRadius: 12,
                }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  flex: "0 0 56px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  background: "#F0EDFF",
                  color: "#6C5CE7",
                }}
              >
                <Camera size={22} />
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#111",
                  }}
                >
                  {selectedRecord.skinScore}점
                </span>

                <span
                  style={{
                    fontSize: 13,
                    color: "#999",
                  }}
                >
                  {" "}
                  / 100
                </span>
              </div>

              <div style={{ fontSize: 12, color: "#4CAF50" }}>
                어제보다 {selectedRecord.change} ↑
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                {selectedRecord.stats?.map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      fontSize: 10,
                      color: "#999",
                    }}
                  >
                    {stat.label}{" "}
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          stat.trend === "down"
                            ? "#4CAF50"
                            : stat.trend === "up"
                              ? "#6C5CE7"
                              : "#999",
                      }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDetailClick}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 14,
              padding: 0,
              border: "none",
              background: "transparent",
              color: "#6C5CE7",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <span>상세 보기</span>
            <span>›</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: "27px 20px",
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            background: "#fff",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              background: "#F0EDFF",
              color: "#6C5CE7",
            }}
          >
            {isFutureDate ? <CalendarDays size={22} /> : <Camera size={22} />}
          </div>

          <strong
            style={{
              marginBottom: 5,
              fontSize: 14,
              color: "#222",
            }}
          >
            {isFutureDate
              ? "아직 기록이 없는 날짜예요"
              : isToday
                ? "오늘의 피부 기록이 아직 없어요"
                : "이날의 피부 기록이 없어요"}
          </strong>

          <span
            style={{
              fontSize: 11,
              lineHeight: 1.55,
              color: "#999",
            }}
          >
            {isFutureDate
              ? "해당 날짜가 되면 피부 기록을 확인할 수 있어요."
              : isToday
                ? "AI 피부 촬영을 완료하면 오늘의 피부 기록이 저장돼요."
                : "이 날짜에는 저장된 피부 사진이 없습니다."}
          </span>

          {isToday && (
            <button
              type="button"
              onClick={handleTodayCapture}
              style={{
                marginTop: 14,
                padding: "10px 16px",
                border: "none",
                borderRadius: 10,
                background: "#6C5CE7",
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              피부 촬영하기
            </button>
          )}
        </div>
      )}

      {/* 생활 기록 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#111",
          }}
        >
          생활 기록
        </span>

        {!isFutureDate && hasLifeLog && (
          <button
            type="button"
            onClick={openLifeLogModal}
            style={{
              border: "none",
              background: "transparent",
              color: "#6C5CE7",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            수정
          </button>
        )}
      </div>

      {hasLifeLog ? (
        <div
          style={{
            padding: "4px 16px",
            marginBottom: 16,
            background: "#fff",
            borderRadius: 16,
          }}
        >
          {selectedRecord.lifeLog.map((item, index) => (
            <div
              key={item.type ?? item.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "13px 0",
                borderBottom:
                  index !== selectedRecord.lifeLog.length - 1 ? "1px solid #F0F0F0" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  color: "#333",
                  fontSize: 14,
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </div>

              <div
                style={{
                  color: "#666",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "25px 18px",
            marginBottom: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            background: "#fff",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 13,
              background: "#F0EDFF",
              color: "#6C5CE7",
            }}
          >
            <ClipboardList size={21} />
          </div>

          <strong
            style={{
              marginBottom: 4,
              fontSize: 13,
              color: "#222",
            }}
          >
            {isFutureDate ? "아직 생활 기록을 입력할 수 없어요" : "생활 기록이 아직 없어요"}
          </strong>

          <span
            style={{
              fontSize: 10,
              lineHeight: 1.5,
              color: "#999",
            }}
          >
            {isFutureDate
              ? "해당 날짜가 되면 생활 습관을 기록할 수 있어요."
              : "수면, 수분 섭취, 야식 여부를 기록해보세요."}
          </span>
        </div>
      )}

      {!isFutureDate && (
        <button
          type="button"
          onClick={openLifeLogModal}
          style={{
            width: "100%",
            marginBottom: 20,
            padding: "12px 0",
            border: "1px solid #E7E4FF",
            borderRadius: 12,
            background: "#F7F6FF",
            color: "#6C5CE7",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {hasLifeLog ? "생활 기록 수정하기" : "+ 생활 기록 추가"}
        </button>
      )}

      {/* 환경 기록 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#111",
          }}
        >
          환경 기록
        </span>

        {!isFutureDate && environmentRecord && (
          <button
            type="button"
            onClick={openEnvironmentModal}
            style={{
              border: "none",
              background: "transparent",
              color: "#6C5CE7",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            수정
          </button>
        )}
      </div>

      {environmentRecord ? (
        <div
          style={{
            padding: "4px 16px",
            marginBottom: 16,
            background: "#fff",
            borderRadius: 16,
          }}
        >
          {[
            ["☀️", "UV 지수", environmentRecord.uvIndex],
            ["🌡️", "온도", `${environmentRecord.temperature}℃`],
            ["💧", "습도", `${environmentRecord.humidity}%`],
            ["🌫️", "미세먼지", environmentRecord.fineDust],
          ].map(([icon, label, value], index, items) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "13px 0",
                borderBottom: index !== items.length - 1 ? "1px solid #F0F0F0" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  color: "#333",
                  fontSize: 14,
                }}
              >
                <span>{icon}</span>
                {label}
              </div>

              <div
                style={{
                  color: "#666",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "25px 18px",
            marginBottom: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            background: "#fff",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 13,
              background: "#F0EDFF",
              color: "#6C5CE7",
            }}
          >
            <CloudSun size={21} />
          </div>

          <strong
            style={{
              marginBottom: 4,
              fontSize: 13,
              color: "#222",
            }}
          >
            {isFutureDate ? "아직 환경 기록을 입력할 수 없어요" : "환경 기록이 아직 없어요"}
          </strong>

          <span
            style={{
              fontSize: 10,
              lineHeight: 1.5,
              color: "#999",
            }}
          >
            {isFutureDate
              ? "해당 날짜가 되면 환경 데이터를 기록할 수 있어요."
              : "UV, 온도, 습도, 미세먼지를 기록해보세요."}
          </span>
        </div>
      )}

      {!isFutureDate && (
        <button
          type="button"
          onClick={openEnvironmentModal}
          style={{
            width: "100%",
            marginBottom: 18,
            padding: "12px 0",
            border: "1px solid #E7E4FF",
            borderRadius: 12,
            background: "#F7F6FF",
            color: "#6C5CE7",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {environmentRecord ? "환경 기록 수정하기" : "+ 환경 기록 추가"}
        </button>
      )}

      {/* 생활 기록 모달 */}
      {isLifeLogModalOpen && (
        <div
          onClick={() => !isSavingLifeLog && setIsLifeLogModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(0, 0, 0, 0.38)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 350,
              maxHeight: "88vh",
              overflowY: "auto",
              padding: 20,
              boxSizing: "border-box",
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 3px", fontSize: 17, fontWeight: 700, color: "#111" }}>
                  생활 기록
                </h3>
                <span style={{ fontSize: 10, color: "#999" }}>{selectedDateLabel}</span>
              </div>

              <button
                type="button"
                disabled={isSavingLifeLog}
                onClick={() => setIsLifeLogModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  borderRadius: "50%",
                  background: "#F5F5F7",
                  color: "#555",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                🌙 수면 시간
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={sleepHour}
                  onChange={(e) => setSleepHour(e.target.value)}
                  style={{
                    width: 75,
                    padding: "10px",
                    boxSizing: "border-box",
                    border: "1px solid #E5E5EA",
                    borderRadius: 10,
                    outline: "none",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                />
                <span style={{ fontSize: 12, color: "#666" }}>시간</span>

                <input
                  type="number"
                  min="0"
                  max="59"
                  value={sleepMinute}
                  onChange={(e) => setSleepMinute(e.target.value)}
                  style={{
                    width: 75,
                    padding: "10px",
                    boxSizing: "border-box",
                    border: "1px solid #E5E5EA",
                    borderRadius: 10,
                    outline: "none",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                />
                <span style={{ fontSize: 12, color: "#666" }}>분</span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  🛏️ 취침 시간
                </label>

                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    boxSizing: "border-box",
                    border: "1px solid #E5E5EA",
                    borderRadius: 10,
                    outline: "none",
                    fontSize: 12,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  ⏰ 기상 시간
                </label>

                <input
                  type="time"
                  value={wakeUpTime}
                  onChange={(e) => setWakeUpTime(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    boxSizing: "border-box",
                    border: "1px solid #E5E5EA",
                    borderRadius: 10,
                    outline: "none",
                    fontSize: 12,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                💧 수분 섭취
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={waterAmount}
                  onChange={(e) => setWaterAmount(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    boxSizing: "border-box",
                    border: "1px solid #E5E5EA",
                    borderRadius: 10,
                    outline: "none",
                    fontSize: 13,
                  }}
                />
                <span style={{ fontSize: 12, color: "#666" }}>L</span>
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                🍜 야식
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 8,
                }}
              >
                {["없음", "먹음"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLateSnack(option)}
                    style={{
                      padding: "10px",
                      border: lateSnack === option ? "1.5px solid #6C5CE7" : "1px solid #E5E5EA",
                      borderRadius: 10,
                      background: lateSnack === option ? "#F0EDFF" : "#fff",
                      color: lateSnack === option ? "#6C5CE7" : "#555",
                      fontSize: 12,
                      fontWeight: lateSnack === option ? 600 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveLifeLog}
              disabled={isSavingLifeLog}
              style={{
                width: "100%",
                padding: "13px 0",
                border: "none",
                borderRadius: 12,
                background: "#6C5CE7",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: isSavingLifeLog ? "default" : "pointer",
                opacity: isSavingLifeLog ? 0.65 : 1,
              }}
            >
              {isSavingLifeLog ? "저장 중..." : "기록 저장"}
            </button>
          </div>
        </div>
      )}

      {/* 환경 기록 모달 */}
      {isEnvironmentModalOpen && (
        <div
          onClick={() => !isSavingEnvironment && setIsEnvironmentModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(0, 0, 0, 0.38)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 350,
              padding: 20,
              boxSizing: "border-box",
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 3px", fontSize: 17, fontWeight: 700, color: "#111" }}>
                  환경 기록
                </h3>
                <span style={{ fontSize: 10, color: "#999" }}>{selectedDateLabel}</span>
              </div>

              <button
                type="button"
                disabled={isSavingEnvironment}
                onClick={() => setIsEnvironmentModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  borderRadius: "50%",
                  background: "#F5F5F7",
                  color: "#555",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {[
              {
                label: "☀️ UV 지수",
                value: uvIndex,
                setter: setUvIndex,
                min: 0,
                max: 20,
                step: 1,
                suffix: "",
              },
              {
                label: "🌡️ 온도",
                value: temperature,
                setter: setTemperature,
                min: -60,
                max: 60,
                step: 0.1,
                suffix: "℃",
              },
              {
                label: "💧 습도",
                value: humidity,
                setter: setHumidity,
                min: 0,
                max: 100,
                step: 1,
                suffix: "%",
              },
              {
                label: "🌫️ 미세먼지",
                value: fineDust,
                setter: setFineDust,
                min: 0,
                step: 1,
                suffix: "",
              },
            ].map((field) => (
              <div key={field.label} style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  {field.label}
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      boxSizing: "border-box",
                      border: "1px solid #E5E5EA",
                      borderRadius: 10,
                      outline: "none",
                      fontSize: 13,
                    }}
                  />

                  {field.suffix && (
                    <span style={{ fontSize: 12, color: "#666" }}>{field.suffix}</span>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleSaveEnvironment}
              disabled={isSavingEnvironment}
              style={{
                width: "100%",
                marginTop: 4,
                padding: "13px 0",
                border: "none",
                borderRadius: 12,
                background: "#6C5CE7",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: isSavingEnvironment ? "default" : "pointer",
                opacity: isSavingEnvironment ? 0.65 : 1,
              }}
            >
              {isSavingEnvironment ? "저장 중..." : "환경 기록 저장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordCalendar;
