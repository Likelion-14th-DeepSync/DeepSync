import SwiftUI

enum AppTab: Int, CaseIterable, Identifiable {
    case home, record, dday, my
    var id: Int { rawValue }

    var label: String {
        switch self {
        case .home: return "홈"
        case .record: return "기록"
        case .dday: return "D-Day"
        case .my: return "마이"
        }
    }

    var icon: String {
        switch self {
        case .home: return "house"
        case .record: return "doc.text"
        case .dday: return "calendar"
        case .my: return "person"
        }
    }
}

struct MainTabView: View {
    @State private var selection: AppTab = MainTabView.initialTab
    @State private var showAI = MainTabView.opensAI
    @State private var showCapture = false

    /// 시뮬레이터 화면 확인용 (DEBUG 전용)
    static var opensAI: Bool {
        #if DEBUG
        return ProcessInfo.processInfo.environment["DEV_TAB"] == "ai"
        #else
        return false
        #endif
    }

    static var initialTab: AppTab {
        #if DEBUG
        switch ProcessInfo.processInfo.environment["DEV_TAB"] {
        case "record": return .record
        case "dday": return .dday
        case "my": return .my
        default: return .home
        }
        #else
        return .home
        #endif
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                switch selection {
                case .home: HomeView()
                case .record: RecordView()
                case .dday: DDayView()
                case .my: MyView()
                }
            }

            AppTabBar(selection: $selection) { showAI = true }
        }
        .ignoresSafeArea(.keyboard)
        .onOpenURL { url in
            // 위젯에서 넘어온 skinsense:// 링크
            switch url.host {
            case "record": selection = .record
            case "dday": selection = .dday
            case "my": selection = .my
            case "capture":
                selection = .home
                showCapture = true
            default: selection = .home
            }
        }
        .fullScreenCover(isPresented: $showCapture) {
            CameraGuideView(onClose: { showCapture = false })
        }
        .fullScreenCover(isPresented: $showAI) {
            AIHomeView(onClose: { showAI = false })
        }
    }
}

/// 피그마 "Global Tab Navigation Container" 재현
/// 아이콘 22 · 라벨 11pt · 중앙 AI 버튼 57x55 r32 (15pt 위로 돌출)
struct AppTabBar: View {
    @Binding var selection: AppTab
    let onAITap: () -> Void

    var body: some View {
        ZStack(alignment: .top) {
            HStack(spacing: 0) {
                tabItem(.home)
                tabItem(.record)
                Color.clear.frame(width: Theme.s(64), height: Theme.s(40))
                tabItem(.dday)
                tabItem(.my)
            }
            .padding(.horizontal, Theme.s(16))
            .frame(height: Theme.s(40))
            .frame(maxWidth: .infinity)

            Button(action: onAITap) {
                Text("AI")
                    .font(.inter(.semiBold, 20))
                    .foregroundStyle(.white)
                    .frame(width: Theme.s(57), height: Theme.s(55))
                    .background(Theme.primary)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.s(32), style: .continuous))
            }
            .buttonStyle(.plain)
            .offset(y: -Theme.s(15))
        }
        .padding(.top, Theme.s(8))
        .padding(.bottom, Theme.s(10))
        .background(
            Theme.background
                .overlay(alignment: .top) {
                    Theme.divider.frame(height: 1)
                }
                .ignoresSafeArea(edges: .bottom)
        )
    }

    private func tabItem(_ tab: AppTab) -> some View {
        let isActive = selection == tab
        return Button {
            selection = tab
        } label: {
            VStack(spacing: Theme.s(4)) {
                Image(systemName: tab.icon)
                    .font(.system(size: Theme.s(18), weight: .regular))
                    .frame(width: Theme.s(22), height: Theme.s(22))
                Text(tab.label)
                    .font(.inter(isActive ? .semiBold : .regular, 11))
            }
            .foregroundStyle(isActive ? Theme.primary : Theme.textMuted)
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    MainTabView().environmentObject(SessionStore())
}
