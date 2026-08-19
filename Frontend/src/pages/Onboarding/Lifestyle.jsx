import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { signup } from "../../api/auth";
import "./Onboarding.css";

function Lifestyle() {
  const navigate = useNavigate();
  const location = useLocation();

  // 회원가입 → 피부타입 → 피부고민까지 누적된 데이터
  const onboardingData = location.state ?? {};

  const [sleep, setSleep] = useState("6-7");
  const [smoking, setSmoking] = useState("no");
  const [drinking, setDrinking] = useState("sometimes");
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigate("/onboarding/concern", {
      state: onboardingData,
    });
  };

  const handleComplete = async () => {
    if (isLoading) return;

    const finalData = {
      ...onboardingData,
      lifestyle: {
        sleep,
        smoking,
        drinking,
      },
    };

    const requestData = {
      email: onboardingData.email,
      password: onboardingData.password,
      nickname: onboardingData.name,
      skinType: onboardingData.skinType.toUpperCase(),
      skinConcerns: onboardingData.concerns,
    };

    console.log("최종 온보딩 데이터:", finalData);
    console.log("회원가입 요청 데이터:", requestData);

    try {
      setIsLoading(true);

      const response = await signup(requestData);

      console.log("회원가입 성공:", response);

      localStorage.setItem("deepSyncOnboarding", JSON.stringify(finalData));

      navigate("/signup/complete", {
        state: finalData,
      });
    } catch (error) {
      console.error("회원가입 실패:", error);

      const message = error.response?.data?.error?.message ?? "회원가입에 실패했습니다.";

      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-screen">
        <header className="question-header">
          <button type="button" className="question-back" onClick={handleBack}>
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

        <button
          type="button"
          className="onboarding-bottom-button"
          onClick={handleComplete}
          disabled={isLoading}
        >
          {isLoading ? "가입 중..." : "시작하기"}
        </button>
      </div>
    </div>
  );
}

export default Lifestyle;
