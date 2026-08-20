import SwiftUI
import WidgetKit

@main
struct SkinSenseWidgetBundle: WidgetBundle {
    var body: some Widget {
        SkinScoreWidget()
        DDayWidget()
        MetricsWidget()
        ExperimentWidget()
        ReminderWidget()
    }
}

// MARK: - 타임라인

struct SnapshotEntry: TimelineEntry {
    let date: Date
    let snapshot: SkinSnapshot
}

struct SnapshotProvider: TimelineProvider {
    func placeholder(in context: Context) -> SnapshotEntry {
        SnapshotEntry(date: Date(), snapshot: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (SnapshotEntry) -> Void) {
        let snapshot = context.isPreview ? SkinSnapshot.placeholder : (SharedStore.load() ?? .placeholder)
        completion(SnapshotEntry(date: Date(), snapshot: snapshot))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SnapshotEntry>) -> Void) {
        let snapshot = SharedStore.load() ?? .signedOut
        let entry = SnapshotEntry(date: Date(), snapshot: snapshot)
        // 앱이 갱신할 때 reloadAllTimelines를 호출하므로 주기는 넉넉히 잡는다.
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

extension WidgetFamily {
    /// WidgetKit 패밀리를 공유 뷰가 이해하는 값으로 바꾼다.
    var snapshotFamily: SnapshotFamily {
        switch self {
        case .systemSmall: return .small
        case .systemMedium: return .medium
        case .systemLarge, .systemExtraLarge: return .large
        case .accessoryCircular: return .circular
        case .accessoryRectangular: return .rectangular
        case .accessoryInline: return .inline
        @unknown default: return .small
        }
    }
}

// MARK: - 위젯 정의

struct SkinScoreWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "SkinScoreWidget", provider: SnapshotProvider()) { entry in
            WidgetFamilyReader { family in
                SkinScoreWidgetView(family: family, snapshot: entry.snapshot)
                    .widgetURL(entry.snapshot.hasScore ? WidgetLink.home : WidgetLink.capture)
            }
            .containerBackground(.background, for: .widget)
        }
        .configurationDisplayName("오늘의 피부 점수")
        .description("가장 최근 분석의 종합 점수와 어제 대비 변화를 보여줘요.")
        .supportedFamilies([.systemSmall, .systemMedium,
                            .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

struct DDayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "DDayWidget", provider: SnapshotProvider()) { entry in
            WidgetFamilyReader { family in
                DDayWidgetView(family: family, snapshot: entry.snapshot)
                    .widgetURL(WidgetLink.dday)
            }
            .containerBackground(for: .widget) {
                LinearGradient(colors: [SnapshotTheme.gradientStart, SnapshotTheme.gradientEnd],
                               startPoint: .topLeading, endPoint: .bottomTrailing)
            }
        }
        .configurationDisplayName("Skin D-Day")
        .description("목표일까지 남은 날짜를 보여줘요.")
        .supportedFamilies([.systemSmall, .systemMedium,
                            .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

struct MetricsWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MetricsWidget", provider: SnapshotProvider()) { entry in
            WidgetFamilyReader { family in
                MetricsWidgetView(family: family, snapshot: entry.snapshot)
                    .widgetURL(WidgetLink.record)
            }
            .containerBackground(.background, for: .widget)
        }
        .configurationDisplayName("피부 지표 변화")
        .description("붉은기 · 트러블 · 피부톤 균일도의 어제 대비 변화를 보여줘요.")
        .supportedFamilies([.systemMedium, .systemLarge, .accessoryRectangular])
    }
}

struct ExperimentWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ExperimentWidget", provider: SnapshotProvider()) { entry in
            WidgetFamilyReader { family in
                ExperimentWidgetView(family: family, snapshot: entry.snapshot)
                    .widgetURL(WidgetLink.dday)
            }
            .containerBackground(.background, for: .widget)
        }
        .configurationDisplayName("생활 실험")
        .description("진행 중인 7일 실험의 실천율을 보여줘요.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
    }
}

struct ReminderWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ReminderWidget", provider: SnapshotProvider()) { entry in
            WidgetFamilyReader { family in
                ReminderWidgetView(family: family, snapshot: entry.snapshot)
                    .widgetURL(entry.snapshot.hasScore ? WidgetLink.home : WidgetLink.capture)
            }
            .containerBackground(.background, for: .widget)
        }
        .configurationDisplayName("오늘 할 일")
        .description("오늘의 리마인더와 환경 주의 사항을 보여줘요.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}

/// 환경의 widgetFamily를 읽어 공유 뷰에 넘겨주는 얇은 래퍼
private struct WidgetFamilyReader<Content: View>: View {
    @Environment(\.widgetFamily) private var family
    @ViewBuilder let content: (SnapshotFamily) -> Content

    var body: some View { content(family.snapshotFamily) }
}
