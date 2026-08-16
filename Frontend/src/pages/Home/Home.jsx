import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const active =
    location.pathname === "/my"
      ? "my"
      : location.pathname === "/d-day" || location.pathname === "/dday"
        ? "dday"
        : location.pathname === "/ai"
          ? "ai"
          : "home";

  const handleNavChange = (key) => {
    if (key === "dday") {
      navigate("/dday");
      return;
    }

    if (key === "ai") {
      navigate("/ai");
      return;
    }

    if (key === "home") {
      navigate("/home");
      return;
    }

    if (key === "my") {
      navigate("/my");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#E9E9EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: 390,
          height: 844,
          background: "#F5F5F7",
          borderRadius: 36,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            fontWeight: "700",
            color: "#111",
          }}
        >
          Home
        </div>

        <BottomNav activeNav={active} onChange={handleNavChange} />
      </div>
    </div>
  );
}

export default Home;
