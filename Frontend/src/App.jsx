import { BrowserRouter, Routes, Route } from "react-router-dom";

import Splash from "./pages/Splash/Splash";
import Login from "./pages/Login/Login";

import SignupStep1 from "./pages/Login/SignupStep1";
import SignupStep2 from "./pages/Login/SignupStep2";
import SignupComplete from "./pages/Login/SignupComplete";

import OnboardingStart from "./pages/Onboarding/OnboardingStart";
import SkinType from "./pages/Onboarding/SkinType";
import SkinConcern from "./pages/Onboarding/SkinConcern";
import Lifestyle from "./pages/Onboarding/Lifestyle";

import Home from "./pages/Home/Home";
import Record from "./pages/Record/Record";
import Dday from "./pages/DDay/Dday";
import AI from "./pages/AI/Ai";

import MyScreen from "./pages/My/MyScreen";
import Wearable from "./pages/My/Wearable";
import HealthConnect from "./pages/My/HealthConnect";

import Routine from "./pages/AI/Routine";

import ExperimentDetail from "./pages/Experiment/ExperimentDetail";
import ExperimentStart from "./pages/Experiment/ExperimentStart";

import NotificationSettings from "./pages/My/NotificationSettings";
import DataManagement from "./pages/My/DataManagement";
import Withdraw from "./pages/My/Withdraw";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Splash */}
        <Route path="/" element={<Splash />} />

        {/* 로그인 */}
        <Route path="/login" element={<Login />} />

        {/* 회원가입 */}
        <Route path="/signup" element={<SignupStep1 />} />

        <Route path="/signup/step2" element={<SignupStep2 />} />

        <Route path="/signup/complete" element={<SignupComplete />} />

        {/* 온보딩 */}
        <Route path="/onboarding" element={<OnboardingStart />} />

        <Route path="/onboarding/skin-type" element={<SkinType />} />

        <Route path="/onboarding/concern" element={<SkinConcern />} />

        <Route path="/onboarding/lifestyle" element={<Lifestyle />} />

        {/* 홈 */}
        <Route path="/home" element={<Home />} />

        {/* 기록 */}
        <Route path="/record" element={<Record />} />

        {/* D-Day */}
        <Route path="/d-day" element={<Dday />} />

        <Route path="/dday" element={<Dday />} />

        {/* AI */}
        <Route path="/ai" element={<AI />} />

        <Route path="/ai/routine" element={<Routine />} />

        {/* 마이 */}
        <Route path="/my" element={<MyScreen />} />

        <Route path="/my/health" element={<HealthConnect />} />

        <Route path="/my/wearable" element={<Wearable />} />

        {/* 생활 실험 */}
        <Route path="/experiment/start" element={<ExperimentStart />} />

        <Route path="/experiment/:id" element={<ExperimentDetail />} />

        <Route path="/my/notifications" element={<NotificationSettings />} />

        <Route path="/my/data" element={<DataManagement />} />

        <Route path="/my/withdraw" element={<Withdraw />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
