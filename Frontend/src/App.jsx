import { BrowserRouter, Routes, Route } from "react-router-dom";

import Splash from "./pages/Splash/Splash";   // 스플래쉬
import Login from "./pages/Login/Login";

import SignupStep1 from "./pages/Login/SignupStep1";
import SignupStep2 from "./pages/Login/SignupStep2";
import SignupComplete from "./pages/Login/SignupComplete";    // 로그인

import OnboardingStart from "./pages/Onboarding/OnboardingStart";   //온보딩
import SkinType from "./pages/Onboarding/SkinType";
import SkinConcern from "./pages/Onboarding/SkinConcern";
import Lifestyle from "./pages/Onboarding/Lifestyle";       // 온보딩 마지막화면

import Home from "./pages/Home/Home";     // 홈 시작

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />   //스플래시

        <Route path="/login" element={<Login />} />   // 로그인


        {/* 회원가입 */}
        <Route path="/signup" element={<SignupStep1 />} />  
        <Route
          path="/signup/step2"
          element={<SignupStep2 />}
        />
        <Route
          path="/signup/complete"
          element={<SignupComplete />}
        />


        {/* 온보딩 */}
        <Route
          path="/onboarding"
          element={<OnboardingStart />}
        />
        <Route
          path="/onboarding/skin-type"
          element={<SkinType />}
        />
        <Route
          path="/onboarding/concern"
          element={<SkinConcern />}
        />
        <Route
          path="/onboarding/lifestyle"
          element={<Lifestyle />}
        />

        {/* 홈 화면 */}
        <Route path="/home" element={<Home />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;