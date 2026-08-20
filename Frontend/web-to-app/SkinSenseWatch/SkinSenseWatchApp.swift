import SwiftUI

@main
struct SkinSenseWatchApp: App {
    @StateObject private var connectivity = WatchConnectivityService.shared

    var body: some Scene {
        WindowGroup {
            WatchRootView()
                .environmentObject(connectivity)
        }
    }
}
