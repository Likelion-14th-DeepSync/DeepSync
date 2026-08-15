import { useEffect, useState } from "react";
import { ChevronRight, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import "./MyScreen.css";

const CONNECT_ITEMS = [
  {
    key: "health",
    title: "건강 앱 연동",
    sub: "미연동",
    status: "연동 안됨",
  },
  {
    key: "wearable",
    title: "웨어러블 기기",
    sub: "미연동",
    status: "연동 안됨",
  },
];

const SETTING_ITEMS = [
  { key: "alarm", title: "알림 설정" },
  { key: "data", title: "데이터 관리" },
  { key: "withdraw", title: "회원 탈퇴" },
];

export default function MyScreen({
  name = "홍길동님",
  userId = "willness_Gildong",
  dDayLeft = 14,
  streakDays = 7,
  activeNav = "my",
  onNavChange,
  onConnectItemClick,
  onSettingItemClick,
  onLogout,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileName, setProfileName] = useState(() => {
    const savedName = localStorage.getItem("deepSyncUserName");
    return savedName ? `${savedName}님` : name;
  });
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("deepSyncUserName");
    if (savedName) {
      setProfileName(`${savedName}님`);
    }
  }, []);

  const currentActiveNav =
    location.pathname === "/home"
      ? "home"
      : location.pathname === "/d-day" || location.pathname === "/dday"
        ? "dday"
        : "my";

  const handleConnectItemClick = (key) => {
    if (key === "wearable") {
      navigate("/my/wearable");
    } else if (key === "health") {
      // 추후 건강 앱 연동 화면 추가
    }
    onConnectItemClick?.(key);
  };

  const handleLogout = () => {
    // localStorage에서 사용자 정보 삭제
    localStorage.removeItem("deepSyncUserName");
    localStorage.removeItem("deepSyncUserNickname");

    // 로그아웃 콜백 실행
    onLogout?.();

    // 로그인 화면으로 리다이렉트
    navigate("/login");
  };

  const handleNavChange = (key) => {
    onNavChange?.(key);

    if (key === "home") {
      navigate("/home");
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
    <div className="phoneWrap">
      <div className="screen">
        <div className="content">
          <div className="pageTitle">My</div>

          {/* Profile card */}
          <div className="profileCard">
            <div className="profileTop">
              <div className="avatar" />
              <div className="profileInfo">
                <div className="profileNameRow">
                  {isEditingName ? (
                    <input
                      className="profileNameInput"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      onBlur={() => {
                        const trimmed = profileName.trim();
                        const nextName = trimmed ? trimmed : name.replace(/님$/, "");

                        setProfileName(`${nextName}님`);
                        localStorage.setItem("deepSyncUserName", nextName);
                        setIsEditingName(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.target.blur();
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="profileName">{profileName}</span>
                  )}
                  <button
                    type="button"
                    className="profileBadge"
                    onClick={() => setIsEditingName(true)}
                  >
                    프로필 수정
                  </button>
                </div>
                <div className="profileId">ID  {userId}</div>
              </div>
            </div>

            <div className="statsRow">
              <div className="statBlock">
                <div className="statLabel">D-Day</div>
                <div className="statValue">{dDayLeft}일 남음</div>
              </div>
              <div className="statBlock">
                <div className="statLabel">연속 기록</div>
                <div className="statValue">{streakDays}일</div>
              </div>
            </div>
          </div>

          {/* 연동 & 기기 */}
          <div className="sectionTitle">연동 &amp; 기기</div>
          <div className="listCard">
            {CONNECT_ITEMS.map((item) => (
              <button
                key={item.key}
                className="listRow"
                onClick={() => handleConnectItemClick(item.key)}
              >
                <div className="listRowLeft">
                  <span className="listRowTitle">{item.title}</span>
                  <span className="listRowSub">{item.sub}</span>
                </div>
                <div className="listRowRight">
                  <span
                    className="statusPill"
                    style={{
                      color: item.status === "연동됨" ? "#2FB380" : "#767676",
                    }}
                  >
                    {item.status}
                  </span>
                  <ChevronRight size={16} className="chevron" />
                </div>
              </button>
            ))}
          </div>

          {/* 설정 */}
          <div className="sectionTitle">설정</div>
          <div className="listCard">
            {SETTING_ITEMS.map((item) => (
              <button
                key={item.key}
                className="plainRow"
                onClick={() => onSettingItemClick?.(item.key)}
              >
                {item.title}
                <ChevronRight size={16} className="chevron" />
              </button>
            ))}
          </div>

          {/* Logout */}
          <button className="logoutBtn" onClick={handleLogout}>
            <LogOut size={16} />
            로그아웃
          </button>

          <div className="footerText">
            개인정보처리방침 | 이용약관
            <br />
            버전 1.0.0
          </div>
        </div>

        <BottomNav
          activeNav={currentActiveNav ?? activeNav}
          onChange={handleNavChange}
        />
      </div>
    </div>
  );
}