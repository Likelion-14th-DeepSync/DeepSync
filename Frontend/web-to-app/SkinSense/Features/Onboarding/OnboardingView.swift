import SwiftUI

/// 피그마 "Onboarding 1"(10:158) — 인트로
struct OnboardingView: View {
    @Binding var hasSeenIntro: Bool

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Spacer()
                    Button {
                        hasSeenIntro = true
                    } label: {
                        Text("건너뛰기")
                            .font(.inter(.medium, 14))
                            .foregroundStyle(Theme.textGray)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, Theme.s(12))

                Spacer()

                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [Theme.gradientStart.opacity(0.25), Theme.gradientEnd.opacity(0.25)],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: Theme.s(220), height: Theme.s(220))
                    Image(systemName: "sparkles")
                        .font(.system(size: Theme.s(76), weight: .light))
                        .foregroundStyle(Theme.primary)
                }
                .frame(maxWidth: .infinity)

                Text("AI 피부 분석으로\n나만의 피부 루틴을\n시작하세요")
                    .font(.inter(.bold, 28))
                    .foregroundStyle(Theme.textInk)
                    .lineSpacing(Theme.s(6))
                    .padding(.top, Theme.s(48))

                Text("정확한 분석과 맞춤 케어로\n건강한 피부를 만들어가요.")
                    .font(.inter(.regular, 14))
                    .foregroundStyle(Theme.textGrayStrong)
                    .lineSpacing(Theme.s(4))
                    .padding(.top, Theme.s(14))

                Spacer()

                PrimaryButton(title: "시작하기", height: Theme.s(56)) {
                    hasSeenIntro = true
                }
                .padding(.bottom, Theme.s(24))
            }
            .padding(.horizontal, Theme.s(20))
        }
    }
}

#Preview {
    OnboardingView(hasSeenIntro: .constant(false))
}
