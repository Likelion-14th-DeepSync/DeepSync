import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronLeft, Eye, EyeOff, X } from "lucide-react";
import "./Login.css";

function SignupStep2() {
  const navigate = useNavigate();
  const location = useLocation();

  const signupInfo = location.state ?? {};

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const rules = useMemo(() => {
    const length = password.length >= 8;
    const letter = /[A-Za-z]/.test(password);
    const number = /\d/.test(password);
    const special = /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/']/g.test(password);

    return {
      length,
      letter,
      number,
      special,
    };
  }, [password]);

  const passwordValid = rules.length && rules.letter && rules.number && rules.special;

  const passwordMatch = passwordConfirm.length > 0 && password === passwordConfirm;

  const canSubmit = passwordValid && passwordMatch;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const signupData = {
      ...signupInfo,
      password,
    };

    localStorage.setItem("deepSyncUserName", signupData.name ?? "");
    localStorage.setItem("deepSyncUserNickname", signupData.nickname ?? "");

    console.log("회원가입 데이터", signupData);

    // 추후 여기서 백엔드 회원가입 API 연결
    navigate("/signup/complete", {
      state: signupData,
    });
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <header className="signup-header">
          <button
            className="icon-button"
            type="button"
            onClick={() =>
              navigate("/signup", {
                state: signupInfo,
              })
            }
            aria-label="뒤로가기"
          >
            <ChevronLeft size={27} />
          </button>

          <div className="signup-progress">
            <span className="progress-circle complete">
              <Check size={14} strokeWidth={3} />
            </span>

            <span className="progress-line complete-line" />

            <span className="progress-circle active">2</span>
          </div>

          <div className="header-space" />
        </header>

        <main className="signup-main">
          <section className="signup-title">
            <h1>회원가입</h1>
            <p>
              안전한 비밀번호를 설정하고
              <br />
              가입을 완료해주세요.
            </p>
          </section>

          <section className="signup-form">
            <div className="form-field">
              <label htmlFor="signup-password">비밀번호</label>

              <div
                className={`field-box password-box ${
                  password.length > 0 ? (passwordValid ? "field-success" : "field-error") : ""
                }`}
              >
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="eye-button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="signup-password-confirm">비밀번호 확인</label>

              <div
                className={`field-box password-box ${
                  passwordConfirm.length > 0
                    ? passwordMatch
                      ? "field-success"
                      : "field-error"
                    : ""
                }`}
              >
                <input
                  id="signup-password-confirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  value={passwordConfirm}
                  placeholder="비밀번호를 다시 입력하세요"
                  autoComplete="new-password"
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />

                <button
                  type="button"
                  className="eye-button"
                  onClick={() => setShowPasswordConfirm((prev) => !prev)}
                  aria-label={showPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {passwordConfirm.length > 0 && !passwordMatch && (
                <p className="field-message error-color">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            <div
              className={`password-rule-card ${
                password.length === 0 ? "" : passwordValid ? "rule-card-success" : "rule-card-error"
              }`}
            >
              <h3>
                {password.length === 0
                  ? "안전한 비밀번호를 만들어주세요"
                  : passwordValid
                    ? "안전한 비밀번호예요!"
                    : "비밀번호 조건을 확인해주세요"}
              </h3>

              <PasswordRule valid={rules.length} active={password.length > 0} text="8자 이상" />

              <PasswordRule valid={rules.letter} active={password.length > 0} text="영문 포함" />

              <PasswordRule valid={rules.number} active={password.length > 0} text="숫자 포함" />

              <PasswordRule
                valid={rules.special}
                active={password.length > 0}
                text="특수문자 포함"
              />

              <PasswordRule
                valid={passwordMatch}
                active={passwordConfirm.length > 0}
                text="비밀번호 일치"
              />
            </div>
          </section>
        </main>

        <button
          type="button"
          className="signup-bottom-button"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          회원가입 완료
        </button>
      </div>
    </div>
  );
}

function PasswordRule({ valid, active, text }) {
  const stateClass = !active ? "rule-neutral" : valid ? "rule-success" : "rule-error";

  return (
    <div className={`password-rule ${stateClass}`}>
      <span className="rule-icon">
        {!active ? (
          "•"
        ) : valid ? (
          <Check size={15} strokeWidth={3} />
        ) : (
          <X size={15} strokeWidth={3} />
        )}
      </span>

      <span>{text}</span>
    </div>
  );
}

export default SignupStep2;
