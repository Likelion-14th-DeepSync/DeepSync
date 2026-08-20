import Foundation
import UIKit

/// 촬영 → 업로드 → 품질검사 → 분석 요청까지의 서버 연동 흐름을 관리한다.
@MainActor
final class CaptureFlowViewModel: ObservableObject {
    struct CapturedShot: Identifiable {
        let direction: CaptureDirection
        let image: SkinImage
        var quality: SkinImageQuality?
        /// 온디바이스 추론에 다시 쓰기 위해 원본 JPEG를 들고 있는다.
        let jpegData: Data
        var id: Int64 { image.imageId }
    }

    @Published var shots: [CapturedShot] = []
    @Published var isUploading = false
    @Published var statusMessage: String?
    @Published var errorMessage: String?
    @Published var makeupApplied = false
    @Published var createdAnalysisId: Int64?
    /// 결과 화면에서 유형별 상세를 보여주기 위해 보관한다.
    @Published var lastScores: SkinVisionScores?

    var capturedCount: Int { shots.count }

    var currentDirection: CaptureDirection {
        switch shots.count {
        case 0: return .front
        case 1: return .left
        default: return .right
        }
    }

    var isComplete: Bool { shots.count >= 3 }

    /// 촬영한 JPEG를 업로드하고 품질 검사까지 수행한다.
    func submit(imageData: Data) async {
        guard !isUploading else { return }
        isUploading = true
        errorMessage = nil
        defer { isUploading = false }

        let direction = currentDirection
        do {
            statusMessage = "사진을 올리는 중이에요…"
            let image = try await SkinSenseAPI.uploadSkinImage(
                imageData: imageData,
                capturedAt: Date(),
                direction: direction,
                makeupApplied: makeupApplied
            )

            statusMessage = "사진 품질을 확인하는 중이에요…"
            let quality = try? await SkinSenseAPI.runQualityCheck(imageId: image.imageId)

            shots.append(CapturedShot(direction: direction, image: image, quality: quality, jpegData: imageData))
            statusMessage = quality.flatMap { $0.messages?.first } ?? "\(direction.korean) 촬영 완료"
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    /// 정면 사진으로 분석을 만들고, 온디바이스 Core ML 결과를 서버에 제출한다.
    /// (서버는 품질 통과 사진만 분석 요청을 허용한다)
    func requestAnalysis() async {
        errorMessage = nil
        guard let base = shots.first(where: { $0.direction == .front }) ?? shots.first else {
            errorMessage = "먼저 사진을 촬영해주세요."
            return
        }

        if let status = base.quality?.qualityStatus, status != .passed {
            errorMessage = "정면 사진 품질이 \(status.label) 상태예요. 밝은 곳에서 초점을 맞춰 다시 촬영해주세요."
            return
        }

        isUploading = true
        defer { isUploading = false }

        do {
            statusMessage = "분석을 요청하는 중이에요…"
            let analysis = try await SkinSenseAPI.requestAnalysis(imageId: base.image.imageId)

            statusMessage = "기기에서 피부를 분석하는 중이에요…"
            let scores: SkinVisionScores
            do {
                scores = try await SkinVisionAnalyzer.shared.analyze(images: shots.map(\.jpegData))
            } catch {
                // 추론이 실패하면 서버 분석이 PROCESSING 상태로 남지 않도록 실패 처리한다.
                let reason = (error as? SkinVisionError)?.errorDescription ?? error.localizedDescription
                _ = try? await SkinSenseAPI.failAnalysis(id: analysis.analysisId, reason: reason)
                statusMessage = nil
                errorMessage = reason
                return
            }
            lastScores = scores

            _ = try? await SkinSenseAPI.startAnalysis(id: analysis.analysisId)

            statusMessage = "결과를 저장하는 중이에요…"
            _ = try await SkinSenseAPI.submitAnalysisResult(
                id: analysis.analysisId,
                SkinAnalysisResultRequest(
                    rednessScore: scores.rednessScore,
                    troubleScore: scores.troubleScore,
                    drynessScore: SkinVisionAnalyzer.unmeasuredScore,
                    toneUniformityScore: SkinVisionAnalyzer.unmeasuredScore,
                    overallScore: scores.overallScore,
                    confidenceScore: scores.confidenceScore,
                    modelVersion: scores.modelVersion
                )
            )

            statusMessage = nil
            createdAnalysisId = analysis.analysisId
        } catch let error as SkinVisionError {
            // 추론이 실패하면 분석을 실패 처리해 서버에 대기 상태로 남지 않게 한다.
            errorMessage = error.errorDescription
            statusMessage = nil
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
            statusMessage = nil
        }
    }

    func reset() {
        shots = []
        createdAnalysisId = nil
        statusMessage = nil
        errorMessage = nil
    }
}

extension CaptureDirection {
    var korean: String {
        switch self {
        case .front: return "정면"
        case .left: return "좌측 45°"
        case .right: return "우측 45°"
        }
    }

    var instruction: String {
        switch self {
        case .front: return "얼굴을 가이드 안에 맞추고\n정면을 바라봐주세요"
        case .left: return "고개를 살짝 왼쪽으로 돌려\n좌측 볼을 보여주세요"
        case .right: return "고개를 살짝 오른쪽으로 돌려\n우측 볼을 보여주세요"
        }
    }
}

extension UIImage {
    /// 업로드용 JPEG. 서버 품질 검사가 해상도를 보므로 과하게 줄이지 않는다.
    func jpegForUpload(maxDimension: CGFloat = 1600, quality: CGFloat = 0.9) -> Data? {
        let longest = max(size.width, size.height)
        guard longest > maxDimension else { return jpegData(compressionQuality: quality) }

        let scale = maxDimension / longest
        let target = CGSize(width: size.width * scale, height: size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: target)
        let resized = renderer.image { _ in draw(in: CGRect(origin: .zero, size: target)) }
        return resized.jpegData(compressionQuality: quality)
    }
}
