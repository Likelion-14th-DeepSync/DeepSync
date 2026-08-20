#if DEBUG
import SwiftUI
import UIKit

/// 시뮬레이터에서 촬영 없이 전체 분석 파이프라인을 검증하는 화면.
/// DEV_SCREEN=selftest 로만 진입하며 릴리스 빌드에는 포함되지 않는다.
struct SkinVisionSelfTestView: View {
    @StateObject private var flow = CaptureFlowViewModel()
    @State private var lines: [String] = []
    @State private var isRunning = true

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.s(10)) {
                Text("SkinVision 자가진단")
                    .font(.inter(.bold, 22))
                    .foregroundStyle(Theme.textInk)

                if isRunning {
                    HStack(spacing: Theme.s(8)) {
                        ProgressView().tint(Theme.accent)
                        Text("실행 중…").font(.inter(.regular, 13)).foregroundStyle(Theme.textGray)
                    }
                }

                ForEach(Array(lines.enumerated()), id: \.offset) { _, line in
                    Text(line)
                        .font(.system(size: Theme.s(12), design: .monospaced))
                        .foregroundStyle(line.hasPrefix("✗") ? Theme.danger : Theme.textInk)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(Theme.s(20))
        }
        .background(Theme.background.ignoresSafeArea())
        .task { await run() }
    }

    private func log(_ text: String) { lines.append(text) }

    private func run() async {
        defer { isRunning = false }

        // 1. 모델 로딩 + 온디바이스 추론만 먼저 확인
        let image = Self.makeTestImage()
        guard let jpeg = image.jpegData(compressionQuality: 0.95) else {
            log("✗ 테스트 이미지 생성 실패"); return
        }
        log("• 테스트 이미지 \(Int(image.size.width))x\(Int(image.size.height)), \(jpeg.count / 1024)KB")

        do {
            let scores = try await SkinVisionAnalyzer.shared.analyze(images: [jpeg])
            log("✓ 온디바이스 추론 성공")
            log("   홍조 \(scores.rednessScore) · 트러블 \(scores.troubleScore) · 종합 \(scores.overallScore) · 확신도 \(scores.confidenceScore)")
            for lesion in LesionType.allCases {
                let value = scores.lesionProbabilities[lesion] ?? 0
                log("   \(lesion.label)(\(lesion.rawValue)) \(String(format: "%.1f%%", value * 100))")
            }
        } catch {
            log("✗ 추론 실패: \(error.localizedDescription)")
            #if targetEnvironment(simulator)
            log("  ⓘ 시뮬레이터는 VisionFeaturePrint(Scene) 추출기를 지원하지 않습니다.")
            log("    이 모델들은 CreateML 이미지 분류기라 실기기에서만 추론됩니다.")
            #endif
            return
        }

        // 2. 서버 왕복 (업로드 → 품질검사 → 분석 생성 → 결과 제출)
        guard APIClient.shared.accessToken != nil else {
            log("• 로그인 상태가 아니라 서버 왕복은 건너뜁니다")
            return
        }
        log("• 서버 업로드 시작…")
        await flow.submit(imageData: jpeg)
        if let error = flow.errorMessage { log("✗ 업로드 실패: \(error)"); return }
        guard let shot = flow.shots.first else { log("✗ 업로드 결과 없음"); return }
        log("✓ 업로드 imageId=\(shot.image.imageId), 품질=\(shot.quality?.qualityStatus?.label ?? "-")(\(shot.quality?.overallScore ?? 0))")

        await flow.requestAnalysis()
        if let error = flow.errorMessage { log("✗ 분석 제출 실패: \(error)"); return }
        if let id = flow.createdAnalysisId {
            log("✓ 분석 생성 + 결과 제출 완료 analysisId=\(id)")
        }

        if let saved = try? await SkinSenseAPI.analysis(id: flow.createdAnalysisId ?? 0) {
            log("✓ 서버 재조회: 상태=\(saved.status?.label ?? "-") 종합=\(saved.overallScore ?? -1) 모델=\(saved.modelVersion ?? "-")")
            log("   측정 지표: \(saved.measuredMetricScores.map { "\($0.0.label) \($0.1)" }.joined(separator: ", "))")
        }
    }

    /// 서버 품질 검사를 통과하도록 고해상도·고대비 패턴을 만든다.
    static func makeTestImage() -> UIImage {
        let size = CGSize(width: 900, height: 1200)
        return UIGraphicsImageRenderer(size: size).image { context in
            let cg = context.cgContext
            let cell: CGFloat = 6
            var row = 0
            var y: CGFloat = 0
            while y < size.height {
                var column = 0
                var x: CGFloat = 0
                while x < size.width {
                    let dark = (row + column) % 2 == 0
                    cg.setFillColor(dark
                                    ? UIColor(white: 0.08, alpha: 1).cgColor
                                    : UIColor(white: 0.92, alpha: 1).cgColor)
                    cg.fill(CGRect(x: x, y: y, width: cell, height: cell))
                    x += cell
                    column += 1
                }
                y += cell
                row += 1
            }
        }
    }
}
#endif
