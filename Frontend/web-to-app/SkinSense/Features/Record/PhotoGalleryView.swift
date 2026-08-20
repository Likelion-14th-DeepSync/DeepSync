import SwiftUI

@MainActor
final class PhotoGalleryViewModel: ObservableObject {
    @Published var images: [SkinImage] = []
    @Published var analyses: [SkinAnalysis] = []
    @Published var baseline: SkinAnalysisBaseline?
    @Published var state: LoadState<Bool> = .loading
    @Published var errorMessage: String?

    func load() async {
        do {
            let from = ServerDate.daysAgo(90)
            let to = ServerDate.today
            async let imagesTask = SkinSenseAPI.skinImages(from: from, to: to)
            async let analysesTask = SkinSenseAPI.analyses(from: from, to: to)
            images = try await imagesTask.sorted {
                (ServerDate.parse($0.capturedAt) ?? .distantPast) > (ServerDate.parse($1.capturedAt) ?? .distantPast)
            }
            analyses = (try? await analysesTask) ?? []
            baseline = try? await SkinSenseAPI.baseline()
            state = .loaded(true)
        } catch {
            state = .from(error)
        }
    }

    func analysis(for image: SkinImage) -> SkinAnalysis? {
        analyses.first { $0.imageId == image.imageId }
    }

    func delete(_ image: SkinImage) async {
        errorMessage = nil
        do {
            try await SkinSenseAPI.deleteSkinImage(imageId: image.imageId)
            images.removeAll { $0.imageId == image.imageId }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    func makeBaseline(analysisId: Int64) async {
        errorMessage = nil
        do { baseline = try await SkinSenseAPI.setBaseline(analysisId: analysisId) }
        catch { errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription }
    }
}

/// 사진 전체 보기 (GET /skin-images, /quality, DELETE, 기준 사진 설정)
struct PhotoGalleryView: View {
    @StateObject private var viewModel = PhotoGalleryViewModel()
    @Environment(\.dismiss) private var dismiss
    @State private var selected: SkinImage?

    private var columns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: Theme.s(12)), count: 3)
    }

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
                Text("사진 전체 보기").font(.inter(.bold, 16)).foregroundStyle(Theme.textInk)
                Spacer()
                Color.clear.frame(width: Theme.s(20))
            }
            .frame(height: Theme.s(52))
            .padding(.horizontal, Theme.s(20))

            ScrollView {
                VStack(spacing: Theme.s(14)) {
                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage).font(.inter(.regular, 12)).foregroundStyle(Theme.danger)
                    }

                    switch viewModel.state {
                    case .loading:
                        EmptyStateBlock(message: "사진을 불러오는 중이에요", isLoading: true)
                    case let .failed(message), let .empty(message):
                        EmptyStateBlock(message: message, icon: "photo") { Task { await viewModel.load() } }
                    case .loaded:
                        if viewModel.images.isEmpty {
                            EmptyStateBlock(message: "최근 90일간 촬영한 사진이 없어요.", icon: "photo.on.rectangle")
                        } else {
                            if let baseline = viewModel.baseline {
                                PanelCard(spacing: Theme.s(6)) {
                                    SectionHeaderRow(title: "기준 사진")
                                    Text("\(ServerDate.parse(baseline.capturedAt).map { ServerDate.dateString($0) } ?? "-") · 종합 \(baseline.overallScore ?? 0)점")
                                        .font(.inter(.medium, 13))
                                        .foregroundStyle(Theme.textInk)
                                    Text("변화 비교의 기준이 되는 사진이에요.")
                                        .font(.inter(.regular, 11))
                                        .foregroundStyle(Theme.textGray)
                                }
                            }

                            LazyVGrid(columns: columns, spacing: Theme.s(12)) {
                                ForEach(viewModel.images) { image in
                                    Button { selected = image } label: {
                                        VStack(spacing: Theme.s(6)) {
                                            RemoteSkinImage(imageId: image.imageId)
                                                .aspectRatio(1, contentMode: .fill)
                                                .frame(maxWidth: .infinity)
                                                .clipShape(RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous))
                                            HStack(spacing: Theme.s(4)) {
                                                Text(shortDate(image.capturedAt))
                                                    .font(.inter(.regular, 10))
                                                    .foregroundStyle(Theme.textGray)
                                                Spacer(minLength: 0)
                                                if let score = viewModel.analysis(for: image)?.overallScore {
                                                    Text("\(score)")
                                                        .font(.inter(.bold, 11))
                                                        .foregroundStyle(Theme.accent)
                                                }
                                            }
                                        }
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Theme.s(16))
                .padding(.top, Theme.s(12))
                .padding(.bottom, Theme.s(40))
            }
        }
        .background(Theme.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task { await viewModel.load() }
        .sheet(item: $selected) { image in
            PhotoDetailSheet(
                image: image,
                analysis: viewModel.analysis(for: image),
                isBaseline: viewModel.baseline?.imageId == image.imageId,
                onDelete: { await viewModel.delete(image); selected = nil },
                onMakeBaseline: { analysisId in await viewModel.makeBaseline(analysisId: analysisId) }
            )
        }
    }

    private func shortDate(_ raw: String?) -> String {
        guard let date = ServerDate.parse(raw) else { return "-" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.dateFormat = "M/d"
        return f.string(from: date)
    }
}

/// 사진 상세 — 품질 점수, 기준 사진 지정, 삭제
private struct PhotoDetailSheet: View {
    let image: SkinImage
    let analysis: SkinAnalysis?
    let isBaseline: Bool
    let onDelete: () async -> Void
    let onMakeBaseline: (Int64) async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var quality: SkinImageQuality?
    @State private var isWorking = false
    @State private var confirmDelete = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.s(16)) {
                    RemoteSkinImage(imageId: image.imageId)
                        .aspectRatio(3.0 / 4.0, contentMode: .fit)
                        .frame(maxWidth: .infinity)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusCard, style: .continuous))

                    PanelCard(spacing: Theme.s(8)) {
                        SectionHeaderRow(title: "사진 정보")
                        infoRow("촬영", ServerDate.parse(image.capturedAt).map {
                            $0.formatted(date: .long, time: .shortened)
                        } ?? "-")
                        infoRow("방향", image.direction.map { direction in
                            switch direction {
                            case .front: return "정면"
                            case .left: return "좌측"
                            case .right: return "우측"
                            }
                        } ?? "-")
                        infoRow("메이크업", (image.makeupApplied ?? false) ? "있음" : "없음")
                        infoRow("용량", image.fileSize.map { "\($0 / 1024)KB" } ?? "-")
                    }

                    PanelCard(spacing: Theme.s(8)) {
                        SectionHeaderRow(title: "품질 검사")
                        if let quality {
                            infoRow("결과", "\(quality.qualityStatus?.label ?? "-") (\(quality.overallScore ?? 0)점)")
                            infoRow("해상도", "\(quality.resolutionScore ?? 0)")
                            infoRow("밝기", "\(quality.lightingScore ?? 0)")
                            infoRow("조명 균일도", "\(quality.lightingUniformityScore ?? 0)")
                            infoRow("선명도", "\(quality.sharpnessScore ?? 0)")
                            ForEach(quality.messages ?? [], id: \.self) { message in
                                Label(message, systemImage: "exclamationmark.circle")
                                    .font(.inter(.regular, 11))
                                    .foregroundStyle(Theme.textGray)
                            }
                        } else {
                            Text("품질 검사 기록이 없어요.")
                                .font(.inter(.regular, 12))
                                .foregroundStyle(Theme.textGray)
                        }
                    }

                    if let analysis, analysis.status == .completed {
                        PanelCard(spacing: Theme.s(10)) {
                            SectionHeaderRow(title: "분석 결과")
                            ForEach(analysis.measuredMetricScores, id: \.0) { metric, score in
                                infoRow(metric.label, "\(score)")
                            }
                            if isBaseline {
                                TagBadge(text: "현재 기준 사진")
                            } else {
                                PrimaryButton(title: "이 사진을 기준으로 설정",
                                              isEnabled: !isWorking, height: Theme.s(42)) {
                                    Task {
                                        isWorking = true
                                        await onMakeBaseline(analysis.analysisId)
                                        isWorking = false
                                    }
                                }
                            }
                        }
                    }

                    Button(role: .destructive) {
                        confirmDelete = true
                    } label: {
                        Text("사진 삭제")
                            .font(.inter(.semiBold, 14))
                            .foregroundStyle(Theme.danger)
                            .frame(maxWidth: .infinity)
                            .frame(height: Theme.s(44))
                            .overlay(
                                RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous)
                                    .stroke(Theme.danger.opacity(0.4), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
                .padding(Theme.s(16))
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("사진 상세")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) { Button("닫기") { dismiss() } }
            }
            .task {
                quality = try? await SkinSenseAPI.imageQuality(imageId: image.imageId)
            }
            .alert("사진을 삭제할까요?", isPresented: $confirmDelete) {
                Button("삭제", role: .destructive) { Task { await onDelete() } }
                Button("취소", role: .cancel) {}
            } message: {
                Text("삭제하면 되돌릴 수 없어요.")
            }
        }
    }

    private func infoRow(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title).font(.inter(.regular, 12)).foregroundStyle(Theme.textGray)
            Spacer()
            Text(value).font(.inter(.semiBold, 12)).foregroundStyle(Theme.textInk)
        }
    }
}
