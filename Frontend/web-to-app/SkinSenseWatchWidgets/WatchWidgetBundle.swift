import SwiftUI
import WidgetKit

/// 워치 페이스 컴플리케이션.
/// App Group 스냅샷을 읽어 표시한다 — 워치 앱과 같은 데이터 소스다.
@main
struct SkinSenseWatchWidgetBundle: WidgetBundle {
    var body: some Widget {
        WatchScoreComplication()
        WatchDDayComplication()
        WatchExperimentComplication()
    }
}

// MARK: - 타임라인

struct WatchSnapshotEntry: TimelineEntry {
    let date: Date
    let snapshot: SkinSnapshot
}

struct WatchSnapshotProvider: TimelineProvider {
    func placeholder(in context: Context) -> WatchSnapshotEntry {
        WatchSnapshotEntry(date: Date(), snapshot: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (WatchSnapshotEntry) -> Void) {
        let snapshot = context.isPreview ? SkinSnapshot.placeholder : (SharedStore.load() ?? .placeholder)
        completion(WatchSnapshotEntry(date: Date(), snapshot: snapshot))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WatchSnapshotEntry>) -> Void) {
        let snapshot = SharedStore.load() ?? .signedOut
        let entry = WatchSnapshotEntry(date: Date(), snapshot: snapshot)
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// MARK: - 점수

struct WatchScoreComplication: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "WatchScoreComplication", provider: WatchSnapshotProvider()) { entry in
            WatchScoreComplicationView(snapshot: entry.snapshot)
                .containerBackground(.background, for: .widget)
        }
        .configurationDisplayName("오늘의 피부 점수")
        .description("가장 최근 분석의 종합 점수를 보여줘요.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline, .accessoryCorner])
    }
}

struct WatchScoreComplicationView: View {
    @Environment(\.widgetFamily) private var family
    let snapshot: SkinSnapshot

    var body: some View {
        switch family {
        case .accessoryCorner:
            Text(snapshot.overallScore.map(String.init) ?? "–")
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .widgetCurvesContent()
                .widgetLabel("피부 점수")

        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 1) {
                Text("오늘의 피부").font(.system(size: 12, weight: .semibold))
                if let score = snapshot.overallScore {
                    Text("\(score)점 · \(SnapshotTheme.deltaText(snapshot.overallChange))")
                        .font(.system(size: 13, weight: .bold))
                } else {
                    Text("아직 분석 없음").font(.system(size: 13, weight: .bold))
                }
                if let label = snapshot.goalDayLabel {
                    Text(label).font(.system(size: 11)).foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

        case .accessoryInline:
            Text(snapshot.overallScore.map { "피부 \($0)점" } ?? "피부 분석 없음")

        default:
            Gauge(value: Double(snapshot.overallScore ?? 0), in: 0...100) {
                Image(systemName: "sparkles")
            } currentValueLabel: {
                Text(snapshot.overallScore.map(String.init) ?? "–")
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
            }
            .gaugeStyle(.accessoryCircular)
        }
    }
}

// MARK: - D-Day

struct WatchDDayComplication: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "WatchDDayComplication", provider: WatchSnapshotProvider()) { entry in
            WatchDDayComplicationView(snapshot: entry.snapshot)
                .containerBackground(.background, for: .widget)
        }
        .configurationDisplayName("Skin D-Day")
        .description("목표일까지 남은 날짜를 보여줘요.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline, .accessoryCorner])
    }
}

struct WatchDDayComplicationView: View {
    @Environment(\.widgetFamily) private var family
    let snapshot: SkinSnapshot

    var body: some View {
        switch family {
        case .accessoryCorner:
            Text(snapshot.goalDaysRemaining.map { "D-\($0)" } ?? "D-?")
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .widgetCurvesContent()
                .widgetLabel(snapshot.goalTitle ?? "목표 없음")

        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 1) {
                Text(snapshot.goalTitle ?? "Skin D-Day")
                    .font(.system(size: 12, weight: .semibold)).lineLimit(1)
                Text(snapshot.goalDayLabel ?? "목표 없음")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                if let concern = snapshot.goalConcern {
                    Text("집중: \(concern)").font(.system(size: 11)).foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

        case .accessoryInline:
            Text(snapshot.goalDayLabel.map { "\(snapshot.goalTitle ?? "목표") \($0)" } ?? "D-Day 없음")

        default:
            VStack(spacing: 0) {
                Text("D").font(.system(size: 10, weight: .semibold))
                Text(snapshot.goalDaysRemaining.map(String.init) ?? "–")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .minimumScaleFactor(0.5).lineLimit(1)
            }
        }
    }
}

// MARK: - 생활 실험

struct WatchExperimentComplication: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "WatchExperimentComplication", provider: WatchSnapshotProvider()) { entry in
            WatchExperimentComplicationView(snapshot: entry.snapshot)
                .containerBackground(.background, for: .widget)
        }
        .configurationDisplayName("생활 실험")
        .description("진행 중인 실험의 실천율을 보여줘요.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular])
    }
}

struct WatchExperimentComplicationView: View {
    @Environment(\.widgetFamily) private var family
    let snapshot: SkinSnapshot

    private var rate: Double { snapshot.experimentRate ?? 0 }

    var body: some View {
        switch family {
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 1) {
                Text(snapshot.experimentTitle ?? "실험 없음")
                    .font(.system(size: 12, weight: .semibold)).lineLimit(1)
                if snapshot.experimentTitle != nil {
                    if let day = snapshot.experimentCurrentDay, let total = snapshot.experimentTotalDays {
                        Text("Day \(day)/\(total) · \(Int(rate * 100))%")
                            .font(.system(size: 12))
                    }
                    ProgressView(value: rate).progressViewStyle(.linear)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

        default:
            Gauge(value: rate) {
                Image(systemName: "flask")
            } currentValueLabel: {
                Text("\(Int(rate * 100))")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
            }
            .gaugeStyle(.accessoryCircular)
        }
    }
}
