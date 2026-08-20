import SwiftUI

struct WatchRootView: View {
    @EnvironmentObject private var connectivity: WatchConnectivityService
    @State private var selection: Int = WatchRootView.initialPage

    /// 시뮬레이터 확인용 (DEBUG 전용)
    static var initialPage: Int {
        #if DEBUG
        return Int(ProcessInfo.processInfo.environment["DEV_WATCH_PAGE"] ?? "0") ?? 0
        #else
        return 0
        #endif
    }

    var body: some View {
        TabView(selection: $selection) {
            WatchScoreView(snapshot: connectivity.snapshot)
                .tag(0)
            WatchDDayView(snapshot: connectivity.snapshot)
                .tag(1)
            WatchExperimentView(snapshot: connectivity.snapshot)
                .tag(2)
            WatchTodoView(snapshot: connectivity.snapshot)
                .tag(3)
        }
        .tabViewStyle(.verticalPage)
        .task { connectivity.requestRefresh() }
    }
}

// MARK: - 오늘의 점수

struct WatchScoreView: View {
    let snapshot: SkinSnapshot

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                Text("오늘의 피부")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(SnapshotTheme.primary)

                ZStack {
                    Circle().stroke(SnapshotTheme.track.opacity(0.35), lineWidth: 9)
                    Circle()
                        .trim(from: 0, to: CGFloat(min(max(snapshot.overallScore ?? 0, 0), 100)) / 100)
                        .stroke(
                            LinearGradient(colors: [SnapshotTheme.gradientStart, SnapshotTheme.gradientEnd],
                                           startPoint: .top, endPoint: .bottomTrailing),
                            style: StrokeStyle(lineWidth: 9, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text(snapshot.overallScore.map(String.init) ?? "–")
                            .font(.system(size: 30, weight: .bold, design: .rounded))
                        Text("/ 100")
                            .font(.system(size: 10))
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(width: 96, height: 96)

                Text(SnapshotTheme.deltaText(snapshot.overallChange))
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(SnapshotTheme.deltaColor(snapshot.overallChange))

                if let summary = snapshot.summary {
                    Text(summary)
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                if !snapshot.hasScore {
                    Text("아이폰에서 촬영하면 점수가 표시돼요")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

// MARK: - D-Day

struct WatchDDayView: View {
    let snapshot: SkinSnapshot

    var body: some View {
        ScrollView {
            VStack(spacing: 6) {
                Text("Skin D-Day")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(SnapshotTheme.primary)

                if let label = snapshot.goalDayLabel {
                    Text(label.replacingOccurrences(of: "D-", with: "D - "))
                        .font(.system(size: 34, weight: .heavy, design: .rounded))
                        .minimumScaleFactor(0.5)
                        .lineLimit(1)
                    Text(snapshot.goalTitle ?? "")
                        .font(.system(size: 12, weight: .medium))
                        .multilineTextAlignment(.center)
                    if let concern = snapshot.goalConcern {
                        Text("집중 관리: \(concern)")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                    }
                } else {
                    Image(systemName: "target")
                        .font(.system(size: 26))
                        .foregroundStyle(.secondary)
                    Text("진행 중인 목표가 없어요")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

// MARK: - 생활 실험

struct WatchExperimentView: View {
    let snapshot: SkinSnapshot

    private var rate: Double { snapshot.experimentRate ?? 0 }

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                Text("생활 실험")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(SnapshotTheme.primary)

                if let title = snapshot.experimentTitle {
                    Text("\(snapshot.experimentEmoji ?? "🧪") \(title)")
                        .font(.system(size: 13, weight: .bold))
                        .multilineTextAlignment(.center)

                    Gauge(value: rate) {
                        EmptyView()
                    } currentValueLabel: {
                        Text("\(Int(rate * 100))%")
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                    }
                    .gaugeStyle(.accessoryCircular)
                    .tint(SnapshotTheme.accent)

                    if let day = snapshot.experimentCurrentDay, let total = snapshot.experimentTotalDays {
                        Text("Day \(day) / \(total)")
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                    }
                } else {
                    Image(systemName: "flask")
                        .font(.system(size: 24))
                        .foregroundStyle(.secondary)
                    Text("진행 중인 실험이 없어요")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

// MARK: - 오늘 할 일

struct WatchTodoView: View {
    let snapshot: SkinSnapshot

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                Text("오늘 할 일")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(SnapshotTheme.primary)
                    .frame(maxWidth: .infinity, alignment: .center)

                HStack(spacing: 6) {
                    Image(systemName: snapshot.hasScore ? "checkmark.circle.fill" : "camera.fill")
                        .foregroundStyle(snapshot.hasScore ? SnapshotTheme.positive : SnapshotTheme.primary)
                    Text(snapshot.reminderTitle ?? (snapshot.hasScore ? "오늘 촬영 완료" : "피부 사진 촬영하기"))
                        .font(.system(size: 12, weight: .medium))
                }

                if snapshot.environmentRisks.isEmpty {
                    Text("오늘 특별한 환경 주의는 없어요")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(snapshot.environmentRisks.prefix(3), id: \.self) { risk in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(SnapshotTheme.negative).frame(width: 5, height: 5).padding(.top, 5)
                            Text(risk).font(.system(size: 11)).foregroundStyle(.secondary)
                        }
                    }
                }

                if snapshot.updatedAt != .distantPast {
                    Text("업데이트 \(snapshot.updatedAt.formatted(date: .omitted, time: .shortened))")
                        .font(.system(size: 10))
                        .foregroundStyle(.tertiary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.top, 4)
                }
            }
            .padding(.horizontal, 4)
        }
    }
}
