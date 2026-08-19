import { useEffect, useRef, useState } from "react";
import { ChevronRight, Camera, X, Check } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import BottomNav from "../../components/BottomNav";

import { getMyProfile, updateMyProfile } from "../../api/user";

import { getDdayDashboard } from "../../api/dashboard";

import "./MyScreen.css";

const DAILY_RECORD_STORAGE_KEY = "wellness-daily-records";

const PROFILE_NAME_KEY = "deepSyncUserName";

const HOME_NAME_KEY = "wellness-user-name";

const PROFILE_IMAGE_KEY = "wellness-profile-image";

const HEALTH_CONNECTION_KEY = "wellness-health-connection";

const WEARABLE_CONNECTION_KEY = "wellness-wearable-connection";

const SETTING_ITEMS = [
  {
    key: "alarm",
    title: "알림 설정",
  },
  {
    key: "data",
    title: "데이터 관리",
  },
  {
    key: "withdraw",
    title: "회원 탈퇴",
  },
];

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function readConnection(key) {
  try {
    const saved = localStorage.getItem(key);

    return saved
      ? JSON.parse(saved)
      : {
          connected: false,
        };
  } catch {
    return {
      connected: false,
    };
  }
}

function calculateStreak() {
  try {
    const saved = localStorage.getItem(DAILY_RECORD_STORAGE_KEY);

    const records = saved ? JSON.parse(saved) : {};

    if (!records || typeof records !== "object") {
      return 0;
    }

    const recordDates = Object.entries(records)
      .filter(([, record]) => {
        if (!record) {
          return false;
        }

        const hasSkin = Boolean(record.skinScore) || Boolean(record.photoDataUrl);

        const hasLifeLog = Array.isArray(record.lifeLog) && record.lifeLog.length > 0;

        return hasSkin || hasLifeLog;
      })
      .map(([date]) => date);

    if (recordDates.length === 0) {
      return 0;
    }

    const recordSet = new Set(recordDates);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    let cursor = new Date(today);

    if (!recordSet.has(getLocalDateKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);

      if (!recordSet.has(getLocalDateKey(cursor))) {
        return 0;
      }
    }

    let streak = 0;

    while (recordSet.has(getLocalDateKey(cursor))) {
      streak += 1;

      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  } catch {
    return 0;
  }
}

export default function MyScreen({
  name = "사용자님",
  userId = "wellness_user",
  activeNav = "my",
  onNavChange,
  onSettingItemClick,
  onLogout,
}) {
  const navigate = useNavigate();

  const location = useLocation();

  const fileInputRef = useRef(null);

  const [memberId, setMemberId] = useState(null);

  const [profileName, setProfileName] = useState(name);

  const [editName, setEditName] = useState(name.replace(/님$/, ""));

  const [skinConcerns, setSkinConcerns] = useState([]);

  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem(PROFILE_IMAGE_KEY) || "";
  });

  const [editImage, setEditImage] = useState(() => {
    return localStorage.getItem(PROFILE_IMAGE_KEY) || "";
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [dDayInfo, setDDayInfo] = useState({
    label: "-",
    daysLeft: null,
  });

  const [streakDays, setStreakDays] = useState(() => calculateStreak());

  const [healthConnection, setHealthConnection] = useState(() =>
    readConnection(HEALTH_CONNECTION_KEY),
  );

  const [wearableConnection, setWearableConnection] = useState(() =>
    readConnection(WEARABLE_CONNECTION_KEY),
  );

  /*
    내 프로필 조회
  */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getMyProfile();

        console.log("마이페이지 프로필:", response);

        const nickname = response.data?.nickname ?? "사용자";

        const concerns = response.data?.skinConcerns ?? [];

        setMemberId(response.data?.memberId ?? null);

        setProfileName(`${nickname}님`);

        setEditName(nickname);

        setSkinConcerns(concerns);

        localStorage.setItem(PROFILE_NAME_KEY, nickname);

        localStorage.setItem(HOME_NAME_KEY, nickname);
      } catch (error) {
        console.error("마이페이지 프로필 조회 실패:", error);

        const savedName =
          localStorage.getItem(PROFILE_NAME_KEY) || localStorage.getItem(HOME_NAME_KEY);

        if (savedName) {
          setProfileName(`${savedName}님`);

          setEditName(savedName);
        }
      }
    };

    fetchProfile();
  }, [location.key]);

  /*
    실제 서버 D-Day
  */
  useEffect(() => {
    const fetchDday = async () => {
      try {
        const response = await getDdayDashboard("SEVEN_DAYS");

        console.log("마이 D-Day:", response);

        const goal = response.data?.goal;

        if (!goal) {
          setDDayInfo({
            label: "-",
            daysLeft: null,
          });

          return;
        }

        setDDayInfo({
          label:
            goal.dayLabel ??
            (goal.daysRemaining === 0
              ? "D-Day"
              : goal.daysRemaining > 0
                ? `D-${goal.daysRemaining}`
                : `D+${Math.abs(goal.daysRemaining)}`),

          daysLeft: goal.daysRemaining ?? null,
        });
      } catch (error) {
        console.error("마이 D-Day 조회 실패:", error);

        setDDayInfo({
          label: "-",
          daysLeft: null,
        });
      }
    };

    fetchDday();
  }, [location.key]);

  useEffect(() => {
    const savedImage = localStorage.getItem(PROFILE_IMAGE_KEY) || "";

    setProfileImage(savedImage);

    setEditImage(savedImage);

    setStreakDays(calculateStreak());

    setHealthConnection(readConnection(HEALTH_CONNECTION_KEY));

    setWearableConnection(readConnection(WEARABLE_CONNECTION_KEY));
  }, [location.key]);

  const currentActiveNav =
    location.pathname === "/home"
      ? "home"
      : location.pathname === "/record"
        ? "record"
        : location.pathname === "/d-day" || location.pathname === "/dday"
          ? "dday"
          : location.pathname === "/ai"
            ? "ai"
            : "my";

  const handleLogout = () => {
    localStorage.removeItem("accessToken");

    localStorage.removeItem("tokenType");

    localStorage.removeItem("expiresIn");

    localStorage.removeItem("rememberLogin");

    localStorage.removeItem(PROFILE_NAME_KEY);

    localStorage.removeItem(HOME_NAME_KEY);

    localStorage.removeItem("deepSyncUserNickname");

    onLogout?.();

    navigate("/login");
  };

  const handleNavChange = (key) => {
    onNavChange?.(key);

    if (key === "home") {
      return navigate("/home");
    }

    if (key === "record") {
      return navigate("/record");
    }

    if (key === "ai") {
      return navigate("/ai");
    }

    if (key === "dday") {
      return navigate("/dday");
    }

    if (key === "my") {
      return navigate("/my");
    }
  };

  const openProfileModal = () => {
    setEditName(profileName.replace(/님$/, ""));

    setEditImage(profileImage);

    setIsProfileModalOpen(true);
  };

  const handleProfileImageSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일을 선택해주세요.");

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditImage(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = () => {
    setEditImage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();

    if (trimmedName.length < 2) {
      alert("이름을 2자 이상 입력해주세요.");

      return;
    }

    if (isSavingProfile) {
      return;
    }

    try {
      setIsSavingProfile(true);

      const response = await updateMyProfile({
        nickname: trimmedName,

        skinConcerns,
      });

      console.log("프로필 수정 성공:", response);

      const updatedNickname = response.data?.nickname ?? trimmedName;

      setProfileName(`${updatedNickname}님`);

      setEditName(updatedNickname);

      localStorage.setItem(PROFILE_NAME_KEY, updatedNickname);

      localStorage.setItem(HOME_NAME_KEY, updatedNickname);

      /*
          프로필 사진 API가 아직 없어서
          사진만 localStorage
        */
      if (editImage) {
        localStorage.setItem(PROFILE_IMAGE_KEY, editImage);
      } else {
        localStorage.removeItem(PROFILE_IMAGE_KEY);
      }

      setProfileImage(editImage);

      setIsProfileModalOpen(false);
    } catch (error) {
      console.error("프로필 수정 실패:", error);

      const message = error.response?.data?.error?.message ?? "프로필 수정에 실패했습니다.";

      alert(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const connectItems = [
    {
      key: "health",
      title: "건강 앱 연동",

      sub: healthConnection.connected ? healthConnection.provider : "미연동",

      status: healthConnection.connected ? "연동됨" : "연동 안됨",
    },

    {
      key: "wearable",
      title: "웨어러블 기기",

      sub: wearableConnection.connected ? wearableConnection.device : "미연동",

      status: wearableConnection.connected ? "연동됨" : "연동 안됨",
    },
  ];

  return (
    <div className="phoneWrap">
      <div className="screen">
        <div className="content">
          <div className="pageTitle">My</div>

          <div className="profileCard">
            <div className="profileTop">
              <div
                className="avatar"
                style={{
                  overflow: "hidden",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  background: profileImage ? "#eee" : "#F0EDFF",

                  color: "#6C5CE7",
                }}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="프로필"
                    style={{
                      width: "100%",

                      height: "100%",

                      objectFit: "cover",

                      display: "block",
                    }}
                  />
                ) : (
                  <Camera size={20} strokeWidth={1.7} />
                )}
              </div>

              <div className="profileInfo">
                <div className="profileNameRow">
                  <span className="profileName">{profileName}</span>

                  <button type="button" className="profileBadge" onClick={openProfileModal}>
                    프로필 수정
                  </button>
                </div>

                <div className="profileId">ID {memberId ?? userId}</div>
              </div>
            </div>

            <div className="statsRow">
              <button type="button" className="statBlock" onClick={() => navigate("/dday")}>
                <div className="statLabel">D-Day</div>

                <div className="statValue">{dDayInfo.label}</div>
              </button>

              <button
                type="button"
                className="statBlock"
                onClick={() => navigate("/record?tab=calendar")}
              >
                <div className="statLabel">연속 기록</div>

                <div className="statValue">{streakDays}일</div>
              </button>
            </div>
          </div>

          <div className="sectionTitle">연동 &amp; 기기</div>

          <div className="listCard">
            {connectItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className="listRow"
                onClick={() => {
                  if (item.key === "health") {
                    navigate("/my/health");
                  }

                  if (item.key === "wearable") {
                    navigate("/my/wearable");
                  }
                }}
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

          <div className="sectionTitle">설정</div>

          <div className="listCard">
            {SETTING_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className="plainRow"
                onClick={() => {
                  if (item.key === "alarm") {
                    navigate("/my/notifications");

                    return;
                  }

                  if (item.key === "data") {
                    navigate("/my/data");

                    return;
                  }

                  if (item.key === "withdraw") {
                    navigate("/my/withdraw");

                    return;
                  }

                  onSettingItemClick?.(item.key);
                }}
              >
                {item.title}

                <ChevronRight size={16} className="chevron" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: "100%",

              marginTop: 18,

              padding: "13px 0",

              border: "none",

              borderRadius: 12,

              background: "#F8F8FC",

              color: "#666",

              fontSize: 13,

              fontWeight: 600,

              cursor: "pointer",
            }}
          >
            로그아웃
          </button>

          <div className="footerText">
            개인정보처리방침 | 이용약관
            <br />
            버전 1.0.0
          </div>
        </div>

        <BottomNav activeNav={currentActiveNav ?? activeNav} onChange={handleNavChange} />

        {isProfileModalOpen && (
          <div
            onClick={() => setIsProfileModalOpen(false)}
            style={{
              position: "absolute",

              inset: 0,

              zIndex: 100,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              padding: 20,

              background: "rgba(0,0,0,0.38)",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",

                maxWidth: 340,

                padding: 20,

                boxSizing: "border-box",

                borderRadius: 20,

                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",

                  justifyContent: "space-between",

                  alignItems: "center",

                  marginBottom: 20,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: "0 0 3px",

                      fontSize: 18,
                    }}
                  >
                    프로필 수정
                  </h2>

                  <span
                    style={{
                      fontSize: 10,

                      color: "#999",
                    }}
                  >
                    이름과 프로필 사진을 변경할 수 있어요.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  style={{
                    width: 32,

                    height: 32,

                    border: "none",

                    borderRadius: "50%",

                    background: "#F5F5F7",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",

                  flexDirection: "column",

                  alignItems: "center",

                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    width: 84,

                    height: 84,

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",

                    overflow: "hidden",

                    marginBottom: 10,

                    borderRadius: "50%",

                    background: "#F0EDFF",

                    color: "#6C5CE7",
                  }}
                >
                  {editImage ? (
                    <img
                      src={editImage}
                      alt="프로필 미리보기"
                      style={{
                        width: "100%",

                        height: "100%",

                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Camera size={28} />
                  )}
                </div>

                <div
                  style={{
                    display: "flex",

                    gap: 7,
                  }}
                >
                  <button type="button" onClick={() => fileInputRef.current?.click()}>
                    사진 선택
                  </button>

                  {editImage && (
                    <button type="button" onClick={handleRemoveProfileImage}>
                      사진 삭제
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageSelect}
                  style={{
                    display: "none",
                  }}
                />
              </div>

              <div
                style={{
                  marginBottom: 22,
                }}
              >
                <label
                  htmlFor="profile-name"
                  style={{
                    display: "block",

                    marginBottom: 7,

                    fontSize: 12,

                    fontWeight: 600,
                  }}
                >
                  이름
                </label>

                <input
                  id="profile-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: "100%",

                    padding: "11px 12px",

                    boxSizing: "border-box",

                    border: "1px solid #E5E5EA",

                    borderRadius: 11,
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                style={{
                  width: "100%",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  gap: 6,

                  padding: "13px 0",

                  border: "none",

                  borderRadius: 12,

                  background: "#6C5CE7",

                  color: "#fff",

                  fontWeight: 600,

                  opacity: isSavingProfile ? 0.65 : 1,
                }}
              >
                <Check size={16} />

                {isSavingProfile ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
