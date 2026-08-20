import SwiftUI

/// 피그마 "AI - 상담 시작"(43:6810)
/// OpenAI(gpt-4o-mini) 기반 대화. 사용자의 실제 기록을 시스템 프롬프트로 주입한다.
struct AIChatView: View {
    var presetQuestion: String? = nil

    @Environment(\.dismiss) private var dismiss
    @State private var messages: [ChatMessage] = []
    @State private var input = ""
    @State private var isThinking = false
    /// OpenAI에 보내는 대화 이력 (system 프롬프트 포함)
    @State private var history: [OpenAIService.Turn] = []
    /// 시스템 프롬프트(사용자 데이터 조회)는 오래 걸릴 수 있어 백그라운드로 미리 만든다.
    /// send()는 이 태스크를 await 하므로 사용자는 즉시 입력할 수 있다.
    @State private var systemPromptTask: Task<OpenAIService.BuiltPrompt, Never>?
    /// 데이터가 포함된 컨텍스트를 확보했는지. 아니면 send마다 재시도한다.
    @State private var hasContext = false

    private let suggestions = ["오늘 피부 왜 안좋아?", "오늘 루틴 추천", "7일 실험 결과"]

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: Theme.s(17), weight: .semibold))
                        .foregroundStyle(Theme.textInk)
                }
                .buttonStyle(.plain)
                Spacer()
                Text("AI 상담")
                    .font(.inter(.bold, 20))
                    .foregroundStyle(Theme.textInk)
                Spacer()
                Color.clear.frame(width: Theme.s(20))
            }
            .frame(height: Theme.s(52))
            .padding(.horizontal, Theme.s(20))

            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: Theme.s(14)) {
                        Text("오늘")
                            .font(.inter(.semiBold, 11))
                            .foregroundStyle(Theme.textTertiary)
                            .frame(maxWidth: .infinity)

                        ForEach(messages) { message in
                            ChatBubble(message: message).id(message.id)
                        }

                        if isThinking {
                            HStack(spacing: Theme.s(6)) {
                                ProgressView().tint(Theme.accent).scaleEffect(0.7)
                                Text("AI가 생각하는 중이에요…")
                                    .font(.inter(.regular, 12))
                                    .foregroundStyle(Theme.textGray)
                            }
                        }
                    }
                    .padding(.horizontal, Theme.s(18))
                    .padding(.vertical, Theme.s(12))
                }
                .onChange(of: messages.count) { _, _ in
                    if let last = messages.last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }

            VStack(spacing: Theme.s(10)) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: Theme.s(8)) {
                        Text("추천 질문")
                            .font(.inter(.semiBold, 12))
                            .foregroundStyle(Theme.textTertiary)
                        ForEach(suggestions, id: \.self) { suggestion in
                            Button {
                                send(suggestion)
                            } label: {
                                Text(suggestion)
                                    .font(.inter(.semiBold, 12))
                                    .foregroundStyle(Theme.accent)
                                    .padding(.horizontal, Theme.s(12))
                                    .padding(.vertical, Theme.s(7))
                                    .background(Theme.tintSurface)
                                    .clipShape(Capsule())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, Theme.s(18))
                }

                HStack(spacing: Theme.s(10)) {
                    TextField("무엇이 궁금한가요?", text: $input)
                        .font(.inter(.medium, 14))
                        .padding(.horizontal, Theme.s(16))
                        .frame(height: Theme.s(44))
                        .background(Theme.card)
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(Theme.panelBorder, lineWidth: 1))

                    Button {
                        send(input)
                    } label: {
                        Image(systemName: "arrow.up")
                            .font(.system(size: Theme.s(16), weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: Theme.s(44), height: Theme.s(44))
                            .background(input.trimmingCharacters(in: .whitespaces).isEmpty
                                        ? Theme.accent.opacity(0.35) : Theme.accent)
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .disabled(input.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(.horizontal, Theme.s(18))
                .padding(.bottom, Theme.s(10))
            }
            .background(Theme.background)
        }
        .background(Theme.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task {
            if messages.isEmpty {
                messages.append(ChatMessage(isUser: false,
                    text: "안녕하세요! 기록을 살펴보고 있어요. 피부에 대해 무엇이든 물어보세요 😊"))
                systemPromptTask = Task { await OpenAIService.shared.buildSystemPrompt() }
                if let presetQuestion { send(presetQuestion) }
            }
        }
    }

    /// 시스템 프롬프트가 준비될 때까지 기다렸다가 history[0]에 넣는다.
    /// 로그인 직후 등으로 데이터를 못 읽었으면 다음 send 때 다시 만든다.
    private func ensureSystemPrompt() async {
        guard !hasContext else { return }
        let task = systemPromptTask ?? Task { await OpenAIService.shared.buildSystemPrompt() }
        systemPromptTask = task
        let built = await task.value

        let systemTurn = OpenAIService.Turn(role: "system", content: built.text)
        if history.isEmpty {
            history = [systemTurn]
        } else {
            history[0] = systemTurn
        }
        hasContext = built.hasData
        if !built.hasData { systemPromptTask = nil }
    }

    private func send(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, !isThinking else { return }
        messages.append(ChatMessage(isUser: true, text: trimmed))
        input = ""
        isThinking = true

        Task {
            await ensureSystemPrompt()
            history.append(OpenAIService.Turn(role: "user", content: trimmed))

            do {
                let reply = try await OpenAIService.shared.reply(history: history)
                history.append(OpenAIService.Turn(role: "assistant", content: reply))
                messages.append(ChatMessage(isUser: false, text: reply))
            } catch {
                // 실패 시 기록 요약으로 대체 응답
                let fallback = await buildReply()
                messages.append(ChatMessage(isUser: false,
                    text: (error as? OpenAIService.AIError)?.errorDescription.map { "\($0)\n\n" + fallback } ?? fallback))
            }
            isThinking = false
        }
    }

    /// AI 호출 실패 시 대체: 실제 기록을 읽어 요약 응답을 만든다.
    private func buildReply() async -> String {
        guard let insight = try? await SkinSenseAPI.todayInsight() else {
            return "아직 오늘 완료된 분석이 없어요. 촬영 후 다시 물어봐 주세요."
        }
        var lines: [String] = []
        if let score = insight.today?.overallScore {
            lines.append("오늘 종합 점수는 \(score)점이에요.")
        }
        if let change = insight.changes?.previous?.overallScoreChange {
            lines.append(change == 0 ? "어제와 같은 수준이에요."
                         : "어제보다 \(abs(change))점 \(change > 0 ? "올랐어요" : "내려갔어요").")
        }
        for factor in (insight.associatedFactors ?? []).prefix(3) {
            if let description = factor.description {
                lines.append("• \(description)")
            } else if let name = factor.factor?.label {
                lines.append("• \(name)이(가) 영향을 준 것으로 보여요.")
            }
        }
        if let summary = insight.summary { lines.append(summary) }
        if lines.isEmpty { lines.append("아직 연관 요인을 찾을 만큼 기록이 쌓이지 않았어요.") }
        return lines.joined(separator: "\n")
    }
}

private struct ChatBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack {
            if message.isUser { Spacer(minLength: Theme.s(40)) }
            Text(message.text)
                .font(.inter(.medium, 14))
                .foregroundStyle(message.isUser ? .white : Theme.textInk)
                .padding(.horizontal, Theme.s(14))
                .padding(.vertical, Theme.s(11))
                .background(message.isUser ? Theme.accent : Theme.card)
                .clipShape(RoundedRectangle(cornerRadius: Theme.s(16), style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.s(16), style: .continuous)
                        .stroke(message.isUser ? Color.clear : Theme.panelBorder, lineWidth: 1)
                )
            if !message.isUser { Spacer(minLength: Theme.s(40)) }
        }
    }
}

#Preview {
    NavigationStack { AIChatView() }
}
