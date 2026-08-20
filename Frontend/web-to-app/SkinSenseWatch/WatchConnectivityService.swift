import Foundation
import WatchConnectivity

/// iPhone이 보내는 요약 스냅샷을 받아 보관한다.
final class WatchConnectivityService: NSObject, ObservableObject {
    static let shared = WatchConnectivityService()

    @Published private(set) var snapshot: SkinSnapshot
    @Published private(set) var isReachable = false

    private override init() {
        snapshot = SharedStore.load() ?? SkinSnapshot()
        #if DEBUG
        // 시뮬레이터 화면 확인용: DEV_SNAPSHOT=demo 로 플레이스홀더 데이터를 그린다.
        if ProcessInfo.processInfo.environment["DEV_SNAPSHOT"] == "demo" {
            snapshot = .placeholder
        }
        #endif
        super.init()
        activate()
    }

    func activate() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    /// iPhone에 최신 데이터를 요청한다.
    func requestRefresh() {
        guard WCSession.default.activationState == .activated else { return }
        WCSession.default.sendMessage(["request": "snapshot"], replyHandler: { [weak self] reply in
            self?.apply(reply)
        }, errorHandler: { _ in })
    }

    private func apply(_ payload: [String: Any]) {
        guard let data = payload["snapshot"] as? Data,
              let decoded = try? JSONDecoder().decode(SkinSnapshot.self, from: data) else { return }
        DispatchQueue.main.async {
            self.snapshot = decoded
            SharedStore.save(decoded)
        }
    }
}

extension WatchConnectivityService: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async { self.isReachable = session.isReachable }
        if let context = session.receivedApplicationContext as [String: Any]?, !context.isEmpty {
            apply(context)
        }
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        apply(applicationContext)
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        apply(message)
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async { self.isReachable = session.isReachable }
    }
}
