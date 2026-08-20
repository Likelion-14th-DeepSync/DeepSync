import Foundation
import HealthKit

/// Apple Watch가 HealthKit에 기록한 데이터를 읽어온다.
///
/// 워치 전용 앱(watchOS 타깃)은 필요하지 않다. 워치가 iPhone의 HealthKit에 데이터를 쓰고
/// 앱은 그 저장소를 읽는 구조다.
@MainActor
final class HealthKitService: ObservableObject {
    static let shared = HealthKitService()

    struct Snapshot {
        var sleepMinutes: Int?
        var bedtime: Date?
        var wakeUpTime: Date?
        var restingHeartRate: Int?
        var heartRateVariability: Int?      // SDNN (ms)
        var activeEnergy: Int?              // kcal
        var steps: Int?

        var isEmpty: Bool {
            sleepMinutes == nil && restingHeartRate == nil && heartRateVariability == nil
                && activeEnergy == nil && steps == nil
        }
    }

    enum HealthError: LocalizedError {
        case unavailable
        case denied

        var errorDescription: String? {
            switch self {
            case .unavailable: return "이 기기에서는 건강 데이터를 사용할 수 없어요."
            case .denied: return "건강 앱에서 SkinSense의 읽기 권한을 켜주세요."
            }
        }
    }

    @Published private(set) var didRequestAuthorization = false

    private let store = HKHealthStore()

    var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    private var readTypes: Set<HKObjectType> {
        var types: Set<HKObjectType> = []
        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { types.insert(sleep) }
        if let hrv = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) { types.insert(hrv) }
        if let resting = HKObjectType.quantityType(forIdentifier: .restingHeartRate) { types.insert(resting) }
        if let energy = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) { types.insert(energy) }
        if let steps = HKObjectType.quantityType(forIdentifier: .stepCount) { types.insert(steps) }
        return types
    }

    /// 읽기 권한을 요청한다. HealthKit은 읽기 허용 여부를 앱에 알려주지 않으므로
    /// 실제 연동 여부는 데이터를 읽어봐야 알 수 있다.
    func requestAuthorization() async throws {
        guard isAvailable else { throw HealthError.unavailable }
        try await store.requestAuthorization(toShare: [], read: readTypes)
        didRequestAuthorization = true
    }

    /// 지정한 날짜(기본: 오늘)의 요약을 읽는다.
    func snapshot(for date: Date = Date()) async -> Snapshot {
        guard isAvailable else { return Snapshot() }

        var snapshot = Snapshot()
        let calendar = Calendar.current
        let dayStart = calendar.startOfDay(for: date)
        let dayEnd = calendar.date(byAdding: .day, value: 1, to: dayStart) ?? date

        // 수면은 전날 저녁부터 당일 정오까지 구간에서 실제 수면 샘플만 합산한다.
        let sleepStart = calendar.date(byAdding: .hour, value: -6, to: dayStart) ?? dayStart
        let sleepEnd = calendar.date(byAdding: .hour, value: 12, to: dayStart) ?? dayEnd
        if let sleep = await sleepSummary(from: sleepStart, to: sleepEnd) {
            snapshot.sleepMinutes = sleep.minutes
            snapshot.bedtime = sleep.start
            snapshot.wakeUpTime = sleep.end
        }

        snapshot.restingHeartRate = await averageQuantity(
            .restingHeartRate, unit: HKUnit.count().unitDivided(by: .minute()), from: dayStart, to: dayEnd
        ).map { Int($0.rounded()) }

        snapshot.heartRateVariability = await averageQuantity(
            .heartRateVariabilitySDNN, unit: .secondUnit(with: .milli), from: dayStart, to: dayEnd
        ).map { Int($0.rounded()) }

        snapshot.activeEnergy = await sumQuantity(
            .activeEnergyBurned, unit: .kilocalorie(), from: dayStart, to: dayEnd
        ).map { Int($0.rounded()) }

        snapshot.steps = await sumQuantity(
            .stepCount, unit: .count(), from: dayStart, to: dayEnd
        ).map { Int($0.rounded()) }

        return snapshot
    }

    // MARK: 내부 조회

    private struct SleepSummary {
        let minutes: Int
        let start: Date
        let end: Date
    }

    private func sleepSummary(from: Date, to: Date) async -> SleepSummary? {
        guard let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return nil }
        let samples: [HKCategorySample] = await withCheckedContinuation { continuation in
            let predicate = HKQuery.predicateForSamples(withStart: from, end: to, options: .strictStartDate)
            let query = HKSampleQuery(sampleType: type, predicate: predicate,
                                      limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, results, _ in
                continuation.resume(returning: (results as? [HKCategorySample]) ?? [])
            }
            store.execute(query)
        }

        let asleep = samples.filter { sample in
            guard let value = HKCategoryValueSleepAnalysis(rawValue: sample.value) else { return false }
            switch value {
            case .asleepUnspecified, .asleepCore, .asleepDeep, .asleepREM: return true
            default: return false
            }
        }
        guard !asleep.isEmpty else { return nil }

        let seconds = asleep.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
        let start = asleep.map(\.startDate).min() ?? from
        let end = asleep.map(\.endDate).max() ?? to
        return SleepSummary(minutes: Int(seconds / 60), start: start, end: end)
    }

    private func averageQuantity(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit,
                                 from: Date, to: Date) async -> Double? {
        await statistic(identifier, unit: unit, from: from, to: to, options: .discreteAverage) {
            $0.averageQuantity()
        }
    }

    private func sumQuantity(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit,
                             from: Date, to: Date) async -> Double? {
        await statistic(identifier, unit: unit, from: from, to: to, options: .cumulativeSum) {
            $0.sumQuantity()
        }
    }

    private func statistic(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit,
                           from: Date, to: Date, options: HKStatisticsOptions,
                           pick: @escaping (HKStatistics) -> HKQuantity?) async -> Double? {
        guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return nil }
        return await withCheckedContinuation { continuation in
            let predicate = HKQuery.predicateForSamples(withStart: from, end: to, options: .strictStartDate)
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate,
                                          options: options) { _, statistics, _ in
                guard let statistics, let quantity = pick(statistics) else {
                    continuation.resume(returning: nil)
                    return
                }
                continuation.resume(returning: quantity.doubleValue(for: unit))
            }
            store.execute(query)
        }
    }
}
