import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import "./Onboarding.css";

function Lifestyle() {
  const navigate = useNavigate();

  const [sleep, setSleep] = useState("6-7");
  const [smoking, setSmoking] = useState("no");
  const [drinking, setDrinking] = useState("sometimes");

  const handleComplete = () => {
    const lifestyleData = {
      sleep,
      smoking,
      drinking,
    };

    console.log("온보딩 생활 습관 데이터:", lifestyleData);

    // 추후 여기서 백엔드 온보딩 API 연동
    navigate("/home");
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-screen">
        <header className="question-header">
          <button
            type="button"
            className="question-back"
            onClick={() => navigate("/onboarding/concern")}
          >
            <ChevronLeft size={24} />
            <span>뒤로</span>
          </button>

          <div className="question-dots">
            <span className="question-dot" />
            <span className="question-dot" />
            <span className="question-dot active" />
          </div>
        </header>

        <section className="question-title">
          <h1>생활 습관을 알려주세요.</h1>
          <p>분석 정확도를 높여줍니다.</p>
        </section>

        <section className="lifestyle-section">
          <h2>평균 수면 시간</h2>

          <div className="option-row option-row-three">
            {[
              ["under5", "5시간 이하"],
              ["6-7", "6~7시간"],
              ["over8", "8시간 이상"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={sleep === value ? "selected" : ""}
                onClick={() => setSleep(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="lifestyle-section">
          <h2>흡연 여부</h2>

          <div className="option-row option-row-two">
            <button
              type="button"
              className={smoking === "yes" ? "selected" : ""}
              onClick={() => setSmoking("yes")}
            >
              예
            </button>

            <button
              type="button"
              className={smoking === "no" ? "selected" : ""}
              onClick={() => setSmoking("no")}
            >
              아니오
            </button>
          </div>
        </section>

        <section className="lifestyle-section">
          <h2>음주 여부</h2>

          <div className="option-row option-row-three">
            {[
              ["often", "자주"],
              ["sometimes", "가끔"],
              ["never", "안함"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={drinking === value ? "selected" : ""}
                onClick={() => setDrinking(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <button type="button" className="onboarding-bottom-button" onClick={handleComplete}>
          시작하기
        </button>
      </div>
    </div>
  );
}

export default Lifestyle;
