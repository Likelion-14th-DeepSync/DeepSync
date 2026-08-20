import Foundation
import WatchConnectivity
import WidgetKit

/// 대시보드 응답을 위젯·워치가 읽을 수 있는 요약으로 바꿔 공유한다.
@MainActor
final class SnapshotPublisher: NSObject {
    static let shared = SnapshotPublisher()

    private var pendingSnapshot: SkinSnapshot?

    private override init() {
        super.init()
        activateSession()
    }

    /// 앱 시작 시 한 번 호출해 세션을 미리 켠다.
    func warmUp() { activateSession() }

    private func activateSession() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    /// 홈 화면이 대시보드를 불러올 때마다 호출한다.
    func publish(dashboard: DdayDashboard, reminder: TodayReminderItem?, isSignedIn: Bool) {
        var snapshot = SkinSnapshot()
        snapshot.updatedAt = Date()
        snapshot.isSignedIn = isSignedIn

        let insight = dashboard.skinInsight
        snapshot.overallScore = insight?.today?.overallScore
        snapshot.overallChange = insight?.changes?.previous?.overallScoreChange
        snapshot.rednessChange = insight?.changes?.previous?.rednessScoreChange
        snapshot.troubleChange = insight?.changes?.previous?.troubleScoreChange
        snapshot.toneChange = insight?.changes?.previous?.toneUniformityScoreChange
        snapshot.summary = insight?.summary

        if let goal = dashboard.goal {
            snapshot.goalTitle = goal.title
            snapshot.goalDayLabel = goal.dayLabel
            snapshot.goalDaysRemaining = goal.daysRemaining.map(Int.init)
            snapshot.goalConcern = goal.targetConcern?.label
        }

        if let active = dashboard.activeExperiment, let experiment = active.experiment {
            snapshot.experimentTitle = experiment.title ?? experiment.experimentType?.label
            snapshot.experimentEmoji = experiment.experimentType?.emoji
            snapshot.experimentCurrentDay = active.progress?.currentDay
            snapshot.experimentTotalDays = experiment.durationDays
            snapshot.experimentRate = active.progress?.completionRate
        }

        snapshot.environmentRisks = (dashboard.environment?.risks ?? []).compactMap(\.message)
        snapshot.reminderTitle = reminder?.title
        snapshot.reminderTime = ServerDate.parse(reminder?.scheduledAt).map {
            $0.formatted(date: .omitted, time: .shortened)
        }

        store(snapshot)
    }

    /// 로그아웃 시 위젯을 비운다.
    func publishSignedOut() {
        store(.signedOut)
    }

    private func store(_ snapshot: SkinSnapshot) {
        SharedStore.save(snapshot)
        WidgetCenter.shared.reloadAllTimelines()
        sendToWatch(snapshot)
    }

    /// 세션 활성화 전에 발행된 값은 보관했다가 활성화 직후 보낸다.
    private func sendToWatch(_ snapshot: SkinSnapshot) {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default

        guard session.activationState == .activated else {
            pendingSnapshot = snapshot
            if session.activationState == .notActivated { session.activate() }
            return
        }
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        try? session.updateApplicationContext(["snapshot": data])
        if session.isReachable {
            session.sendMessage(["snapshot": data], replyHandler: nil, errorHandler: nil)
        }
    }
}

extension SnapshotPublisher: WCSessionDelegate {
    nonisolated func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
        guard state == .activated else { return }
        Task { @MainActor in
            let snapshot = self.pendingSnapshot ?? SharedStore.load()
            guard let snapshot else { return }
            self.pendingSnapshot = nil
            self.sendToWatchAfterActivation(snapshot)
        }
    }

    @MainActor
    private func sendToWatchAfterActivation(_ snapshot: SkinSnapshot) {
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        try? WCSession.default.updateApplicationContext(["snapshot": data])
    }
    nonisolated func sessionDidBecomeInactive(_ session: WCSession) {}
    nonisolated func sessionDidDeactivate(_ session: WCSession) { session.activate() }

    /// 워치가 최신 값을 요청하면 저장된 스냅샷을 돌려준다.
    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any],
                             replyHandler: @escaping ([String: Any]) -> Void) {
        guard let snapshot = SharedStore.load(), let data = try? JSONEncoder().encode(snapshot) else {
            replyHandler([:])
            return
        }
        replyHandler(["snapshot": data])
    }
}
