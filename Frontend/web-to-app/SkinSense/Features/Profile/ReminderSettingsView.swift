import SwiftUI

@MainActor
final class ReminderSettingsViewModel: ObservableObject {
    @Published var settings: [ReminderType: ReminderSetting] = [:]
    @Published var state: LoadState<Bool> = .loading
    @Published var errorMessage: String?
    @Published var notificationsDenied = false

    /// 서버 설정과 기기 로컬 알림을 맞춘다.
    private func syncLocalNotifications() async {
        let granted = await LocalReminderScheduler.shared.requestPermission()
        notificationsDenied = !granted
        guard granted else { return }
        await LocalReminderScheduler.shared.sync(settings: Array(settings.values))
    }

    func load() async {
        do {
            let list = try await SkinSenseAPI.reminderSettings()
            settings = Dictionary(uniqueKeysWithValues: list.compactMap { setting in
                setting.reminderType.map { ($0, setting) }
            })
            state = .loaded(true)
        } catch {
            // 설정이 하나도 없으면 404가 올 수 있어 빈 상태로 처리한다.
            if (error as? APIError)?.isNotFound == true {
                settings = [:]
                state = .loaded(true)
            } else {
                state = .from(error)
            }
        }
    }

    func save(type: ReminderType, enabled: Bool, time: Date, days: Set<ReminderWeekday>) async {
        errorMessage = nil
        let body = ReminderSettingRequest(
            enabled: enabled,
            reminderTime: Self.timeString(time),
            daysOfWeek: ReminderWeekday.allCases.filter { days.contains($0) },
            timezone: TimeZone.current.identifier
        )
        do {
            let saved = try await SkinSenseAPI.updateReminder(type: type, body)
            settings[type] = saved
            await syncLocalNotifications()
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    func disable(type: ReminderType) async {
        errorMessage = nil
        do {
            settings[type] = try await SkinSenseAPI.disableReminder(type: type)
            await syncLocalNotifications()
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    func remove(type: ReminderType) async {
        errorMessage = nil
        do {
            try await SkinSenseAPI.deleteReminder(type: type)
            settings[type] = nil
            await syncLocalNotifications()
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    static func timeString(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "HH:mm:ss"
        return f.string(from: date)
    }

    static func time(from string: String?) -> Date? {
        guard let string else { return nil }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "HH:mm:ss"
        return f.date(from: string.count == 5 ? string + ":00" : string)
    }
}

/// 리마인더 설정 (GET/PUT/PATCH/DELETE /api/v1/reminders/settings)
struct ReminderSettingsView: View {
    @StateObject private var viewModel = ReminderSettingsViewModel()
    @Environment(\.dismiss) private var dismiss
    @State private var editing: ReminderType?

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
                Text("알림 설정").font(.inter(.bold, 16)).foregroundStyle(Theme.textInk)
                Spacer()
                Color.clear.frame(width: Theme.s(20))
            }
            .frame(height: Theme.s(52))
            .padding(.horizontal, Theme.s(20))

            ScrollView {
                VStack(spacing: Theme.s(12)) {
                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage).font(.inter(.regular, 12)).foregroundStyle(Theme.danger)
                    }

                    switch viewModel.state {
                    case .loading:
                        EmptyStateBlock(message: "설정을 불러오는 중이에요", isLoading: true)
                    case let .failed(message), let .empty(message):
                        EmptyStateBlock(message: message, icon: "bell.slash") {
                            Task { await viewModel.load() }
                        }
                    case .loaded:
                        if viewModel.notificationsDenied {
                            Text("기기 알림 권한이 꺼져 있어요. 설정 앱 > SkinSense 에서 알림을 허용해주세요.")
                                .font(.inter(.regular, 11))
                                .foregroundStyle(Theme.warning)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        ForEach(ReminderType.allCases) { type in
                            row(type)
                        }
                        Text("알림은 이 기기의 로컬 알림으로 울려요. 설정은 서버에도 저장되어 홈의 '오늘의 리마인더'에 반영됩니다.")
                            .font(.inter(.regular, 11))
                            .foregroundStyle(Theme.textTertiary)
                            .padding(.top, Theme.s(6))
                    }
                }
                .padding(.horizontal, Theme.s(16))
                .padding(.top, Theme.s(14))
                .padding(.bottom, Theme.s(40))
            }
        }
        .background(Theme.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task { await viewModel.load() }
        .sheet(item: $editing) { type in
            ReminderEditSheet(type: type, existing: viewModel.settings[type]) { enabled, time, days in
                await viewModel.save(type: type, enabled: enabled, time: time, days: days)
            } onDelete: {
                await viewModel.remove(type: type)
            }
        }
    }

    private func row(_ type: ReminderType) -> some View {
        let setting = viewModel.settings[type]
        let isOn = setting?.enabled == true

        return Button {
            editing = type
        } label: {
            HStack(spacing: Theme.s(14)) {
                Image(systemName: type.icon)
                    .font(.system(size: Theme.s(15)))
                    .foregroundStyle(isOn ? Theme.primary : Theme.textTertiary)
                    .frame(width: Theme.s(38), height: Theme.s(38))
                    .background(isOn ? Theme.violetSurface : Theme.panelBorder.opacity(0.5))
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: Theme.s(2)) {
                    Text(type.label).font(.inter(.semiBold, 14)).foregroundStyle(Theme.textInk)
                    Text(subtitle(setting))
                        .font(.inter(.regular, 11))
                        .foregroundStyle(Theme.textGray)
                        .lineLimit(1)
                }
                Spacer()
                Text(isOn ? "켜짐" : "꺼짐")
                    .font(.inter(.bold, 11))
                    .foregroundStyle(isOn ? Theme.accent : Theme.textTertiary)
                Image(systemName: "chevron.right")
                    .font(.system(size: Theme.s(11)))
                    .foregroundStyle(Theme.textTertiary)
            }
            .padding(Theme.s(14))
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusCard, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radiusCard, style: .continuous)
                    .stroke(Theme.panelBorder, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func subtitle(_ setting: ReminderSetting?) -> String {
        guard let setting, setting.enabled == true else { return type_detail(setting) }
        let time = ServerDate.shortTime(setting.reminderTime) ?? "-"
        let days = (setting.daysOfWeek ?? []).map(\.short).joined(separator: "·")
        return days.isEmpty ? time : "\(time) · \(days)"
    }

    private func type_detail(_ setting: ReminderSetting?) -> String {
        setting?.reminderType?.detail ?? "탭해서 설정하세요"
    }
}

private struct ReminderEditSheet: View {
    let type: ReminderType
    let existing: ReminderSetting?
    let onSave: (Bool, Date, Set<ReminderWeekday>) async -> Void
    let onDelete: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var enabled = true
    @State private var time = Date()
    @State private var days: Set<ReminderWeekday> = Set(ReminderWeekday.allCases)
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Toggle("알림 켜기", isOn: $enabled).tint(Theme.accent)
                    DatePicker("시간", selection: $time, displayedComponents: .hourAndMinute)
                } header: {
                    Text(type.label)
                } footer: {
                    Text(type.detail)
                }

                Section("요일") {
                    HStack(spacing: Theme.s(6)) {
                        ForEach(ReminderWeekday.allCases) { day in
                            let selected = days.contains(day)
                            Button {
                                if selected { days.remove(day) } else { days.insert(day) }
                            } label: {
                                Text(day.short)
                                    .font(.inter(.semiBold, 13))
                                    .foregroundStyle(selected ? .white : Theme.textGray)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: Theme.s(36))
                                    .background(selected ? Theme.accent : Theme.panelBorder.opacity(0.5))
                                    .clipShape(RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                if existing != nil {
                    Section {
                        Button("이 알림 삭제", role: .destructive) {
                            Task { await onDelete(); dismiss() }
                        }
                    }
                }
            }
            .navigationTitle("알림 설정")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("취소") { dismiss() } }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("저장") {
                        Task {
                            isSaving = true
                            await onSave(enabled, time, days)
                            isSaving = false
                            dismiss()
                        }
                    }
                    .disabled(isSaving || days.isEmpty)
                }
            }
            .onAppear {
                if let existing {
                    enabled = existing.enabled ?? true
                    time = ReminderSettingsViewModel.time(from: existing.reminderTime) ?? time
                    if let saved = existing.daysOfWeek, !saved.isEmpty { days = Set(saved) }
                }
            }
        }
    }
}
