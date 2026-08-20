import SwiftUI

@MainActor
final class ReportViewModel: ObservableObject {
    @Published var type: ReportType = .weekly
    @Published var state: LoadState<SkinReport> = .loading

    func load() async {
        state = .loading
        do {
            if type == .weekly {
                state = .loaded(try await SkinSenseAPI.weeklyReport())
            } else {
                let now = Calendar.current.dateComponents([.year, .month], from: Date())
                state = .loaded(try await SkinSenseAPI.monthlyReport(year: now.year ?? 2026, month: now.month ?? 1))
            }
        } catch {
            state = .from(error)
        }
    }
}

/// 주간·월간 피부 리포트 (GET /api/v1/reports/weekly · /monthly)
struct ReportView: View {
    @StateObject private var viewModel = ReportViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: Theme.s(17), weight: .semibold))
                        .foregroundStyle(Theme.textInk)
                }
                .buttonStyle(.plain)
                Spacer()
                Text("피부 리포트")
                    .font(.inter(.bold, 16))
                    .foregroundStyle(Theme.textInk)
                Spacer()
                Color.clear.frame(width: Theme.s(20))
            }
            .frame(height: Theme.s(52))
            .padding(.horizontal, Theme.s(20))

            Picker("기간", selection: $viewModel.type) {
                ForEach(ReportType.allCases) { Text($0.label).tag($0) }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, Theme.s(20))
            .onChange(of: viewModel.type) { _, _ in Task { await viewModel.load() } }

            ScrollView {
                VStack(spacing: Theme.s(16)) {
                    switch viewModel.state {
                    case .loading:
                        EmptyStateBlock(message: "리포트를 만드는 중이에요", isLoading: true)
                    case let .empty(message):
                        EmptyStateBlock(message: message, icon: "doc.text")
                    case let .failed(message):
                        EmptyStateBlock(message: message, icon: "wifi.exclamationmark") {
                            Task { await viewModel.load() }
                        }
                    case let .loaded(report):
                        periodCard(report)
                        skinCard(report)
                        lifestyleCard(report)
                        environmentCard(report)
                        factorCard(report)
                        experimentCard(report)
                        if let warnings = report.warnings, !warnings.isEmpty {
                            PanelCard(spacing: Theme.s(8)) {
                                SectionHeaderRow(title: "참고")
                                ForEach(warnings, id: \.self) { warning in
                                    Label(warning, systemImage: "info.circle")
                                        .font(.inter(.regular, 11))
                                        .foregroundStyle(Theme.textGray)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Theme.s(16))
                .padding(.top, Theme.s(14))
                .padding(.bottom, Theme.s(40))
            }
        }
        .background(Theme.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task { await viewModel.load() }
    }

    // MARK: 카드

    private func periodCard(_ report: SkinReport) -> some View {
        PanelCard(spacing: Theme.s(8)) {
            SectionHeaderRow(title: "\(report.reportType?.label ?? "") 리포트")
            Text("\(report.displayPeriod?.startDate ?? "") ~ \(report.displayPeriod?.endDate ?? "")")
                .font(.inter(.medium, 13))
                .foregroundStyle(Theme.textInk)
            if let confidence = report.confidence {
                Text("신뢰도 \(confidence.score ?? 0) (\(confidence.level?.label ?? "-"))")
                    .font(.inter(.regular, 12))
                    .foregroundStyle(Theme.textGray)
            }
        }
    }

    @ViewBuilder
    private func skinCard(_ report: SkinReport) -> some View {
        PanelCard {
            SectionHeaderRow(title: "피부 요약")
            if let skin = report.skin, (skin.analysisCount ?? 0) > 0 {
                statLine("분석 횟수", "\(skin.analysisCount ?? 0)회")
                statLine("기록한 날", "\(skin.recordedDays ?? 0)/\(skin.periodDays ?? 0)일")
                if let averages = report.skin?.averages {
                    ForEach(averages.measured, id: \.0) { metric, value in
                        let change = changeValue(report.skin?.changes, metric)
                        HStack {
                            Text("평균 \(metric.label)")
                                .font(.inter(.regular, 13))
                                .foregroundStyle(Theme.textGray)
                            Spacer()
                            if let change, abs(change) >= 0.05 {
                                Text(String(format: "%+.1f", change))
                                    .font(.inter(.semiBold, 12))
                                    .foregroundStyle(change > 0 ? Theme.success : Theme.danger)
                            }
                            Text(String(format: "%.1f", value))
                                .font(.inter(.bold, 14))
                                .foregroundStyle(Theme.textInk)
                        }
                    }
                }
                Text("건조함·톤 균일도는 온디바이스 모델이 아직 측정하지 않아요.")
                    .font(.inter(.regular, 10))
                    .foregroundStyle(Theme.textTertiary)
            } else {
                EmptyStateBlock(message: "이 기간에 완료된 분석이 없어요.", icon: "camera.viewfinder")
            }
        }
    }

    private func changeValue(_ set: ReportScoreSet?, _ metric: SkinMetric) -> Double? {
        switch metric {
        case .redness: return set?.redness
        case .trouble: return set?.trouble
        case .dryness: return set?.dryness
        case .toneUniformity: return set?.toneUniformity
        case .overall: return set?.overall
        }
    }

    @ViewBuilder
    private func lifestyleCard(_ report: SkinReport) -> some View {
        PanelCard {
            SectionHeaderRow(title: "생활 요약")
            if let life = report.lifestyle, (life.recordedDays ?? 0) > 0 {
                statLine("기록한 날", "\(life.recordedDays ?? 0)일")
                if let minutes = life.averageSleepMinutes {
                    statLine("평균 수면", String(format: "%.0f시간 %.0f분", minutes / 60, minutes.truncatingRemainder(dividingBy: 60)))
                }
                statLine("7시간 이상 잔 날", "\(life.sleepAtLeastSevenHoursDays ?? 0)일")
                statLine("자정 전 취침", "\(life.bedtimeBeforeMidnightDays ?? 0)일")
                statLine("야식", "\(life.lateNightMealDays ?? 0)일")
                statLine("물 1.5L 이상", "\(life.waterAtLeast1500MlDays ?? 0)일")
            } else {
                EmptyStateBlock(message: "이 기간에 생활 기록이 없어요.", icon: "square.and.pencil")
            }
        }
    }

    @ViewBuilder
    private func environmentCard(_ report: SkinReport) -> some View {
        PanelCard {
            SectionHeaderRow(title: "환경 요약")
            if let env = report.environment, (env.recordedDays ?? 0) > 0 {
                statLine("기록한 날", "\(env.recordedDays ?? 0)일")
                if let uv = env.averageUvIndex { statLine("평균 UV", String(format: "%.1f", uv)) }
                if let temp = env.averageTemperature { statLine("평균 기온", String(format: "%.1f°C", temp)) }
                if let humidity = env.averageHumidity { statLine("평균 습도", String(format: "%.0f%%", humidity)) }
                if let dust = env.averageFineDust { statLine("평균 미세먼지", String(format: "%.0f", dust)) }
                if let risk = env.riskDays {
                    statLine("주의한 날", "UV \(risk.highUvDays ?? 0) · 건조 \(risk.lowHumidityDays ?? 0) · 미세먼지 \(risk.highFineDustDays ?? 0)")
                }
            } else {
                EmptyStateBlock(message: "이 기간에 환경 기록이 없어요.", icon: "cloud.sun")
            }
        }
    }

    @ViewBuilder
    private func factorCard(_ report: SkinReport) -> some View {
        PanelCard {
            SectionHeaderRow(title: "관찰된 생활 요인")
            let factors = report.topObservedFactors ?? []
            if factors.isEmpty {
                Text(report.factorAnalysisNotice ?? "아직 연관 요인을 찾을 만큼 데이터가 쌓이지 않았어요.")
                    .font(.inter(.regular, 12))
                    .foregroundStyle(Theme.textGray)
            } else {
                ForEach(factors) { factor in
                    VStack(alignment: .leading, spacing: Theme.s(3)) {
                        HStack {
                            Text("\(factor.factor?.label ?? "요인") ↔ \(factor.targetMetric?.label ?? "")")
                                .font(.inter(.semiBold, 13))
                                .foregroundStyle(Theme.textInk)
                            Spacer()
                            Text(String(format: "%+.1f", factor.observedDifference ?? 0))
                                .font(.inter(.bold, 13))
                                .foregroundStyle((factor.observedDifference ?? 0) >= 0 ? Theme.success : Theme.danger)
                        }
                        if let summary = factor.summary {
                            Text(summary)
                                .font(.inter(.regular, 11))
                                .foregroundStyle(Theme.textGray)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func experimentCard(_ report: SkinReport) -> some View {
        let experiments = report.completedExperiments ?? []
        if !experiments.isEmpty {
            PanelCard {
                SectionHeaderRow(title: "완료한 생활 실험")
                ForEach(experiments) { experiment in
                    HStack {
                        Text(experiment.experimentType?.emoji ?? "🧪")
                        Text(experiment.experimentType?.label ?? "실험")
                            .font(.inter(.semiBold, 13))
                            .foregroundStyle(Theme.textInk)
                        Spacer()
                        Text(String(format: "실천율 %.0f%%", (experiment.achievementRate ?? 0) * 100))
                            .font(.inter(.bold, 12))
                            .foregroundStyle(Theme.accent)
                    }
                }
            }
        }
    }

    private func statLine(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title)
                .font(.inter(.regular, 13))
                .foregroundStyle(Theme.textGray)
            Spacer()
            Text(value)
                .font(.inter(.semiBold, 13))
                .foregroundStyle(Theme.textInk)
        }
    }
}

#Preview {
    NavigationStack { ReportView() }
}
