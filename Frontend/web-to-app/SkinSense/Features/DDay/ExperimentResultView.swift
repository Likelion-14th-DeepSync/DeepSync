import SwiftUI

/// 생활 실험 결과 리포트 (GET/POST /api/v1/experiments/{id}/result)
struct ExperimentResultView: View {
    let experiment: Experiment
    @Environment(\.dismiss) private var dismiss

    @State private var state: LoadState<ExperimentResult> = .loading
    @State private var summary: ExperimentProgressSummary?
    @State private var isCompleting = false
    @State private var errorMessage: String?

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
                Text("실험 결과")
                    .font(.inter(.bold, 16))
                    .foregroundStyle(Theme.textInk)
                Spacer()
                Color.clear.frame(width: Theme.s(20))
            }
            .frame(height: Theme.s(52))
            .padding(.horizontal, Theme.s(20))

            ScrollView {
                VStack(spacing: Theme.s(16)) {
                    header

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.inter(.regular, 12))
                            .foregroundStyle(Theme.danger)
                    }

                    switch state {
                    case .loading:
                        EmptyStateBlock(message: "결과를 불러오는 중이에요", isLoading: true)
                    case let .failed(message):
                        EmptyStateBlock(message: message, icon: "wifi.exclamationmark") {
                            Task { await load() }
                        }
                    case .empty:
                        PanelCard {
                            EmptyStateBlock(
                                message: "아직 결과가 없어요.\n실험을 완료하면 피부 변화를 계산해드려요.",
                                icon: "flask"
                            )
                            PrimaryButton(title: isCompleting ? "계산 중…" : "실험 완료하고 결과 보기",
                                          isEnabled: !isCompleting, height: Theme.s(44)) {
                                Task { await complete() }
                            }
                        }
                    case let .loaded(result):
                        resultCards(result)
                        summaryCard
                    }
                }
                .padding(.horizontal, Theme.s(16))
                .padding(.top, Theme.s(14))
                .padding(.bottom, Theme.s(40))
            }
        }
        .background(Theme.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task {
            await load()
            summary = try? await SkinSenseAPI.experimentProgressSummary(id: experiment.experimentId)
        }
    }

    private var header: some View {
        PanelCard(spacing: Theme.s(8)) {
            HStack(spacing: Theme.s(10)) {
                Text(experiment.experimentType?.emoji ?? "🧪").font(.system(size: Theme.s(20)))
                Text(experiment.title ?? experiment.experimentType?.label ?? "실험")
                    .font(.inter(.bold, 15))
                    .foregroundStyle(Theme.textInk)
                Spacer()
                TagBadge(text: experiment.status?.label ?? "-")
            }
            Text("\(experiment.startDate ?? "") ~ \(experiment.endDate ?? "") · \(experiment.durationDays ?? 0)일")
                .font(.inter(.regular, 12))
                .foregroundStyle(Theme.textGray)
        }
    }

    @ViewBuilder
    private func resultCards(_ result: ExperimentResult) -> some View {
        PanelCard {
            SectionHeaderRow(title: "실천 결과")
            HStack {
                VStack(spacing: Theme.s(4)) {
                    Text(String(format: "%.0f%%", (result.achievementRate ?? 0) * 100))
                        .font(.inter(.extraBold, 26))
                        .foregroundStyle(Theme.accent)
                    Text("실천율").font(.inter(.regular, 11)).foregroundStyle(Theme.textGray)
                }
                .frame(maxWidth: .infinity)

                VStack(spacing: Theme.s(4)) {
                    Text("\(result.achievedDays ?? 0)/\(result.evaluatedDays ?? 0)")
                        .font(.inter(.extraBold, 26))
                        .foregroundStyle(Theme.textInk)
                    Text("달성일").font(.inter(.regular, 11)).foregroundStyle(Theme.textGray)
                }
                .frame(maxWidth: .infinity)
            }
            ProgressTrack(value: result.achievementRate ?? 0)
        }

        PanelCard {
            SectionHeaderRow(title: "피부 점수 변화")
            if let changes = result.scoreChanges {
                changeRow("종합", changes.overall)
                changeRow("트러블", changes.trouble)
                changeRow("홍조", changes.redness)
                Text("건조함·톤 균일도는 온디바이스 모델이 측정하지 않아 제외했어요.")
                    .font(.inter(.regular, 10))
                    .foregroundStyle(Theme.textTertiary)
            } else {
                EmptyStateBlock(message: "비교할 분석이 부족해요.", icon: "chart.bar")
            }
        }

        PanelCard(spacing: Theme.s(10)) {
            SectionHeaderRow(title: "판단")
            if let summary = result.summary {
                Text(summary)
                    .font(.inter(.regular, 13))
                    .foregroundStyle(Theme.textInk)
                    .lineSpacing(Theme.s(3))
            }
            HStack(spacing: Theme.s(8)) {
                TagBadge(text: "신뢰도 \(result.confidenceLevel?.label ?? "-")")
                if let recommendation = result.recommendation {
                    TagBadge(text: recommendationLabel(recommendation),
                             foreground: Theme.textInk, background: Theme.panelBorder)
                }
            }
            ForEach(result.confidenceReasons ?? [], id: \.self) { reason in
                Label(reason, systemImage: "info.circle")
                    .font(.inter(.regular, 11))
                    .foregroundStyle(Theme.textGray)
            }
        }
    }

    @ViewBuilder
    private var summaryCard: some View {
        if let segments = summary?.weeklySummaries, !segments.isEmpty {
            PanelCard {
                SectionHeaderRow(title: "주차별 실천")
                ForEach(segments) { segment in
                    VStack(alignment: .leading, spacing: Theme.s(5)) {
                        HStack {
                            Text("\(segment.sequence ?? 0)주차")
                                .font(.inter(.semiBold, 13))
                                .foregroundStyle(Theme.textInk)
                            Text("\(segment.startDate ?? "") ~ \(segment.endDate ?? "")")
                                .font(.inter(.regular, 11))
                                .foregroundStyle(Theme.textTertiary)
                            Spacer()
                            Text(String(format: "%.0f%%", (segment.completionRate ?? 0) * 100))
                                .font(.inter(.bold, 13))
                                .foregroundStyle(Theme.accent)
                        }
                        ProgressTrack(value: segment.completionRate ?? 0)
                        Text("달성 \(segment.achievedDays ?? 0)일 · 미기록 \(segment.missingDays ?? 0)일")
                            .font(.inter(.regular, 10))
                            .foregroundStyle(Theme.textGray)
                    }
                }
            }
        }
    }

    private func changeRow(_ title: String, _ change: ScoreChange?) -> some View {
        HStack {
            Text(title).font(.inter(.regular, 13)).foregroundStyle(Theme.textGray)
            Spacer()
            if let change, let value = change.change {
                Text(String(format: "%.0f → %.0f", change.before ?? 0, change.after ?? 0))
                    .font(.inter(.regular, 12))
                    .foregroundStyle(Theme.textTertiary)
                Text(String(format: "%+.1f", value))
                    .font(.inter(.bold, 13))
                    .foregroundStyle(value >= 0 ? Theme.success : Theme.danger)
            } else {
                Text("데이터 부족").font(.inter(.regular, 12)).foregroundStyle(Theme.textTertiary)
            }
        }
    }

    private func recommendationLabel(_ raw: String) -> String {
        switch raw {
        case "CONTINUE": return "계속 추천"
        case "NEUTRAL": return "판단 보류"
        case "MORE_DATA_NEEDED": return "데이터 더 필요"
        case "RECONSIDER": return "재검토 권장"
        default: return raw
        }
    }

    private func load() async {
        do {
            state = .loaded(try await SkinSenseAPI.experimentResult(id: experiment.experimentId))
        } catch {
            state = .from(error)
        }
    }

    private func complete() async {
        isCompleting = true
        errorMessage = nil
        defer { isCompleting = false }
        do {
            // 종료 응답은 실험 정보이고, 결과 리포트는 별도 조회한다.
            _ = try await SkinSenseAPI.completeExperiment(id: experiment.experimentId)
            state = .loaded(try await SkinSenseAPI.experimentResult(id: experiment.experimentId))
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }
}
