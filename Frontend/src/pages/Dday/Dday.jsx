import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import BottomNav from "../../components/BottomNav";
import "./Dday.css";

const WEEK_DAYS = [
  { label: "월", done: true },
  { label: "화", done: true },
  { label: "수", done: true },
  { label: "목", done: true },
  { label: "금", done: false },
  { label: "토", done: false },
  { label: "일", done: false },
];

const PLAN_ITEMS = [
  {
    title: "이번 주 집중 포인트",
    sub: "수면 시간 확보와 자외선 차단을 우선으로 관리하세요.",
  },
  {
    title: "추천 습관 유지",
    sub: "물 1.5L 마시기, 야식 줄이기 습관을 계속 유지하세요.",
  },
  {
    title: "다음 실험 제안",
    sub: '다음 7일은 "야식 줄이기" 실험을 추천해요.',
  },
];

export default function DDayScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeNav =
    location.pathname === "/my"
      ? "my"
      : location.pathname === "/home"
        ? "home"
        : "dday";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const defaultTargetDate = new Date(today);
  defaultTargetDate.setDate(today.getDate() + 14);

  const [targetDate, setTargetDate] = useState(defaultTargetDate);

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (targetDate - today) / (1000 * 60 * 60 * 24)
    )
  );

  const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  const formattedTargetDate =
    `${targetDate.getFullYear()}.` +
    `${String(targetDate.getMonth() + 1).padStart(2, "0")}.` +
    `${String(targetDate.getDate()).padStart(2, "0")} ` +
    `(${weekdayLabels[targetDate.getDay()]})`;

  const handleDateChange = (event) => {
    const selected = new Date(event.target.value);
    selected.setHours(0, 0, 0, 0);
    setTargetDate(selected);
  };

  return (
    <div className="dday-page">
      <div className="dday-phone">
        {/* Content */}
        <div className="dday-content">
          <div className="dday-title">
            D-Day
          </div>

          {/* Hero card */}
          <div className="hero-card">
            <div className="hero-header">
              <div>
                <span className="hero-badge">
                  면접
                </span>

                <div className="hero-subtitle">
                  면접까지
                </div>
              </div>

              <label className="calendar-button">
                <Calendar size={16} color="#fff" />

                <input
                  type="date"
                  value={targetDate
                    .toISOString()
                    .slice(0, 10)}
                  onChange={handleDateChange}
                />
              </label>
            </div>

            <div className="dday-number">
              D - {daysLeft}
            </div>

            <div className="target-date">
              {formattedTargetDate}
            </div>

            <div className="goal-bar">
              <div className="goal-text">
                <span className="goal-dot" />
                목표: 붉은기 완화
              </div>

              <button className="edit-button">
                수정
              </button>
            </div>
          </div>

          {/* Goal status card */}
          <div className="content-card goal-status-card">
            <div className="section-title goal-title">
              목표 현황

              <span className="info-icon">
                i
              </span>
            </div>

            <div className="score-row">
              <div>
                <div className="score-label">
                  현재 피부 점수
                </div>

                <div className="score-value">
                  72점
                </div>
              </div>

              <div className="score-arrow">
                →
              </div>

              <div className="score-target">
                <div className="score-label">
                  목표 피부 점수
                </div>

                <div className="score-value purple">
                  82점
                </div>
              </div>
            </div>

            <div className="progress-text">
              목표 달성까지 10일 남았어요
            </div>

            <div className="progress-track">
              <div className="progress-fill progress-62" />
            </div>
          </div>

          {/* Experiment card */}
          <div className="content-card experiment-card">
            <div className="experiment-header">
              <div className="section-title">
                진행 중 생활 실험
              </div>

              <div className="detail-button">
                상세 보기
                <ChevronRight size={12} />
              </div>
            </div>

            <div className="experiment-name">
              <Clock
                size={14}
                color="#6C5CE7"
              />
              7시간 이상 수면
            </div>

            <div className="experiment-info">
              <span>Day 4 / 7</span>
              <span className="experiment-rate">
                실천율 75%
              </span>
            </div>

            <div className="progress-track experiment-progress">
              <div className="progress-fill progress-75" />
            </div>

            <div className="week-days">
              {WEEK_DAYS.map((day) => (
                <div
                  key={day.label}
                  className="week-day"
                >
                  <div
                    className={
                      day.done
                        ? "day-circle done"
                        : "day-circle"
                    }
                  >
                    {day.done ? "✓" : day.label}
                  </div>

                  <div className="day-label">
                    {day.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plan card */}
          <div className="content-card plan-card">
            <div className="section-title plan-title">
              D-Day 관리 계획
            </div>

            {PLAN_ITEMS.map((item, idx) => (
              <div
                key={item.title}
                className={`plan-item ${
                  idx !== 0 ? "has-border" : ""
                }`}
              >
                <span className="plan-dot" />

                <div className="plan-content">
                  <div className="plan-item-title">
                    {item.title}
                  </div>

                  <div className="plan-item-sub">
                    {item.sub}
                  </div>
                </div>

                <ChevronRight
                  size={14}
                  color="#A5A5A5"
                  className="plan-arrow"
                />
              </div>
            ))}
          </div>
        </div>

        <BottomNav
          activeNav={activeNav}
          onChange={(key) => {
            if (key === "home") {
              navigate("/home");
              return;
            }

            if (key === "dday") {
              navigate("/dday");
              return;
            }

            if (key === "my") {
              navigate("/my");
            }
          }}
        />
      </div>
    </div>
  );
}