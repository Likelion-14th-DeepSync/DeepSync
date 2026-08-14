import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./Splash.css";
import logo from "../../assets/logo1.png";

function Splash() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/login");
        }, 1800);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="splash-page">
            <div className="glow glow-top" />
            <div className="glow glow-bottom" />

            <div className="orb orb-1" />
            <div className="orb orb-2" />

            <span className="sparkle sparkle-1">✦</span>
            <span className="sparkle sparkle-2">✦</span>
            <span className="sparkle sparkle-3">•</span>

            <div className="splash-content">
                <div className="logo-mark">
                    <img
                        src={logo}
                        alt="Wellness Care Logo"
                        className="splash-logo"
                    />
                </div>

                <h1>
                    Wellness <span>Care</span>
                </h1>

                <p>
                    AI 피부 분석으로
                    <br />
                    나만의 피부 루틴을 시작하세요
                </p>
            </div>

            <p className="splash-footer">By AAC</p>
        </div>
    );
}

export default Splash;