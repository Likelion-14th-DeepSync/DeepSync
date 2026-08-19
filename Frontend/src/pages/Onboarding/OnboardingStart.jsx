import { useLocation, useNavigate } from "react-router-dom";
import { Droplets, ShieldCheck, Sparkles, BarChart3 } from "lucide-react";

import onboardingImage from "../../assets/Onboarding.png";
import "./Onboarding.css";

function OnboardingStart() {
  const navigate = useNavigate();
  const location = useLocation();

  const signupData = location.state ?? {};

  const handleStart = () => {
    navigate("/onboarding/skin-type", {
      state: signupData,
    });
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-screen onboarding-start-screen">
        <button className="skip-button">건너뛰기</button>

        <section className="intro-copy">
          <h1>
            AI 피부 분석으로
            <br />
            <span>나만의 피부 루틴</span>을
            <br />
            시작하세요
          </h1>

          <p>
            정확한 분석과 맞춤 케어로
            <br />
            건강한 피부를 만들어가요.
          </p>
        </section>

        <div className="onboarding-visual">
          <img src={onboardingImage} alt="피부 케어" className="onboarding-woman" />

          <div className="visual-icon icon-drop">
            <Droplets size={17} />
          </div>

          <div className="visual-icon icon-shield">
            <ShieldCheck size={16} />
          </div>

          <div className="visual-icon icon-sparkle">
            <Sparkles size={16} />
          </div>

          <div className="visual-icon icon-chart">
            <BarChart3 size={16} />
          </div>
        </div>

        <div className="intro-dots">
          <span className="intro-dot active" />
          <span className="intro-dot" />
          <span className="intro-dot" />
        </div>

        <button className="onboarding-bottom-button" onClick={handleStart}>
          시작하기
        </button>
      </div>
    </div>
  );
}

export default OnboardingStart;
