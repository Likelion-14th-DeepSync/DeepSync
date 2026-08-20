import Foundation

@MainActor
final class RecordViewModel: ObservableObject {
    enum Tab: Hashable { case calendar, photo, change }

    @Published var tab: Tab = {
        #if DEBUG
        switch ProcessInfo.processInfo.environment["DEV_RECORD_TAB"] {
        case "photo": return .photo
        case "change": return .change
        default: return .calendar
        }
        #else
        return .calendar
        #endif
    }()
    @Published var month: Date = Date()
    @Published var selectedDate: Date = Date()

    @Published var analyses: [SkinAnalysis] = []
    @Published var images: [SkinImage] = []
    @Published var lifestyle: LoadState<LifestyleRecord> = .loading
    @Published var environment: LoadState<EnvironmentRecord> = .loading
    @Published var dayAnalysis: SkinAnalysis?
    @Published var dayInsight: DailySkinInsight?
    @Published var factors: LoadState<[PersonalFactorAnalysis]> = .loading
    @Published var timeline: SkinAnalysisTimeline?
    @Published var confidence: AnalysisConfidence?
    @Published var errorMessage: String?
    @Published var isLoading = false

    private var calendar: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.firstWeekday = 2  // 월요일 시작 (피그마 월~일)
        return c
    }

    var selectedDateString: String { ServerDate.dateString(selectedDate) }

    // MARK: 달력 계산

    var monthTitle: String {
        let comps = calendar.dateComponents([.year, .month], from: month)
        return "\(comps.year ?? 0)년 \(comps.month ?? 0)월"
    }

    /// 월요일 시작 6주 그리드 (앞뒤 달 포함)
    var monthGrid: [Date] {
        guard let first = calendar.date(from: calendar.dateComponents([.year, .month], from: month)),
              let range = calendar.range(of: .day, in: .month, for: first) else { return [] }
        let weekdayOfFirst = calendar.component(.weekday, from: first)   // 1=일
        let leading = (weekdayOfFirst - calendar.firstWeekday + 7) % 7
        let start = calendar.date(byAdding: .day, value: -leading, to: first) ?? first
        let total = Int(ceil(Double(leading + range.count) / 7.0)) * 7
        return (0..<total).compactMap { calendar.date(byAdding: .day, value: $0, to: start) }
    }

    func isInDisplayedMonth(_ date: Date) -> Bool {
        calendar.isDate(date, equalTo: month, toGranularity: .month)
    }

    func isSunday(_ date: Date) -> Bool { calendar.component(.weekday, from: date) == 1 }
    func isToday(_ date: Date) -> Bool { calendar.isDateInToday(date) }
    func isSelected(_ date: Date) -> Bool { calendar.isDate(date, inSameDayAs: selectedDate) }

    func score(on date: Date) -> Int? {
        let key = ServerDate.dateString(date)
        return analyses.first {
            guard let captured = ServerDate.parse($0.capturedAt) else { return false }
            return ServerDate.dateString(captured) == key
        }?.overallScore
    }

    func shiftMonth(_ delta: Int) {
        month = calendar.date(byAdding: .month, value: delta, to: month) ?? month
        Task { await loadMonth() }
    }

    // MARK: 로딩

    func loadAll() async {
        isLoading = true
        defer { isLoading = false }
        async let a: Void = loadMonth()
        async let b: Void = loadDay()
        async let c: Void = loadFactors()
        async let d: Void = loadTimeline()
        _ = await (a, b, c, d)
    }

    func loadMonth() async {
        guard let first = calendar.date(from: calendar.dateComponents([.year, .month], from: month)),
              let range = calendar.range(of: .day, in: .month, for: first),
              let last = calendar.date(byAdding: .day, value: range.count - 1, to: first) else { return }
        let from = ServerDate.dateString(first)
        let to = ServerDate.dateString(last)
        analyses = (try? await SkinSenseAPI.analyses(from: from, to: to)) ?? []
        images = (try? await SkinSenseAPI.skinImages(from: from, to: to)) ?? []
    }

    func loadDay() async {
        let date = selectedDateString
        do { lifestyle = .loaded(try await SkinSenseAPI.lifestyleRecord(date: date)) }
        catch { lifestyle = .from(error) }
        do { environment = .loaded(try await SkinSenseAPI.environmentRecord(date: date)) }
        catch { environment = .from(error) }

        dayAnalysis = analyses.first {
            guard let captured = ServerDate.parse($0.capturedAt) else { return false }
            return ServerDate.dateString(captured) == date
        }
        // 선택한 날짜의 인사이트 (연관 요인·요약)
        dayInsight = dayAnalysis == nil ? nil : try? await SkinSenseAPI.dailyInsight(date: date)
    }

    func loadFactors() async {
        do { factors = .loaded(try await SkinSenseAPI.personalFactors()) }
        catch { factors = .from(error) }
    }

    func loadTimeline() async {
        timeline = try? await SkinSenseAPI.timeline(period: .sevenDays)
        confidence = try? await SkinSenseAPI.confidence()
    }

    /// 요인·신뢰도를 서버에서 다시 계산한다.
    func recalculate() async {
        factors = .loading
        errorMessage = nil
        do { factors = .loaded(try await SkinSenseAPI.recalculateFactors()) }
        catch { factors = .from(error) }
        confidence = try? await SkinSenseAPI.recalculateConfidence()
    }

    func select(_ date: Date) {
        selectedDate = date
        Task { await loadDay() }
    }

    // MARK: 저장

    func saveLifestyle(_ body: LifestyleRecordRequest) async {
        errorMessage = nil
        do {
            lifestyle = .loaded(lifestyle.value != nil
                ? try await SkinSenseAPI.updateLifestyleRecord(date: body.recordDate, body)
                : try await SkinSenseAPI.createLifestyleRecord(body))
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    func saveEnvironment(_ body: EnvironmentRecordRequest) async {
        errorMessage = nil
        do {
            environment = .loaded(environment.value != nil
                ? try await SkinSenseAPI.updateEnvironmentRecord(date: body.recordDate, body)
                : try await SkinSenseAPI.createEnvironmentRecord(body))
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    /// 7일 기준 지표 변화 (첫 분석 대비 최신 분석)
    var metricChanges: [(SkinMetric, Int?)] {
        let sorted = (timeline?.analyses ?? []).sorted {
            (ServerDate.parse($0.capturedAt) ?? .distantPast) < (ServerDate.parse($1.capturedAt) ?? .distantPast)
        }
        guard let first = sorted.first, let last = sorted.last, sorted.count >= 2 else {
            return [(.redness, nil), (.trouble, nil), (.toneUniformity, nil)]
        }
        func diff(_ a: Int?, _ b: Int?) -> Int? {
            guard let a, let b else { return nil }
            return b - a
        }
        return [
            (.redness, diff(first.rednessScore, last.rednessScore)),
            (.trouble, diff(first.troubleScore, last.troubleScore)),
            (.toneUniformity, diff(first.toneUniformityScore, last.toneUniformityScore))
        ]
    }
}
