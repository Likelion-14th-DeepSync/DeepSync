import SwiftUI

/// 피그마 "AI"(34:2126)
struct AIHomeView: View {
    let onClose: () -> Void
    @State private var showChat = false
    @State private var showCapture = false
    @State private var presetQuestion: String?

    private let quickQuestions: [(String, String)] = [
        ("🌙", "왜 피부점수가 떨어졌어?"),
        ("☀️", "오늘 루틴 추천해줘"),
        ("📊", "7일 실험 결과 알려줘"),
        ("📅", "D-Day 관리 어떻게 해?"),
        ("✨", "피부 변화 요약해줘")
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Text("Wellness Care AI")
                            .font(.inter(.bold, 22))
                            .foregroundStyle(Theme.textPrimary)
                        Spacer()
                        Button(action: onClose) {
                            Image(systemName: "xmark")
                                .font(.system(size: Theme.s(15), weight: .semibold))
                                .foregroundStyle(Theme.textGray)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, Theme.s(26))

                    VStack(alignment: .leading, spacing: Theme.s(6)) {
                        Text("안녕하세요 👋")
                            .font(.inter(.bold, 24))
                            .foregroundStyle(Theme.textInk)
                        Text("무엇을 도와드릴까요?")
                            .font(.inter(.bold, 24))
                            .foregroundStyle(Theme.textGrayStrong)
                    }
                    .padding(.top, Theme.s(30))

                    VStack(spacing: Theme.s(12)) {
                        actionCard(icon: "camera", title: "피부 분석하기",
                                   subtitle: "현재 피부 상태를 사진으로 분석해요") {
                            showCapture = true
                        }
                        actionCard(icon: "message", title: "AI 상담 시작",
                                   subtitle: "내 피부 기록을 기반으로 상담해요") {
                            presetQuestion = nil
                            showChat = true
                        }
                    }
                    .padding(.top, Theme.s(24))

                    Text("빠른 질문")
                        .font(.inter(.bold, 15))
                        .foregroundStyle(Theme.textInk)
                        .padding(.top, Theme.s(28))

                    VStack(spacing: Theme.s(8)) {
                        ForEach(quickQuestions, id: \.1) { emoji, question in
                            Button {
                                presetQuestion = question
                                showChat = true
                            } label: {
                                HStack(spacing: Theme.s(12)) {
                                    Text(emoji).font(.system(size: Theme.s(16)))
                                    Text(question)
                                        .font(.inter(.medium, 14))
                                        .foregroundStyle(Theme.textInk)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: Theme.s(11)))
                                        .foregroundStyle(Theme.textTertiary)
                                }
                                .padding(.horizontal, Theme.s(16))
                                .frame(height: Theme.s(48))
                                .background(Theme.card)
                                .clipShape(RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous)
                                        .stroke(Theme.panelBorder, lineWidth: 1)
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.top, Theme.s(12))
                }
                .padding(.horizontal, Theme.s(18))
                .padding(.bottom, Theme.s(40))
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationBarHidden(true)
            .navigationDestination(isPresented: $showChat) {
                AIChatView(presetQuestion: presetQuestion)
            }
            .fullScreenCover(isPresented: $showCapture) {
                CameraGuideView(onClose: { showCapture = false })
            }
        }
    }

    private func actionCard(icon: String, title: String, subtitle: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: Theme.s(12)) {
                Circle()
                    .fill(Theme.violetSurface)
                    .frame(width: Theme.s(40), height: Theme.s(40))
                    .overlay(
                        Image(systemName: icon)
                            .font(.system(size: Theme.s(17)))
                            .foregroundStyle(Theme.primary)
                    )

                VStack(alignment: .leading, spacing: Theme.s(2)) {
                    Text(title)
                        .font(.inter(.bold, 15))
                        .foregroundStyle(Theme.textInk)
                    Text(subtitle)
                        .font(.inter(.medium, 12))
                        .foregroundStyle(Theme.textGrayStrong)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: Theme.s(12)))
                    .foregroundStyle(Theme.textTertiary)
            }
            .padding(.horizontal, Theme.s(16))
            .frame(height: Theme.s(72))
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusCard, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radiusCard, style: .continuous)
                    .stroke(Theme.panelBorder, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    AIHomeView(onClose: {})
}
