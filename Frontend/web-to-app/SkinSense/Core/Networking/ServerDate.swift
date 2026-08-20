import Foundation

/// 서버는 LocalDate("2026-08-18") / LocalDateTime("2026-08-18T10:19:02.928887515") /
/// LocalTime("01:20:00") 을 문자열로 내려준다. 소수점 자리수가 일정하지 않아
/// DTO는 문자열로 받고 필요한 곳에서만 Date로 변환한다.
///
/// 서버 Clock은 Asia/Seoul 고정이다(TimeConfig). 기기 시간대가 서울보다 빠르면
/// capturedAt이 "미래"로 거부되고(FUTURE_CAPTURED_AT) 날짜 키도 어긋나므로,
/// 서버로 보내는/서버에서 받는 벽시계 문자열은 모두 서울 기준으로 처리한다.
enum ServerDate {
    static let serverTimeZone = TimeZone(identifier: "Asia/Seoul")!

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = serverTimeZone
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static let dateTimeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = serverTimeZone
        f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        return f
    }()

    /// "2026-08-18" 형식으로 변환 (요청 본문의 LocalDate 필드용)
    static func dateString(_ date: Date) -> String {
        dateFormatter.string(from: date)
    }

    /// "2026-08-18T10:19:02" 형식으로 변환 (요청 본문의 LocalDateTime 필드용)
    static func dateTimeString(_ date: Date) -> String {
        dateTimeFormatter.string(from: date)
    }

    private static let offsetFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    /// 날짜/일시 문자열을 모두 받아 Date로 변환한다.
    /// 서버는 LocalDate("2026-08-19"), LocalDateTime("...T10:19:02.928887515"),
    /// OffsetDateTime("...T20:00:00+09:00") 세 형태를 모두 쓴다.
    static func parse(_ string: String?) -> Date? {
        guard let string, !string.isEmpty else { return nil }
        if !string.contains("T") {
            return dateFormatter.date(from: string)
        }
        // 오프셋이 붙은 형태 (+09:00 / Z)
        if string.hasSuffix("Z") || string.range(of: #"[+-]\d{2}:\d{2}$"#, options: .regularExpression) != nil {
            if let date = offsetFormatter.date(from: string) { return date }
            // 소수점 이하 초가 섞인 오프셋 형태
            if let dotIndex = string.firstIndex(of: "."),
               let offsetStart = string.range(of: #"[+-]\d{2}:\d{2}$|Z$"#, options: .regularExpression) {
                let trimmed = String(string[string.startIndex..<dotIndex]) + String(string[offsetStart])
                if let date = offsetFormatter.date(from: trimmed) { return date }
            }
            return nil
        }
        // 소수점 이하 초는 잘라내고 파싱한다.
        let trimmed = string.split(separator: ".").first.map(String.init) ?? string
        return dateTimeFormatter.date(from: trimmed)
    }

    static var today: String { dateString(Date()) }

    static func daysAgo(_ days: Int) -> String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = serverTimeZone
        let date = calendar.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        return dateString(date)
    }

    /// "01:20:00" → "01:20"
    static func shortTime(_ string: String?) -> String? {
        guard let string, string.count >= 5 else { return string }
        return String(string.prefix(5))
    }
}
