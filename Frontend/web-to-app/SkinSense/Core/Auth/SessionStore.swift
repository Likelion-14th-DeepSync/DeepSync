import Foundation
import SwiftUI

/// 로그인 상태와 내 프로필을 보관하는 앱 전역 스토어.
@MainActor
final class SessionStore: ObservableObject {
    @Published private(set) var isSignedIn = false
    @Published private(set) var profile: MemberProfile?
    @Published var isBusy = false
    @Published var errorMessage: String?

    /// 로컬에만 저장하는 값들 — 백엔드에 대응 필드가 없다.
    @AppStorage("localName") var localName: String = ""
    @AppStorage("localSkinType") var skinType: String = "복합성"
    @AppStorage("localSleepGoalHours") var sleepGoalHours: Double = 7.5
    @AppStorage("localWaterGoalMl") var waterGoalMl: Int = 2000

    var displayName: String { profile?.nickname ?? "회원" }

    init() {
        if let token = TokenStore.load() {
            APIClient.shared.accessToken = token
            isSignedIn = true
        }
        APIClient.shared.renewToken = { [weak self] in
            await self?.renewToken() ?? false
        }
        APIClient.shared.onUnauthorized = { [weak self] in
            Task { @MainActor in self?.forceSignOut() }
        }

        #if DEBUG
        // 시뮬레이터 화면 확인용: SIMCTL_CHILD_DEV_EMAIL / DEV_PASSWORD 로 자동 로그인.
        // 키체인에 죽은 세션이 남아 있어도 항상 새로 로그인한다.
        let env = ProcessInfo.processInfo.environment
        if let email = env["DEV_EMAIL"], let password = env["DEV_PASSWORD"] {
            Task {
                if TokenStore.loadCredentials()?.email != email { signOut() }
                if !isSignedIn { _ = await signIn(email: email, password: password) }
            }
        }
        #endif
    }

    // MARK: - 인증

    func signUp(email: String, password: String, nickname: String,
                concerns: [SkinConcern], skinType: ServerSkinType = .unknown) async -> Bool {
        await perform {
            _ = try await SkinSenseAPI.signUp(
                SignUpRequest(email: email, password: password, nickname: nickname,
                              skinConcerns: concerns, skinType: skinType)
            )
            try await self.authenticate(email: email, password: password)
        }
    }

    func signIn(email: String, password: String) async -> Bool {
        await perform {
            try await self.authenticate(email: email, password: password)
        }
    }

    private func authenticate(email: String, password: String) async throws {
        let response = try await SkinSenseAPI.login(LoginRequest(email: email, password: password))
        TokenStore.save(response.accessToken)
        TokenStore.saveCredentials(email: email, password: password)
        APIClient.shared.accessToken = response.accessToken
        isSignedIn = true
        profile = try? await SkinSenseAPI.me()
    }

    func clearError() { errorMessage = nil }

    func signOut() {
        SnapshotPublisher.shared.publishSignedOut()
        Task { await LocalReminderScheduler.shared.cancelAll() }
        TokenStore.clear()
        APIClient.shared.accessToken = nil
        profile = nil
        isSignedIn = false
    }

    /// accessToken 만료(1시간) 시 저장된 자격 증명으로 조용히 재로그인한다.
    /// 성공하면 APIClient가 원 요청을 재시도한다.
    /// 백엔드에 refresh token이 생기면 이 경로를 그것으로 교체해야 한다.
    private func renewToken() async -> Bool {
        guard isSignedIn,
              let credentials = TokenStore.loadCredentials(),
              let response = try? await SkinSenseAPI.login(
                  LoginRequest(email: credentials.email, password: credentials.password)) else {
            return false
        }
        TokenStore.save(response.accessToken)
        APIClient.shared.accessToken = response.accessToken
        return true
    }

    /// 갱신까지 실패한 경우에만 호출된다.
    private func forceSignOut() {
        guard isSignedIn else { return }
        signOut()
        errorMessage = "로그인이 만료되었어요. 다시 로그인해주세요."
    }

    // MARK: - 프로필

    func refreshProfile() async {
        guard isSignedIn else { return }
        profile = try? await SkinSenseAPI.me()
    }

    func updateProfile(nickname: String, concerns: [SkinConcern]) async -> Bool {
        await perform {
            self.profile = try await SkinSenseAPI.updateMe(
                UpdateMemberProfileRequest(nickname: nickname, skinConcerns: concerns)
            )
        }
    }

    // MARK: - 공통

    private func perform(_ work: @escaping () async throws -> Void) async -> Bool {
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }
        do {
            try await work()
            return true
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
            return false
        }
    }
}
