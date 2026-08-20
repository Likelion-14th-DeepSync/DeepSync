import React, { useCallback, useEffect, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import BottomNav from "../../components/BottomNav";

import { uploadSkinImage, checkSkinImageQuality } from "../../api/skinImages";

import { requestSkinAnalysis, startSkinAnalysis, completeSkinAnalysis } from "../../api/analysis";

import "./Ai.css";

/* =========================================================
   Icons
========================================================= */

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
      d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.2-1.8a1.5 1.5 0 0 1 1.25-.7h3.1a1.5 1.5 0 0 1 1.25.7L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 12c0-4.4 3.8-8 8.5-8S21 7.6 21 12s-3.8 8-8.5 8c-1 0-1.96-.15-2.85-.44L5 21l1.3-3.9C4.85 15.7 4 13.9 4 12Z"
      stroke="currentColor"
      strokeWidth="1.7"
    />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
    />
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />

    <path
      d="M12 2.5v2.2M12 19.3v2.2M4.2 12H2M22 12h-2.2"
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

    <path d="M4 9.5h16M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      d="M12 3.5c.3 0 .57.2.65.49l.98 3.3a3.2 3.2 0 0 0 2.18 2.18l3.3.98a.68.68 0 0 1 0 1.3l-3.3.98a3.2 3.2 0 0 0-2.18 2.18l-.98 3.3a.68.68 0 0 1-1.3 0l-.98-3.3a3.2 3.2 0 0 0-2.18-2.18l-3.3-.98a.68.68 0 0 1 0-1.3l3.3-.98a3.2 3.2 0 0 0 2.18-2.18l.98-3.3c.08-.29.35-.49.65-.49Z"
      fill="currentColor"
    />
  </svg>
);

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <circle cx="5" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="19" cy="12" r="1.6" fill="currentColor" />
  </svg>
);

const BotAvatar = () => (
  <span className="ai-chat__avatar">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="7" width="16" height="12" rx="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9" cy="13" r="1.2" fill="currentColor" />
      <circle cx="15" cy="13" r="1.2" fill="currentColor" />
    </svg>
  </span>
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
    />
  </svg>
);

const GalleryIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />

    <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.7" />

    <path
      d="M4.5 17l4.7-4.8a1.4 1.4 0 0 1 2 0l2.2 2.2 1.7-1.7a1.4 1.4 0 0 1 2 0l3.4 3.4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* =========================================================
   Static
========================================================= */

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

let messageId = 0;

const nextId = () => `message-${++messageId}`;

function getAiReply(question) {
  if (question.includes("안좋아") || question.includes("점수")) {
    return "최근 기록을 분석해보니,\n🌙 수면시간이 부족했어요.\n☀️ 자외선 지수가 높았어요.\n생활 기록과 함께 피부 변화가 나타난 것으로 보여요.";
  }

  if (question.includes("루틴")) {
    return "오늘은 수분 진정 위주의 루틴을 추천해요.\n1) 저자극 세안\n2) 진정 토너\n3) 보습 크림\n4) 외출 전 선크림";
  }

  if (question.includes("7일") || question.includes("실험")) {
    return "최근 7일 기록을 기준으로 피부 변화와 생활 패턴을 함께 확인해볼 수 있어요.";
  }

  return "조금 더 자세히 알려주시면 기록을 기반으로 분석해드릴게요!";
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(
    2,
    "0",
  )}`;
}

function formatLocalDateTime(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

async function dataUrlToFile(dataUrl, fileName = "skin-photo.jpg") {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], fileName, {
    type: blob.type || "image/jpeg",
  });
}

/*
 * 실제 AI 모델 연동 전 MVP 분석값.
 */
function createMvpSkinAnalysisResult() {
  return {
    rednessScore: 74,
    troubleScore: 81,
    drynessScore: 72,
    toneUniformityScore: 83,
    overallScore: 78,
    confidenceScore: 86,
    modelVersion: "deepsync-mvp-v1",
  };
}

/* =========================================================
   Menu
========================================================= */

function AiMenu({ onOpenCapture, onOpenChat }) {
  return (
    <div className="ai-menu">
      <header className="ai-menu__header">
        <h1 className="ai-menu__brand">Wellness Care AI</h1>
      </header>

      <div className="ai-menu__greeting">
        <p className="ai-menu__hello">안녕하세요 👋</p>

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

          <ChevronRight />
        </button>

        <button type="button" className="ai-card ai-card--action" onClick={() => onOpenChat()}>
          <span className="ai-card__icon ai-card__icon--chat">
            <ChatIcon />
          </span>

          <span className="ai-card__text">
            <span className="ai-card__title">AI 상담 시작</span>

            <span className="ai-card__desc">내 피부 기록을 기반으로 상담해요</span>
          </span>

          <ChevronRight />
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

              <ChevronRight />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   Chat
========================================================= */

function AiChat({ onBack, initialQuestion }) {
  const [messages, setMessages] = useState([]);

  const [draft, setDraft] = useState("");

  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef(null);
  const sentInitial = useRef(false);

  const sendMessage = useCallback((text) => {
    const value = text?.trim();

    if (!value) return;

    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        role: "user",
        text: value,
        time: new Date(),
      },
    ]);

    setDraft("");
    setIsTyping(true);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "bot",
          text: getAiReply(value),
          time: new Date(),
        },
      ]);

      setIsTyping(false);
    }, 700);
  }, []);

  useEffect(() => {
    if (initialQuestion && !sentInitial.current) {
      sentInitial.current = true;

      sendMessage(initialQuestion);
    }
  }, [initialQuestion, sendMessage]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="ai-chat">
      <header className="ai-chat__header">
        <button type="button" className="ai-chat__icon-btn" onClick={onBack}>
          <ChevronLeft />
        </button>

        <h1 className="ai-chat__title">AI 상담</h1>

        <button type="button" className="ai-chat__icon-btn">
          <MoreIcon />
        </button>
      </header>

      <div className="ai-chat__body" ref={listRef}>
        <div className="ai-chat__row ai-chat__row--bot">
          <BotAvatar />

          <div className="ai-chat__col">
            <div
              className="ai-bubble ai-bubble--bot"
              style={{
                whiteSpace: "pre-line",
              }}
            >
              {WELCOME}
            </div>

            <span className="ai-chat__time">{formatTime(new Date())}</span>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="ai-chat__suggested">
            <span className="ai-chat__suggested-label">추천 질문</span>

            <div className="ai-chat__chip-row">
              {SUGGESTED.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="ai-chip"
                  onClick={() => sendMessage(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`ai-chat__row ai-chat__row--${message.role}`}>
            {message.role === "bot" && <BotAvatar />}

            <div className={`ai-chat__col ${message.role === "user" ? "ai-chat__col--user" : ""}`}>
              <div
                className={`ai-bubble ai-bubble--${message.role}`}
                style={{
                  whiteSpace: "pre-line",
                }}
              >
                {message.text}
              </div>

              <span className="ai-chat__time">{formatTime(message.time)}</span>
            </div>
          </div>
        ))}

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

      <form
        className="ai-chat__inputbar"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(draft);
        }}
      >
        <input
          className="ai-chat__input"
          placeholder="무엇이 궁금한가요?"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />

        <button type="submit" className="ai-chat__send" disabled={!draft.trim()}>
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

/* =========================================================
   Capture
========================================================= */

function AiCapture({ onBack, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  /*
   * 사진 추가 input
   */
  const fileInputRef = useRef(null);

  const requestIdRef = useRef(0);

  const mountedRef = useRef(false);

  const [facingMode, setFacingMode] = useState("user");

  const [status, setStatus] = useState("requesting");

  const [capturedImage, setCapturedImage] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [isUploading, setIsUploading] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(
    async (mode = "user", retryCount = 0) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (mountedRef.current) {
          setStatus("unsupported");

          setErrorMessage("이 브라우저에서는 카메라를 사용할 수 없어요.");
        }

        return;
      }

      const requestId = ++requestIdRef.current;

      setStatus("requesting");

      setErrorMessage("");

      stopCamera();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: mode,
            },

            width: {
              ideal: 1280,
            },

            height: {
              ideal: 720,
            },
          },

          audio: false,
        });

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          stream.getTracks().forEach((track) => track.stop());

          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;

        if (video) {
          video.srcObject = stream;

          try {
            await video.play();
          } catch (playError) {
            console.warn("video.play() 경고:", playError);
          }
        }

        setStatus("ready");
      } catch (error) {
        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        console.error("카메라 오류:", error);

        if (error?.name === "AbortError" && retryCount < 1) {
          window.setTimeout(() => {
            if (mountedRef.current) {
              startCamera(mode, retryCount + 1);
            }
          }, 350);

          return;
        }

        if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
          setStatus("denied");

          setErrorMessage("카메라 접근 권한이 필요해요.");

          return;
        }

        if (error?.name === "NotFoundError") {
          setStatus("unsupported");

          setErrorMessage("사용 가능한 카메라를 찾을 수 없어요.");

          return;
        }

        if (error?.name === "NotReadableError") {
          setStatus("error");

          setErrorMessage("카메라가 다른 앱에서 사용 중일 수 있어요.");

          return;
        }

        if (error?.name === "OverconstrainedError") {
          setStatus("error");

          setErrorMessage("현재 카메라 설정을 사용할 수 없어요.");

          return;
        }

        setStatus("error");

        setErrorMessage(error?.message || "카메라를 실행할 수 없어요.");
      }
    },
    [stopCamera],
  );

  useEffect(() => {
    mountedRef.current = true;

    startCamera("user");

    return () => {
      mountedRef.current = false;

      requestIdRef.current += 1;

      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleSwitchCamera = async () => {
    if (isUploading || capturedImage) {
      return;
    }

    const nextMode = facingMode === "user" ? "environment" : "user";

    setFacingMode(nextMode);

    await startCamera(nextMode);
  };

  const handleShutter = () => {
    const video = videoRef.current;

    const canvas = canvasRef.current;

    if (!video || !canvas || status !== "ready") {
      return;
    }

    const width = video.videoWidth;

    const height = video.videoHeight;

    if (!width || !height) {
      setErrorMessage("카메라 화면을 불러오는 중이에요. 잠시 후 다시 촬영해주세요.");

      return;
    }

    canvas.width = width;

    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.save();

    if (facingMode === "user") {
      context.translate(width, 0);

      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, width, height);

    context.restore();

    const imageData = canvas.toDataURL("image/jpeg", 0.9);

    setCapturedImage(imageData);

    stopCamera();
  };

  /*
   * 앨범 / Finder에서 사진 선택 버튼
   */
  const handleOpenGallery = () => {
    if (isUploading) {
      return;
    }

    fileInputRef.current?.click();
  };

  /*
   * 선택한 사진을 미리보기로 변환
   */
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("이미지 파일만 선택할 수 있어요.");

      return;
    }

    /*
     * 같은 파일을 다시 선택 가능하도록 초기화
     */
    event.target.value = "";

    setErrorMessage("");

    stopCamera();

    const reader = new FileReader();

    reader.onload = () => {
      setCapturedImage(reader.result);
    };

    reader.onerror = () => {
      setErrorMessage("사진을 불러오지 못했어요.");
    };

    reader.readAsDataURL(file);
  };

  const handleRetake = async () => {
    if (isUploading) {
      return;
    }

    setCapturedImage(null);

    setErrorMessage("");

    await startCamera(facingMode);
  };

  const handleUsePhoto = async () => {
    if (!capturedImage || isUploading) {
      return;
    }

    try {
      setIsUploading(true);

      setErrorMessage("");

      await onCapture(capturedImage);
    } catch (error) {
      console.error("사진 업로드 실패:", error);

      setErrorMessage(
        error.response?.data?.error?.message || error.message || "사진 저장에 실패했어요.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="ai-capture">
      <header className="ai-capture__header">
        <button
          type="button"
          className="ai-capture__icon-btn"
          onClick={onBack}
          disabled={isUploading}
        >
          <ChevronLeft />
        </button>

        <h1 className="ai-capture__title">피부 촬영</h1>

        <button
          type="button"
          className="ai-capture__icon-btn"
          onClick={handleSwitchCamera}
          disabled={isUploading || Boolean(capturedImage)}
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
            playsInline
            muted
            autoPlay
            style={{
              transform: facingMode === "user" ? "scaleX(-1)" : "none",
            }}
          />
        )}

        {capturedImage && (
          <img src={capturedImage} alt="선택된 피부 사진" className="ai-capture__preview" />
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
          </svg>
        )}

        {status === "requesting" && !capturedImage && (
          <div className="ai-capture__overlay-msg">카메라를 준비하고 있어요…</div>
        )}

        {status === "denied" && !capturedImage && (
          <div className="ai-capture__overlay-msg">
            {errorMessage}
            <br />
            카메라 권한이 없어도 아래의 사진 추가 기능을 사용할 수 있어요.
          </div>
        )}

        {(status === "error" || status === "unsupported") && !capturedImage && (
          <div className="ai-capture__overlay-msg">
            {errorMessage}
            <br />
            아래에서 사진을 직접 추가할 수도 있어요.
          </div>
        )}

        {isUploading && (
          <div className="ai-capture__overlay-msg">
            피부를 분석하고 있어요…
            <br />
            잠시만 기다려주세요.
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        style={{
          display: "none",
        }}
      />

      {/* 실제 사진 선택 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{
          display: "none",
        }}
      />

      {errorMessage && capturedImage && !isUploading && (
        <p
          style={{
            margin: "10px 20px",
            textAlign: "center",
            fontSize: 12,
            whiteSpace: "pre-line",
            color: "#E35D6A",
          }}
        >
          {errorMessage}
        </p>
      )}

      <div className="ai-capture__controls">
        {!capturedImage ? (
          <div
            style={{
              position: "relative",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* 가운데 촬영 버튼 */}
            <button
              type="button"
              className="ai-capture__shutter"
              onClick={handleShutter}
              disabled={status !== "ready"}
              aria-label="사진 촬영"
            />

            {/* 오른쪽 사진 추가 */}
            <button
              type="button"
              onClick={handleOpenGallery}
              disabled={isUploading}
              aria-label="사진 추가"
              style={{
                position: "absolute",
                right: 22,
                width: 46,
                height: 46,
                padding: 0,
                border: "1px solid #E4E0FF",
                borderRadius: "50%",
                background: "#F7F6FF",
                color: "#6C5CE7",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <GalleryIcon />
            </button>
          </div>
        ) : (
          <div className="ai-capture__result-actions">
            <button
              type="button"
              className="ai-capture__secondary"
              onClick={handleRetake}
              disabled={isUploading}
            >
              다시 촬영
            </button>

            <button
              type="button"
              className="ai-capture__primary"
              onClick={handleUsePhoto}
              disabled={isUploading}
            >
              {isUploading ? "분석 중..." : "이 사진 사용하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Page
========================================================= */

export default function AI() {
  const navigate = useNavigate();

  const location = useLocation();

  const params = new URLSearchParams(location.search);

  const requestedMode = params.get("mode");

  const openedFrom = params.get("from");

  const [view, setView] = useState(requestedMode === "capture" ? "capture" : "menu");

  const [chatPreset, setChatPreset] = useState();

  const openChat = (question) => {
    setChatPreset(question);

    setView("chat");
  };

  const handleCapture = async (photoDataUrl) => {
    console.log("🔥 0. 피부 분석 흐름 시작");

    // 1. DataURL → File
    const file = await dataUrlToFile(photoDataUrl, `skin-${Date.now()}.jpg`);

    const metadata = {
      capturedAt: formatLocalDateTime(new Date()),
      direction: "FRONT",
      makeupApplied: false,
    };

    // 2. 사진 업로드
    const uploadResponse = await uploadSkinImage(file, metadata);

    console.log("✅ 1. 피부 사진 업로드 성공:", uploadResponse);

    const uploadedImage = uploadResponse?.data;
    const imageId = uploadedImage?.imageId;

    if (!imageId) {
      throw new Error("사진 업로드 후 imageId를 받지 못했습니다.");
    }

    // 3. 품질검사
    let quality = null;

    try {
      const qualityResponse = await checkSkinImageQuality(imageId);

      quality = qualityResponse?.data;

      console.log("✅ 2. 품질검사 API 성공:", qualityResponse);

      console.log("📷 실제 사진 품질 상태:", quality?.qualityStatus);

      console.log("📷 품질검사 점수:", {
        resolutionScore: quality?.resolutionScore,

        lightingScore: quality?.lightingScore,

        lightingUniformityScore: quality?.lightingUniformityScore,

        sharpnessScore: quality?.sharpnessScore,

        overallScore: quality?.overallScore,

        messages: quality?.messages,
      });
    } catch (qualityError) {
      console.warn("⚠️ 품질검사 실패 - MVP에서는 계속 진행:", qualityError);
    }

    // 4. 피부 분석 API 시도
    let analysis = null;
    let analysisId = null;

    try {
      console.log("🔥 3. 피부 분석 요청 시작:", imageId);

      const requestResponse = await requestSkinAnalysis(imageId);

      console.log("✅ 3. 피부 분석 요청 성공:", requestResponse);

      analysisId = requestResponse?.data?.analysisId;

      if (!analysisId) {
        throw new Error("분석 요청 후 analysisId를 받지 못했습니다.");
      }

      // 5. 분석 시작
      const startResponse = await startSkinAnalysis(analysisId);

      console.log("✅ 4. 피부 분석 시작 성공:", startResponse);

      // 6. MVP 결과값 생성
      const result = createMvpSkinAnalysisResult();

      // 7. 분석 결과 저장
      const completeResponse = await completeSkinAnalysis(analysisId, result);

      console.log("✅ 5. 피부 분석 완료:", completeResponse);

      analysis = completeResponse?.data;

      if (!analysis) {
        throw new Error("피부 분석 결과가 없습니다.");
      }
    } catch (analysisError) {
      console.warn("⚠️ 피부 분석 API 미완료 - MVP mock 분석 사용:", analysisError);

      /*
       * 백엔드 품질검사 조건 수정 전까지
       * 임시로 화면 개발을 계속하기 위한 mock 데이터
       */
      analysis = {
        analysisId: null,

        imageId,

        status: "COMPLETED",

        rednessScore: 74,

        troubleScore: 81,

        drynessScore: 72,

        toneUniformityScore: 83,

        overallScore: 78,

        confidenceScore: 86,

        modelVersion: "frontend-mvp-mock",

        capturedAt: uploadedImage?.capturedAt ?? new Date().toISOString(),

        analyzedAt: new Date().toISOString(),
      };

      analysisId = null;
    }

    // 8. 홈 화면용 데이터
    const homeAnalysis = {
      score: analysis.overallScore,

      change: "+4점",

      capturedAt: analysis.capturedAt ?? uploadedImage?.capturedAt ?? new Date().toISOString(),

      photoDataUrl,

      imageId,

      analysisId: analysis.analysisId ?? analysisId,

      confidenceScore: analysis.confidenceScore,

      /*
       * 품질검사 정보도 같이 보관
       */
      qualityStatus: quality?.qualityStatus ?? null,

      qualityScore: quality?.overallScore ?? null,

      isMock: analysis.modelVersion === "frontend-mvp-mock",

      stats: [
        {
          label: "붉은기",

          value: `${analysis.rednessScore}점`,

          trend: "same",
        },

        {
          label: "트러블",

          value: `${analysis.troubleScore}점`,

          trend: "same",
        },

        {
          label: "건조함",

          value: `${analysis.drynessScore}점`,

          trend: "same",
        },

        {
          label: "피부톤 균일도",

          value: `${analysis.toneUniformityScore}점`,

          trend: "same",
        },
      ],
    };

    localStorage.setItem("wellness-today-skin-analysis", JSON.stringify(homeAnalysis));

    localStorage.setItem("wellness-latest-skin-image-id", String(imageId));

    if (analysisId) {
      localStorage.setItem("wellness-latest-skin-analysis-id", String(analysisId));
    } else {
      localStorage.removeItem("wellness-latest-skin-analysis-id");
    }

    console.log("🎉 피부 분석 화면 데이터 준비 완료:", {
      imageId,

      analysisId,

      score: analysis.overallScore,

      qualityStatus: quality?.qualityStatus,

      mock: analysis.modelVersion === "frontend-mvp-mock",
    });

    // 9. 이동
    if (openedFrom === "home") {
      navigate("/home", {
        replace: true,
      });

      return;
    }

    if (openedFrom === "record") {
      navigate("/record?tab=photo", {
        replace: true,
      });

      return;
    }

    setView("menu");
  };

  const handleNavChange = (key) => {
    const paths = {
      home: "/home",
      record: "/record",
      ai: "/ai",
      dday: "/dday",
      my: "/my",
    };

    if (paths[key]) {
      navigate(paths[key]);
    }
  };

  return (
    <div className="ai-page">
      <div className="ai-phone">
        <div className="ai-page__content">
          {view === "menu" && (
            <AiMenu onOpenCapture={() => setView("capture")} onOpenChat={openChat} />
          )}

          {view === "chat" && (
            <AiChat onBack={() => setView("menu")} initialQuestion={chatPreset} />
          )}

          {view === "capture" && (
            <AiCapture onBack={() => setView("menu")} onCapture={handleCapture} />
          )}
        </div>

        <BottomNav activeNav="ai" onChange={handleNavChange} />
      </div>
    </div>
  );
}
