import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CalendarDays, ClipboardList, X } from "lucide-react";

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

  const [sleepHour, setSleepHour] = useState("7");
  const [sleepMinute, setSleepMinute] = useState("0");
  const [waterAmount, setWaterAmount] = useState("1.5");
  const [lateSnack, setLateSnack] = useState("없음");

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  const prevMonthDays = [27, 28, 29, 30, 31];

  const currentMonthDays = Array.from({ length: 31 }, (_, index) => index + 1);

  /*
    일정 불러오기
  */
  useEffect(() => {
    try {
      const savedSchedules = localStorage.getItem(SCHEDULE_STORAGE_KEY);

      setSchedules(savedSchedules ? JSON.parse(savedSchedules) : []);
    } catch {
      setSchedules([]);
    }
  }, []);

  /*
    날짜별 기록 불러오기
    + AI 오늘 촬영 결과를 오늘 날짜 기록에 반영
  */
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

          photoDataUrl: analysis.photoDataUrl ?? previousRecord.photoDataUrl ?? null,

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
      // 분석 데이터 오류 시 기존 기록 유지
    }

    setDailyRecords(records);
  }, []);

  const selectedDateKey = useMemo(() => {
    return `${currentYear}-${String(currentMonth).padStart(
      2,
      "0",
    )}-${String(selectedDate).padStart(2, "0")}`;
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

  const selectedRecord = dailyRecords[selectedDateKey] ?? null;

  const hasSkinRecord = Boolean(selectedRecord?.skinScore || selectedRecord?.photoDataUrl);

  const hasLifeLog = Array.isArray(selectedRecord?.lifeLog) && selectedRecord.lifeLog.length > 0;

  const hasAnyRecord = hasSkinRecord || hasLifeLog;

  const hasDailyRecord = (day) => {
    const key = `${currentYear}-${String(currentMonth).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;

    const record = dailyRecords[key];

    if (!record) return false;

    return Boolean(record.skinScore || record.photoDataUrl || record.lifeLog?.length);
  };

  const selectedSchedules = schedules.filter((schedule) => schedule.date === selectedDateKey);

  const hasSchedule = (day) => {
    const key = `${currentYear}-${String(currentMonth).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;

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

  /*
    생활 기록 모달 열기

    기존 생활 기록이 있으면 값 불러와서 수정 가능
  */
  const openLifeLogModal = () => {
    if (isFutureDate) return;

    const lifeLog = selectedRecord?.lifeLog ?? [];

    const sleep = lifeLog.find((item) => item.type === "sleep");

    const water = lifeLog.find((item) => item.type === "water");

    const snack = lifeLog.find((item) => item.type === "lateSnack");

    if (sleep) {
      setSleepHour(String(sleep.hour ?? 7));

      setSleepMinute(String(sleep.minute ?? 0));
    } else {
      setSleepHour("7");
      setSleepMinute("0");
    }

    if (water) {
      setWaterAmount(String(water.amount ?? 1.5));
    } else {
      setWaterAmount("1.5");
    }

    if (snack) {
      setLateSnack(snack.value ?? "없음");
    } else {
      setLateSnack("없음");
    }

    setIsLifeLogModalOpen(true);
  };

  /*
    생활 기록 저장
  */
  const handleSaveLifeLog = () => {
    const hour = Number(sleepHour);

    const minute = Number(sleepMinute);

    const water = Number(waterAmount);

    if (Number.isNaN(hour) || hour < 0 || hour > 24) {
      alert("수면 시간을 확인해주세요.");
      return;
    }

    if (Number.isNaN(minute) || minute < 0 || minute > 59) {
      alert("수면 분을 확인해주세요.");
      return;
    }

    if (Number.isNaN(water) || water < 0) {
      alert("수분 섭취량을 확인해주세요.");
      return;
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
        type: "water",
        icon: "💧",
        label: "수분 섭취",
        amount: water,
        value: `${water} L`,
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
  };

  return (
    <div
      style={{
        padding: "16px 20px 20px",
      }}
    >
      {/* ==============================
          달력
      ============================== */}

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
          <span
            style={{
              cursor: "pointer",

              color: "#999",
            }}
          >
            ‹
          </span>

          <span
            style={{
              fontSize: 15,

              fontWeight: 700,

              color: "#111",
            }}
          >
            2026년 8월
          </span>

          <span
            style={{
              cursor: "pointer",

              color: "#999",
            }}
          >
            ›
          </span>
        </div>

        {/* 요일 */}
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

        {/* 날짜 */}
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

      {/* ==============================
          일정 추가
      ============================== */}

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

        <div
          style={{
            display: "flex",

            gap: 8,
          }}
        >
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

      {/* ==============================
          날짜 제목
      ============================== */}

      <div
        style={{
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
          {selectedDateLabel}

          {isToday ? " · 오늘" : ""}
        </span>
      </div>

      {/* ==============================
          피부 기록
      ============================== */}

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
          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: 12,
            }}
          >
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

            <div
              style={{
                minWidth: 0,
              }}
            >
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

              <div
                style={{
                  fontSize: 12,

                  color: "#4CAF50",
                }}
              >
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

      {/* ==============================
          생활 기록
      ============================== */}

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
          {hasLifeLog ? "생활 기록 수정하기" : "+ 생활 기록 추가"}
        </button>
      )}

      {/* ==============================
          생활 기록 입력 모달
      ============================== */}

      {isLifeLogModalOpen && (
        <div
          onClick={() => setIsLifeLogModalOpen(false)}
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
            {/* 모달 헤더 */}
            <div
              style={{
                display: "flex",

                justifyContent: "space-between",

                alignItems: "center",

                marginBottom: 20,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: "0 0 3px",

                    fontSize: 17,

                    fontWeight: 700,

                    color: "#111",
                  }}
                >
                  생활 기록
                </h3>

                <span
                  style={{
                    fontSize: 10,

                    color: "#999",
                  }}
                >
                  {selectedDateLabel}
                </span>
              </div>

              <button
                type="button"
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

            {/* 수면 */}
            <div
              style={{
                marginBottom: 18,
              }}
            >
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

              <div
                style={{
                  display: "flex",

                  alignItems: "center",

                  gap: 7,
                }}
              >
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

                <span
                  style={{
                    fontSize: 12,

                    color: "#666",
                  }}
                >
                  시간
                </span>

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

                <span
                  style={{
                    fontSize: 12,

                    color: "#666",
                  }}
                >
                  분
                </span>
              </div>
            </div>

            {/* 물 */}
            <div
              style={{
                marginBottom: 18,
              }}
            >
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

              <div
                style={{
                  display: "flex",

                  alignItems: "center",

                  gap: 7,
                }}
              >
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

                <span
                  style={{
                    fontSize: 12,

                    color: "#666",
                  }}
                >
                  L
                </span>
              </div>
            </div>

            {/* 야식 */}
            <div
              style={{
                marginBottom: 22,
              }}
            >
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

            {/* 저장 */}
            <button
              type="button"
              onClick={handleSaveLifeLog}
              style={{
                width: "100%",

                padding: "13px 0",

                border: "none",

                borderRadius: 12,

                background: "#6C5CE7",

                color: "#fff",

                fontSize: 13,

                fontWeight: 600,

                cursor: "pointer",
              }}
            >
              기록 저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordCalendar;
