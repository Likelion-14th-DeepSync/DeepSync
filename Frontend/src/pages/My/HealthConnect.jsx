import { useEffect, useState } from "react";
import { ChevronLeft, HeartPulse, Check, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HEALTH_CONNECTION_KEY = "wellness-health-connection";

const HEALTH_PROVIDERS = [
  {
    id: "apple",
    name: "Apple 건강",
    desc: "수면과 활동 데이터를 연동해요.",
    icon: "🍎",
  },
  {
    id: "google",
    name: "Google Fit",
    desc: "건강 및 활동 기록을 연동해요.",
    icon: "❤️",
  },
];

export default function HealthConnect() {
  const navigate = useNavigate();

  const [selectedProvider, setSelectedProvider] = useState("apple");

  const [connection, setConnection] = useState({
    connected: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HEALTH_CONNECTION_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        setConnection(parsed);

        if (parsed.providerId) {
          setSelectedProvider(parsed.providerId);
        }
      }
    } catch {
      setConnection({
        connected: false,
      });
    }
  }, []);

  const handleConnect = () => {
    const provider = HEALTH_PROVIDERS.find((item) => item.id === selectedProvider);

    if (!provider) return;

    const next = {
      connected: true,
      providerId: provider.id,
      provider: provider.name,
      connectedAt: new Date().toISOString(),
    };

    localStorage.setItem(HEALTH_CONNECTION_KEY, JSON.stringify(next));

    setConnection(next);
  };

  const handleDisconnect = () => {
    localStorage.removeItem(HEALTH_CONNECTION_KEY);

    setConnection({
      connected: false,
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#E9E9EE",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 390,
          height: 844,
          background: "#F5F5F7",
          borderRadius: 36,
          overflowY: "auto",
          padding: "24px 20px",
          boxSizing: "border-box",
          boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/my")}
            style={{
              width: 36,
              height: 36,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={24} />
          </button>

          <h1
            style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 700,
            }}
          >
            건강 앱 연동
          </h1>
        </header>

        <section
          style={{
            padding: 20,
            marginBottom: 22,
            background: "#F0EDFF",
            borderRadius: 18,
          }}
        >
          <HeartPulse size={28} color="#6C5CE7" />

          <h2
            style={{
              margin: "12px 0 6px",
              fontSize: 16,
            }}
          >
            생활 데이터를 자동으로 기록해요
          </h2>

          <p
            style={{
              margin: 0,
              color: "#777",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            건강 앱의 수면 및 활동 정보를 Wellness Care의 생활 기록과 연결할 수 있어요.
          </p>
        </section>

        <h2
          style={{
            margin: "0 0 12px",
            fontSize: 15,
          }}
        >
          연동할 건강 앱
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {HEALTH_PROVIDERS.map((provider) => {
            const selected = selectedProvider === provider.id;

            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => !connection.connected && setSelectedProvider(provider.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 15,
                  border: selected ? "1.5px solid #6C5CE7" : "1px solid transparent",
                  borderRadius: 15,
                  background: "#fff",
                  textAlign: "left",
                  cursor: connection.connected ? "default" : "pointer",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "#F5F5F7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  {provider.icon}
                </div>

                <div
                  style={{
                    flex: 1,
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: 14,
                      color: "#111",
                    }}
                  >
                    {provider.name}
                  </strong>

                  <span
                    style={{
                      fontSize: 10,
                      color: "#999",
                    }}
                  >
                    {provider.desc}
                  </span>
                </div>

                {selected && <Check size={19} color="#6C5CE7" />}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 13,
            background: "#fff",
            display: "flex",
            gap: 10,
          }}
        >
          <Smartphone size={18} color="#6C5CE7" />

          <p
            style={{
              margin: 0,
              fontSize: 10,
              lineHeight: 1.6,
              color: "#888",
            }}
          >
            현재는 해커톤 MVP용 연동 시뮬레이션입니다. 실제 서비스에서는 사용자 동의를 받은 건강
            데이터만 불러오게 됩니다.
          </p>
        </div>

        <button
          type="button"
          onClick={connection.connected ? handleDisconnect : handleConnect}
          style={{
            width: "100%",
            marginTop: 24,
            padding: "14px 0",
            border: "none",
            borderRadius: 14,
            background: connection.connected ? "#F0F0F3" : "#6C5CE7",
            color: connection.connected ? "#777" : "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {connection.connected ? `${connection.provider} 연동 해제` : "건강 앱 연동하기"}
        </button>

        {connection.connected && (
          <div
            style={{
              marginTop: 12,
              textAlign: "center",
              fontSize: 11,
              color: "#2FB380",
              fontWeight: 600,
            }}
          >
            ✓ {connection.provider} 연동 완료
          </div>
        )}
      </div>
    </div>
  );
}
