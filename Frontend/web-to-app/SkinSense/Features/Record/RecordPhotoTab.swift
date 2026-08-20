import SwiftUI

/// 피그마 "기록 - 사진 기록"(42:4300)
struct RecordPhotoTab: View {
    @ObservedObject var viewModel: RecordViewModel
    let onCapture: () -> Void
    @State private var showGallery = false

    private var columns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: Theme.s(12)), count: 3)
    }

    private var sortedImages: [SkinImage] {
        viewModel.images.sorted {
            (ServerDate.parse($0.capturedAt) ?? .distantPast) > (ServerDate.parse($1.capturedAt) ?? .distantPast)
        }
    }

    var body: some View {
        VStack(spacing: Theme.s(16)) {
            PanelCard {
                SectionHeaderRow(title: "사진 기록",
                                 actionTitle: sortedImages.isEmpty ? nil : "전체 보기",
                                 action: sortedImages.isEmpty ? nil : { showGallery = true })

                if sortedImages.isEmpty {
                    EmptyStateBlock(message: "아직 촬영한 사진이 없어요.\n첫 사진을 남겨보세요.", icon: "photo.on.rectangle")
                } else {
                    LazyVGrid(columns: columns, spacing: Theme.s(12)) {
                        ForEach(sortedImages.prefix(6)) { image in
                            PhotoCell(image: image, score: score(for: image))
                        }
                    }
                }

                HStack(spacing: Theme.s(10)) {
                    Text("피부 사진을 매일 기록하면 더 정확한 변화 분석이 가능해요!")
                        .font(.inter(.regular, 12))
                        .foregroundStyle(Theme.accent)
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                    Button(action: onCapture) {
                        HStack(spacing: Theme.s(4)) {
                            Image(systemName: "camera.fill").font(.system(size: Theme.s(11)))
                            Text("사진 촬영").font(.inter(.bold, 11))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, Theme.s(12))
                        .frame(height: Theme.s(30))
                        .background(Theme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
                .padding(Theme.s(12))
                .background(Theme.tintSurface)
                .clipShape(RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous))
            }

            comparisonCard
        }
        .navigationDestination(isPresented: $showGallery) {
            PhotoGalleryView()
        }
    }

    private func score(for image: SkinImage) -> Int? {
        viewModel.analyses.first { $0.imageId == image.imageId }?.overallScore
    }

    @ViewBuilder
    private var comparisonCard: some View {
        let withScore = sortedImages.compactMap { image -> (SkinImage, Int)? in
            guard let s = score(for: image) else { return nil }
            return (image, s)
        }

        PanelCard {
            SectionHeaderRow(title: "사진 비교")

            if withScore.count >= 2, let latest = withScore.first, let oldest = withScore.last {
                HStack(spacing: Theme.s(16)) {
                    ComparePane(image: oldest.0, score: oldest.1, isLatest: false)
                    Image(systemName: "arrow.right")
                        .font(.system(size: Theme.s(16), weight: .semibold))
                        .foregroundStyle(Theme.textTertiary)
                    ComparePane(image: latest.0, score: latest.1, isLatest: true)
                }
            } else {
                EmptyStateBlock(message: "분석이 완료된 사진이 2장 이상 있으면\n변화를 비교해드려요.", icon: "rectangle.on.rectangle")
            }
        }
    }
}

private struct PhotoCell: View {
    let image: SkinImage
    let score: Int?

    var body: some View {
        VStack(spacing: Theme.s(8)) {
            RemoteSkinImage(imageId: image.imageId)
                .aspectRatio(1, contentMode: .fill)
                .frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous))

            HStack {
                Text(shortDate)
                    .font(.inter(.regular, 11))
                    .foregroundStyle(Theme.textGray)
                Spacer()
                if let score {
                    Text("\(score)점")
                        .font(.inter(.bold, 12))
                        .foregroundStyle(Theme.accent)
                }
            }
        }
    }

    private var shortDate: String {
        guard let date = ServerDate.parse(image.capturedAt) else { return "-" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.dateFormat = "M/d (E)"
        return f.string(from: date)
    }
}

private struct ComparePane: View {
    let image: SkinImage
    let score: Int
    let isLatest: Bool

    var body: some View {
        VStack(spacing: Theme.s(6)) {
            Text(longDate)
                .font(.inter(.regular, 11))
                .foregroundStyle(Theme.textGray)
            RemoteSkinImage(imageId: image.imageId)
                .aspectRatio(1, contentMode: .fill)
                .frame(width: Theme.s(110), height: Theme.s(110))
                .clipShape(RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous))
            Text("\(score)점")
                .font(.inter(.bold, 13))
                .foregroundStyle(isLatest ? Theme.accent : Theme.textInk)
        }
        .frame(maxWidth: .infinity)
    }

    private var longDate: String {
        guard let date = ServerDate.parse(image.capturedAt) else { return "-" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.dateFormat = "M월 d일 (E)"
        return f.string(from: date)
    }
}

/// 서버에서 받은 피부 사진을 메모리에 캐시한다.
enum SkinImageCache {
    private static let cache: NSCache<NSNumber, UIImage> = {
        let c = NSCache<NSNumber, UIImage>()
        c.countLimit = 60
        return c
    }()

    static func image(for id: Int64) -> UIImage? { cache.object(forKey: NSNumber(value: id)) }
    static func store(_ image: UIImage, for id: Int64) { cache.setObject(image, forKey: NSNumber(value: id)) }
}

/// 서버에서 이미지 바이트를 받아 표시한다. (GET /skin-images/{id}/file)
struct RemoteSkinImage: View {
    let imageId: Int64
    @State private var uiImage: UIImage?

    var body: some View {
        Group {
            if let uiImage {
                Image(uiImage: uiImage).resizable().scaledToFill()
            } else {
                Theme.violetSurface.overlay(
                    Image(systemName: "photo")
                        .font(.system(size: Theme.s(18)))
                        .foregroundStyle(Theme.primary.opacity(0.4))
                )
            }
        }
        .clipped()
        .task {
            guard uiImage == nil else { return }
            if let cached = SkinImageCache.image(for: imageId) {
                uiImage = cached
                return
            }
            if let data = try? await SkinSenseAPI.imageFileData(imageId: imageId),
               let image = UIImage(data: data) {
                SkinImageCache.store(image, for: imageId)
                uiImage = image
            }
        }
    }
}
