import SwiftUI

/// 피그마 "로그인"(10:282)
struct AuthView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var email = ""
    @State private var password = ""
    @State private var keepSignedIn = true
    @State private var showSignUp = false
    @State private var socialNotice = false

    private var canSubmit: Bool { email.contains("@") && password.count >= 8 }

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        VStack(alignment: .leading, spacing: Theme.s(10)) {
                            Text("로그인")
                                .font(.inter(.bold, 32))
                                .foregroundStyle(.black)
                            Text("계정에 로그인하여\n맞춤 피부 케어를 시작하세요.")
                                .font(.inter(.regular, 16))
                                .foregroundStyle(Theme.textGrayStrong)
                                .lineSpacing(Theme.s(4))
                        }
                        .padding(.top, Theme.s(96))

                        VStack(alignment: .leading, spacing: Theme.s(18)) {
                            fieldBlock(label: "이메일") {
                                TextField("이메일을 입력하세요", text: $email)
                                    .keyboardType(.emailAddress)
                                    .textContentType(.emailAddress)
                                    .textInputAutocapitalization(.never)
                                    .autocorrectionDisabled()
                            }
                            fieldBlock(label: "비밀번호") {
                                SecureField("비밀번호를 입력하세요", text: $password)
                                    .textContentType(.password)
                            }
                        }
                        .padding(.top, Theme.s(56))

                        HStack {
                            Button {
                                keepSignedIn.toggle()
                            } label: {
                                HStack(spacing: Theme.s(6)) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: Theme.s(9), style: .continuous)
                                            .fill(keepSignedIn ? Theme.accent : Color.clear)
                                            .frame(width: Theme.s(18), height: Theme.s(18))
                                            .overlay(
                                                RoundedRectangle(cornerRadius: Theme.s(9), style: .continuous)
                                                    .stroke(keepSignedIn ? Color.clear : Theme.lineBorder, lineWidth: 1)
                                            )
                                        if keepSignedIn {
                                            Image(systemName: "checkmark")
                                                .font(.system(size: Theme.s(9), weight: .bold))
                                                .foregroundStyle(.white)
                                        }
                                    }
                                    Text("로그인 상태 유지")
                                        .font(.inter(.medium, 13))
                                        .foregroundStyle(Theme.textGrayStrong)
                                }
                            }
                            .buttonStyle(.plain)

                            Spacer()

                            Button {
                                socialNotice = true
                            } label: {
                                Text("비밀번호 찾기")
                                    .font(.inter(.medium, 13))
                                    .foregroundStyle(Theme.accent)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.top, Theme.s(20))

                        if let message = session.errorMessage {
                            Text(message)
                                .font(.inter(.regular, 12))
                                .foregroundStyle(Theme.danger)
                                .padding(.top, Theme.s(12))
                        }

                        PrimaryButton(title: "로그인", isEnabled: canSubmit, isLoading: session.isBusy, height: Theme.s(48)) {
                            Task { _ = await session.signIn(email: email, password: password) }
                        }
                        .padding(.top, Theme.s(20))

                        HStack(spacing: Theme.s(12)) {
                            Rectangle().fill(Theme.panelBorder).frame(height: 1)
                            Text("또는")
                                .font(.inter(.regular, 13))
                                .foregroundStyle(Theme.textGrayStrong)
                            Rectangle().fill(Theme.panelBorder).frame(height: 1)
                        }
                        .padding(.top, Theme.s(28))

                        VStack(spacing: Theme.s(10)) {
                            socialButton(title: "Google로 계속하기", systemImage: "globe")
                            socialButton(title: "Apple로 계속하기", systemImage: "apple.logo")
                        }
                        .padding(.top, Theme.s(24))

                        Text("소셜 로그인은 준비 중이에요")
                            .font(.inter(.regular, 11))
                            .foregroundStyle(Theme.textTertiary)
                            .frame(maxWidth: .infinity, alignment: .center)
                            .padding(.top, Theme.s(10))

                        Rectangle().fill(Theme.divider).frame(height: 1)
                            .padding(.top, Theme.s(28))

                        HStack(spacing: Theme.s(4)) {
                            Text("계정이 없으신가요?")
                                .font(.inter(.regular, 12))
                                .foregroundStyle(Theme.textGrayStrong)
                            Button {
                                session.clearError()
                                showSignUp = true
                            } label: {
                                Text("회원가입")
                                    .font(.inter(.bold, 12))
                                    .foregroundStyle(Theme.primary)
                            }
                            .buttonStyle(.plain)
                        }
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.top, Theme.s(16))
                    }
                    .padding(.horizontal, Theme.s(24))
                    .padding(.bottom, Theme.s(40))
                }
            }
            .navigationDestination(isPresented: $showSignUp) {
                SignUpFlowView()
            }
            .alert("준비 중이에요", isPresented: $socialNotice) {
                Button("확인", role: .cancel) {}
            } message: {
                Text("백엔드에 해당 기능이 아직 없어요.")
            }
        }
    }

    @ViewBuilder
    private func fieldBlock<Content: View>(label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: Theme.s(8)) {
            Text(label)
                .font(.inter(.regular, 16))
                .foregroundStyle(.black)
            content()
                .font(.inter(.regular, 16))
                .foregroundStyle(Theme.textPrimary)
                .padding(.horizontal, Theme.s(14))
                .frame(height: Theme.s(44))
                .background(Theme.card)
                .clipShape(RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous)
                        .stroke(Theme.divider, lineWidth: 1)
                )
        }
    }

    private func socialButton(title: String, systemImage: String) -> some View {
        Button {
            socialNotice = true
        } label: {
            HStack(spacing: Theme.s(10)) {
                Image(systemName: systemImage)
                    .font(.system(size: Theme.s(17)))
                    .foregroundStyle(Theme.textPrimary)
                Text(title)
                    .font(.inter(.semiBold, 14))
                    .foregroundStyle(Theme.textPrimary)
            }
            .frame(maxWidth: .infinity)
            .frame(height: Theme.s(52))
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous)
                    .stroke(Theme.lineBorder, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    AuthView().environmentObject(SessionStore())
}
