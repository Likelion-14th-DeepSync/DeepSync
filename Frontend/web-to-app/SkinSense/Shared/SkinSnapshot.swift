import Foundation

/// 앱 · 위젯 · 워치가 함께 쓰는 요약 스냅샷.
/// 위젯과 워치는 네트워크·인증 없이 이 값만 읽어 그린다.
struct SkinSnapshot: Codable, Equatable {
    var updatedAt: Date = .distantPast

    // 오늘의 피부
    var overallScore: Int?
    var overallChange: Int?
    var rednessChange: Int?
    var troubleChange: Int?
    var toneChange: Int?
    var summary: String?

    // D-Day
    var goalTitle: String?
    var goalDayLabel: String?
    var goalDaysRemaining: Int?
    var goalConcern: String?

    // 생활 실험
    var experimentTitle: String?
    var experimentEmoji: String?
    var experimentCurrentDay: Int?
    var experimentTotalDays: Int?
    var experimentRate: Double?

    // 환경 · 리마인더
    var environmentRisks: [String] = []
    var reminderTitle: String?
    var reminderTime: String?

    var isSignedIn: Bool = false

    var hasScore: Bool { overallScore != nil }

    /// 위젯 미리보기·플레이스홀더용
    static let placeholder = SkinSnapshot(
        updatedAt: Date(),
        overallScore: 81,
        overallChange: 13,
        rednessChange: 9,
        troubleChange: 16,
        toneChange: -4,
        summary: "수면이 늘어 트러블이 눈에 띄게 좋아졌어요.",
        goalTitle: "결혼식 피부 컨디션 관리",
        goalDayLabel: "D-41",
        goalDaysRemaining: 41,
        goalConcern: "트러블",
        experimentTitle: "7시간 이상 수면",
        experimentEmoji: "🌙",
        experimentCurrentDay: 3,
        experimentTotalDays: 7,
        experimentRate: 0.67,
        environmentRisks: ["오늘 UV 지수가 높습니다.", "오늘 습도가 낮습니다."],
        reminderTitle: "오늘 피부 사진을 촬영해 주세요.",
        reminderTime: "20:00",
        isSignedIn: true
    )

    static let signedOut = SkinSnapshot(updatedAt: Date(), isSignedIn: false)
}

/// App Group 공유 저장소
enum SharedStore {
    static let appGroup = "group.com.mjmac.skinsense"
    private static let key = "skinSnapshot"

    private static var defaults: UserDefaults? {
        UserDefaults(suiteName: appGroup)
    }

    static func save(_ snapshot: SkinSnapshot) {
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        defaults?.set(data, forKey: key)
    }

    static func load() -> SkinSnapshot? {
        guard let data = defaults?.data(forKey: key),
              let snapshot = try? JSONDecoder().decode(SkinSnapshot.self, from: data) else { return nil }
        return snapshot
    }

    static func clear() {
        defaults?.removeObject(forKey: key)
    }
}
