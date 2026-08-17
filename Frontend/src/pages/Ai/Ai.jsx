import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import "./Ai.css";

/* -------------------------------------------------------------------- */
/*  Inline icons (no icon package dependency)                           */
/* -------------------------------------------------------------------- */

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 5l7 7-7 7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronLeft = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M15 5l-7 7 7 7"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CameraIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5H8l1.2-1.8A1.5 1.5 0 0 1 10.45 4.5h3.1a1.5 1.5 0 0 1 1.25.7L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 12c0-4.4 3.8-8 8.5-8s8.5 3.6 8.5 8-3.8 8-8.5 8c-1 0-1.96-.15-2.85-.44L5 21l1.3-3.9C4.85 15.7 4 13.9 4 12Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="M12 2.5v2.2M12 19.3v2.2M4.2 12H2M22 12h-2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 20V10M11 20V4M18 20v-7"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="M4 9.5h16M8 3.5v3M16 3.5v3"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3.5c.3 0 .57.2.65.49l.98 3.3a3.2 3.2 0 0 0 2.18 2.18l3.3.98a.68.68 0 0 1 0 1.3l-3.3.98a3.2 3.2 0 0 0-2.18 2.18l-.98 3.3a.68.68 0 0 1-1.3 0l-.98-3.3a3.2 3.2 0 0 0-2.18-2.18l-3.3-.98a.68.68 0 0 1 0-1.3l3.3-.98a3.2 3.2 0 0 0 2.18-2.18l.98-3.3c.08-.29.35-.49.65-.49Z"
      fill="currentColor"
    />
  </svg>
);

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="5" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="19" cy="12" r="1.6" fill="currentColor" />
  </svg>
);

const BotAvatar = () => (
  <span className="ai-chat__avatar">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="7" width="16" height="12" rx="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7V4M9 4h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="9" cy="13" r="1.2" fill="currentColor" />
      <circle cx="15" cy="13" r="1.2" fill="currentColor" />
    </svg>
  </span>
);

const ImagePickIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="8.3" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="M4 16.5l4.8-4.8a1.5 1.5 0 0 1 2.1 0l2.1 2.1M14 15l1.6-1.6a1.5 1.5 0 0 1 2.1 0L20.5 16"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CameraPickIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5H8l1.2-1.8A1.5 1.5 0 0 1 10.45 4.5h3.1a1.5 1.5 0 0 1 1.25.7L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 19V6M6 11l6-6 6 6"
      stroke="white"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SwitchCameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M9 12.2a3 3 0 0 1 4.8-1.3M15 11.8a3 3 0 0 1-4.8 1.3"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M13 9.5l1.2 1.3M11 14.5l-1.2-1.3"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/* -------------------------------------------------------------------- */
/*  Static content                                                      */
/* -------------------------------------------------------------------- */

const QUICK_QUESTIONS = [
  {
    key: "score",
    label: "왜 피부점수가 떨어졌어?",
    Icon: MoonIcon,
    tone: "moon",
  },
  {
    key: "routine",
    label: "오늘 루틴 추천해줘",
    Icon: SunIcon,
    tone: "sun",
  },
  {
    key: "week",
    label: "7일 실험 결과 알려줘",
    Icon: ChartIcon,
    tone: "chart",
  },
  {
    key: "dday",
    label: "D-Day 관리 어떻게 해?",
    Icon: CalendarIcon,
    tone: "calendar",
  },
  {
    key: "summary",
    label: "피부 변화 요약해줘",
    Icon: SparkleIcon,
    tone: "sparkle",
  },
];

const SUGGESTED = ["오늘 피부 왜 안좋아?", "오늘 루틴 추천", "7일 실험 결과"];

const WELCOME =
  "안녕하세요!\nWellness Care AI입니다.\n내 피부 기록을 분석해서 궁금한 점을 알려드릴게요 😊";

function getAiReply(question) {
  if (question.includes("안좋아") || question.includes("점수")) {
    return "최근 기록을 분석해보니,\n🌙 수면시간이 5시간으로 부족했어요.\n☀️ 자외선 지수가 매우 높았어요.\n🌭 야식 기록이 있었어요.\n이 요인들이 복합적으로 작용하여 피부점수가 하락한 것으로 보여요.";
  }

  if (question.includes("루틴")) {
    return "오늘은 수분 진정 위주의 루틴을 추천해요.\n1) 저자극 클렌저로 세안\n2) 진정 토너 2회 레이어링\n3) 세라마이드 크림으로 마무리\n자외선 지수가 높으니 외출 전 선크림도 꼭 발라주세요.";
  }

  if (question.includes("7일") || question.includes("실험")) {
    return "지난 7일간 피부점수는 평균 3.2점 상승했어요.\n특히 수분 점수의 개선폭이 가장 컸고, 유분 밸런스는 큰 변화가 없었어요.";
  }

  return "조금 더 자세히 알려주시면 기록을 바탕으로 정확히 분석해드릴게요!";
}

function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${hh}:${mm}`;
}

let msgId = 0;

const nextId = () => `m${++msgId}`;

/* -------------------------------------------------------------------- */
/*  Menu                                                                 */
/* -------------------------------------------------------------------- */

function AiMenu({ onOpenCapture, onOpenChat }) {
  return (
    <div className="ai-menu">
      <header className="ai-menu__header">
        <h1 className="ai-menu__brand">Wellness Care AI</h1>
      </header>

      <div className="ai-menu__greeting">
        <p className="ai-menu__hello">
          안녕하세요 <span className="ai-menu__wave">👋</span>
        </p>

        <p className="ai-menu__subtitle">무엇을 도와드릴까요?</p>
      </div>

      <section className="ai-menu__actions">
        <button type="button" className="ai-card ai-card--action" onClick={onOpenCapture}>
          <span className="ai-card__icon ai-card__icon--camera">
            <CameraIcon />
          </span>

          <span className="ai-card__text">
            <span className="ai-card__title">피부 분석하기</span>

            <span className="ai-card__desc">현재 피부 상태를 사진으로 분석해요</span>
          </span>

          <span className="ai-card__chevron">
            <ChevronRight />
          </span>
        </button>

        <button type="button" className="ai-card ai-card--action" onClick={() => onOpenChat()}>
          <span className="ai-card__icon ai-card__icon--chat">
            <ChatIcon />
          </span>

          <span className="ai-card__text">
            <span className="ai-card__title">AI 상담 시작</span>

            <span className="ai-card__desc">내 피부 기록을 기반으로 상담해요</span>
          </span>

          <span className="ai-card__chevron">
            <ChevronRight />
          </span>
        </button>
      </section>

      <section className="ai-menu__quick">
        <h2 className="ai-menu__quick-title">빠른 질문</h2>

        <div className="ai-menu__quick-list">
          {QUICK_QUESTIONS.map(({ key, label, Icon, tone }) => (
            <button
              key={key}
              type="button"
              className="ai-card ai-card--quick"
              onClick={() => onOpenChat(label)}
            >
              <span className={`ai-card__icon ai-card__icon--${tone}`}>
                <Icon />
              </span>

              <span className="ai-card__title ai-card__title--quick">{label}</span>

              <span className="ai-card__chevron">
                <ChevronRight />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  Chat                                                                 */
/* -------------------------------------------------------------------- */

function AiChat({ onBack, initialQuestion }) {
  const [messages, setMessages] = useState([]);

  const [draft, setDraft] = useState("");

  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef(null);
  const sentInitial = useRef(false);

  const sendMessage = (text) => {
    const trimmed = text.trim();

    if (!trimmed) return;

    const userMsg = {
      id: nextId(),
      role: "user",
      text: trimmed,
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    setDraft("");
    setIsTyping(true);

    window.setTimeout(() => {
      const botMsg = {
        id: nextId(),
        role: "bot",
        text: getAiReply(trimmed),
        time: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);

      setIsTyping(false);
    }, 900);
  };

  useEffect(() => {
    if (initialQuestion && !sentInitial.current) {
      sentInitial.current = true;
      sendMessage(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(draft);
  };

  return (
    <div className="ai-chat">
      <header className="ai-chat__header">
        <button type="button" className="ai-chat__icon-btn" onClick={onBack} aria-label="뒤로가기">
          <ChevronLeft />
        </button>

        <h1 className="ai-chat__title">AI 상담</h1>

        <button type="button" className="ai-chat__icon-btn" aria-label="더보기">
          <MoreIcon />
        </button>
      </header>

      <div className="ai-chat__body" ref={listRef}>
        <div className="ai-chat__row ai-chat__row--bot">
          <BotAvatar />

          <div className="ai-chat__col">
            <div className="ai-bubble ai-bubble--bot">{WELCOME}</div>

            <span className="ai-chat__time">{formatTime(new Date())}</span>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="ai-chat__suggested">
            <span className="ai-chat__suggested-label">추천 질문</span>

            <div className="ai-chat__chip-row">
              {SUGGESTED.map((q, i) => (
                <button
                  key={q}
                  type="button"
                  className={`ai-chip${i === 0 ? " ai-chip--active" : ""}`}
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="ai-chat__date-divider">
            <span>오늘</span>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div className="ai-chat__row ai-chat__row--user" key={m.id}>
              <div className="ai-chat__col ai-chat__col--user">
                <div className="ai-bubble ai-bubble--user">{m.text}</div>

                <span className="ai-chat__time">
                  {formatTime(m.time)} <span className="ai-chat__check">✓</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="ai-chat__row ai-chat__row--bot" key={m.id}>
              <BotAvatar />

              <div className="ai-chat__col">
                <div
                  className="ai-bubble ai-bubble--bot"
                  style={{
                    whiteSpace: "pre-line",
                  }}
                >
                  {m.text}
                </div>

                <span className="ai-chat__time">{formatTime(m.time)}</span>
              </div>
            </div>
          ),
        )}

        {isTyping && (
          <div className="ai-chat__row ai-chat__row--bot">
            <BotAvatar />

            <div className="ai-bubble ai-bubble--bot ai-bubble--typing">
              <span className="ai-dot" />
              <span className="ai-dot" />
              <span className="ai-dot" />
            </div>
          </div>
        )}
      </div>

      <form className="ai-chat__inputbar" onSubmit={handleSubmit}>
        <button
          type="button"
          className="ai-chat__icon-btn ai-chat__icon-btn--ghost"
          aria-label="이미지 첨부"
        >
          <ImagePickIcon />
        </button>

        <button
          type="button"
          className="ai-chat__icon-btn ai-chat__icon-btn--ghost"
          aria-label="사진 촬영"
        >
          <CameraPickIcon />
        </button>

        <input
          className="ai-chat__input"
          placeholder="무엇이 궁금한가요?"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />

        <button
          type="submit"
          className="ai-chat__send"
          disabled={!draft.trim()}
          aria-label="보내기"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  Capture                                                              */
/* -------------------------------------------------------------------- */

function AiCapture({ onBack, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState("user");

  const [status, setStatus] = useState("requesting");

  const [capturedImage, setCapturedImage] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());

      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("unsupported");
      return;
    }

    setStatus("requesting");
    setErrorMessage("");

    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: {
            ideal: 1080,
          },
          height: {
            ideal: 1440,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play();
      }

      setStatus("ready");
    } catch (err) {
      if (err && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
        setStatus("denied");
      } else if (err && err.name === "NotFoundError") {
        setStatus("unsupported");

        setErrorMessage("사용 가능한 카메라를 찾을 수 없어요.");
      } else {
        setStatus("error");

        setErrorMessage("카메라를 불러오는 중 문제가 발생했어요.");
      }
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    startCamera();

    return () => stopStream();
  }, [facingMode, startCamera, stopStream]);

  const handleShutter = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || status !== "ready") {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    setCapturedImage(canvas.toDataURL("image/jpeg", 0.92));

    stopStream();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleUsePhoto = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className="ai-capture">
      <header className="ai-capture__header">
        <button
          type="button"
          className="ai-capture__icon-btn"
          onClick={onBack}
          aria-label="뒤로가기"
        >
          <ChevronLeft />
        </button>

        <h1 className="ai-capture__title">피부 촬영</h1>

        <button
          type="button"
          className="ai-capture__icon-btn"
          onClick={handleSwitchCamera}
          aria-label="카메라 전환"
          disabled={!!capturedImage}
        >
          <SwitchCameraIcon />
        </button>
      </header>

      {!capturedImage && (
        <p className="ai-capture__tip">
          <span className="ai-capture__tip-label">TIP.</span> 자연광에서 정면을 바라봐 주세요
        </p>
      )}

      <div className="ai-capture__stage">
        {!capturedImage && (
          <video
            ref={videoRef}
            className="ai-capture__video"
            style={{
              transform: facingMode === "user" ? "scaleX(-1)" : "none",
            }}
            playsInline
            muted
            autoPlay
          />
        )}

        {capturedImage && (
          <img src={capturedImage} alt="촬영된 피부 사진" className="ai-capture__preview" />
        )}

        {!capturedImage && status === "ready" && (
          <svg className="ai-capture__guide" viewBox="0 0 400 520" fill="none">
            <ellipse
              cx="200"
              cy="245"
              rx="140"
              ry="200"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="2.5"
              strokeDasharray="7 8"
            />

            <line
              x1="40"
              y1="245"
              x2="80"
              y2="245"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="2"
            />

            <line
              x1="320"
              y1="245"
              x2="360"
              y2="245"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="2"
            />

            <line
              x1="200"
              y1="465"
              x2="200"
              y2="500"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="2"
            />
          </svg>
        )}

        {status === "requesting" && !capturedImage && (
          <div className="ai-capture__overlay-msg">카메라를 준비하고 있어요…</div>
        )}

        {status === "denied" && (
          <div className="ai-capture__overlay-msg">
            카메라 접근 권한이 필요해요.
            <br />
            브라우저 설정에서 카메라 권한을 허용해주세요.
            <button type="button" className="ai-capture__retry" onClick={startCamera}>
              다시 시도
            </button>
          </div>
        )}

        {(status === "unsupported" || status === "error") && (
          <div className="ai-capture__overlay-msg">
            {errorMessage || "이 기기에서는 카메라를 사용할 수 없어요."}

            <button type="button" className="ai-capture__retry" onClick={startCamera}>
              다시 시도
            </button>
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        style={{
          display: "none",
        }}
      />

      <div className="ai-capture__controls">
        {!capturedImage ? (
          <button
            type="button"
            className="ai-capture__shutter"
            onClick={handleShutter}
            disabled={status !== "ready"}
            aria-label="사진 촬영"
          />
        ) : (
          <div className="ai-capture__result-actions">
            <button type="button" className="ai-capture__secondary" onClick={handleRetake}>
              다시 촬영
            </button>

            <button type="button" className="ai-capture__primary" onClick={handleUsePhoto}>
              이 사진 사용하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  AI page                                                              */
/* -------------------------------------------------------------------- */

export default function AI() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);

  const requestedMode = params.get("mode");

  const openedFrom = params.get("from");

  const [view, setView] = useState(requestedMode === "capture" ? "capture" : "menu");

  const [chatPreset, setChatPreset] = useState(undefined);

  const [lastPhoto, setLastPhoto] = useState(null);

  const activeNav =
    location.pathname === "/home"
      ? "home"
      : location.pathname === "/record"
        ? "record"
        : location.pathname === "/d-day" || location.pathname === "/dday"
          ? "dday"
          : location.pathname === "/my"
            ? "my"
            : "ai";

  const openChat = (presetQuestion) => {
    setChatPreset(presetQuestion);

    setView("chat");
  };

  const openCapture = () => setView("capture");

  const goToMenu = () => setView("menu");

  const handleCapture = (photoDataUrl) => {
    setLastPhoto(photoDataUrl);

    const mockAnalysis = {
      score: 78,
      change: "+4점",
      capturedAt: new Date().toISOString(),
      photoDataUrl,
      stats: [
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
    };

    localStorage.setItem("wellness-today-skin-analysis", JSON.stringify(mockAnalysis));

    if (openedFrom === "home") {
      navigate("/home", {
        replace: true,
      });

      return;
    }

    setView("menu");
  };

  const handleNavChange = (key) => {
    if (key === "home") {
      navigate("/home");
      return;
    }

    /* 기록 탭 추가 */
    if (key === "record") {
      navigate("/record");
      return;
    }

    if (key === "ai") {
      navigate("/ai");
      return;
    }

    if (key === "dday") {
      navigate("/dday");
      return;
    }

    if (key === "my") {
      navigate("/my");
    }
  };

  return (
    <div className="ai-page">
      <div className="ai-phone">
        <div className="ai-page__content">
          {view === "menu" && <AiMenu onOpenCapture={openCapture} onOpenChat={openChat} />}

          {view === "chat" && <AiChat onBack={goToMenu} initialQuestion={chatPreset} />}

          {view === "capture" && <AiCapture onBack={goToMenu} onCapture={handleCapture} />}
        </div>

        <BottomNav activeNav={activeNav} onChange={handleNavChange} />
      </div>
    </div>
  );
}
