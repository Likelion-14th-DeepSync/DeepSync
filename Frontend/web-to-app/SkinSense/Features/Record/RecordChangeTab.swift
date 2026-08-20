import SwiftUI

/// 피그마 "기록 - 변화"(42:4988)
struct RecordChangeTab: View {
    @ObservedObject var viewModel: RecordViewModel
    @State private var selectedFactor: LifestyleFactor?

    private func dotColor(_ metric: SkinMetric) -> Color {
        switch metric {
        case .redness: return Theme.danger
        case .trouble: return Theme.warning
        case .toneUniformity: return Theme.info
        case .dryness: return Theme.success
        case .overall: return Theme.accent
        }
    }

    var body: some View {
        VStack(spacing: Theme.s(16)) {
            PanelCard {
                SectionHeaderRow(title: "주요 지표 변화 (7일 기준)")

                VStack(spacing: Theme.s(12)) {
                    ForEach(viewModel.metricChanges, id: \.0) { metric, change in
                        HStack(spacing: Theme.s(8)) {
                            Circle().fill(dotColor(metric)).frame(width: Theme.s(8), height: Theme.s(8))
                            Text(metric.label)
                                .font(.inter(.regular, 14))
                                .foregroundStyle(Theme.textInk)
                            Spacer()
                            if let change {
                                Text(change == 0 ? "변화 없음"
                                     : "\(change > 0 ? "+" : "")\(change)점 \(change > 0 ? "↑" : "↓")")
                                    .font(.inter(.bold, 14))
                                    .foregroundStyle(change == 0 ? Theme.textGray : (change > 0 ? Theme.success : Theme.danger))
                            } else {
                                Text("데이터 부족")
                                    .font(.inter(.regular, 13))
                                    .foregroundStyle(Theme.textTertiary)
                            }
                        }
                        .frame(height: Theme.s(17))
                    }

                    HStack(spacing: Theme.s(8)) {
                        Circle().fill(Theme.success).frame(width: Theme.s(8), height: Theme.s(8))
                        Text("모공 (피부결)")
                            .font(.inter(.regular, 14))
                            .foregroundStyle(Theme.textTertiary)
                        Spacer()
                        Text("준비 중")
                            .font(.inter(.regular, 13))
                            .foregroundStyle(Theme.textTertiary)
                    }
                    .frame(height: Theme.s(17))
                }
            }

            PanelCard {
                SectionHeaderRow(title: "생활 요인과의 연관성", actionTitle: "다시 계산") {
                    Task { await viewModel.recalculate() }
                }

                switch viewModel.factors {
                case .loading:
                    EmptyStateBlock(message: "분석 중이에요", isLoading: true)
                case let .empty(message), let .failed(message):
                    EmptyStateBlock(message: message, icon: "chart.bar")
                case let .loaded(list):
                    if list.isEmpty {
                        EmptyStateBlock(
                            message: "아직 연관성을 계산할 데이터가 부족해요.\n촬영과 생활 기록을 며칠 이어가 보세요.",
                            icon: "chart.bar"
                        )
                    } else {
                        VStack(spacing: Theme.s(12)) {
                            ForEach(list) { analysis in
                                let metric = analysis.overallMetric
                                Button {
                                    selectedFactor = analysis.factor
                                } label: {
                                HStack(spacing: Theme.s(8)) {
                                    Text("\(analysis.factor?.label ?? "요인") ↔ \(metric?.targetMetric?.label ?? "종합")")
                                        .font(.inter(.regular, 13))
                                        .foregroundStyle(Theme.textGray)
                                        .lineLimit(1)
                                    Spacer(minLength: Theme.s(8))
                                    Text(levelLabel(metric?.confidenceLevel))
                                        .font(.inter(.regular, 12))
                                        .foregroundStyle(Theme.textTertiary)
                                    HStack(spacing: Theme.s(3)) {
                                        ForEach(0..<3, id: \.self) { index in
                                            Circle()
                                                .fill(index < levelDots(metric?.confidenceLevel) ? Theme.accent : Theme.panelBorder)
                                                .frame(width: Theme.s(6), height: Theme.s(6))
                                        }
                                    }
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: Theme.s(10)))
                                        .foregroundStyle(Theme.textTertiary)
                                }
                                .frame(height: Theme.s(16))
                                .contentShape(Rectangle())
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }
            .sheet(item: $selectedFactor) { factor in
                FactorDetailSheet(factor: factor)
            }

            if let confidence = viewModel.confidence {
                PanelCard {
                    SectionHeaderRow(title: "종합 분석 신뢰도")
                    HStack(alignment: .firstTextBaseline, spacing: Theme.s(10)) {
                        Text("\(confidence.score ?? 0)")
                            .font(.inter(.extraBold, 28))
                            .foregroundStyle(Theme.accent)
                        Text(confidence.level?.label ?? "-")
                            .font(.inter(.semiBold, 14))
                            .foregroundStyle(Theme.textInk)
                        Spacer()
                        if let days = confidence.periodDays {
                            Text("최근 \(days)일 기준")
                                .font(.inter(.regular, 11))
                                .foregroundStyle(Theme.textTertiary)
                        }
                    }
                    ForEach((confidence.nextActions ?? []).prefix(3), id: \.self) { action in
                        HStack(spacing: Theme.s(8)) {
                            Image(systemName: "arrow.right.circle")
                                .font(.system(size: Theme.s(11)))
                                .foregroundStyle(Theme.accent)
                            Text(action)
                                .font(.inter(.regular, 12))
                                .foregroundStyle(Theme.textGray)
                        }
                    }
                }
            }

            PanelCard {
                SectionHeaderRow(title: "피부 점수 추이 (7일)")
                if let points = viewModel.timeline?.analyses, points.count >= 2 {
                    TrendSparkline(points: points)
                } else {
                    EmptyStateBlock(message: "분석이 2회 이상 쌓이면 그래프가 나타나요.", icon: "chart.xyaxis.line")
                }
            }
        }
    }

    private func levelLabel(_ level: ConfidenceLevel?) -> String {
        switch level {
        case .high: return "연관성 높음"
        case .medium: return "연관성 보통"
        case .low: return "연관성 낮음"
        case nil: return "판단 보류"
        }
    }

    private func levelDots(_ level: ConfidenceLevel?) -> Int {
        switch level {
        case .high: return 3
        case .medium: return 2
        case .low: return 1
        case nil: return 0
        }
    }
}

private struct TrendSparkline: View {
    let points: [SkinScoreSnapshot]

    var body: some View {
        let values = points.compactMap(\.overallScore)
        GeometryReader { geo in
            let maxV = max(values.max() ?? 100, 1)
            let minV = min(values.min() ?? 0, maxV - 1)
            let stepX = values.count > 1 ? geo.size.width / CGFloat(values.count - 1) : 0

            ZStack {
                Path { path in
                    for (index, value) in values.enumerated() {
                        let ratio = CGFloat(value - minV) / CGFloat(maxV - minV)
                        let point = CGPoint(x: CGFloat(index) * stepX, y: geo.size.height * (1 - ratio))
                        if index == 0 { path.move(to: point) } else { path.addLine(to: point) }
                    }
                }
                .stroke(Theme.accent, style: StrokeStyle(lineWidth: Theme.s(2), lineCap: .round, lineJoin: .round))

                ForEach(Array(values.enumerated()), id: \.offset) { index, value in
                    let ratio = CGFloat(value - minV) / CGFloat(maxV - minV)
                    Circle()
                        .fill(Theme.accent)
                        .frame(width: Theme.s(6), height: Theme.s(6))
                        .position(x: CGFloat(index) * stepX, y: geo.size.height * (1 - ratio))
                }
            }
        }
        .frame(height: Theme.s(90))
        .padding(.vertical, Theme.s(6))
    }
}


// MARK: - 요인 상세 (GET /api/v1/analysis/factors/{factor})

private struct FactorDetailSheet: View {
    let factor: LifestyleFactor
    @Environment(\.dismiss) private var dismiss
    @State private var state: LoadState<PersonalFactorAnalysis> = .loading

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.s(14)) {
                    switch state {
                    case .loading:
                        EmptyStateBlock(message: "요인을 분석하는 중이에요", isLoading: true)
                    case let .empty(message), let .failed(message):
                        EmptyStateBlock(message: message, icon: "chart.bar")
                    case let .loaded(analysis):
                        PanelCard(spacing: Theme.s(8)) {
                            HStack(spacing: Theme.s(10)) {
                                Image(systemName: factor.icon)
                                    .font(.system(size: Theme.s(16)))
                                    .foregroundStyle(Theme.accent)
                                Text(factor.label)
                                    .font(.inter(.bold, 16))
                                    .foregroundStyle(Theme.textInk)
                                Spacer()
                            }
                            Text("\(analysis.analyzedFrom ?? "") ~ \(analysis.analyzedTo ?? "")")
                                .font(.inter(.regular, 12))
                                .foregroundStyle(Theme.textGray)
                            if let notice = analysis.notice {
                                Text(notice)
                                    .font(.inter(.regular, 11))
                                    .foregroundStyle(Theme.textTertiary)
                            }
                        }

                        ForEach(Array((analysis.metrics ?? []).enumerated()), id: \.offset) { _, metric in
                            PanelCard(spacing: Theme.s(8)) {
                                HStack {
                                    Text(metric.targetMetric?.label ?? "지표")
                                        .font(.inter(.bold, 14))
                                        .foregroundStyle(Theme.textInk)
                                    Spacer()
                                    Text(String(format: "%+.1f", metric.observedDifference ?? 0))
                                        .font(.inter(.bold, 14))
                                        .foregroundStyle((metric.observedDifference ?? 0) >= 0 ? Theme.success : Theme.danger)
                                }
                                row("노출된 날 평균", metric.exposedAverage.map { String(format: "%.1f", $0) } ?? "-")
                                row("그 외 평균", metric.normalAverage.map { String(format: "%.1f", $0) } ?? "-")
                                row("관측 일수", "노출 \(metric.exposedCount ?? 0)일 · 그 외 \(metric.normalCount ?? 0)일")
                                row("신뢰도", metric.confidenceLevel?.label ?? "-")
                                if let summary = metric.summary {
                                    Text(summary)
                                        .font(.inter(.regular, 11))
                                        .foregroundStyle(Theme.textGray)
                                }
                            }
                        }
                    }
                }
                .padding(Theme.s(16))
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("요인 상세")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("닫기") { dismiss() } } }
            .task {
                do { state = .loaded(try await SkinSenseAPI.factorDetail(factor)) }
                catch { state = .from(error) }
            }
        }
    }

    private func row(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title).font(.inter(.regular, 12)).foregroundStyle(Theme.textGray)
            Spacer()
            Text(value).font(.inter(.semiBold, 12)).foregroundStyle(Theme.textInk)
        }
    }
}
