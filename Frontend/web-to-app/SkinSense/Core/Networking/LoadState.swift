import SwiftUI

/// 화면 단위 로딩 상태. 서버가 데이터 없음을 404로 알려주므로 empty를 따로 둔다.
enum LoadState<Value> {
    case loading
    case loaded(Value)
    case empty(String)
    case failed(String)

    var value: Value? {
        if case let .loaded(value) = self { return value }
        return nil
    }
}

extension LoadState {
    /// 404는 "아직 데이터가 없음"으로, 나머지는 오류로 처리한다.
    static func from(_ error: Error) -> LoadState {
        if let apiError = error as? APIError {
            if case let .notFound(_, message) = apiError { return .empty(message) }
            return .failed(apiError.errorDescription ?? "요청에 실패했어요.")
        }
        return .failed(error.localizedDescription)
    }
}

/// 로딩 / 빈 상태 / 오류를 한 자리에서 그리는 카드 안쪽 뷰
struct StatePlaceholder: View {
    let state: String
    var icon: String = "tray"
    var isLoading: Bool = false
    var retry: (() -> Void)?

    var body: some View {
        VStack(spacing: 10) {
            if isLoading {
                ProgressView()
            } else {
                Image(systemName: icon)
                    .font(.system(size: 22))
                    .foregroundStyle(Theme.textSecondary.opacity(0.6))
            }
            Text(state)
                .font(.system(size: 12))
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.textSecondary)
            if let retry {
                Button("다시 시도", action: retry)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Theme.primaryDark)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 18)
    }
}
