import Foundation
import UserNotifications

/// 서버에 저장된 리마인더 설정을 기기 로컬 알림으로 스케줄한다.
///
/// APNs(서버 푸시)가 아직 없어, 설정을 저장·수정할 때마다 로컬 반복 알림을
/// 다시 등록하는 방식으로 실제 알림을 제공한다. 서버 푸시가 도입되면
/// 이 클래스는 제거하고 디바이스 토큰 등록으로 교체한다.
@MainActor
final class LocalReminderScheduler {
    static let shared = LocalReminderScheduler()

    private let center = UNUserNotificationCenter.current()
    private let idPrefix = "reminder."

    private init() {}

    /// 알림 권한을 요청한다. 이미 결정됐으면 현재 상태를 반환한다.
    func requestPermission() async -> Bool {
        let settings = await center.notificationSettings()
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            return true
        case .denied:
            return false
        case .notDetermined:
            return (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        @unknown default:
            return false
        }
    }

    /// 서버 설정 전체를 로컬 알림으로 다시 등록한다.
    func sync(settings: [ReminderSetting]) async {
        let pending = await center.pendingNotificationRequests()
        let ours = pending.map(\.identifier).filter { $0.hasPrefix(idPrefix) }
        center.removePendingNotificationRequests(withIdentifiers: ours)

        for setting in settings where setting.enabled == true {
            await schedule(setting)
        }
    }

    private func schedule(_ setting: ReminderSetting) async {
        guard let type = setting.reminderType,
              let time = setting.reminderTime else { return }

        let parts = time.split(separator: ":").compactMap { Int($0) }
        guard parts.count >= 2 else { return }
        let (hour, minute) = (parts[0], parts[1])

        let content = UNMutableNotificationContent()
        content.title = type.label
        content.body = type.detail
        content.sound = .default

        let weekdays = setting.daysOfWeek ?? []
        if weekdays.isEmpty || weekdays.count == 7 {
            var components = DateComponents()
            components.hour = hour
            components.minute = minute
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
            let request = UNNotificationRequest(identifier: idPrefix + type.rawValue,
                                                content: content, trigger: trigger)
            try? await center.add(request)
        } else {
            for day in weekdays {
                var components = DateComponents()
                components.weekday = calendarWeekday(day)
                components.hour = hour
                components.minute = minute
                let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
                let request = UNNotificationRequest(identifier: idPrefix + type.rawValue + "." + day.rawValue,
                                                    content: content, trigger: trigger)
                try? await center.add(request)
            }
        }
    }

    /// ReminderWeekday → Calendar.weekday (1=일요일)
    private func calendarWeekday(_ day: ReminderWeekday) -> Int {
        switch day {
        case .sunday: return 1
        case .monday: return 2
        case .tuesday: return 3
        case .wednesday: return 4
        case .thursday: return 5
        case .friday: return 6
        case .saturday: return 7
        }
    }

    /// 로그아웃 시 전부 해제한다.
    func cancelAll() async {
        let pending = await center.pendingNotificationRequests()
        let ours = pending.map(\.identifier).filter { $0.hasPrefix(idPrefix) }
        center.removePendingNotificationRequests(withIdentifiers: ours)
    }
}
