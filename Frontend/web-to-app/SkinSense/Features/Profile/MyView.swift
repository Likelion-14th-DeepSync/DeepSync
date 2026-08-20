import SwiftUI

/// 피그마 "마이"(34:2068)
struct MyView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var activeGoal: SkinGoal?
    @State private var streakDays: Int = 0
    @State private var reminderSummary: String?
    @State private var isEditing = false
    @State private var showNotice = false
    @State private var legalKind: LegalView.Kind?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("마이")
                        .font(.inter(.bold, 32))
                        .foregroundStyle(.black)
                        .padding(.top, Theme.s(26))

                    profileCard.padding(.top, Theme.s(20))

                    Text("연동 & 기기")
                        .font(.inter(.bold, 20))
                        .foregroundStyle(.black)
                        .padding(.top, Theme.s(30))

                    OutlinedCard {
                        NavigationLink { WearableView() } label: {
                            LinkListRow(title: "건강 앱 연동", detail: "Apple Watch 수면·심박·활동 읽기", badge: nil)
                        }
                        .buttonStyle(.plain)
                        Divider().background(Theme.divider)
                        NavigationLink { WearableView() } label: {
                            LinkListRow(title: "웨어러블 기기", detail: "HealthKit으로 데이터 가져오기", badge: nil)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, Theme.s(14))

                    Text("나의 관리")
                        .font(.inter(.bold, 20))
                        .foregroundStyle(.black)
                        .padding(.top, Theme.s(30))

                    OutlinedCard {
                        NavigationLink { DDayView() } label: {
                            LinkListRow(title: "Skin D-Day",
                                        detail: activeGoal?.title ?? "진행 중인 목표가 없어요", badge: nil)
                        }
                        .buttonStyle(.plain)
                        Divider().background(Theme.divider)
                        NavigationLink { AIChatView() } label: {
                            LinkListRow(title: "AI 상담", detail: "기록 기반 요약 상담", badge: nil)
                        }
                        .buttonStyle(.plain)
                        Divider().background(Theme.divider)
                        NavigationLink { ReportView() } label: {
                            LinkListRow(title: "피부 리포트", detail: "주간 · 월간 요약", badge: nil)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, Theme.s(14))

                    Text("설정")
                        .font(.inter(.bold, 20))
                        .foregroundStyle(.black)
                        .padding(.top, Theme.s(30))

                    OutlinedCard {
                        NavigationLink { ReminderSettingsView() } label: {
                            LinkListRow(title: "알림 설정", detail: reminderSummary, badge: nil)
                        }
                        .buttonStyle(.plain)
                        Divider().background(Theme.divider)
                        Button { showNotice = true } label: {
                            LinkListRow(title: "데이터 관리", detail: nil, badge: nil)
                        }
                        .buttonStyle(.plain)
                        Divider().background(Theme.divider)
                        Button { showNotice = true } label: {
                            LinkListRow(title: "회원 탈퇴", detail: nil, badge: nil)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, Theme.s(14))

                    Button {
                        session.signOut()
                    } label: {
                        HStack(spacing: Theme.s(8)) {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .font(.system(size: Theme.s(13), weight: .semibold))
                            Text("로그아웃").font(.inter(.bold, 14))
                        }
                        .foregroundStyle(Color(hex: 0xFF383C))
                        .frame(maxWidth: .infinity)
                        .frame(height: Theme.s(48))
                        .background(Theme.card)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous)
                                .stroke(Color(hex: 0xFF383C).opacity(0.5), lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                    .padding(.top, Theme.s(30))

                    VStack(spacing: Theme.s(6)) {
                        HStack(spacing: Theme.s(4)) {
                            Button { legalKind = .privacy } label: {
                                Text("개인정보처리방침").font(.inter(.bold, 12)).foregroundStyle(Color(hex: 0x8E8E93))
                            }.buttonStyle(.plain)
                            Text("|").font(.inter(.regular, 12)).foregroundStyle(Color(hex: 0x8E8E93))
                            Button { legalKind = .terms } label: {
                                Text("이용약관").font(.inter(.bold, 12)).foregroundStyle(Color(hex: 0x8E8E93))
                            }.buttonStyle(.plain)
                        }
                        Text("버전 \(Bundle.main.appVersionString)")
                            .font(.inter(.regular, 11))
                            .foregroundStyle(Color(hex: 0x8E8E93))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, Theme.s(28))
                }
                .padding(.horizontal, Theme.s(18))
                .padding(.bottom, Theme.s(120))
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationBarHidden(true)
            .sheet(isPresented: $isEditing) {
                ProfileEditView().environmentObject(session)
            }
            .sheet(item: $legalKind) { kind in
                LegalView(kind: kind)
            }
            .alert("준비 중이에요", isPresented: $showNotice) {
                Button("확인", role: .cancel) {}
            } message: {
                Text("이 기능은 아직 백엔드에 연결되지 않았어요.")
            }
            .task { await load() }
            .refreshable { await load() }
        }
    }

    // MARK: 프로필 카드

    private var profileCard: some View {
        VStack(spacing: Theme.s(16)) {
            HStack(alignment: .top, spacing: Theme.s(14)) {
                Circle()
                    .fill(Theme.violetSurface)
                    .frame(width: Theme.s(71), height: Theme.s(71))
                    .overlay(
                        Text(String((session.profile?.nickname ?? "회").prefix(1)))
                            .font(.inter(.bold, 26))
                            .foregroundStyle(Theme.primary)
                    )

                VStack(alignment: .leading, spacing: Theme.s(6)) {
                    Text("\(session.profile?.nickname ?? "회원")님")
                        .font(.inter(.bold, 20))
                        .foregroundStyle(.black)
                    HStack(spacing: Theme.s(4)) {
                        Text("ID")
                            .font(.inter(.regular, 14))
                            .foregroundStyle(Color(hex: 0x8E8E93))
                        Text(session.profile?.email ?? "-")
                            .font(.inter(.regular, 13))
                            .foregroundStyle(Color(hex: 0x8E8E93))
                            .lineLimit(1)
                    }
                }

                Spacer(minLength: 0)

                Button {
                    isEditing = true
                } label: {
                    Text("프로필 수정")
                        .font(.inter(.bold, 10))
                        .foregroundStyle(Color(hex: 0x7C5CFC))
                        .padding(.horizontal, Theme.s(10))
                        .padding(.vertical, Theme.s(5))
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous)
                                .stroke(Color(hex: 0x7E51EC), lineWidth: 1)
                        )
                }
                .buttonStyle(.plain)
            }

            Divider().background(Theme.divider)

            HStack(spacing: 0) {
                statColumn(title: "D-Day",
                           value: activeGoal?.daysRemaining.map { "\($0)일 남음" } ?? "없음")
                Rectangle().fill(Theme.divider).frame(width: 1, height: Theme.s(40))
                statColumn(title: "연속 기록", value: "\(streakDays)일")
            }
        }
        .padding(Theme.s(18))
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous)
                .stroke(Theme.divider, lineWidth: 2)
        )
    }

    private func statColumn(title: String, value: String) -> some View {
        VStack(spacing: Theme.s(8)) {
            Text(title)
                .font(.inter(.regular, 14))
                .foregroundStyle(Color(hex: 0x8E8E93))
            Text(value)
                .font(.inter(.bold, 14))
                .foregroundStyle(.black)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: 로딩

    private func load() async {
        await session.refreshProfile()
        activeGoal = try? await SkinSenseAPI.activeSkinGoal()
        if let reminders = try? await SkinSenseAPI.todayReminders() {
            let count = reminders.reminders?.count ?? 0
            reminderSummary = count > 0 ? "오늘 \(count)건" : nil
        }
        streakDays = await computeStreak()
    }

    /// 최근 30일 분석 기록으로 연속 기록일 계산
    private func computeStreak() async -> Int {
        guard let analyses = try? await SkinSenseAPI.analyses(from: ServerDate.daysAgo(30), to: ServerDate.today) else {
            return 0
        }
        let days = Set(analyses.compactMap { analysis -> String? in
            guard let captured = ServerDate.parse(analysis.capturedAt) else { return nil }
            return ServerDate.dateString(captured)
        })
        var streak = 0
        var cursor = Date()
        while days.contains(ServerDate.dateString(cursor)) {
            streak += 1
            cursor = Calendar.current.date(byAdding: .day, value: -1, to: cursor) ?? cursor
        }
        return streak
    }
}

// MARK: - 부품

struct OutlinedCard<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        VStack(spacing: 0) { content }
            .padding(.horizontal, Theme.s(16))
            .padding(.vertical, Theme.s(4))
            .frame(maxWidth: .infinity)
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous)
                    .stroke(Theme.divider, lineWidth: 2)
            )
    }
}

struct LinkListRow: View {
    let title: String
    var detail: String?
    var badge: String?

    var body: some View {
        HStack(spacing: Theme.s(8)) {
            VStack(alignment: .leading, spacing: Theme.s(3)) {
                Text(title)
                    .font(.inter(.bold, 14))
                    .foregroundStyle(.black)
                if let detail {
                    Text(detail)
                        .font(.inter(.regular, 11))
                        .foregroundStyle(Color(hex: 0x8E8E93))
                        .lineLimit(1)
                }
            }
            Spacer(minLength: 0)
            if let badge {
                Text(badge)
                    .font(.inter(.bold, 9))
                    .foregroundStyle(Color(hex: 0x2BBC76))
            }
            Image(systemName: "chevron.right")
                .font(.system(size: Theme.s(12), weight: .semibold))
                .foregroundStyle(Color(hex: 0x808080).opacity(0.5))
        }
        .padding(.vertical, Theme.s(12))
        .contentShape(Rectangle())
    }
}

#Preview {
    MyView().environmentObject(SessionStore())
}
