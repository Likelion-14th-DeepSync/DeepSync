import XCTest
@testable import SkinSense

final class ServerDateTests: XCTestCase {

    func testParsesDateOnly() {
        let date = ServerDate.parse("2026-08-19")
        XCTAssertNotNil(date)
        XCTAssertEqual(ServerDate.dateString(date!), "2026-08-19")
    }

    /// 서버는 LocalDateTime 소수점 자리수가 일정하지 않다.
    func testParsesDateTimeWithVaryingFractionalSeconds() {
        let samples = [
            "2026-08-18T10:19:02",
            "2026-08-18T10:19:02.928",
            "2026-08-18T10:19:02.928887515"
        ]
        for sample in samples {
            let date = ServerDate.parse(sample)
            XCTAssertNotNil(date, "파싱 실패: \(sample)")
            XCTAssertEqual(ServerDate.dateString(date!), "2026-08-18")
        }
    }

    func testReturnsNilForEmptyOrGarbage() {
        XCTAssertNil(ServerDate.parse(nil))
        XCTAssertNil(ServerDate.parse(""))
        XCTAssertNil(ServerDate.parse("어제"))
    }

    func testShortTimeTrimsSeconds() {
        XCTAssertEqual(ServerDate.shortTime("01:20:00"), "01:20")
        XCTAssertEqual(ServerDate.shortTime("01:20"), "01:20")
        XCTAssertNil(ServerDate.shortTime(nil))
    }

    func testDateTimeStringRoundTrips() {
        let now = Date()
        let text = ServerDate.dateTimeString(now)
        XCTAssertNotNil(ServerDate.parse(text))
        XCTAssertEqual(text.count, 19, "yyyy-MM-ddTHH:mm:ss 형식이어야 한다")
    }

    func testDaysAgoGoesBackwards() {
        XCTAssertLessThan(ServerDate.daysAgo(7), ServerDate.today)
    }
}

extension ServerDateTests {

    /// 리마인더 응답은 오프셋이 붙은 형태로 내려온다.
    func testParsesOffsetDateTime() {
        XCTAssertNotNil(ServerDate.parse("2026-08-19T20:00:00+09:00"))
        XCTAssertNotNil(ServerDate.parse("2026-08-19T11:00:00Z"))
        XCTAssertNotNil(ServerDate.parse("2026-08-19T20:00:00.123+09:00"))
    }

    func testOffsetAndLocalRepresentSameInstant() {
        let utc = ServerDate.parse("2026-08-19T11:00:00Z")
        let kst = ServerDate.parse("2026-08-19T20:00:00+09:00")
        XCTAssertEqual(utc, kst)
    }
}

extension ServerDateTests {

    /// 서버 Clock이 Asia/Seoul 고정이므로 벽시계 문자열도 서울 기준이어야 한다.
    func testFormatsInSeoulTimeZone() {
        // 2026-08-19 15:00:00 UTC == 2026-08-20 00:00:00 KST
        let instant = Date(timeIntervalSince1970: 1787151600)
        XCTAssertEqual(ServerDate.dateString(instant), "2026-08-20")
        XCTAssertEqual(ServerDate.dateTimeString(instant), "2026-08-20T00:00:00")
    }
}
