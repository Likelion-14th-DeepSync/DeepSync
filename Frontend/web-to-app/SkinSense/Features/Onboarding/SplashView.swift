import SwiftUI

/// 피그마 "Splash"(46:7172)
struct SplashView: View {
    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            VStack(spacing: Theme.s(16)) {
                Spacer()

                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [Theme.gradientStart, Theme.gradientEnd],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: Theme.s(120), height: Theme.s(120))
                    Image(systemName: "sparkles")
                        .font(.system(size: Theme.s(48), weight: .light))
                        .foregroundStyle(.white)
                }

                Text("Wellness Care")
                    .font(.inter(.bold, 32))
                    .foregroundStyle(Theme.textInk)

                Text("AI 피부 분석으로\n나만의 피부 루틴을 시작하세요")
                    .font(.inter(.regular, 14))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.textGray)
                    .lineSpacing(Theme.s(4))

                Spacer()

                Text("By AAC")
                    .font(.inter(.bold, 20))
                    .foregroundStyle(Theme.textTertiary)
                    .padding(.bottom, Theme.s(40))
            }
        }
    }
}

#Preview { SplashView() }
