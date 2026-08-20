import SwiftUI

@MainActor
final class WearableViewModel: ObservableObject {
    @Published var snapshot = HealthKitService.Snapshot()
    @Published var isConnected = false
    @Published var isWorking = false
    @Published var message: String?
    @Published var syncedToServer = false

    private let health = HealthKitService.shared

    var isAvailable: Bool { health.isAvailable }

    func load() async {
        guard health.isAvailable else { return }
        snapshot = await health.snapshot()
        isConnected = !snapshot.isEmpty
    }

    func connect() async {
        isWorking = true
        message = nil
        defer { isWorking = false }
        do {
            try await health.requestAuthorization()
            snapshot = await health.snapshot()
            isConnected = !snapshot.isEmpty
            if snapshot.isEmpty {
                message = "권한은 요청했지만 읽어올 데이터가 없어요. 건강 앱에 Apple Watch 데이터가 있는지 확인해주세요."
            }
        } catch {
            message = (error as? HealthKitService.HealthError)?.errorDescription ?? error.localizedDescription
        }
    }

    /// 워치가 기록한 수면을 서버 생활 기록으로 보낸다. (sourceType: WEARABLE)
    func syncSleepToServer() async {
        guard let minutes = snapshot.sleepMinutes else {
            message = "동기화할 수면 데이터가 없어요."
            return
        }
        isWorking = true
        message = nil
        defer { isWorking = false }

        let date = ServerDate.today
        let existing = try? await SkinSenseAPI.lifestyleRecord(date: date)
        let body = LifestyleRecordRequest(
            recordDate: date,
            sleepDurationMinutes: minutes,
            bedtime: snapshot.bedtime.map { LifestyleEditSheet.timeString($0) } ?? existing?.bedtime,
            wakeUpTime: snapshot.wakeUpTime.map { LifestyleEditSheet.timeString($0) } ?? existing?.wakeUpTime,
            lateNightMeal: existing?.lateNightMeal,
            waterIntakeMl: existing?.waterIntakeMl,
            sourceType: .wearable
        )
        do {
            if existing != nil {
                _ = try await SkinSenseAPI.updateLifestyleRecord(date: date, body)
            } else {
                _ = try await SkinSenseAPI.createLifestyleRecord(body)
            }
            syncedToServer = true
            message = "수면 \(minutes / 60)시간 \(minutes % 60)분을 생활 기록에 저장했어요."
        } catch {
            message = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }
}

/// 피그마 "마이 - 웨어러블"(43:6444)
/// Apple Watch → HealthKit → 앱 순으로 읽으며, 워치 전용 앱은 필요하지 않다.
struct WearableView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = WearableViewModel()

    private let watchTint = Color(hex: 0x7C5CFC)

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: Theme.s(17), weight: .semibold))
                        .foregroundStyle(Theme.textInk)
                        .frame(width: Theme.s(32), height: Theme.s(32))
                }
                .buttonStyle(.plain)
                Spacer()
                Text("웨어러블 기기").font(.inter(.bold, 16)).foregroundStyle(Theme.textInk)
                Spacer()
                Color.clear.frame(width: Theme.s(32), height: Theme.s(32))
            }
            .frame(height: Theme.s(56))
            .padding(.horizontal, Theme.s(20))

            ScrollView {
                VStack(spacing: Theme.s(20)) {
                    connectedPanel

                    if let message = viewModel.message {
                        Text(message)
                            .font(.inter(.regular, 11))
                            .foregroundStyle(viewModel.syncedToServer ? Theme.success : Theme.textGray)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    VStack(alignment: .leading, spacing: Theme.s(12)) {
                        Text("가져온 라이프스타일 데이터")
                            .font(.inter(.bold, 14))
                            .foregroundStyle(Theme.textInk)
                            .frame(maxWidth: .infinity, alignment: .leading)

                        dataCard(icon: "flame.fill", label: "활동 소모 칼로리",
                                 value: viewModel.snapshot.activeEnergy.map { "\($0) kcal" },
                                 tag: viewModel.snapshot.activeEnergy == nil ? "데이터 없음" : "읽음",
                                 note: "서버 저장 필드 없음")
                        dataCard(icon: "waveform.path.ecg", label: "평균 심박수",
                                 value: viewModel.snapshot.restingHeartRate.map { "\($0) bpm" },
                                 tag: viewModel.snapshot.restingHeartRate == nil ? "데이터 없음" : "읽음",
                                 note: "서버 저장 필드 없음")
                        dataCard(icon: "moon.fill", label: "수면 시간",
                                 value: viewModel.snapshot.sleepMinutes.map { "\($0 / 60)시간 \($0 % 60)분" },
                                 tag: viewModel.snapshot.sleepMinutes == nil ? "데이터 없음" : "읽음",
                                 note: "생활 기록으로 저장 가능")
                        dataCard(icon: "heart.fill", label: "심박변이도 (HRV)",
                                 value: viewModel.snapshot.heartRateVariability.map { "\($0) ms" },
                                 tag: viewModel.snapshot.heartRateVariability == nil ? "데이터 없음" : "읽음",
                                 note: "서버 저장 필드 없음")
                        dataCard(icon: "figure.walk", label: "걸음 수",
                                 value: viewModel.snapshot.steps.map { "\($0)" },
                                 tag: viewModel.snapshot.steps == nil ? "데이터 없음" : "읽음",
                                 note: "서버 저장 필드 없음")
                    }

                    if viewModel.snapshot.sleepMinutes != nil {
                        PrimaryButton(title: "수면 데이터를 생활 기록에 저장",
                                      isEnabled: !viewModel.isWorking,
                                      isLoading: viewModel.isWorking,
                                      height: Theme.s(46)) {
                            Task { await viewModel.syncSleepToServer() }
                        }
                    }

                    Text("칼로리·심박·HRV·걸음 수는 백엔드 생활 기록에 대응 필드가 없어 화면에서만 보여줍니다. "
                         + "수면만 sourceType=WEARABLE 로 저장됩니다.")
                        .font(.inter(.regular, 10))
                        .foregroundStyle(Theme.textTertiary)
                }
                .padding(.horizontal, Theme.s(20))
                .padding(.bottom, Theme.s(40))
            }
        }
        .background(Theme.background.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task { await viewModel.load() }
    }

    private var connectedPanel: some View {
        VStack(spacing: Theme.s(14)) {
            HStack(spacing: Theme.s(14)) {
                RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous)
                    .fill(watchTint.opacity(0.08))
                    .frame(width: Theme.s(48), height: Theme.s(48))
                    .overlay(
                        Image(systemName: "applewatch")
                            .font(.system(size: Theme.s(22)))
                            .foregroundStyle(watchTint)
                    )

                VStack(alignment: .leading, spacing: Theme.s(2)) {
                    Text(viewModel.isConnected ? "연동됨" : (viewModel.isAvailable ? "연동 전" : "사용 불가"))
                        .font(.inter(.bold, 11))
                        .foregroundStyle(viewModel.isConnected ? watchTint : Theme.textGray)
                    Text("Apple Watch · 건강 앱")
                        .font(.inter(.bold, 15))
                        .foregroundStyle(Theme.textInk)
                }

                Spacer()

                Text(viewModel.isConnected ? "읽는 중" : "미연결")
                    .font(.inter(.bold, 11))
                    .foregroundStyle(viewModel.isConnected ? Theme.success : Theme.textGray)
                    .padding(.horizontal, Theme.s(10))
                    .padding(.vertical, Theme.s(4))
                    .background(viewModel.isConnected ? Color(hex: 0xE6FBF3) : Color(hex: 0xF5F6FA))
                    .clipShape(RoundedRectangle(cornerRadius: Theme.s(6), style: .continuous))
            }

            if !viewModel.isConnected {
                PrimaryButton(title: viewModel.isAvailable ? "건강 데이터 연동하기" : "이 기기에서는 사용할 수 없어요",
                              isEnabled: viewModel.isAvailable && !viewModel.isWorking,
                              isLoading: viewModel.isWorking,
                              height: Theme.s(44)) {
                    Task { await viewModel.connect() }
                }
                Text("Apple Watch가 건강 앱에 기록한 수면·심박·활동 데이터를 읽습니다. 워치 전용 앱 설치는 필요 없어요.")
                    .font(.inter(.regular, 10))
                    .foregroundStyle(Theme.textTertiary)
            }
        }
        .padding(Theme.s(18))
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusLargeCard, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.radiusLargeCard, style: .continuous)
                .stroke(Color(hex: 0xF1F2FF), lineWidth: 1)
        )
    }

    private func dataCard(icon: String, label: String, value: String?, tag: String, note: String) -> some View {
        VStack(alignment: .leading, spacing: Theme.s(12)) {
            HStack {
                Circle()
                    .fill(watchTint.opacity(0.08))
                    .frame(width: Theme.s(32), height: Theme.s(32))
                    .overlay(
                        Image(systemName: icon)
                            .font(.system(size: Theme.s(14)))
                            .foregroundStyle(watchTint)
                    )
                Spacer()
                Text(tag)
                    .font(.inter(.bold, 11))
                    .foregroundStyle(value == nil ? Theme.textTertiary : Theme.success)
                    .padding(.horizontal, Theme.s(8))
                    .padding(.vertical, Theme.s(3))
                    .background(Color(hex: 0xF5F6FA))
                    .clipShape(RoundedRectangle(cornerRadius: Theme.s(4), style: .continuous))
            }

            VStack(alignment: .leading, spacing: Theme.s(2)) {
                Text(label)
                    .font(.inter(.regular, 12))
                    .foregroundStyle(Color(hex: 0x6C6E7E))
                Text(value ?? "—")
                    .font(.inter(.bold, 18))
                    .foregroundStyle(value == nil ? Theme.textTertiary : Theme.textInk)
                Text(note)
                    .font(.inter(.regular, 9))
                    .foregroundStyle(Theme.textTertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.s(16))
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusCard, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.radiusCard, style: .continuous)
                .stroke(Color(hex: 0xF1F2FF), lineWidth: 1)
        )
    }
}

#Preview {
    NavigationStack { WearableView() }
}
