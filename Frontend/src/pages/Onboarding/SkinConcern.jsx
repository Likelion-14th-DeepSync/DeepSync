import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Check,
  CircleDot,
  ScanFace,
  Sun,
  Waves,
  HeartPulse,
  Activity,
  Eye,
  Droplets,
} from "lucide-react";

import "./Onboarding.css";

const concerns = [
  {
    id: "acne",
    label: "여드름",
    icon: CircleDot,
  },
  {
    id: "pores",
    label: "모공",
    icon: ScanFace,
  },
  {
    id: "blemish",
    label: "잡티",
    icon: Sun,
  },
  {
    id: "wrinkle",
    label: "주름",
    icon: Waves,
  },
  {
    id: "redness",
    label: "홍조",
    icon: HeartPulse,
  },
  {
    id: "elasticity",
    label: "탄력",
    icon: Activity,
  },
  {
    id: "darkcircle",
    label: "다크서클",
    icon: Eye,
  },
  {
    id: "dryness",
    label: "건조함",
    icon: Droplets,
  },
];

function SkinConcern() {
  const navigate = useNavigate();

  const [selected, setSelected] = useState(["acne", "pores", "blemish"]);

  const toggleConcern = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
      return;
    }

    if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-screen">
        <header className="question-header">
          <button
            type="button"
            className="question-back"
            onClick={() => navigate("/onboarding/skin-type")}
          >
            <ChevronLeft size={24} />
            <span>뒤로</span>
          </button>

          <div className="question-dots">
            <span className="question-dot" />
            <span className="question-dot active" />
            <span className="question-dot" />
          </div>
        </header>

        <section className="question-title concern-title">
          <h1>
            가장 고민되는 피부 문제를
            <br />
            선택해주세요.
          </h1>

          <p>최대 3개까지 선택할 수 있어요.</p>
        </section>

        <div className="concern-grid">
          {concerns.map((item) => {
            const Icon = item.icon;
            const isSelected = selected.includes(item.id);

            return (
              <button
                type="button"
                key={item.id}
                className={`concern-card ${isSelected ? "selected" : ""}`}
                onClick={() => toggleConcern(item.id)}
              >
                {isSelected && (
                  <span className="concern-check">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}

                <div className={`concern-type-icon ${item.id}`}>
                  <Icon size={25} strokeWidth={2.1} />
                </div>

                <span className="concern-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="onboarding-bottom-button"
          onClick={() =>
            navigate("/onboarding/lifestyle", {
              state: {
                concerns: selected,
              },
            })
          }
        >
          다음
        </button>
      </div>
    </div>
  );
}

export default SkinConcern;
