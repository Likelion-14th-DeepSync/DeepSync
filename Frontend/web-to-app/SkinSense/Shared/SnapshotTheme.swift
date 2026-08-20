import SwiftUI

/// 위젯·워치에서 쓰는 최소 팔레트. 앱 Theme와 값이 같다.
enum SnapshotTheme {
    static let primary = Color(red: 0x6C / 255, green: 0x5C / 255, blue: 0xE7 / 255)
    static let primaryDeep = Color(red: 0x70 / 255, green: 0x54 / 255, blue: 0xDB / 255)
    static let accent = Color(red: 0x5C / 255, green: 0x5C / 255, blue: 0xF1 / 255)
    static let gradientStart = Color(red: 0x92 / 255, green: 0x92 / 255, blue: 0xF6 / 255)
    static let gradientEnd = Color(red: 0xC9 / 255, green: 0x92 / 255, blue: 0xF6 / 255)
    static let ink = Color(red: 0x1A / 255, green: 0x1A / 255, blue: 0x1A / 255)
    static let gray = Color(red: 0x6B / 255, green: 0x72 / 255, blue: 0x80 / 255)
    static let light = Color(red: 0x9C / 255, green: 0xA3 / 255, blue: 0xAF / 255)
    static let track = Color(red: 0xEC / 255, green: 0xEC / 255, blue: 0xFE / 255)
    static let positive = Color(red: 0x2E / 255, green: 0xB2 / 255, blue: 0x59 / 255)
    static let negative = Color(red: 0xD9 / 255, green: 0x40 / 255, blue: 0x40 / 255)

    static func deltaColor(_ value: Int?) -> Color {
        guard let value, value != 0 else { return gray }
        return value > 0 ? positive : negative
    }

    static func deltaText(_ value: Int?, unit: String = "점") -> String {
        guard let value else { return "-" }
        if value == 0 { return "변화 없음" }
        return "\(value > 0 ? "+" : "")\(value)\(unit) \(value > 0 ? "↑" : "↓")"
    }
}
