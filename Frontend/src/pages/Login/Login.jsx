import { useNavigate } from "react-router-dom";
import "./Login.css";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

function Login() {
  const navigate = useNavigate();

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
            <label>이메일</label>
            <input type="email" placeholder="이메일을 입력하세요" />
          </div>

          <div className="input-group">
            <label>비밀번호</label>
            <input type="password" placeholder="비밀번호를 입력하세요" />
          </div>

          <div className="login-options">
            <label className="remember">
              <input type="checkbox" />
              <span>로그인 상태 유지</span>
            </label>

            <button className="text-button">비밀번호 찾기</button>
          </div>

          <button className="login-button">로그인</button>

          <div className="divider">
            <span />
            <p>또는</p>
            <span />
          </div>

          <button className="social-button">
            <FcGoogle size={22} />
            Google로 계속하기
          </button>

          <button className="social-button">
            <FaApple size={22} />
            Apple로 계속하기
          </button>

          <div className="signup-link">
            계정이 없으신가요?
            <button onClick={() => navigate("/signup")}>회원가입</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
