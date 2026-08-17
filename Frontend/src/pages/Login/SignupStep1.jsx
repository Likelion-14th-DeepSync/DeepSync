import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import "./Login.css";

function SignupStep1() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");

  const emailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const nameValid = name.trim().length >= 2;
  const nicknameValid = nickname.trim().length > 0;

  const canNext = emailValid && nameValid;

  const handleNext = () => {
    if (!canNext) return;

    localStorage.setItem("wellness-user-name", name.trim());

    navigate("/signup/step2", {
      state: {
        email: email.trim(),
        name: name.trim(),
        nickname: nickname.trim(),
      },
    });
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <header className="signup-header">
          <button
            className="icon-button"
            type="button"
            onClick={() => navigate("/login")}
            aria-label="뒤로가기"
          >
            <ChevronLeft size={27} />
          </button>

          <div className="signup-progress">
            <span className="progress-circle active">1</span>
            <span className="progress-line" />
            <span className="progress-circle">2</span>
          </div>

          <div className="header-space" />
        </header>

        <main className="signup-main">
          <section className="signup-title">
            <h1>회원가입</h1>
            <p>
              계정을 만들고
              <br />
              맞춤 피부 케어를 시작하세요.
            </p>
          </section>

          <section className="signup-form">
            <div className="form-field">
              <label htmlFor="signup-email">이메일</label>

              <div
                className={`field-box ${
                  email.length > 0 ? (emailValid ? "field-success" : "field-error") : ""
                }`}
              >
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  placeholder="이메일을 입력하세요"
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                />

                {emailValid && <CheckCircle2 className="field-status success-color" size={20} />}
              </div>

              {email.length > 0 && !emailValid && (
                <p className="field-message error-color">올바른 이메일 형식으로 입력해주세요.</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="signup-name">이름</label>

              <div
                className={`field-box ${
                  name.length > 0 ? (nameValid ? "field-success" : "field-error") : ""
                }`}
              >
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  placeholder="이름을 입력하세요"
                  autoComplete="name"
                  onChange={(e) => setName(e.target.value)}
                />

                {nameValid && <CheckCircle2 className="field-status success-color" size={20} />}
              </div>

              {name.length > 0 && !nameValid && (
                <p className="field-message error-color">이름을 2자 이상 입력해주세요.</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="signup-nickname">닉네임 (선택)</label>

              <div className={`field-box ${nicknameValid ? "field-success" : ""}`}>
                <input
                  id="signup-nickname"
                  type="text"
                  value={nickname}
                  placeholder="닉네임을 입력하세요"
                  onChange={(e) => setNickname(e.target.value)}
                />

                {nicknameValid && <CheckCircle2 className="field-status success-color" size={20} />}
              </div>
            </div>
          </section>
        </main>

        <button
          type="button"
          className="signup-bottom-button"
          disabled={!canNext}
          onClick={handleNext}
        >
          다음
        </button>
      </div>
    </div>
  );
}

export default SignupStep1;
