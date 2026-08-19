import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

import { login } from "../../api/auth";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const canLogin = email.trim().length > 0 && password.length > 0 && !isLoading;

  const handleLogin = async () => {
    if (!canLogin) return;

    setIsLoading(true);
    setLoginError("");

    try {
      const response = await login({
        email: email.trim(),
        password,
      });

      console.log("로그인 성공:", response);

      const accessToken = response.data?.accessToken;
      const tokenType = response.data?.tokenType;
      const expiresIn = response.data?.expiresIn;

      if (!accessToken) {
        throw new Error("로그인 응답에 accessToken이 없습니다.");
      }

      localStorage.setItem("accessToken", accessToken);

      if (tokenType) {
        localStorage.setItem("tokenType", tokenType);
      }

      if (expiresIn !== undefined) {
        localStorage.setItem("expiresIn", String(expiresIn));
      }

      if (rememberMe) {
        localStorage.setItem("rememberLogin", "true");
      } else {
        localStorage.removeItem("rememberLogin");
      }

      navigate("/home");
    } catch (error) {
      console.error("로그인 실패:", error);

      const message =
        error.response?.data?.error?.message ?? error.message ?? "로그인에 실패했습니다.";

      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="login-page">
      <div className="login-content">
        <h1>로그인</h1>

        <p className="login-description">
          계정에 로그인하여
          <br />
          맞춤 피부 케어를 시작하세요.
        </p>

        <div className="login-form">
          <div className="input-group">
            <label htmlFor="login-email">이메일</label>

            <input
              id="login-email"
              type="email"
              value={email}
              placeholder="이메일을 입력하세요"
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">비밀번호</label>

            <input
              id="login-password"
              type="password"
              value={password}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="login-options">
            <label className="remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>로그인 상태 유지</span>
            </label>

            <button type="button" className="text-button">
              비밀번호 찾기
            </button>
          </div>

          {loginError && <p className="field-message error-color">{loginError}</p>}

          <button type="button" className="login-button" disabled={!canLogin} onClick={handleLogin}>
            {isLoading ? "로그인 중..." : "로그인"}
          </button>

          <div className="divider">
            <span />
            <p>또는</p>
            <span />
          </div>

          <button type="button" className="social-button">
            <FcGoogle size={22} />
            Google로 계속하기
          </button>

          <button type="button" className="social-button">
            <FaApple size={22} />
            Apple로 계속하기
          </button>

          <div className="signup-link">
            계정이 없으신가요?
            <button type="button" onClick={() => navigate("/signup")}>
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
