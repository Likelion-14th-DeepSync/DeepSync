import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import "./Login.css";

function SignupComplete() {
  const navigate = useNavigate();

  return (
    <div className="signup-complete-page">
      <div className="signup-complete-content">
        <div className="complete-icon">
          <div className="complete-circle">
            <Sparkles size={34} color="#ffffff" strokeWidth={2.3} />
          </div>

          <span className="confetti confetti-1" />
          <span className="confetti confetti-2" />
          <span className="confetti confetti-3" />
          <span className="confetti confetti-4" />
        </div>

        <h1>회원가입 완료!</h1>

        <p>
          웰니스케어에 오신 것을 환영해요.
          <br />
          이제 맞춤 피부 케어를 시작해볼까요?
        </p>
      </div>

      <button
        className="auth-bottom-button complete-button"
        onClick={() => navigate("/onboarding")}
      >
        시작하기
      </button>
    </div>
  );
}

export default SignupComplete;
