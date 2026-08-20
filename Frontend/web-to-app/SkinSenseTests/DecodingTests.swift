import XCTest
@testable import SkinSense

/// 실제 서버 응답 형태를 그대로 디코딩해 DTO 계약을 검증한다.
final class DecodingTests: XCTestCase {

    private func decode<T: Decodable>(_ type: T.Type, _ json: String) throws -> T {
        let envelope = try JSONDecoder().decode(APIEnvelope<T>.self, from: Data(json.utf8))
        return try XCTUnwrap(envelope.data)
    }

    func testDecodesLoginResponse() throws {
        let json = """
        {"success":true,"data":{"accessToken":"abc.def.ghi","tokenType":"Bearer","expiresIn":3600},"error":null}
        """
        let login = try decode(LoginResponse.self, json)
        XCTAssertEqual(login.accessToken, "abc.def.ghi")
        XCTAssertEqual(login.expiresIn, 3600)
    }

    func testDecodesSkinAnalysisWithNullScores() throws {
        let json = """
        {"success":true,"data":{"analysisId":1,"imageId":3,"status":"PENDING","rednessScore":null,
        "troubleScore":null,"drynessScore":null,"toneUniformityScore":null,"overallScore":null,
        "confidenceScore":null,"modelVersion":null,"failureReason":null,
        "capturedAt":"2026-08-18T10:10:00","analyzedAt":null,"requestedAt":"2026-08-18T10:19:02.928887515"},"error":null}
        """
        let analysis = try decode(SkinAnalysis.self, json)
        XCTAssertEqual(analysis.status, .pending)
        XCTAssertTrue(analysis.metricScores.isEmpty)
    }

    func testDecodesErrorEnvelope() throws {
        let json = """
        {"success":false,"data":null,"error":{"code":"SKIN_GOAL_NOT_FOUND","message":"피부 목표를 찾을 수 없습니다."}}
        """
        let envelope = try JSONDecoder().decode(APIEnvelope<SkinGoal>.self, from: Data(json.utf8))
        XCTAssertFalse(envelope.success)
        XCTAssertEqual(envelope.error?.code, "SKIN_GOAL_NOT_FOUND")
        XCTAssertNil(envelope.data)
    }

    func testDecodesUnknownEnumAsNil() throws {
        // 서버가 새 상태를 추가해도 앱이 깨지지 않아야 한다.
        let json = """
        {"success":true,"data":{"goalId":1,"title":"면접","targetDate":"2026-09-29","daysRemaining":42,
        "dayLabel":"D-42","targetConcern":"TROUBLE","targetDescription":null,"status":"ACTIVE"},"error":null}
        """
        let goal = try decode(SkinGoal.self, json)
        XCTAssertEqual(goal.status, .active)
        XCTAssertEqual(goal.targetConcern, .trouble)
        XCTAssertEqual(goal.targetDateValue.map { ServerDate.dateString($0) }, "2026-09-29")
    }
}
