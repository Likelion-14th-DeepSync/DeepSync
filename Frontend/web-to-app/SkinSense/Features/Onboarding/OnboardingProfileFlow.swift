import SwiftUI

/// 피그마 "Onboarding 2·3·4" — 피부 타입 · 고민 · 생활 습관.
///
/// 웹 프론트와 동일하게, 회원가입은 이 온보딩의 마지막 단계에서 호출한다
/// (skinType·skinConcerns를 가입 요청에 함께 보내야 하기 때문 — 백엔드 #31).
/// 이미 로그인된 계정이 온보딩만 안 끝낸 경우에는 PATCH /members/me 로 동작한다.
struct OnboardingProfileFlow: View {
    enum Mode {
        /// 로그인된 상태에서 프로필만 마저 설정
        case postLogin
        /// 가입 정보 수집 후 마지막에 signup 호출
        case signup(email: String, password: String, name: String, nickname: String)
    }

    var mode: Mode = .postLogin

    @EnvironmentObject private var session: SessionStore
    @AppStorage("hasCompletedProfileOnboarding") private var completed = false

    @State private var step = 0
    @State private var skinType = ""
    @State private var concerns: Set<SkinConcern> = []
    @State private var sleep = ""
    @State private var smoking = ""
    @State private var drinking = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    private let skinTypes: [(String, String)] = [
        ("건성", "피부가 건조하고\n당김이 느껴져요"),
        ("지성", "피부에 유분이 많고\n번들거려요"),
        ("복합성", "부위별로 유분과\n건조함이 달라요"),
        ("민감성", "자극에 쉽게\n붉어지고 따가워요")
    ]

    /// 피그마 고민 항목 중 백엔드 enum에 대응하는 것만 선택 가능
    private let concernOptions: [(String, SkinConcern?)] = [
        ("여드름", .trouble), ("홍조", .redness), ("건조함", .dryness),
        ("잡티 · 피부톤", .skinTone), ("모공", nil), ("주름", nil)
    ]

    private var canProceed: Bool {
        switch step {
        case 0: return !skinType.isEmpty
        case 1: return !concerns.isEmpty
        default: return !sleep.isEmpty && !smoking.isEmpty && !drinking.isEmpty
        }
    }

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Button {
                        if step > 0 { step -= 1 }
                    } label: {
                        Text("< 뒤로")
                            .font(.inter(.bold, 20))
                            .foregroundStyle(step > 0 ? .black : .clear)
                    }
                    .buttonStyle(.plain)
                    .disabled(step == 0)

                    Spacer()

                    HStack(spacing: Theme.s(14)) {
                        ForEach(0..<4, id: \.self) { index in
                            Circle()
                                .fill(index == step + 1 ? Theme.primary : Color(hex: 0xD9D9D9))
                                .frame(width: Theme.s(8), height: Theme.s(8))
                        }
                    }
                }
                .frame(height: Theme.s(40))
                .padding(.top, Theme.s(12))

                Text(title)
                    .font(.inter(.bold, 24))
                    .foregroundStyle(.black)
                    .padding(.top, Theme.s(40))

                Text(subtitle)
                    .font(.inter(.regular, 14))
                    .foregroundStyle(Color(hex: 0x777777))
                    .padding(.top, Theme.s(10))

                ScrollView {
                    VStack(alignment: .leading, spacing: Theme.s(24)) {
                        switch step {
                        case 0: skinTypeStep
                        case 1: concernStep
                        default: habitStep
                        }
                    }
                    .padding(.top, Theme.s(28))
                    .padding(.bottom, Theme.s(24))
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.inter(.regular, 12))
                        .foregroundStyle(Theme.danger)
                        .padding(.bottom, Theme.s(6))
                }

                PrimaryButton(title: step == 2 ? "시작하기" : "다음",
                              isEnabled: canProceed, isLoading: isSaving,
                              height: Theme.s(56)) {
                    Task { await next() }
                }
                .padding(.bottom, Theme.s(24))
            }
            .padding(.horizontal, Theme.s(19))
        }
    }

    private var title: String {
        switch step {
        case 0: return "당신의 피부 타입은?"
        case 1: return "가장 고민되는\n피부 문제를 선택해주세요."
        default: return "생활 습관을 알려주세요."
        }
    }

    private var subtitle: String {
        switch step {
        case 0: return "정확한 분석을 위해 알려주세요."
        case 1: return "최대 3개까지 선택할 수 있어요."
        default: return "분석 정확도를 높여줍니다."
        }
    }

    // MARK: 단계별

    private var skinTypeStep: some View {
        VStack(spacing: Theme.s(12)) {
            ForEach(skinTypes, id: \.0) { name, detail in
                SelectionCard(isSelected: skinType == name, height: Theme.s(72)) {
                    skinType = name
                } content: {
                    HStack {
                        VStack(alignment: .leading, spacing: Theme.s(4)) {
                            Text(name)
                                .font(.inter(.semiBold, 15))
                                .foregroundStyle(.black)
                            Text(detail.replacingOccurrences(of: "\n", with: " "))
                                .font(.inter(.regular, 12))
                                .foregroundStyle(Theme.textGray)
                        }
                        Spacer()
                    }
                    .padding(.horizontal, Theme.s(18))
                }
            }
        }
    }

    private var concernStep: some View {
        VStack(alignment: .leading, spacing: Theme.s(12)) {
            LazyVGrid(columns: [GridItem(.flexible(), spacing: Theme.s(12)),
                                GridItem(.flexible(), spacing: Theme.s(12))],
                      spacing: Theme.s(12)) {
                ForEach(concernOptions, id: \.0) { label, concern in
                    let supported = concern != nil
                    let selected = concern.map { concerns.contains($0) } ?? false
                    SelectionCard(isSelected: selected, height: Theme.s(56), isEnabled: supported) {
                        guard let concern else { return }
                        if concerns.contains(concern) {
                            concerns.remove(concern)
                        } else if concerns.count < 3 {
                            concerns.insert(concern)
                        }
                    } content: {
                        VStack(spacing: Theme.s(2)) {
                            Text(label)
                                .font(.inter(.semiBold, 14))
                                .foregroundStyle(supported ? .black : Theme.textTertiary)
                            if !supported {
                                Text("준비 중")
                                    .font(.inter(.regular, 10))
                                    .foregroundStyle(Theme.textTertiary)
                            }
                        }
                    }
                }
            }
            Text("모공·주름은 백엔드 분석 항목에 아직 없어 선택할 수 없어요.")
                .font(.inter(.regular, 11))
                .foregroundStyle(Theme.textTertiary)
        }
    }

    private var habitStep: some View {
        VStack(alignment: .leading, spacing: Theme.s(24)) {
            habitGroup(title: "평균 수면 시간",
                       options: ["5시간 이하", "6~7시간", "8시간 이상"],
                       selection: $sleep)
            habitGroup(title: "흡연 여부", options: ["예", "아니오"], selection: $smoking)
            habitGroup(title: "음주 여부", options: ["자주", "가끔", "안함"], selection: $drinking)

            Text("생활 습관은 이 기기에만 저장돼요.")
                .font(.inter(.regular, 11))
                .foregroundStyle(Theme.textTertiary)
        }
    }

    private func habitGroup(title: String, options: [String], selection: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: Theme.s(12)) {
            Text(title)
                .font(.inter(.bold, 15))
                .foregroundStyle(.black)
            HStack(spacing: Theme.s(12)) {
                ForEach(options, id: \.self) { option in
                    SelectionCard(isSelected: selection.wrappedValue == option, height: Theme.s(48)) {
                        selection.wrappedValue = option
                    } content: {
                        Text(option)
                            .font(.inter(.semiBold, 13))
                            .foregroundStyle(.black)
                    }
                }
            }
        }
    }

    private func next() async {
        if step < 2 {
            step += 1
            return
        }
        isSaving = true
        defer { isSaving = false }

        session.skinType = skinType
        UserDefaults.standard.set(sleep, forKey: "habitSleep")
        UserDefaults.standard.set(smoking, forKey: "habitSmoking")
        UserDefaults.standard.set(drinking, forKey: "habitDrinking")

        switch mode {
        case .postLogin:
            _ = await session.updateProfile(nickname: session.profile?.nickname ?? session.displayName,
                                            concerns: Array(concerns))
            completed = true

        case let .signup(email, password, name, nickname):
            let finalNickname = nickname.isEmpty ? name : nickname
            let ok = await session.signUp(email: email, password: password,
                                          nickname: finalNickname,
                                          concerns: Array(concerns),
                                          skinType: ServerSkinType(koreanLabel: skinType))
            if ok {
                session.localName = name
                completed = true
            } else {
                errorMessage = session.errorMessage ?? "회원가입에 실패했어요."
            }
        }
    }
}

/// 선택 카드 (선택 시 #F5F3FF + #6C5CE7 2pt 테두리)
struct SelectionCard<Content: View>: View {
    let isSelected: Bool
    var height: CGFloat
    var isEnabled: Bool = true
    let action: () -> Void
    @ViewBuilder var content: Content

    var body: some View {
        Button(action: action) {
            content
                .frame(maxWidth: .infinity)
                .frame(height: height)
                .background(isSelected ? Color(hex: 0xF5F3FF) : Theme.card)
                .clipShape(RoundedRectangle(cornerRadius: Theme.s(16), style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.s(16), style: .continuous)
                        .stroke(isSelected ? Theme.primary : Color(hex: 0xE8E8F0), lineWidth: 2)
                )
                .opacity(isEnabled ? 1 : 0.55)
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
    }
}

#Preview {
    OnboardingProfileFlow().environmentObject(SessionStore())
}
