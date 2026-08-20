import SwiftUI

// MARK: - 화면 헤더 (피그마 screen-header: 700/22 #1C1F2E, 좌 20)

struct ScreenHeader: View {
    let title: String
    var trailing: AnyView? = nil

    var body: some View {
        HStack {
            Text(title)
                .font(.inter(.bold, 22))
                .foregroundStyle(Theme.textPrimary)
            Spacer()
            if let trailing { trailing }
        }
        .frame(height: Theme.s(51))
        .padding(.horizontal, Theme.s(20))
    }
}

// MARK: - 섹션 헤더 (제목 700/15 + 우측 링크 600/12)

struct SectionHeaderRow: View {
    let title: String
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        HStack {
            Text(title)
                .font(.inter(.bold, 15))
                .foregroundStyle(Theme.textPrimary)
            Spacer()
            if let actionTitle {
                Button {
                    action?()
                } label: {
                    HStack(spacing: Theme.s(4)) {
                        Text(actionTitle).font(.inter(.semiBold, 12))
                        Image(systemName: "chevron.right").font(.system(size: Theme.s(9), weight: .semibold))
                    }
                    .foregroundStyle(Theme.accent)
                }
                .buttonStyle(.plain)
                .disabled(action == nil)
            }
        }
        .frame(height: Theme.s(18))
    }
}

// MARK: - 흰 카드 (r16 + #ECEEF4 테두리)

struct PanelCard<Content: View>: View {
    var radius: CGFloat = Theme.radiusCard
    var padding: CGFloat = Theme.s(16)
    var spacing: CGFloat = Theme.s(16)
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: spacing) {
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(padding)
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: radius, style: .continuous)
                .stroke(Theme.panelBorder, lineWidth: 1)
        )
    }
}

// MARK: - 세그먼트 탭 (기록 화면 캘린더/사진 기록/변화)

struct SegmentSwitcher<Tab: Hashable>: View {
    let tabs: [(tab: Tab, label: String)]
    @Binding var selection: Tab

    var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(tabs.enumerated()), id: \.offset) { _, item in
                let isActive = selection == item.tab
                Button {
                    selection = item.tab
                } label: {
                    VStack(spacing: 0) {
                        Spacer(minLength: 0)
                        Text(item.label)
                            .font(.inter(isActive ? .bold : .medium, 14))
                            .foregroundStyle(isActive ? Theme.accent : Theme.textGray)
                        Spacer(minLength: 0)
                        Rectangle()
                            .fill(isActive ? Theme.accent : Color.clear)
                            .frame(height: Theme.s(2))
                    }
                    .frame(maxWidth: .infinity)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .frame(height: Theme.s(44))
    }
}

// MARK: - 진행률 바 (트랙 #ECECFE · 채움 #5C5CF1 · h8 r4)

struct ProgressTrack: View {
    let value: Double  // 0...1

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Theme.trackBackground)
                Capsule()
                    .fill(Theme.accent)
                    .frame(width: geo.size.width * min(max(value, 0), 1))
            }
        }
        .frame(height: Theme.s(8))
    }
}

// MARK: - 태그 뱃지

struct TagBadge: View {
    let text: String
    var foreground: Color = Theme.accent
    var background: Color = Theme.tintSurface

    var body: some View {
        Text(text)
            .font(.inter(.semiBold, 11))
            .foregroundStyle(foreground)
            .padding(.horizontal, Theme.s(6))
            .padding(.vertical, Theme.s(3))
            .background(background)
            .clipShape(RoundedRectangle(cornerRadius: Theme.s(4), style: .continuous))
    }
}

// MARK: - 주요 액션 버튼 (r12 · h48~51 · #5C5CF1)

struct PrimaryButton: View {
    let title: String
    var isEnabled: Bool = true
    var isLoading: Bool = false
    var height: CGFloat = Theme.s(48)
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Theme.s(8)) {
                if isLoading { ProgressView().tint(.white) }
                Text(title).font(.inter(.bold, 15))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: height)
            .background(isEnabled ? Theme.accent : Theme.accent.opacity(0.35))
            .clipShape(RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled || isLoading)
    }
}

// MARK: - 입력 필드 (r12 · h46~48 · 테두리 #ECEEF4)

struct FormField<Content: View>: View {
    let label: String
    var hint: String? = nil
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.s(6)) {
            Text(label)
                .font(.inter(.semiBold, 14))
                .foregroundStyle(Theme.textPrimary)
            content
                .font(.inter(.regular, 15))
                .foregroundStyle(Theme.textPrimary)
                .padding(.horizontal, Theme.s(16))
                .frame(height: Theme.s(48))
                .background(Theme.card)
                .clipShape(RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous)
                        .stroke(Theme.panelBorder, lineWidth: 1)
                )
            if let hint {
                Text(hint)
                    .font(.inter(.regular, 12))
                    .foregroundStyle(Theme.textGrayStrong)
            }
        }
    }
}

// MARK: - 빈 상태 / 오류

struct EmptyStateBlock: View {
    let message: String
    var icon: String = "tray"
    var isLoading: Bool = false
    var retry: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: Theme.s(10)) {
            if isLoading {
                ProgressView().tint(Theme.accent)
            } else {
                Image(systemName: icon)
                    .font(.system(size: Theme.s(22)))
                    .foregroundStyle(Theme.textTertiary)
            }
            Text(message)
                .font(.inter(.regular, 12))
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.textGray)
            if let retry {
                Button("다시 시도", action: retry)
                    .font(.inter(.semiBold, 12))
                    .foregroundStyle(Theme.accent)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Theme.s(24))
    }
}

// MARK: - 피부 고민 칩

struct ConcernChips: View {
    @Binding var selected: Set<SkinConcern>

    private var columns: [GridItem] { [GridItem(.adaptive(minimum: Theme.s(84)), spacing: Theme.s(10))] }

    var body: some View {
        LazyVGrid(columns: columns, alignment: .leading, spacing: Theme.s(10)) {
            ForEach(SkinConcern.allCases) { concern in
                let isSelected = selected.contains(concern)
                Text(concern.label)
                    .font(.inter(.medium, 14))
                    .padding(.horizontal, Theme.s(16))
                    .padding(.vertical, Theme.s(10))
                    .background(isSelected ? Theme.primary : Theme.card)
                    .foregroundStyle(isSelected ? .white : Theme.textPrimary)
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(Theme.panelBorder, lineWidth: isSelected ? 0 : 1))
                    .onTapGesture {
                        if isSelected { selected.remove(concern) } else { selected.insert(concern) }
                    }
            }
        }
    }
}

// MARK: - 번들 정보

extension Bundle {
    /// "1.0.0 (12)" 형태의 버전 문자열
    var appVersionString: String {
        let version = infoDictionary?["CFBundleShortVersionString"] as? String ?? "-"
        let build = infoDictionary?["CFBundleVersion"] as? String ?? "-"
        return build == version ? version : "\(version) (\(build))"
    }
}
