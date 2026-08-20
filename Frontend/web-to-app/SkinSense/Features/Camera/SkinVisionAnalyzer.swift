import CoreGraphics
import CoreML
import Foundation
import Vision
#if canImport(UIKit)
import UIKit
#endif

/// 온디바이스 Core ML 추론 결과
struct SkinVisionScores {
    /// 홍조 점수 (높을수록 좋음) — RashClassifier의 clear 확률
    let rednessScore: Int
    /// 트러블 점수 (높을수록 좋음) — TroubleClassifier의 clear 확률
    let troubleScore: Int
    /// 종합 점수
    let overallScore: Int
    /// 모델 확신도 (0~100)
    let confidenceScore: Int
    /// 여드름 유형별 검출 확률 (0~1)
    let lesionProbabilities: [LesionType: Double]
    /// 분석에 사용한 사진 수
    let analyzedImageCount: Int

    var modelVersion: String { SkinVisionAnalyzer.modelVersion }
}

enum LesionType: String, CaseIterable, Identifiable {
    case comedone = "Comedone"
    case papule = "Papule"
    case pustule = "Pustule"
    case nodule = "Nodule"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .comedone: return "면포"
        case .papule: return "구진"
        case .pustule: return "농포"
        case .nodule: return "결절"
        }
    }

    var detail: String {
        switch self {
        case .comedone: return "블랙헤드·화이트헤드"
        case .papule: return "붉게 솟은 좁쌀 여드름"
        case .pustule: return "고름이 찬 여드름"
        case .nodule: return "깊고 단단한 염증"
        }
    }

    var modelName: String { rawValue + "Classifier" }
}

enum SkinVisionError: LocalizedError {
    case modelMissing(String)
    case invalidImage
    case inferenceFailed(String)

    var errorDescription: String? {
        switch self {
        case let .modelMissing(name): return "\(name) 모델을 찾지 못했어요."
        case .invalidImage: return "사진을 읽지 못했어요."
        case let .inferenceFailed(message): return "분석에 실패했어요. (\(message))"
        }
    }
}

/// 번들에 포함된 Core ML 분류기 6종으로 피부 점수를 계산한다.
/// - TroubleClassifier: clear / trouble
/// - RashClassifier: clear / rash
/// - Comedone·Papule·Pustule·NoduleClassifier: absent / present
final class SkinVisionAnalyzer {
    static let shared = SkinVisionAnalyzer()
    static let modelVersion = "skinsense-coreml-v1"

    /// 백엔드가 6개 점수를 모두 필수로 요구하는데(null·생략 시 400) 건조함·톤 균일도는
    /// 대응 모델이 없다. 값이 왜곡되지 않도록 중립값을 보내고 화면에서는 "미측정"으로 감춘다.
    static let unmeasuredScore = 50

    /// 이 모델 버전이 실제로 측정하는 지표
    static let measuredMetrics: Set<SkinMetric> = [.redness, .trouble, .overall]

    private var cache: [String: VNCoreMLModel] = [:]
    private let lock = NSLock()

    /// 기본은 앱 번들. 테스트 하네스에서 다른 경로를 주입할 수 있다.
    var modelDirectory: URL?

    init() {}

    // MARK: 공개 API

    #if canImport(UIKit)
    /// 촬영한 JPEG들을 추론한다.
    func analyze(images: [Data]) async throws -> SkinVisionScores {
        let cgImages = images.compactMap { UIImage(data: $0)?.cgImage }
        guard !cgImages.isEmpty else { throw SkinVisionError.invalidImage }
        return try await analyze(cgImages: cgImages)
    }
    #endif

    /// 사진들을 모두 추론해 평균 확률로 점수를 만든다.
    func analyze(cgImages: [CGImage]) async throws -> SkinVisionScores {
        guard !cgImages.isEmpty else { throw SkinVisionError.invalidImage }

        var troubleClear: [Double] = []
        var rashClear: [Double] = []
        var lesionPresent: [LesionType: [Double]] = [:]

        for cgImage in cgImages {
            if let p = try await probability(model: "TroubleClassifier", label: "clear", in: cgImage) {
                troubleClear.append(p)
            }
            if let p = try await probability(model: "RashClassifier", label: "clear", in: cgImage) {
                rashClear.append(p)
            }
            for lesion in LesionType.allCases {
                if let p = try await probability(model: lesion.modelName, label: "present", in: cgImage) {
                    lesionPresent[lesion, default: []].append(p)
                }
            }
        }

        guard !troubleClear.isEmpty || !rashClear.isEmpty else {
            throw SkinVisionError.inferenceFailed("모델 출력을 얻지 못했습니다")
        }

        let trouble = mean(troubleClear)
        let rash = mean(rashClear)
        let lesions: [LesionType: Double] = lesionPresent.compactMapValues { mean($0) }

        // 유형별 병변이 뚜렷하면 트러블 점수를 조금 더 낮춘다 (최대 15점)
        let strongestLesion: Double = lesions.values.max() ?? 0
        let lesionPenalty: Double = min(0.15, strongestLesion * 0.15)

        let troubleScore = clamp(Int(((trouble ?? 1) - lesionPenalty) * 100))
        let rednessScore = clamp(Int((rash ?? 1) * 100))

        var available: [Int] = []
        if trouble != nil { available.append(troubleScore) }
        if rash != nil { available.append(rednessScore) }
        let overall = available.isEmpty ? 0 : available.reduce(0, +) / available.count

        // 확신도: 이진 분류 확률이 0.5에서 멀수록 높다
        var certaintySources: [Double] = Array(lesions.values)
        if let trouble { certaintySources.append(trouble) }
        if let rash { certaintySources.append(rash) }
        let certainties: [Double] = certaintySources.map { abs($0 - 0.5) * 2 }
        let confidence = clamp(Int((mean(certainties) ?? 0.5) * 100))

        return SkinVisionScores(
            rednessScore: rednessScore,
            troubleScore: troubleScore,
            overallScore: overall,
            confidenceScore: confidence,
            lesionProbabilities: lesions,
            analyzedImageCount: cgImages.count
        )
    }

    // MARK: 내부

    private func loadModel(named name: String) throws -> VNCoreMLModel {
        lock.lock()
        defer { lock.unlock() }
        if let cached = cache[name] { return cached }

        let url: URL
        if let modelDirectory {
            url = modelDirectory.appendingPathComponent(name + ".mlmodelc")
        } else if let bundled = Bundle.main.url(forResource: name, withExtension: "mlmodelc") {
            url = bundled
        } else {
            throw SkinVisionError.modelMissing(name)
        }
        let configuration = MLModelConfiguration()
        #if targetEnvironment(simulator)
        // 시뮬레이터에서 ANE/GPU 경로는 "Could not create inference context" 로 실패한다.
        configuration.computeUnits = .cpuOnly
        #else
        configuration.computeUnits = .all
        #endif
        let model = try MLModel(contentsOf: url, configuration: configuration)
        let visionModel = try VNCoreMLModel(for: model)
        cache[name] = visionModel
        return visionModel
    }

    /// 지정한 라벨의 확률을 반환한다.
    private func probability(model name: String, label: String, in image: CGImage) async throws -> Double? {
        let visionModel = try loadModel(named: name)

        // perform(_:)이 실패하면 completion 핸들러와 throw가 모두 발생할 수 있어
        // continuation 을 한 번만 재개하도록 막는다.
        let box = ResumeGuard()

        return try await withCheckedThrowingContinuation { continuation in
            let request = VNCoreMLRequest(model: visionModel) { request, error in
                guard box.claim() else { return }
                if let error {
                    continuation.resume(throwing: SkinVisionError.inferenceFailed(error.localizedDescription))
                    return
                }
                let results = request.results as? [VNClassificationObservation] ?? []
                let value = results.first { $0.identifier == label }.map { Double($0.confidence) }
                continuation.resume(returning: value)
            }
            // CreateML 학습 시 전체 이미지를 리사이즈하므로 동일하게 맞춘다.
            request.imageCropAndScaleOption = .scaleFill

            do {
                try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
            } catch {
                guard box.claim() else { return }
                continuation.resume(throwing: SkinVisionError.inferenceFailed(error.localizedDescription))
            }
        }
    }

    /// continuation 을 한 번만 재개하기 위한 잠금
    private final class ResumeGuard {
        private var used = false
        private let lock = NSLock()

        func claim() -> Bool {
            lock.lock()
            defer { lock.unlock() }
            if used { return false }
            used = true
            return true
        }
    }

    private func mean(_ values: [Double]) -> Double? {
        values.isEmpty ? nil : values.reduce(0, +) / Double(values.count)
    }

    private func clamp(_ value: Int) -> Int { min(max(value, 0), 100) }
}
