import SwiftUI

struct MetricsWidgetView: View {
    var family: SnapshotFamily = .small
    let snapshot: SkinSnapshot

    private var metrics: [(String, Int?)] {
        [("붉은기", snapshot.rednessChange),
         ("트러블", snapshot.troubleChange),
         ("피부톤 균일도", snapshot.toneChange)]
    }

    var body: some View {
        if family == .rectangular {
            VStack(alignment: .leading, spacing: 1) {
                Text("지표 변화").font(.system(size: 12, weight: .semibold))
                ForEach(metrics.prefix(2), id: \.0) { name, value in
                    Text("\(name) \(SnapshotTheme.deltaText(value))")
                        .font(.system(size: 12))
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Label("어제 대비 변화", systemImage: "chart.bar.fill")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(SnapshotTheme.primary)
                    Spacer()
                    if let score = snapshot.overallScore {
                        Text("종합 \(score)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(SnapshotTheme.gray)
                    }
                }

                ForEach(metrics, id: \.0) { name, value in
                    HStack(spacing: 8) {
                        Text(name)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(SnapshotTheme.ink)
                            .frame(width: 82, alignment: .leading)

                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(SnapshotTheme.track)
                                Capsule()
                                    .fill(SnapshotTheme.deltaColor(value))
                                    .frame(width: geo.size.width * barRatio(value))
                            }
                        }
                        .frame(height: 7)

                        Text(SnapshotTheme.deltaText(value))
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(SnapshotTheme.deltaColor(value))
                            .frame(width: 66, alignment: .trailing)
                    }
                }

                if family == .large, let summary = snapshot.summary {
                    Text(summary)
                        .font(.system(size: 11))
                        .foregroundStyle(SnapshotTheme.gray)
                        .lineLimit(3)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func barRatio(_ value: Int?) -> CGFloat {
        guard let value else { return 0 }
        return min(CGFloat(abs(value)) / 20.0, 1.0)
    }
}
