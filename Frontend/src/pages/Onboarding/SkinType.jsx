import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Check,
  Droplets,
  Sparkles,
  Layers3,
  ShieldAlert,
  CircleHelp,
} from "lucide-react";

import "./Onboarding.css";

const skinTypes = [
  {
    id: "dry",
    title: "건성",
    description: "피부가 건조하고\n당김이 느껴져요",
    icon: Droplets,
  },
  {
    id: "oily",
    title: "지성",
    description: "피부에 유분이 많고\n번들거려요",
    icon: Sparkles,
  },
  {
    id: "combination",
    title: "복합성",
    description: "T존은 지성, U존은\n건조한 편이에요",
    icon: Layers3,
  },
  {
    id: "sensitive",
    title: "민감성",
    description: "자극에 쉽게 붉어지고\n예민해요",
    icon: ShieldAlert,
  },
  {
    id: "unknown",
    title: "잘 모르겠어요",
    description: "정확히 모르겠어요",
    icon: CircleHelp,
  },
];

function SkinType() {
  const navigate = useNavigate();
  const location = useLocation();

  const signupData = location.state ?? {};

  const [selected, setSelected] = useState("dry");

  const handleNext = () => {
    navigate("/onboarding/concern", {
      state: {
        ...signupData,
        skinType: selected,
      },
    });
  };

  const handleBack = () => {
    navigate("/onboarding", {
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
            <span className="question-dot active" />
            <span className="question-dot" />
            <span className="question-dot" />
          </div>
        </header>

        <section className="question-title">
          <h1>당신의 피부 타입은?</h1>
          <p>정확한 분석을 위해 알려주세요.</p>
        </section>

        <div className="skin-type-list">
          {skinTypes.map((item) => {
            const Icon = item.icon;
            const isSelected = selected === item.id;

            return (
              <button
                type="button"
                key={item.id}
                className={`skin-type-card ${isSelected ? "selected" : ""}`}
                onClick={() => setSelected(item.id)}
              >
                <div className={`type-icon ${item.id} ${isSelected ? "selected-icon" : ""}`}>
                  <Icon size={25} strokeWidth={2.2} />
                </div>

                <div className="skin-type-copy">
                  <strong>{item.title}</strong>

                  <p>
                    {item.description.split("\n").map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < item.description.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                </div>

                {isSelected && (
                  <span className="skin-check">
                    <Check size={15} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button type="button" className="onboarding-bottom-button" onClick={handleNext}>
          다음
        </button>
      </div>
    </div>
  );
}

export default SkinType;
