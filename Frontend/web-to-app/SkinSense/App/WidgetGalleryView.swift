#if DEBUG
import SwiftUI

/// 시뮬레이터에서 위젯 레이아웃을 확인하기 위한 화면.
/// DEV_SCREEN=widgets1 / widgets2 / widgets3 으로 페이지를 나눠 본다.
/// 실제 위젯 확장(SkinSenseWidgets)이 여기와 똑같은 뷰를 사용한다.
struct WidgetGalleryView: View {
    enum Page: String { case one, two, lock }
    var page: Page = .one

    private var snapshot: SkinSnapshot { SharedStore.load() ?? .placeholder }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text(title)
                    .font(.inter(.bold, 20))
                    .foregroundStyle(Theme.textInk)

                switch page {
                case .one:
                    section("오늘의 피부 점수 · 작게") {
                        tile(.small) { SkinScoreWidgetView(family: .small, snapshot: snapshot) }
                    }
                    section("오늘의 피부 점수 · 중간") {
                        tile(.medium) { SkinScoreWidgetView(family: .medium, snapshot: snapshot) }
                    }
                    section("Skin D-Day · 작게") {
                        tile(.small, gradient: true) { DDayWidgetView(family: .small, snapshot: snapshot) }
                    }
                    section("Skin D-Day · 중간") {
                        tile(.medium, gradient: true) { DDayWidgetView(family: .medium, snapshot: snapshot) }
                    }

                case .two:
                    section("피부 지표 변화 · 중간") {
                        tile(.medium) { MetricsWidgetView(family: .medium, snapshot: snapshot) }
                    }
                    section("생활 실험 · 중간") {
                        tile(.medium) { ExperimentWidgetView(family: .medium, snapshot: snapshot) }
                    }
                    section("오늘 할 일 · 중간") {
                        tile(.medium) { ReminderWidgetView(family: .medium, snapshot: snapshot) }
                    }
                    HStack(alignment: .top, spacing: 12) {
                        tile(.small) { ExperimentWidgetView(family: .small, snapshot: snapshot) }
                        tile(.small) { ReminderWidgetView(family: .small, snapshot: snapshot) }
                    }

                case .lock:
                    lockSection("점수", hasInline: true) { SkinScoreWidgetView(family: $0, snapshot: snapshot) }
                    lockSection("D-Day", hasInline: true) { DDayWidgetView(family: $0, snapshot: snapshot) }
                    lockSection("생활 실험", hasInline: false) { ExperimentWidgetView(family: $0, snapshot: snapshot) }
                    lockSection("오늘 할 일", hasInline: true) { ReminderWidgetView(family: $0, snapshot: snapshot) }
                }
            }
            .padding(20)
        }
        .background(Theme.background.ignoresSafeArea())
    }

    private var title: String {
        switch page {
        case .one: return "위젯 · 점수와 D-Day"
        case .two: return "위젯 · 지표 · 실험 · 할 일"
        case .lock: return "잠금 화면 위젯"
        }
    }

    @ViewBuilder
    private func section<V: View>(_ label: String, @ViewBuilder content: () -> V) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(label).font(.inter(.semiBold, 12)).foregroundStyle(Theme.textGray)
            content()
        }
    }

    @ViewBuilder
    private func lockSection<V: View>(_ label: String, hasInline: Bool,
                                      @ViewBuilder content: @escaping (SnapshotFamily) -> V) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(label).font(.inter(.semiBold, 12)).foregroundStyle(Theme.textGray)
            HStack(alignment: .center, spacing: 10) {
                ForEach([SnapshotFamily.circular, .rectangular]) { family in
                    content(family)
                        .frame(width: family.previewSize.width, height: family.previewSize.height)
                        .padding(6)
                        .background(Color.black)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                Spacer(minLength: 0)
            }
            if hasInline {
                content(.inline)
                    .font(.system(size: 13))
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(Color.black)
                    .foregroundStyle(.white)
                    .clipShape(Capsule())
            }
        }
    }

    @ViewBuilder
    private func tile<V: View>(_ family: SnapshotFamily, gradient: Bool = false,
                               @ViewBuilder content: () -> V) -> some View {
        content()
            .padding(14)
            .frame(width: family.previewSize.width, height: family.previewSize.height)
            .background {
                if gradient {
                    LinearGradient(colors: [SnapshotTheme.gradientStart, SnapshotTheme.gradientEnd],
                                   startPoint: .topLeading, endPoint: .bottomTrailing)
                } else {
                    Color.white
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(Theme.panelBorder, lineWidth: 1)
            )
    }
}
#endif
