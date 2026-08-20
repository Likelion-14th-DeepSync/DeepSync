import SwiftUI

/// 피그마 "회원가입" 1단계(10:298) · 2단계(34:1952) · 완료(34:1981)
struct SignUpFlowView: View {
    @EnvironmentObject private var session: SessionStore
    @Environment(\.dismiss) private var dismiss

    private enum Step { case info, password }
    @State private var step: Step = .info
    @State private var goOnboarding = false

    @State private var email = ""
    @State private var name = ""
    @State private var nickname = ""
    @State private var password = ""
    @State private var passwordConfirm = ""
    @State private var showPassword = false

    private var emailValid: Bool { email.contains("@") && email.contains(".") }
    private var nameValid: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty }
    private var lengthOK: Bool { password.count >= 8 }
    private var varietyOK: Bool {
        password.rangeOfCharacter(from: .letters) != nil &&
        password.rangeOfCharacter(from: .decimalDigits) != nil &&
        password.rangeOfCharacter(from: CharacterSet.alphanumerics.inverted) != nil
    }
    private var passwordValid: Bool { lengthOK && varietyOK && password == passwordConfirm }

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            switch step {
            case .info: infoStep
            case .password: passwordStep
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .navigationDestination(isPresented: $goOnboarding) {
            // 웹과 동일: 피부 타입·고민·습관을 받은 뒤 마지막에 가입 API를 호출한다.
            OnboardingProfileFlow(mode: .signup(
                email: email,
                password: password,
                name: name.trimmingCharacters(in: .whitespaces),
                nickname: nickname.trimmingCharacters(in: .whitespaces)
            ))
            .environmentObject(session)
        }
    }

    // MARK: 상단 (뒤로 + 단계 표시)

    private func stepHeader(current: Int) -> some View {
        HStack {
            Button {
                if current == 2 { step = .info } else { dismiss() }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: Theme.s(18), weight: .semibold))
                    .foregroundStyle(Theme.textInk)
                    .frame(width: Theme.s(24), height: Theme.s(24))
            }
            .buttonStyle(.plain)

            Spacer()

            HStack(spacing: Theme.s(8)) {
                stepDot(number: 1, isDone: current > 1, isActive: current == 1)
                Rectangle()
                    .fill(current > 1 ? Theme.primary : Theme.panelBorder)
                    .frame(width: Theme.s(16), height: Theme.s(2))
                stepDot(number: 2, isDone: false, isActive: current == 2)
            }

            Spacer()
            Color.clear.frame(width: Theme.s(24), height: Theme.s(24))
        }
        .frame(height: Theme.s(48))
    }

    private func stepDot(number: Int, isDone: Bool, isActive: Bool) -> some View {
        ZStack {
            Circle()
                .fill(isDone ? Theme.violetSurface : (isActive ? Theme.primary : Theme.panelBorder))
                .frame(width: Theme.s(24), height: Theme.s(24))
            if isDone {
                Image(systemName: "checkmark")
                    .font(.system(size: Theme.s(11), weight: .bold))
                    .foregroundStyle(Theme.primary)
            } else {
                Text("\(number)")
                    .font(.inter(.bold, 12))
                    .foregroundStyle(isActive ? .white : Theme.textGrayStrong)
            }
        }
    }

    private var titleBlock: some View {
        VStack(alignment: .leading, spacing: Theme.s(8)) {
            Text("회원가입")
                .font(.inter(.extraBold, 28))
                .foregroundStyle(Theme.textInk)
            Text("계정을 만들고\n맞춤 피부 케어를 시작하세요.")
                .font(.inter(.medium, 15))
                .foregroundStyle(Theme.textGrayStrong)
                .lineSpacing(Theme.s(3))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: 1단계 — 이메일 / 이름 / 닉네임

    private var infoStep: some View {
        VStack(spacing: 0) {
            stepHeader(current: 1)

            ScrollView {
                VStack(alignment: .leading, spacing: Theme.s(16)) {
                    titleBlock.padding(.bottom, Theme.s(4))

                    validatedField(label: "이메일", text: $email, placeholder: "wellness@care.com",
                                   isValid: emailValid, keyboard: .emailAddress)
                    validatedField(label: "이름", text: $name, placeholder: "김민재", isValid: nameValid)
                    validatedField(label: "닉네임 (선택)", text: $nickname, placeholder: "민재",
                                   isValid: !nickname.isEmpty)

                    Text("이름은 이 기기에만 저장돼요. 서버에는 닉네임만 전달됩니다.")
                        .font(.inter(.regular, 11))
                        .foregroundStyle(Theme.textTertiary)
                }
                .padding(.top, Theme.s(12))
                .padding(.bottom, Theme.s(24))
            }

            Spacer(minLength: 0)

            VStack(spacing: Theme.s(20)) {
                PrimaryButton(title: "다음", isEnabled: emailValid && nameValid, height: Theme.s(51)) {
                    step = .password
                }
                pageDots(active: 0)
            }
            .padding(.bottom, Theme.s(16))
        }
        .padding(.horizontal, Theme.s(24))
    }

    // MARK: 2단계 — 비밀번호 + 피부 고민

    private var passwordStep: some View {
        VStack(spacing: 0) {
            stepHeader(current: 2)

            ScrollView {
                VStack(alignment: .leading, spacing: Theme.s(16)) {
                    titleBlock.padding(.bottom, Theme.s(4))

                    VStack(alignment: .leading, spacing: Theme.s(6)) {
                        Text("비밀번호")
                            .font(.inter(.semiBold, 14))
                            .foregroundStyle(Theme.textInk)
                        HStack(spacing: Theme.s(12)) {
                            Group {
                                if showPassword {
                                    TextField("비밀번호", text: $password)
                                } else {
                                    SecureField("비밀번호", text: $password)
                                }
                            }
                            .font(.inter(.regular, 15))
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()

                            Button {
                                showPassword.toggle()
                            } label: {
                                Image(systemName: showPassword ? "eye.slash" : "eye")
                                    .font(.system(size: Theme.s(16)))
                                    .foregroundStyle(Theme.textGrayStrong)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, Theme.s(16))
                        .frame(height: Theme.s(48))
                        .background(Theme.card)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous)
                                .stroke(Theme.panelBorder, lineWidth: 1)
                        )
                        Text("영문, 숫자, 특수문자 포함 8자 이상")
                            .font(.inter(.regular, 12))
                            .foregroundStyle(Theme.textGrayStrong)
                    }

                    validatedField(label: "비밀번호 확인", text: $passwordConfirm, placeholder: "비밀번호 확인",
                                   isValid: !passwordConfirm.isEmpty && passwordConfirm == password,
                                   isSecure: true)

                    PanelCard(spacing: Theme.s(10)) {
                        HStack(spacing: Theme.s(8)) {
                            Image(systemName: "shield")
                                .font(.system(size: Theme.s(15)))
                                .foregroundStyle(Theme.primary)
                            Text(lengthOK && varietyOK ? "안전한 비밀번호예요!" : "비밀번호 조건을 확인해주세요")
                                .font(.inter(.bold, 14))
                                .foregroundStyle(Theme.textInk)
                        }
                        checkRow("8자 이상", ok: lengthOK)
                        checkRow("영문, 숫자, 특수문자 포함", ok: varietyOK)
                    }

                    if let message = session.errorMessage {
                        Text(message)
                            .font(.inter(.regular, 12))
                            .foregroundStyle(Theme.danger)
                    }
                }
                .padding(.top, Theme.s(12))
                .padding(.bottom, Theme.s(24))
            }

            VStack(spacing: Theme.s(20)) {
                PrimaryButton(title: "다음",
                              isEnabled: passwordValid,
                              height: Theme.s(51)) {
                    session.clearError()
                    goOnboarding = true
                }
                pageDots(active: 1)
            }
            .padding(.bottom, Theme.s(16))
        }
        .padding(.horizontal, Theme.s(24))
    }

    // MARK: 부품

    private func validatedField(label: String, text: Binding<String>, placeholder: String,
                                isValid: Bool, keyboard: UIKeyboardType = .default,
                                isSecure: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: Theme.s(6)) {
            Text(label)
                .font(.inter(.semiBold, 14))
                .foregroundStyle(Theme.textInk)
            HStack(spacing: Theme.s(12)) {
                Group {
                    if isSecure {
                        SecureField(placeholder, text: text)
                    } else {
                        TextField(placeholder, text: text)
                    }
                }
                .font(.inter(.regular, 15))
                .keyboardType(keyboard)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()

                if isValid {
                    Image(systemName: "checkmark.circle")
                        .font(.system(size: Theme.s(16)))
                        .foregroundStyle(Color(hex: 0x34C759))
                }
            }
            .padding(.horizontal, Theme.s(16))
            .frame(height: Theme.s(46))
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous)
                    .stroke(isValid ? Color(hex: 0x34C759) : Theme.panelBorder, lineWidth: 1)
            )
        }
    }

    private func checkRow(_ title: String, ok: Bool) -> some View {
        HStack(spacing: Theme.s(8)) {
            Image(systemName: ok ? "checkmark.circle.fill" : "circle")
                .font(.system(size: Theme.s(12)))
                .foregroundStyle(ok ? Color(hex: 0x34C759) : Theme.textTertiary)
            Text(title)
                .font(.inter(.medium, 13))
                .foregroundStyle(Theme.textGrayStrong)
        }
    }

    private func pageDots(active: Int) -> some View {
        HStack(spacing: Theme.s(6)) {
            ForEach(0..<2, id: \.self) { index in
                Circle()
                    .fill(index == active ? Theme.primary : Theme.panelBorder)
                    .frame(width: Theme.s(6), height: Theme.s(6))
            }
        }
    }

}

#Preview {
    NavigationStack { SignUpFlowView().environmentObject(SessionStore()) }
}
