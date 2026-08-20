import SwiftUI

/// 서버 프로필(닉네임·피부 고민)과 앱 로컬 설정(피부 타입·생활 목표)을 함께 편집한다.
/// 피부 타입과 생활 목표는 백엔드에 대응 필드가 없어 기기에만 저장한다.
struct ProfileEditView: View {
    @EnvironmentObject private var session: SessionStore
    @Environment(\.dismiss) private var dismiss

    @State private var nickname = ""
    @State private var concerns: Set<SkinConcern> = []
    @State private var skinType = "복합성"
    @State private var sleepGoal: Double = 7.5
    @State private var waterGoal: Double = 2000
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 26) {
                        FormField(label: "닉네임") {
                            TextField("표시할 이름", text: $nickname)
                        }

                        VStack(alignment: .leading, spacing: 10) {
                            Text("피부 고민 (복수 선택)").fieldLabelStyle()
                            ConcernChips(selected: $concerns)
                        }

                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text("피부 타입").fieldLabelStyle()
                                Spacer()
                                Text("기기 저장").badgeStyle()
                            }
                            Picker("피부 타입", selection: $skinType) {
                                ForEach(skinTypeOptions, id: \.self) { Text($0).tag($0) }
                            }
                            .pickerStyle(.segmented)
                        }

                        VStack(alignment: .leading, spacing: 14) {
                            HStack {
                                Text("생활 목표").fieldLabelStyle()
                                Spacer()
                                Text("기기 저장").badgeStyle()
                            }

                            VStack(spacing: 14) {
                                HStack {
                                    Label("수면 목표", systemImage: "bed.double.fill")
                                        .foregroundStyle(Theme.textPrimary)
                                    Spacer()
                                    Text(String(format: "%.1f시간", sleepGoal))
                                        .foregroundStyle(Theme.textSecondary)
                                }
                                Slider(value: $sleepGoal, in: 5...10, step: 0.5)
                                    .tint(Theme.primaryDark)

                                Divider().background(Theme.divider)

                                HStack {
                                    Label("수분 섭취 목표", systemImage: "drop.fill")
                                        .foregroundStyle(Theme.textPrimary)
                                    Spacer()
                                    Text("\(Int(waterGoal))ml")
                                        .foregroundStyle(Theme.textSecondary)
                                }
                                Slider(value: $waterGoal, in: 1000...3000, step: 100)
                                    .tint(Theme.primaryDark)
                            }
                            .cardStyle()
                        }

                        if let errorMessage {
                            Text(errorMessage)
                                .font(.system(size: Theme.s(13)))
                                .foregroundStyle(.red.opacity(0.85))
                        }
                    }
                    .padding(20)
                }
            }
            .navigationTitle("프로필 편집")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("취소") { dismiss() }.foregroundStyle(Theme.textSecondary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("저장") { Task { await save() } }
                        .font(.system(size: Theme.s(15), weight: .semibold))
                        .disabled(nickname.trimmingCharacters(in: .whitespaces).isEmpty || concerns.isEmpty || session.isBusy)
                }
            }
            .onAppear {
                nickname = session.profile?.nickname ?? ""
                concerns = Set(session.profile?.skinConcerns ?? [])
                skinType = session.skinType
                sleepGoal = session.sleepGoalHours
                waterGoal = Double(session.waterGoalMl)
            }
        }
    }

    private func save() async {
        session.skinType = skinType
        session.sleepGoalHours = sleepGoal
        session.waterGoalMl = Int(waterGoal)

        let ok = await session.updateProfile(nickname: nickname, concerns: Array(concerns))
        if ok {
            dismiss()
        } else {
            errorMessage = session.errorMessage
        }
    }
}

private extension Text {
    func fieldLabelStyle() -> some View {
        self.font(.system(size: Theme.s(14), weight: .semibold)).foregroundStyle(Theme.textSecondary)
    }

    func badgeStyle() -> some View {
        self.font(.system(size: Theme.s(10), weight: .semibold))
            .foregroundStyle(Theme.textSecondary)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Theme.divider)
            .clipShape(Capsule())
    }
}

#Preview {
    ProfileEditView().environmentObject(SessionStore())
}
