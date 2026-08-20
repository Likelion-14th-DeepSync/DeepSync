import SwiftUI
import UIKit

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

/// 피그마 아트보드(402pt = iPhone 16/17 Pro) 대비 현재 기기 폭 비율.
/// 모든 수치를 이 비율로 곱해 어떤 기기에서도 피그마와 같은 비율로 보이게 한다.
enum DS {
    static let baseWidth: CGFloat = 402

    /// 앱 실행 중 한 번만 계산된다 (세로 고정 iPhone 전용 앱)
    static let screenWidth: CGFloat = {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        if let w = scenes.first?.windows.first?.bounds.width, w > 0 { return w }
        if let w = scenes.first?.coordinateSpace.bounds.width, w > 0 { return w }
        return baseWidth
    }()

    static let scale: CGFloat = screenWidth / baseWidth

    /// 피그마 수치 → 현재 기기 수치
    static func s(_ value: CGFloat) -> CGFloat { value * scale }
}

/// Figma "Wellness Care AI Design" 실측 토큰
/// (파일 oi5Asb5PVVvT1e4g6ZcniS · 402x874 기준)
enum Theme {

    // MARK: 브랜드

    /// 탭 활성 · 링크 · 체크 · 중앙 AI 버튼
    static let primary = Color(hex: 0x6C5CE7)
    /// 주요 CTA 버튼 · D-Day 숫자
    static let primaryButton = Color(hex: 0x7054DB)
    /// 강조 보조
    static let accent = Color(hex: 0x5C5CF1)
    static let gradientStart = Color(hex: 0x9292F6)
    static let gradientEnd = Color(hex: 0xC992F6)

    // MARK: 텍스트

    static let textPrimary = Color(hex: 0x1A1A1A)
    static let textSecondary = Color(hex: 0x737373)
    static let textTertiary = Color(hex: 0xA6A6A6)
    /// 탭바 비활성 라벨
    static let textMuted = Color(hex: 0x767676)
    /// 기록·D-Day 화면 계열 (#1C1F2E / #6B7280 / #9CA3AF)
    static let textInk = Color(hex: 0x1C1F2E)
    static let textGray = Color(hex: 0x6B7280)
    static let textGrayStrong = Color(hex: 0x7E8494)
    static let placeholder = Color(hex: 0xB3B3B3)

    // MARK: 표면

    static let background = Color.white
    static let card = Color.white
    static let border = Color(hex: 0xE8E8E8)
    static let divider = Color(hex: 0xF0F0F0)
    /// 아이콘 홀더 배경
    static let surfaceViolet = Color(hex: 0xF0F0F6)
    static let surfaceBlue = Color(hex: 0xE3F2FD)
    /// 카드 테두리(#ECEEF4) · 진행바 트랙(#ECECFE) · 연보라 배경(#EFEBFF)
    static let panelBorder = Color(hex: 0xECEEF4)
    static let trackBackground = Color(hex: 0xECECFE)
    static let tintSurface = Color(hex: 0xECECFE)
    static let violetSurface = Color(hex: 0xEFEBFF)
    static let lineBorder = Color(hex: 0xE5E7EB)

    // MARK: 시맨틱

    static let positive = Color(hex: 0x2EB259)
    static let negative = Color(hex: 0xD94040)
    /// 지표/차트 계열
    static let success = Color(hex: 0x10B981)
    static let danger = Color(hex: 0xEF4444)
    static let warning = Color(hex: 0xF59E0B)
    static let info = Color(hex: 0x3B82F6)

    // MARK: 반경 · 여백

    static var radiusStat: CGFloat { DS.s(12) }
    static var radiusCard: CGFloat { DS.s(16) }
    static var radiusLargeCard: CGFloat { DS.s(20) }
    static var radiusButton: CGFloat { DS.s(24) }
    static var radiusPill: CGFloat { DS.s(100) }

    /// 화면 좌우 여백
    static var screenPadding: CGFloat { DS.s(18) }
    static var cardPadding: CGFloat { DS.s(20) }
    static var cornerRadius: CGFloat { radiusCard }

    /// 피그마 수치를 기기 비율로 변환하는 단축 함수
    static func s(_ value: CGFloat) -> CGFloat { DS.s(value) }

    // MARK: 이전 이름 (아직 옮기지 않은 화면용 — 화면 이전이 끝나면 제거)

    static let primaryDark = primary
}

// MARK: - Inter 타이포그래피

extension Font {
    enum Inter: String {
        case regular = "Inter-Regular"      // 400
        case medium = "Inter-Medium"        // 500
        case semiBold = "Inter-SemiBold"    // 600
        case bold = "Inter-Bold"            // 700
        case extraBold = "Inter-ExtraBold"  // 800
        case black = "Inter-Black"          // 900
    }

    /// 피그마 수치를 기기 폭 비율로 환산해 적용한다.
    /// (다이나믹 타입으로 레이아웃이 깨지지 않도록 fixedSize를 쓴다)
    static func inter(_ weight: Inter, _ size: CGFloat) -> Font {
        .custom(weight.rawValue, fixedSize: DS.s(size))
    }
}

// MARK: - 카드

struct CardBackground: ViewModifier {
    var radius: CGFloat = Theme.radiusCard
    var padding: CGFloat = Theme.cardPadding
    var borderWidth: CGFloat = 1

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(Theme.border, lineWidth: borderWidth)
            )
    }
}

extension View {
    func cardStyle(radius: CGFloat = Theme.radiusCard, padding: CGFloat = Theme.cardPadding) -> some View {
        modifier(CardBackground(radius: radius, padding: padding))
    }

    func sectionTitleStyle() -> some View {
        self.font(.inter(.bold, 18))
            .foregroundStyle(Theme.textPrimary)
    }
}
