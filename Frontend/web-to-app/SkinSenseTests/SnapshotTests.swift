import XCTest
@testable import SkinSense

/// 위젯·워치가 읽는 공유 스냅샷의 직렬화 계약을 검증한다.
final class SnapshotTests: XCTestCase {

    func testSnapshotRoundTrip() throws {
        let original = SkinSnapshot.placeholder
        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(SkinSnapshot.self, from: data)
        XCTAssertEqual(decoded, original)
    }

    func testSignedOutSnapshotIsEmpty() {
        let snapshot = SkinSnapshot.signedOut
        XCTAssertFalse(snapshot.isSignedIn)
        XCTAssertFalse(snapshot.hasScore)
        XCTAssertNil(snapshot.goalDayLabel)
        XCTAssertTrue(snapshot.environmentRisks.isEmpty)
    }

    /// 과거 버전 앱이 저장한 JSON(필드 일부 누락)도 읽혀야 한다.
    func testDecodesPartialSnapshot() throws {
        let json = """
        {"updatedAt":0,"environmentRisks":[],"isSignedIn":true,"overallScore":72}
        """
        let decoded = try JSONDecoder().decode(SkinSnapshot.self, from: Data(json.utf8))
        XCTAssertEqual(decoded.overallScore, 72)
        XCTAssertNil(decoded.goalTitle)
        XCTAssertTrue(decoded.hasScore)
    }

    func testDeltaTextFormatting() {
        XCTAssertEqual(SnapshotTheme.deltaText(13), "+13점 ↑")
        XCTAssertEqual(SnapshotTheme.deltaText(-4), "-4점 ↓")
        XCTAssertEqual(SnapshotTheme.deltaText(0), "변화 없음")
        XCTAssertEqual(SnapshotTheme.deltaText(nil), "-")
    }
}
