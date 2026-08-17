import { useState } from "react";
import { ChevronLeft, UserX, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Withdraw() {
  const navigate = useNavigate();

  const [checked, setChecked] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canWithdraw = checked && confirmText.trim() === "회원탈퇴";

  const handleWithdraw = () => {
    if (!canWithdraw) return;

    const finalConfirm = window.confirm("정말 회원 탈퇴할까요?\n모든 로컬 데이터가 삭제됩니다.");

    if (!finalConfirm) return;

    /*
      MVP용:
      Wellness Care 관련 localStorage 전체 삭제
    */
    const keysToDelete = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);

      if (key?.startsWith("wellness-") || key?.startsWith("deepSync")) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      localStorage.removeItem(key);
    });

    navigate("/login", {
      replace: true,
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
            회원 탈퇴
          </h1>
        </header>

        <section
          style={{
            padding: 20,
            marginBottom: 20,
            background: "#FFF2F3",
            borderRadius: 18,
          }}
        >
          <UserX size={28} color="#E35D6A" />

          <h2
            style={{
              margin: "12px 0 6px",
              fontSize: 16,
              color: "#222",
            }}
          >
            탈퇴하기 전에 확인해주세요
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: 11,
              lineHeight: 1.7,
              color: "#777",
            }}
          >
            회원 탈퇴 후에는 피부 기록, 생활 기록, D-Day, 생활 실험 등의 데이터가 삭제되며 복구할 수
            없어요.
          </p>
        </section>

        <div
          style={{
            padding: 16,
            marginBottom: 16,
            background: "#fff",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle size={18} color="#E35D6A" />

            <div>
              <strong
                style={{
                  display: "block",
                  marginBottom: 5,
                  fontSize: 12,
                  color: "#333",
                }}
              >
                삭제되는 데이터
              </strong>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: 17,
                  fontSize: 10,
                  lineHeight: 1.7,
                  color: "#888",
                }}
              >
                <li>프로필 및 회원 정보</li>
                <li>피부 사진과 분석 결과</li>
                <li>생활 기록</li>
                <li>D-Day 및 일정</li>
                <li>생활 실험 데이터</li>
              </ul>
            </div>
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 9,
            padding: 14,
            marginBottom: 18,
            background: "#fff",
            borderRadius: 14,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{
              marginTop: 2,
            }}
          />

          <span
            style={{
              fontSize: 11,
              lineHeight: 1.55,
              color: "#555",
            }}
          >
            위 내용을 확인했으며 회원 탈퇴 시 데이터가 복구되지 않는 것에 동의합니다.
          </span>
        </label>

        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontSize: 11,
            fontWeight: 600,
            color: "#333",
          }}
        >
          확인을 위해 <strong>회원탈퇴</strong>를 입력해주세요.
        </label>

        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="회원탈퇴"
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: 18,
            boxSizing: "border-box",
            border: "1px solid #E5E5EA",
            borderRadius: 12,
            outline: "none",
            fontSize: 13,
          }}
        />

        <button
          type="button"
          disabled={!canWithdraw}
          onClick={handleWithdraw}
          style={{
            width: "100%",
            padding: "14px 0",
            border: "none",
            borderRadius: 13,
            background: canWithdraw ? "#E35D6A" : "#E6E6EA",
            color: canWithdraw ? "#fff" : "#AAA",
            fontSize: 13,
            fontWeight: 700,
            cursor: canWithdraw ? "pointer" : "default",
          }}
        >
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}
