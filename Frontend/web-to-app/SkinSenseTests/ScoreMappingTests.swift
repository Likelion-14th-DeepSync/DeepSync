import XCTest
@testable import SkinSense

final class ScoreMappingTests: XCTestCase {

    private func analysis(modelVersion: String?) -> SkinAnalysis {
        let json = """
        {"analysisId":1,"imageId":1,"status":"COMPLETED","rednessScore":70,"troubleScore":80,
        "drynessScore":50,"toneUniformityScore":50,"overallScore":75,"confidenceScore":60,
        "modelVersion":\(modelVersion.map { "\"\($0)\"" } ?? "null"),"failureReason":null,
        "capturedAt":"2026-08-18T10:10:00","analyzedAt":"2026-08-18T10:11:00","requestedAt":"2026-08-18T10:10:30"}
        """
        return try! JSONDecoder().decode(SkinAnalysis.self, from: Data(json.utf8))
    }

    /// 온디바이스 모델은 건조함·톤 균일도를 측정하지 않으므로 화면에서 감춰야 한다.
    func testHidesUnmeasuredMetricsForOnDeviceModel() {
        let measured = analysis(modelVersion: "skinsense-coreml-v1").measuredMetricScores.map(\.0)
        XCTAssertTrue(measured.contains(.trouble))
        XCTAssertTrue(measured.contains(.redness))
        XCTAssertFalse(measured.contains(.dryness))
        XCTAssertFalse(measured.contains(.toneUniformity))
    }

    /// 다른 모델(서버 분석 등)이 붙으면 전체 지표를 그대로 보여준다.
    func testShowsAllMetricsForOtherModels() {
        let measured = analysis(modelVersion: "server-v2").measuredMetricScores.map(\.0)
        XCTAssertEqual(measured.count, 4)
    }

    func testUnmeasuredLabelsListed() {
        let labels = analysis(modelVersion: "skinsense-coreml-v1").unmeasuredMetricLabels
        XCTAssertEqual(Set(labels), ["건조함", "톤 균일도"])
    }

    func testAPIErrorNotFoundDetection() {
        let notFound = APIError.notFound(code: "X", message: "없음")
        let failure = APIError.failure(status: 500, code: "Y", message: "오류")
        XCTAssertTrue(notFound.isNotFound)
        XCTAssertFalse(failure.isNotFound)
    }

    func testLoadStateMapsNotFoundToEmpty() {
        let state = LoadState<SkinGoal>.from(APIError.notFound(code: "X", message: "목표 없음"))
        if case let .empty(message) = state {
            XCTAssertEqual(message, "목표 없음")
        } else {
            XCTFail("404는 empty 로 변환돼야 한다")
        }
    }
}
