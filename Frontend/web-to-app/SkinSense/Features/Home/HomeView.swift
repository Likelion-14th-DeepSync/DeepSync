import SwiftUI

@MainActor
final class HomeViewModel: ObservableObject {
    @Published var state: LoadState<DdayDashboard> = .loading

    func load() async {
        do {
            let dashboard = try await SkinSenseAPI.dashboard(period: .sevenDays)
            state = .loaded(dashboard)

            // 위젯 · 애플워치가 읽을 요약을 갱신한다.
            let reminder = (try? await SkinSenseAPI.todayReminders())?.reminders?.first
            SnapshotPublisher.shared.publish(dashboard: dashboard, reminder: reminder, isSignedIn: true)
        } catch {
            state = .from(error)
        }
    }
}

/// 피그마 "홈" 프레임(34:2010) 기준.
/// 모든 수치는 Theme.s()로 기기 폭 비율에 맞춰 환산된다.
struct HomeView: View {
    @EnvironmentObject private var session: SessionStore
    @StateObject private var viewModel = HomeViewModel()
    @State private var showCapture = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Wellness Care")
                        .font(.inter(.bold, 22))
                        .foregroundStyle(Theme.textPrimary)
                        .padding(.top, Theme.s(26))

                    Text("안녕하세요, \(session.displayName)님 👋")
                        .font(.inter(.semiBold, 18))
                        .foregroundStyle(Theme.textPrimary)
                        .padding(.top, Theme.s(35))

                    switch viewModel.state {
                    case .loading:
                        loadingBlock
                    case let .failed(message), let .empty(message):
                        errorBlock(message)
                    case let .loaded(dashboard):
                        DDayRow(goal: dashboard.goal)
                            .padding(.top, Theme.s(22))

                        SkinConditionCard(insight: dashboard.skinInsight) {
                            showCapture = true
                        }
                        .padding(.top, Theme.s(11))

                        StatRow(insight: dashboard.skinInsight)
                            .padding(.top, Theme.s(20))

                        AIRoutineSection(routine: dashboard.routine)
                            .padding(.top, Theme.s(16))

                        if let environment = dashboard.environment,
                           let risks = environment.risks, !risks.isEmpty {
                            EnvironmentRiskSection(risks: risks)
                                .padding(.top, Theme.s(16))
                        }
                    }
                }
                .padding(.horizontal, Theme.screenPadding)
                .padding(.bottom, Theme.s(120))
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationBarHidden(true)
            .refreshable { await viewModel.load() }
            .task { await viewModel.load() }
            .fullScreenCover(isPresented: $showCapture) {
                CameraGuideView(onClose: { showCapture = false })
            }
        }
    }

    private var loadingBlock: some View {
        HStack {
            Spacer()
            ProgressView().tint(Theme.primary)
            Spacer()
        }
        .padding(.vertical, Theme.s(80))
    }

    private func errorBlock(_ message: String) -> some View {
        VStack(spacing: Theme.s(10)) {
            Text(message)
                .font(.inter(.regular, 13))
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.textSecondary)
            Button("다시 시도") { Task { await viewModel.load() } }
                .font(.inter(.semiBold, 13))
                .foregroundStyle(Theme.primary)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, Theme.s(60))
    }
}

// MARK: - D-Day 행 (피그마 y=194, h=34)

private struct DDayRow: View {
    let goal: SkinGoal?

    var body: some View {
        HStack(alignment: .center, spacing: Theme.s(8)) {
            Text(goal.flatMap(\.title).map { "\($0)까지 D-Day" } ?? "진행 중인 D-Day 없음")
                .font(.inter(.regular, 14))
                .foregroundStyle(Theme.textSecondary)
                .lineLimit(1)
            Spacer(minLength: 0)
            Text(goal?.dayLabel?.replacingOccurrences(of: "D-", with: "D - ") ?? "—")
                .font(.inter(.bold, 28))
                .foregroundStyle(Theme.primaryButton)
                .lineLimit(1)
        }
        .frame(height: Theme.s(34))
        .padding(.horizontal, Theme.s(2))
    }
}

// MARK: - 오늘의 피부 컨디션 (피그마 359x209 · r16 · pad20 · gap12)

private struct SkinConditionCard: View {
    let insight: DailySkinInsight?
    let onAnalyze: () -> Void

    var body: some View {
        VStack(spacing: Theme.s(12)) {
            HStack {
                Text("오늘의 피부 컨디션")
                    .font(.inter(.semiBold, 16))
                    .foregroundStyle(Theme.textPrimary)
                Spacer()
                Image(systemName: "info.circle")
                    .font(.system(size: Theme.s(15)))
                    .foregroundStyle(Theme.textTertiary)
            }

            VStack(spacing: Theme.s(4)) {
                if let score = insight?.today?.overallScore {
                    HStack(alignment: .lastTextBaseline, spacing: Theme.s(4)) {
                        Text("\(score)")
                            .font(.inter(.bold, 48))
                            .foregroundStyle(Theme.textPrimary)
                        Text("/ 100")
                            .font(.inter(.regular, 16))
                            .foregroundStyle(Theme.textTertiary)
                    }
                    ScoreDeltaLabel(change: insight?.changes?.previous?.overallScoreChange)
                } else {
                    Text("아직 분석이 없어요")
                        .font(.inter(.bold, 24))
                        .foregroundStyle(Theme.textTertiary)
                    Text("촬영하면 오늘의 점수가 나와요")
                        .font(.inter(.medium, 13))
                        .foregroundStyle(Theme.textSecondary)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: Theme.s(78))

            Button(action: onAnalyze) {
                Text("📷  AI 피부 분석하기")
                    .font(.inter(.semiBold, 15))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: Theme.s(46))
                    .background(Theme.primaryButton)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.radiusButton, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .cardStyle(radius: Theme.radiusCard, padding: Theme.s(20))
    }
}

private struct ScoreDeltaLabel: View {
    let change: Int?

    var body: some View {
        if let change {
            Text(change == 0 ? "어제와 같아요"
                 : "어제보다 \(change > 0 ? "+" : "")\(change)점 \(change > 0 ? "↑" : "↓")")
                .font(.inter(.medium, 13))
                .foregroundStyle(change == 0 ? Theme.textSecondary : (change > 0 ? Theme.positive : Theme.negative))
        } else {
            Text("첫 분석 기록이에요")
                .font(.inter(.medium, 13))
                .foregroundStyle(Theme.textSecondary)
        }
    }
}

// MARK: - 지표 3종 (피그마 106x84 · r12 · pad 14/8 · gap 4)

private struct StatRow: View {
    let insight: DailySkinInsight?

    var body: some View {
        let previous = insight?.changes?.previous
        HStack(spacing: Theme.s(16)) {
            StatCard(title: "붉은기", change: previous?.rednessScoreChange)
            StatCard(title: "트러블", change: previous?.troubleScoreChange)
            // 톤 균일도는 온디바이스 모델이 아직 측정하지 않아 중립값이 저장된다.
            StatCard(title: "피부톤 균일도", change: nil, placeholderText: "측정 준비 중")
        }
    }
}

private struct StatCard: View {
    let title: String
    let change: Int?
    var placeholderText: String = "기록 없음"

    private var valueText: String {
        guard let change else { return placeholderText }
        if change == 0 { return "변화 없음" }
        return "\(change > 0 ? "+" : "")\(change)점 \(change > 0 ? "↑" : "↓")"
    }

    private var valueColor: Color {
        guard let change, change != 0 else { return Theme.textSecondary }
        return change > 0 ? Theme.positive : Theme.negative
    }

    var body: some View {
        VStack(spacing: Theme.s(4)) {
            Text(title)
                .font(.inter(.medium, 12))
                .foregroundStyle(Theme.textSecondary)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            Text(valueText)
                .font(.inter(.bold, 16))
                .foregroundStyle(valueColor)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
            Text("어제 대비")
                .font(.inter(.regular, 10))
                .foregroundStyle(Theme.textTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Theme.s(14))
        .padding(.horizontal, Theme.s(8))
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusStat, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.radiusStat, style: .continuous)
                .stroke(Theme.border, lineWidth: 1)
        )
    }
}

// MARK: - 오늘의 AI 루틴 (백엔드 미구현 → 준비 중 표시)

private struct AIRoutineSection: View {
    let routine: DashboardRoutine?

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.s(12)) {
            HStack {
                Text("오늘의 AI 루틴")
                    .font(.inter(.bold, 18))
                    .foregroundStyle(Theme.textPrimary)
                Spacer()
                HStack(spacing: Theme.s(4)) {
                    Text("전체 보기")
                        .font(.inter(.medium, 13))
                    Image(systemName: "chevron.right")
                        .font(.system(size: Theme.s(10), weight: .semibold))
                }
                .foregroundStyle(Theme.primary.opacity(0.4))
            }
            .frame(height: Theme.s(22))

            VStack(spacing: Theme.s(16)) {
                RoutinePlaceholderItem(
                    emoji: "🌙",
                    background: Theme.surfaceViolet,
                    title: "AI 루틴 준비 중",
                    detail: routine?.message ?? "루틴 정보를 불러오지 못했어요."
                )
                Rectangle().fill(Theme.border).frame(height: 1)
                RoutinePlaceholderItem(
                    emoji: "💧",
                    background: Theme.surfaceBlue,
                    title: "곧 만나요",
                    detail: "촬영과 생활 기록이 쌓이면 맞춤 루틴이 생성돼요."
                )
            }
            .padding(Theme.s(16))
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusLargeCard, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radiusLargeCard, style: .continuous)
                    .stroke(Theme.border, lineWidth: 1)
            )
        }
    }
}

private struct RoutinePlaceholderItem: View {
    let emoji: String
    let background: Color
    let title: String
    let detail: String

    var body: some View {
        HStack(spacing: Theme.s(12)) {
            Text(emoji)
                .font(.system(size: Theme.s(22)))
                .frame(width: Theme.s(40), height: Theme.s(40))
                .background(background)
                .clipShape(RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous))

            VStack(alignment: .leading, spacing: Theme.s(2)) {
                Text(title)
                    .font(.inter(.semiBold, 15))
                    .foregroundStyle(Theme.textPrimary)
                Text(detail)
                    .font(.inter(.regular, 12))
                    .foregroundStyle(Theme.textMuted)
                    .lineLimit(2)
            }
            Spacer(minLength: 0)

            Circle()
                .strokeBorder(Theme.border, lineWidth: 1.5)
                .frame(width: Theme.s(24), height: Theme.s(24))
        }
        .frame(minHeight: Theme.s(40))
    }
}

// MARK: - 환경 주의 (dashboard.environment.risks)

private struct EnvironmentRiskSection: View {
    let risks: [EnvironmentRisk]

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.s(12)) {
            Text("오늘의 환경 주의")
                .font(.inter(.bold, 18))
                .foregroundStyle(Theme.textPrimary)

            VStack(spacing: Theme.s(12)) {
                ForEach(risks) { risk in
                    HStack(spacing: Theme.s(12)) {
                        Circle().fill(Theme.negative).frame(width: Theme.s(6), height: Theme.s(6))
                        Text(risk.message ?? "")
                            .font(.inter(.regular, 13))
                            .foregroundStyle(Theme.textPrimary)
                        Spacer(minLength: 0)
                        Text(risk.value ?? "")
                            .font(.inter(.semiBold, 13))
                            .foregroundStyle(Theme.textSecondary)
                    }
                }
            }
            .padding(Theme.s(16))
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusLargeCard, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radiusLargeCard, style: .continuous)
                    .stroke(Theme.border, lineWidth: 1)
            )
        }
    }
}

#Preview {
    HomeView().environmentObject(SessionStore())
}
