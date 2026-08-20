import Foundation

// MARK: - 프로필 옵션 (기기에만 저장하는 값)

let skinTypeOptions = ["건성", "지성", "복합성", "민감성", "중성"]

// MARK: - AI 상담 채팅 (백엔드 API 없음 — UI 데모용)

struct ChatMessage: Identifiable {
    let id = UUID()
    let isUser: Bool
    let text: String
}

let sampleChatMessages: [ChatMessage] = [
    ChatMessage(isUser: false, text: "안녕하세요! 궁금한 피부 고민을 물어보세요 😊"),
    ChatMessage(isUser: true, text: "요즘 턱쪽에 트러블이 자주 나는데 이유가 뭘까?"),
    ChatMessage(isUser: false, text: "생활 기록과 피부 분석이 쌓이면 인사이트 탭에서 요인별 연관도를 확인할 수 있어요.")
]
