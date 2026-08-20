import Foundation

/// ⚠️ 보안 주의
/// 클라이언트 바이너리에 포함된 API 키는 누구나 추출할 수 있다.
/// App Store 출시 전에 반드시 백엔드 프록시(서버가 키 보관, 앱은 우리 서버 호출)로
/// 옮기고 이 키는 폐기·재발급해야 한다. 테스트 단계 한정으로만 사용한다.
enum AISecrets {
    static let openAIKey = "YOUR_OPENAI_API_KEY"
}
