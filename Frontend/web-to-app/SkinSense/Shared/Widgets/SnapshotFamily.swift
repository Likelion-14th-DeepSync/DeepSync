import Foundation

/// 위젯 뷰가 크기를 스스로 판단하기 위한 타입.
/// WidgetKit의 widgetFamily는 환경에서 읽기 전용이라, 앱 안에서 미리보기하려면
/// 명시적으로 넘길 수 있는 값이 필요하다.
enum SnapshotFamily: String, CaseIterable, Identifiable {
    case small, medium, large
    case circular, rectangular, inline

    var id: String { rawValue }

    var isAccessory: Bool {
        switch self {
        case .circular, .rectangular, .inline: return true
        default: return false
        }
    }

    var label: String {
        switch self {
        case .small: return "작게"
        case .medium: return "중간"
        case .large: return "크게"
        case .circular: return "잠금 · 원형"
        case .rectangular: return "잠금 · 사각"
        case .inline: return "잠금 · 인라인"
        }
    }

    /// 홈 화면 위젯 근사 크기 (iPhone 402pt 기준)
    var previewSize: CGSize {
        switch self {
        case .small: return CGSize(width: 158, height: 158)
        case .medium: return CGSize(width: 338, height: 158)
        case .large: return CGSize(width: 338, height: 354)
        case .circular: return CGSize(width: 76, height: 76)
        case .rectangular: return CGSize(width: 172, height: 76)
        case .inline: return CGSize(width: 250, height: 26)
        }
    }
}

/// 위젯 탭 시 이동할 화면
enum WidgetLink {
    static func url(_ path: String) -> URL { URL(string: "skinsense://\(path)")! }
    static let home = url("home")
    static let record = url("record")
    static let dday = url("dday")
    static let capture = url("capture")
}
