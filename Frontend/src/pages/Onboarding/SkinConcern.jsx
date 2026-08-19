import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Check, CircleDot, Sun, HeartPulse, Droplets } from "lucide-react";

import "./Onboarding.css";

const concerns = [
  {
    id: "TROUBLE",
    label: "트러블",
    icon: CircleDot,
  },
  {
    id: "REDNESS",
    label: "홍조",
    icon: HeartPulse,
  },
  {
    id: "DRYNESS",
    label: "건조함",
    icon: Droplets,
  },
  {
    id: "SKIN_TONE",
    label: "피부톤",
    icon: Sun,
  },
];

function SkinConcern() {
  const navigate = useNavigate();
  const location = useLocation();

  const signupData = location.state ?? {};

  const [selected, setSelected] = useState([]);

  const toggleConcern = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
      return;
    }

    if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  };

  const handleNext = () => {
    if (selected.length === 0) return;

    navigate("/onboarding/lifestyle", {
      state: {
        ...signupData,
        concerns: selected,
      },
    });
  };

  const handleBack = () => {
    navigate("/onboarding/skin-type", {
      state: signupData,
    });
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-screen">
        <header className="question-header">
          <button type="button" className="question-back" onClick={handleBack}>
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
          onClick={handleNext}
          disabled={selected.length === 0}
        >
          다음
        </button>
      </div>
    </div>
  );
}

export default SkinConcern;
