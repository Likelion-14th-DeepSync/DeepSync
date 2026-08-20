import SwiftUI

struct ExperimentWidgetView: View {
    var family: SnapshotFamily = .small
    let snapshot: SkinSnapshot

    private var hasExperiment: Bool { snapshot.experimentTitle != nil }
    private var rate: Double { snapshot.experimentRate ?? 0 }
    private var dayText: String {
        guard let current = snapshot.experimentCurrentDay, let total = snapshot.experimentTotalDays else { return "-" }
        return "Day \(current) / \(total)"
    }

    var body: some View {
        switch family {
        case .circular:
            Gauge(value: rate) {
                Image(systemName: "flask")
            } currentValueLabel: {
                Text("\(Int(rate * 100))")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
            }
            .gaugeStyle(.accessoryCircular)

        case .rectangular:
            VStack(alignment: .leading, spacing: 1) {
                Text(snapshot.experimentTitle ?? "진행 중인 실험 없음")
                    .font(.system(size: 12, weight: .semibold))
                    .lineLimit(1)
                if hasExperiment {
                    Text("\(dayText) · 실천율 \(Int(rate * 100))%")
                        .font(.system(size: 12))
                    ProgressView(value: rate).progressViewStyle(.linear)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

        case .medium:
            HStack(spacing: 14) {
                ZStack {
                    Circle().stroke(SnapshotTheme.track, lineWidth: 8)
                    Circle()
                        .trim(from: 0, to: CGFloat(rate))
                        .stroke(SnapshotTheme.accent, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Text("\(Int(rate * 100))%")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(SnapshotTheme.ink)
                }
                .frame(width: 68, height: 68)

                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(snapshot.experimentEmoji ?? "🧪")
                        Text(snapshot.experimentTitle ?? "진행 중인 실험 없음")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(SnapshotTheme.ink)
                            .lineLimit(1)
                    }
                    if hasExperiment {
                        Text(dayText)
                            .font(.system(size: 12))
                            .foregroundStyle(SnapshotTheme.gray)
                        Text("실천율 \(Int(rate * 100))%")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(SnapshotTheme.accent)
                    } else {
                        Text("D-Day 탭에서 7일 실험을 시작해보세요")
                            .font(.system(size: 11))
                            .foregroundStyle(SnapshotTheme.light)
                            .lineLimit(2)
                    }
                }
                Spacer(minLength: 0)
            }

        default:
            VStack(alignment: .leading, spacing: 6) {
                Text(snapshot.experimentEmoji ?? "🧪").font(.system(size: 20))
                Spacer(minLength: 0)
                Text(snapshot.experimentTitle ?? "실험 없음")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(SnapshotTheme.ink)
                    .lineLimit(2)
                if hasExperiment {
                    Text(dayText).font(.system(size: 10)).foregroundStyle(SnapshotTheme.gray)
                    ProgressView(value: rate)
                        .tint(SnapshotTheme.accent)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
