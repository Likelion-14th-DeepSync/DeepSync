import SwiftUI

struct RootView: View {
    @StateObject private var session = SessionStore()
    @AppStorage("hasSeenIntro") private var hasSeenIntro = false
    @AppStorage("hasCompletedProfileOnboarding") private var hasCompletedProfileOnboarding = false
    @State private var showSplash = true

    /// 시뮬레이터에서 특정 화면만 띄워 확인하기 위한 값 (DEBUG 전용)
    private var forcedScreen: String? {
        #if DEBUG
        return ProcessInfo.processInfo.environment["DEV_SCREEN"]
        #else
        return nil
        #endif
    }

    var body: some View {
        Group {
            #if DEBUG
            if let forcedScreen {
                switch forcedScreen {
                case "signup": NavigationStack { SignUpFlowView() }
                case "onboarding": OnboardingProfileFlow()
                case "intro": OnboardingView(hasSeenIntro: $hasSeenIntro)
                case "splash": SplashView()
                case "camera": CameraGuideView()
                case "selftest": SkinVisionSelfTestView()
                case "report": NavigationStack { ReportView() }
                case "reminders": NavigationStack { ReminderSettingsView() }
                case "gallery": NavigationStack { PhotoGalleryView() }
                case "chat": NavigationStack {
                    AIChatView(presetQuestion: ProcessInfo.processInfo.environment["DEV_CHAT_Q"])
                }
                case "wearable": NavigationStack { WearableView() }
                case "result": NavigationStack { DebugLatestResultView() }
                case "experiment": NavigationStack { DebugExperimentResultView() }
                case "widgets1": WidgetGalleryView(page: .one)
                case "widgets2": WidgetGalleryView(page: .two)
                case "widgets3": WidgetGalleryView(page: .lock)
                case "ai": AIHomeView(onClose: {})
                default: AuthView()
                }
            } else {
                mainFlow
            }
            #else
            mainFlow
            #endif
        }
        .environmentObject(session)
        .tint(Theme.primary)
        // 팔레트가 라이트 기준으로만 정의돼 있어 다크 모드에서 대비가 깨진다.
        // 다크 팔레트를 만들기 전까지는 라이트로 고정한다.
        .preferredColorScheme(.light)
        .task {
            SnapshotPublisher.shared.warmUp()
            await session.refreshProfile()
        }
    }

    @ViewBuilder
    private var mainFlow: some View {
        Group {
            if showSplash {
                SplashView()
                    .task {
                        try? await Task.sleep(nanoseconds: 1_200_000_000)
                        withAnimation { showSplash = false }
                    }
            } else if !hasSeenIntro {
                OnboardingView(hasSeenIntro: $hasSeenIntro)
            } else if !session.isSignedIn {
                AuthView()
            } else if !hasCompletedProfileOnboarding {
                OnboardingProfileFlow()
            } else {
                MainTabView()
            }
        }
    }
}

#Preview {
    RootView()
}
