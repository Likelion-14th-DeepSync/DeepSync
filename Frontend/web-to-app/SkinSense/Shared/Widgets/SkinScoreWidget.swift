import SwiftUI

struct SkinScoreWidgetView: View {
    var family: SnapshotFamily = .small
    let snapshot: SkinSnapshot

    var body: some View {
        switch family {
        case .circular: circular
        case .rectangular: rectangular
        case .inline: inline
        case .medium: medium
        default: small
        }
    }

    // MARK: 홈 화면

    private var small: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("오늘의 피부", systemImage: "sparkles")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(SnapshotTheme.primary)

            Spacer(minLength: 0)

            if let score = snapshot.overallScore {
                HStack(alignment: .lastTextBaseline, spacing: 2) {
                    Text("\(score)")
                        .font(.system(size: 38, weight: .bold, design: .rounded))
                        .foregroundStyle(SnapshotTheme.ink)
                    Text("/100")
                        .font(.system(size: 12))
                        .foregroundStyle(SnapshotTheme.light)
                }
                Text(SnapshotTheme.deltaText(snapshot.overallChange))
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(SnapshotTheme.deltaColor(snapshot.overallChange))
            } else {
                Text("아직 분석 없음")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(SnapshotTheme.gray)
                Text("촬영하면 점수가 나와요")
                    .font(.system(size: 10))
                    .foregroundStyle(SnapshotTheme.light)
            }

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var medium: some View {
        HStack(spacing: 14) {
            ScoreRingCompact(score: snapshot.overallScore, size: 74, lineWidth: 8)

            VStack(alignment: .leading, spacing: 5) {
                Text("오늘의 피부 컨디션")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(SnapshotTheme.gray)

                Text(SnapshotTheme.deltaText(snapshot.overallChange).replacingOccurrences(of: "변화 없음", with: "어제와 같아요"))
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(SnapshotTheme.deltaColor(snapshot.overallChange))

                if let summary = snapshot.summary {
                    Text(summary)
                        .font(.system(size: 10))
                        .foregroundStyle(SnapshotTheme.light)
                        .lineLimit(2)
                } else if let label = snapshot.goalDayLabel, let title = snapshot.goalTitle {
                    Text("\(title) \(label)")
                        .font(.system(size: 10))
                        .foregroundStyle(SnapshotTheme.light)
                        .lineLimit(1)
                }
            }
            Spacer(minLength: 0)
        }
    }

    // MARK: 잠금 화면

    private var circular: some View {
        Gauge(value: Double(snapshot.overallScore ?? 0), in: 0...100) {
            Image(systemName: "sparkles")
        } currentValueLabel: {
            Text(snapshot.overallScore.map(String.init) ?? "–")
                .font(.system(size: 16, weight: .semibold, design: .rounded))
        }
        .gaugeStyle(.accessoryCircular)
    }

    private var rectangular: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text("오늘의 피부")
                .font(.system(size: 12, weight: .semibold))
            if let score = snapshot.overallScore {
                Text("\(score)점 · \(SnapshotTheme.deltaText(snapshot.overallChange))")
                    .font(.system(size: 13, weight: .bold))
            } else {
                Text("아직 분석 없음")
                    .font(.system(size: 13, weight: .bold))
            }
            if let label = snapshot.goalDayLabel, let title = snapshot.goalTitle {
                Text("\(title) \(label)")
                    .font(.system(size: 11))
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var inline: some View {
        Text(snapshot.overallScore.map { "피부 \($0)점 · \(SnapshotTheme.deltaText(snapshot.overallChange))" }
             ?? "피부 분석 기록 없음")
    }
}

/// 위젯용 점수 링
struct ScoreRingCompact: View {
    let score: Int?
    var size: CGFloat = 70
    var lineWidth: CGFloat = 8

    var body: some View {
        ZStack {
            Circle().stroke(SnapshotTheme.track, lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: CGFloat(min(max(score ?? 0, 0), 100)) / 100)
                .stroke(
                    LinearGradient(colors: [SnapshotTheme.primary, SnapshotTheme.gradientEnd],
                                   startPoint: .top, endPoint: .bottomTrailing),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
            Text(score.map(String.init) ?? "–")
                .font(.system(size: size * 0.34, weight: .bold, design: .rounded))
                .foregroundStyle(SnapshotTheme.ink)
        }
        .frame(width: size, height: size)
    }
}
