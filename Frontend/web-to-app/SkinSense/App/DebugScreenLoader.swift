#if DEBUG
import SwiftUI

/// DEV_SCREEN=result 로 최신 분석 결과 화면을 바로 띄우기 위한 로더.
struct DebugLatestResultView: View {
    @State private var analysisId: Int64?
    @State private var message = "최신 분석을 불러오는 중이에요…"

    var body: some View {
        Group {
            if let analysisId {
                SkinVisionResultView(analysisId: analysisId)
            } else {
                VStack(spacing: Theme.s(10)) {
                    ProgressView().tint(Theme.accent)
                    Text(message).font(.inter(.regular, 13)).foregroundStyle(Theme.textGray)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Theme.background.ignoresSafeArea())
            }
        }
        .task {
            if let latest = try? await SkinSenseAPI.latestAnalysis() {
                analysisId = latest.analysisId
            } else {
                message = "완료된 분석이 없어요."
            }
        }
    }
}

/// DEV_SCREEN=experiment 로 활성 실험 결과 화면을 띄운다.
struct DebugExperimentResultView: View {
    @State private var experiment: Experiment?

    var body: some View {
        Group {
            if let experiment {
                ExperimentResultView(experiment: experiment)
            } else {
                EmptyStateBlock(message: "진행 중인 실험을 불러오는 중이에요", isLoading: true)
                    .frame(maxHeight: .infinity)
                    .background(Theme.background.ignoresSafeArea())
            }
        }
        .task {
            experiment = try? await SkinSenseAPI.activeExperiment()
            if experiment == nil {
                experiment = (try? await SkinSenseAPI.experiments())?.first
            }
        }
    }
}
#endif
