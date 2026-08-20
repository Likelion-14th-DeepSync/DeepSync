import SwiftUI
import UIKit

@MainActor
final class SkinVisionResultViewModel: ObservableObject {
    @Published var analysis: LoadState<SkinAnalysis> = .loading
    @Published var comparison: SkinAnalysisComparison?
    @Published var errorMessage: String?
    @Published var isSubmitting = false
    @Published var capturedImage: UIImage?

    let analysisId: Int64

    init(analysisId: Int64) {
        self.analysisId = analysisId
    }

    func load() async {
        do {
            let result = try await SkinSenseAPI.analysis(id: analysisId)
            analysis = .loaded(result)
            if result.status == .completed {
                comparison = try? await SkinSenseAPI.comparison(analysisId: analysisId)
            }
            if capturedImage == nil, let imageId = result.imageId,
               let data = try? await SkinSenseAPI.imageFileData(imageId: imageId) {
                capturedImage = UIImage(data: data)
            }
        } catch {
            analysis = .from(error)
        }
    }

    /// 온디바이스 Core ML 모델이 준비되면 이 자리에서 추론 결과를 넣어 제출한다.
    /// (지금은 개발 확인용으로만 쓰인다 — DEBUG 빌드에서만 노출)
    func submitScores(_ request: SkinAnalysisResultRequest) async {
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }
        do {
            _ = try? await SkinSenseAPI.startAnalysis(id: analysisId)
            let updated = try await SkinSenseAPI.submitAnalysisResult(id: analysisId, request)
            analysis = .loaded(updated)
            comparison = try? await SkinSenseAPI.comparison(analysisId: analysisId)
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }
}

struct SkinVisionResultView: View {
    @StateObject private var viewModel: SkinVisionResultViewModel
    @Environment(\.dismiss) private var dismiss
    let onFinish: () -> Void
    /// 방금 촬영해 온디바이스로 분석한 경우에만 전달된다.
    let scores: SkinVisionScores?

    init(analysisId: Int64, scores: SkinVisionScores? = nil, onFinish: @escaping () -> Void = {}) {
        _viewModel = StateObject(wrappedValue: SkinVisionResultViewModel(analysisId: analysisId))
        self.scores = scores
        self.onFinish = onFinish
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                header

                if let image = viewModel.capturedImage {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 180)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous))
                        .overlay(alignment: .bottomLeading) {
                            Text("분석에 사용된 사진")
                                .font(.system(size: Theme.s(11), weight: .medium))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(.black.opacity(0.45))
                                .clipShape(Capsule())
                                .padding(10)
                        }
                }

                switch viewModel.analysis {
                case .loading:
                    StatePlaceholder(state: "분석 정보를 불러오는 중이에요", isLoading: true).cardStyle()
                case let .failed(message), let .empty(message):
                    StatePlaceholder(state: message, icon: "exclamationmark.triangle") {
                        Task { await viewModel.load() }
                    }
                    .cardStyle()
                case let .loaded(analysis):
                    if analysis.status == .completed {
                        completedContent(analysis)
                    } else {
                        pendingContent(analysis)
                    }
                }

                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.inter(.regular, 12))
                        .foregroundStyle(.red.opacity(0.85))
                }

                Button {
                    onFinish()
                    dismiss()
                } label: {
                    Text("돌아가기")
                        .font(.inter(.semiBold, 16))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(Theme.primaryDark)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
            }
            .padding(20)
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationBarBackButtonHidden(true)
        .task { await viewModel.load() }
        .refreshable { await viewModel.load() }
    }

    private var header: some View {
        VStack(spacing: 8) {
            Text("SkinVision 분석")
                .font(.inter(.bold, 22))
                .foregroundStyle(Theme.textPrimary)
            Text("분석 #\(viewModel.analysisId)")
                .font(.inter(.regular, 13))
                .foregroundStyle(Theme.textGray)
        }
        .padding(.top, 12)
    }

    // MARK: 분석 완료

    @ViewBuilder
    private func completedContent(_ analysis: SkinAnalysis) -> some View {
        if let overall = analysis.overallScore {
            ScoreRing(score: overall, lineWidth: 14, showsCaption: false)
                .frame(width: 180, height: 180)
            Text("종합 피부 점수")
                .font(.inter(.regular, 13))
                .foregroundStyle(Theme.textGray)
        }

        VStack(alignment: .leading, spacing: 14) {
            Text("세부 분석")
                .font(.inter(.bold, 17))
                .foregroundStyle(Theme.textPrimary)

            VStack(spacing: 14) {
                ForEach(analysis.measuredMetricScores, id: \.0) { metric, score in
                    MetricBar(title: metric.label, value: score, icon: metric.icon,
                              change: change(for: metric))
                }
            }

            if let confidence = analysis.confidenceScore {
                Divider().background(Theme.divider)
                HStack {
                    Label("모델 신뢰도", systemImage: "checkmark.seal")
                        .font(.system(size: Theme.s(13)))
                        .foregroundStyle(Theme.textSecondary)
                    Spacer()
                    Text("\(confidence)")
                        .font(.inter(.semiBold, 13))
                        .foregroundStyle(Theme.textPrimary)
                }
            }
            if let version = analysis.modelVersion {
                Text("모델 버전 \(version)")
                    .font(.inter(.regular, 11))
                    .foregroundStyle(Theme.textSecondary)
            }
        }
        .cardStyle()

        if let scores {
            LesionBreakdownCard(scores: scores)
        }

        UnsupportedMetricsCard()
    }

    private func change(for metric: SkinMetric) -> Int? {
        guard let previous = viewModel.comparison?.previousComparison else { return nil }
        switch metric {
        case .redness: return previous.rednessScoreChange
        case .trouble: return previous.troubleScoreChange
        case .dryness: return previous.drynessScoreChange
        case .toneUniformity: return previous.toneUniformityScoreChange
        case .overall: return previous.overallScoreChange
        }
    }

    // MARK: 분석 대기 / 실패

    @ViewBuilder
    private func pendingContent(_ analysis: SkinAnalysis) -> some View {
        VStack(spacing: 12) {
            Image(systemName: analysis.status == .failed ? "xmark.octagon" : "hourglass")
                .font(.system(size: Theme.s(30)))
                .foregroundStyle(Theme.primaryDark)
            Text(analysis.status?.label ?? "상태 확인 중")
                .font(.inter(.semiBold, 16))
                .foregroundStyle(Theme.textPrimary)
            Text(analysis.failureReason
                 ?? "사진과 분석 요청은 서버에 등록됐어요.\n점수 계산이 끝나면 자동으로 표시돼요.")
                .font(.system(size: Theme.s(13)))
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.textSecondary)
                .lineSpacing(3)

            Button {
                Task { await viewModel.load() }
            } label: {
                Label("상태 새로고침", systemImage: "arrow.clockwise")
                    .font(.inter(.semiBold, 13))
                    .foregroundStyle(Theme.primaryDark)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .cardStyle()

    }
}

// MARK: - 백엔드에 없는 지표 안내

private struct UnsupportedMetricsCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("건조함 · 톤 균일도 · 모공 · 수분 · 탄력", systemImage: "hourglass")
                .font(.inter(.semiBold, 14))
                .foregroundStyle(Theme.textPrimary)
            Text("아직 측정하지 않아요. 현재 온디바이스 모델은 트러블(여드름 4종)과 홍조만 판별합니다.")
                .font(.inter(.regular, 12))
                .foregroundStyle(Theme.textSecondary)
        }
        .cardStyle()
    }
}

// MARK: - 개발용 점수 제출 (Core ML 모델 연결 전 확인용)


/// 종합 점수 링 (홈이 피그마 디자인으로 바뀌면서 이곳으로 옮겨왔다)
struct ScoreRing: View {
    let score: Int
    var lineWidth: CGFloat = 14
    var showsCaption: Bool = true

    var body: some View {
        ZStack {
            Circle().stroke(Theme.border, lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: CGFloat(min(max(score, 0), 100)) / 100)
                .stroke(Theme.primary, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: 0) {
                Text("\(score)")
                    .font(.inter(.bold, lineWidth > 10 ? 42 : 26))
                    .foregroundStyle(Theme.textPrimary)
                if showsCaption {
                    Text("점").font(.inter(.regular, 11)).foregroundStyle(Theme.textSecondary)
                }
            }
        }
    }
}

private struct MetricBar: View {
    let title: String
    let value: Int
    let icon: String
    var change: Int?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Label(title, systemImage: icon)
                    .font(.inter(.medium, 13))
                    .foregroundStyle(Theme.textPrimary)
                Spacer()
                if let change, change != 0 {
                    Text("\(change > 0 ? "+" : "")\(change)")
                        .font(.inter(.semiBold, 11))
                        .foregroundStyle(change > 0 ? Theme.primaryDark : .orange)
                }
                Text("\(value)")
                    .font(.inter(.semiBold, 13))
                    .foregroundStyle(Theme.textSecondary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.divider)
                    Capsule()
                        .fill(Theme.primary)
                        .frame(width: geo.size.width * CGFloat(min(max(value, 0), 100)) / 100)
                }
            }
            .frame(height: 8)
        }
    }
}

#Preview {
    NavigationStack { SkinVisionResultView(analysisId: 1) }
}


// MARK: - 여드름 유형별 검출 (온디바이스 모델 4종)

private struct LesionBreakdownCard: View {
    let scores: SkinVisionScores

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.s(14)) {
            HStack {
                Label("여드름 유형별 분석", systemImage: "sparkle.magnifyingglass")
                    .font(.inter(.bold, 15))
                    .foregroundStyle(Theme.textInk)
                Spacer()
                Text("사진 \(scores.analyzedImageCount)장")
                    .font(.inter(.regular, 11))
                    .foregroundStyle(Theme.textTertiary)
            }

            ForEach(LesionType.allCases) { lesion in
                let value = scores.lesionProbabilities[lesion] ?? 0
                VStack(alignment: .leading, spacing: Theme.s(5)) {
                    HStack {
                        Text(lesion.label)
                            .font(.inter(.semiBold, 13))
                            .foregroundStyle(Theme.textInk)
                        Text(lesion.detail)
                            .font(.inter(.regular, 11))
                            .foregroundStyle(Theme.textTertiary)
                        Spacer()
                        Text(String(format: "%.0f%%", value * 100))
                            .font(.inter(.bold, 13))
                            .foregroundStyle(color(for: value))
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Theme.trackBackground)
                            Capsule()
                                .fill(color(for: value))
                                .frame(width: geo.size.width * CGFloat(min(max(value, 0), 1)))
                        }
                    }
                    .frame(height: Theme.s(6))
                }
            }

            Text("기기 안에서만 분석되며 사진 원본은 분석 결과와 함께 계정에 저장돼요.")
                .font(.inter(.regular, 10))
                .foregroundStyle(Theme.textTertiary)
        }
        .cardStyle(radius: Theme.radiusCard, padding: Theme.s(16))
    }

    private func color(for value: Double) -> Color {
        switch value {
        case ..<0.25: return Theme.success
        case ..<0.6: return Theme.warning
        default: return Theme.danger
        }
    }
}
