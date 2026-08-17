import { useState } from "react";
import { ArrowLeft, Check, Moon, Droplets, Sun, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const INITIAL_ROUTINES = [
  {
    id: 1,
    icon: Moon,
    title: "자정 전에 취침하기",
    desc: "최근 수면 시간이 짧았어요. 오늘은 피부 회복 시간을 충분히 확보해보세요.",
    reason: "수면 시간 ↔ 붉은기",
    done: true,
  },
  {
    id: 2,
    icon: Droplets,
    title: "오후 2시 전에 물 1L 마시기",
    desc: "수분 섭취를 일정하게 유지하면 건조함 관리에 도움이 될 수 있어요.",
    reason: "수분 섭취 ↔ 피부 컨디션",
    done: false,
  },
  {
    id: 3,
    icon: Sun,
    title: "외출 전 자외선 차단제 바르기",
    desc: "오늘 UV가 높은 편이에요. 외출 전 자외선 차단을 추천해요.",
    reason: "UV ↔ 피부톤 균일도",
    done: false,
  },
];

export default function Routine() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState(INITIAL_ROUTINES);

  const toggle = (id) => {
    setRoutines((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const completed = routines.filter((item) => item.done).length;
  const percent = Math.round((completed / routines.length) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#E9E9EE", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 390, height: 844, background: "#F7F7FA", borderRadius: 36, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }}>
        <header style={{ height: 64, background: "#fff", display: "flex", alignItems: "center", padding: "0 18px", borderBottom: "1px solid #F0F0F3" }}>
          <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기" style={{ width: 38, height: 38, border: "none", background: "transparent", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <ArrowLeft size={22} />
          </button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: 700, marginRight: 38 }}>오늘의 AI 루틴</div>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: "20px 18px 28px" }}>
          <section style={{ background: "linear-gradient(135deg, #6C5CE7, #8B7CF6)", color: "#fff", borderRadius: 20, padding: 20, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Sparkles size={18} />
              <strong style={{ fontSize: 15 }}>오늘 기록을 바탕으로 추천했어요</strong>
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5, marginBottom: 15 }}>작은 습관을 하나씩 완료해보세요. 관찰된 생활 기록과 피부 변화의 연관성을 기준으로 구성했어요.</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 7 }}>
              <span>{completed} / {routines.length} 완료</span>
              <span>{percent}%</span>
            </div>
            <div style={{ height: 7, background: "rgba(255,255,255,0.25)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${percent}%`, height: "100%", background: "#fff", borderRadius: 99 }} />
            </div>
          </section>

          <h2 style={{ fontSize: 16, margin: "0 0 12px", color: "#17171A" }}>오늘 해야 할 루틴</h2>
          <div style={{ display: "grid", gap: 11 }}>
            {routines.map(({ id, icon: Icon, title, desc, reason, done }) => (
              <button key={id} type="button" onClick={() => toggle(id)} style={{ textAlign: "left", border: "none", background: "#fff", borderRadius: 17, padding: 16, cursor: "pointer", boxShadow: "0 1px 0 rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 40, height: 40, flex: "0 0 auto", borderRadius: 12, background: "#F0EDFF", color: "#6C5CE7", display: "grid", placeItems: "center" }}><Icon size={20} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <strong style={{ fontSize: 14, color: "#17171A" }}>{title}</strong>
                      <span style={{ width: 23, height: 23, borderRadius: "50%", border: done ? "none" : "2px solid #DCDCE3", background: done ? "#6C5CE7" : "#fff", display: "grid", placeItems: "center", color: "#fff" }}>{done && <Check size={14} strokeWidth={3} />}</span>
                    </div>
                    <p style={{ margin: "7px 0 10px", fontSize: 12, color: "#85858E", lineHeight: 1.5 }}>{desc}</p>
                    <div style={{ fontSize: 11, color: "#6C5CE7", background: "#F7F5FF", display: "inline-block", padding: "5px 8px", borderRadius: 8 }}>근거 · {reason}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p style={{ fontSize: 11, lineHeight: 1.55, color: "#9A9AA3", margin: "18px 4px 0" }}>AI 루틴은 의료적 진단이 아니라 사용자의 기록에서 관찰된 패턴을 바탕으로 제공되는 생활 관리 제안입니다.</p>
        </main>
      </div>
    </div>
  );
}
