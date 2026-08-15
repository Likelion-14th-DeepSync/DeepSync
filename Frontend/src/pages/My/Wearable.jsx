import { ChevronLeft, MoreHorizontal, Watch, Flame, HeartPulse, Moon, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Wearable.css";

const LIFESTYLE_DATA = [
  {
    key: "calories",
    label: "활동 소모 칼로리",
    value: "320 kcal",
    status: "완료",
    statusColor: "#767676",
    icon: Flame,
    iconColor: "#F5A623",
    iconBg: "rgba(245,166,35,0.12)",
  },
  {
    key: "heartRate",
    label: "평균 심박수",
    value: "62 bpm",
    status: "정상",
    statusColor: "#2FB380",
    icon: HeartPulse,
    iconColor: "#6C5CE7",
    iconBg: "rgba(108,92,231,0.12)",
  },
  {
    key: "sleep",
    label: "수면 시간",
    value: "7시간 30분",
    status: "적정",
    statusColor: "#4A90E2",
    icon: Moon,
    iconColor: "#4A90E2",
    iconBg: "rgba(74,144,226,0.12)",
  },
  {
    key: "hrv",
    label: "심박변이도 (HRV)",
    value: "68 ms",
    status: "안정",
    statusColor: "#EB5757",
    icon: Heart,
    iconColor: "#EB5757",
    iconBg: "rgba(235,87,87,0.12)",
  },
];

export default function WearableDeviceScreen({
  deviceName = "Apple Watch Series 9",
  connected = false,
  data = LIFESTYLE_DATA,
  onBack,
  onMore,
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/my");
    }
  };

  return (
    <div className="phoneWrap">
      <div className="screen">
        <div className="header">
          <button className="headerBtn" onClick={handleBack}>
            <ChevronLeft size={22} />
          </button>
          <div className="headerTitle">웨어러블 기기</div>
          <button className="headerBtn" onClick={onMore}>
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="content">
          {/* Connected device card */}
          <div className="deviceCard">
            <div className="deviceLeft">
              <div className="deviceIcon">
                <Watch size={20} color="#6C5CE7" />
              </div>
              <div>
                <div className="deviceLabel">{connected ? "연동 활성화됨" : "연동 비활성화됨"}</div>
                <div className="deviceName">{deviceName}</div>
              </div>
            </div>
            <span
              className="connectedPill"
              style={{
                color: connected ? "#2FB380" : "#767676",
                background: connected ? "rgba(47, 179, 128, 0.12)" : "rgba(118, 118, 118, 0.12)",
              }}
            >
              {connected ? "연결 완료" : "연결 안됨"}
            </span>
          </div>

          {/* Lifestyle data */}
          <div className="sectionTitle">가져온 라이프스타일 데이터</div>

          {data.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="dataCard">
                <div className="dataLeft">
                  <div className="dataIcon" style={{ background: item.iconBg }}>
                    <Icon size={18} color={item.iconColor} />
                  </div>
                  <div>
                    <div className="dataLabel">{item.label}</div>
                    <div className="dataValue">{item.value}</div>
                  </div>
                </div>
                <span className="dataStatus" style={{ color: item.statusColor }}>
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}