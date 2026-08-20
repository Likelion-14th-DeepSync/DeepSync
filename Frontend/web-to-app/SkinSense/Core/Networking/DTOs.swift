import Foundation

// MARK: - 공통 열거형

enum SkinConcern: String, Codable, CaseIterable, Identifiable {
    case trouble = "TROUBLE"
    case redness = "REDNESS"
    case dryness = "DRYNESS"
    case skinTone = "SKIN_TONE"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .trouble: return "트러블"
        case .redness: return "홍조"
        case .dryness: return "건조함"
        case .skinTone: return "피부톤"
        }
    }
}

enum SkinMetric: String, Codable {
    case redness = "REDNESS"
    case trouble = "TROUBLE"
    case dryness = "DRYNESS"
    case toneUniformity = "TONE_UNIFORMITY"
    case overall = "OVERALL"

    var label: String {
        switch self {
        case .redness: return "홍조"
        case .trouble: return "트러블"
        case .dryness: return "건조함"
        case .toneUniformity: return "톤 균일도"
        case .overall: return "종합"
        }
    }

    var icon: String {
        switch self {
        case .redness: return "heart.fill"
        case .trouble: return "circle.grid.3x3.fill"
        case .dryness: return "drop.fill"
        case .toneUniformity: return "sun.max.fill"
        case .overall: return "sparkles"
        }
    }
}

enum LifestyleFactor: String, Codable, Identifiable {
    var id: String { rawValue }

    case shortSleep = "SHORT_SLEEP"
    case lateBedtime = "LATE_BEDTIME"
    case lateNightMeal = "LATE_NIGHT_MEAL"
    case lowWaterIntake = "LOW_WATER_INTAKE"
    case highUV = "HIGH_UV"
    case lowHumidity = "LOW_HUMIDITY"
    case highFineDust = "HIGH_FINE_DUST"
    case highTemperature = "HIGH_TEMPERATURE"
    case lowTemperature = "LOW_TEMPERATURE"

    var label: String {
        switch self {
        case .shortSleep: return "수면 부족"
        case .lateBedtime: return "늦은 취침"
        case .lateNightMeal: return "야식"
        case .lowWaterIntake: return "수분 부족"
        case .highUV: return "높은 자외선"
        case .lowHumidity: return "낮은 습도"
        case .highFineDust: return "미세먼지"
        case .highTemperature: return "높은 기온"
        case .lowTemperature: return "낮은 기온"
        }
    }

    var icon: String {
        switch self {
        case .shortSleep, .lateBedtime: return "bed.double.fill"
        case .lateNightMeal: return "fork.knife"
        case .lowWaterIntake: return "drop.fill"
        case .highUV: return "sun.max.fill"
        case .lowHumidity: return "humidity.fill"
        case .highFineDust: return "aqi.medium"
        case .highTemperature: return "thermometer.sun.fill"
        case .lowTemperature: return "thermometer.snowflake"
        }
    }
}

enum ConfidenceLevel: String, Codable {
    case low = "LOW"
    case medium = "MEDIUM"
    case high = "HIGH"

    var label: String {
        switch self {
        case .low: return "낮음"
        case .medium: return "보통"
        case .high: return "높음"
        }
    }
}

enum TimelinePeriod: String, Codable, CaseIterable, Identifiable {
    case sevenDays = "SEVEN_DAYS"
    case thirtyDays = "THIRTY_DAYS"
    case ninetyDays = "NINETY_DAYS"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .sevenDays: return "7일"
        case .thirtyDays: return "30일"
        case .ninetyDays: return "90일"
        }
    }
}

enum RecordSource: String, Codable {
    case manual = "MANUAL"
    case wearable = "WEARABLE"
    case weatherAPI = "WEATHER_API"
    case sample = "SAMPLE"
}

// MARK: - 인증 / 회원

/// 서버 Member.SkinType 과 동일
enum ServerSkinType: String, Codable, CaseIterable {
    case dry = "DRY"
    case oily = "OILY"
    case combination = "COMBINATION"
    case sensitive = "SENSITIVE"
    case unknown = "UNKNOWN"

    var label: String {
        switch self {
        case .dry: return "건성"
        case .oily: return "지성"
        case .combination: return "복합성"
        case .sensitive: return "민감성"
        case .unknown: return "미설정"
        }
    }

    init(koreanLabel: String) {
        switch koreanLabel {
        case "건성": self = .dry
        case "지성": self = .oily
        case "복합성": self = .combination
        case "민감성": self = .sensitive
        default: self = .unknown
        }
    }
}

struct SignUpRequest: Encodable {
    let email: String
    let password: String
    let nickname: String
    let skinConcerns: [SkinConcern]
    /// 백엔드 main 반영(#31). 구버전 배포 서버는 이 필드를 무시한다.
    let skinType: ServerSkinType
}

struct SignUpResponse: Decodable {
    let memberId: Int64?
    let email: String?
    let nickname: String?
}

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct LoginResponse: Decodable {
    let accessToken: String
    let tokenType: String?
    let expiresIn: Int64?
}

struct MemberProfile: Decodable {
    let memberId: Int64?
    let email: String?
    let nickname: String?
    let skinConcerns: [SkinConcern]?
}

struct UpdateMemberProfileRequest: Encodable {
    let nickname: String
    let skinConcerns: [SkinConcern]
}

// MARK: - 피부 목표 (Skin D-Day)

enum SkinGoalStatus: String, Codable {
    case active = "ACTIVE"
    case completed = "COMPLETED"
    case cancelled = "CANCELLED"

    var label: String {
        switch self {
        case .active: return "진행 중"
        case .completed: return "완료"
        case .cancelled: return "취소됨"
        }
    }
}

struct SkinGoal: Decodable, Identifiable {
    let goalId: Int64
    let title: String?
    let targetDate: String?
    let daysRemaining: Int64?
    let dayLabel: String?
    let targetConcern: SkinConcern?
    let targetDescription: String?
    let status: SkinGoalStatus?

    var id: Int64 { goalId }
    var targetDateValue: Date? { ServerDate.parse(targetDate) }
}

struct SkinGoalRequest: Encodable {
    let title: String
    let targetDate: String
    let targetConcern: SkinConcern
    let targetDescription: String?
}

// MARK: - 생활 / 환경 기록

struct LifestyleRecord: Decodable {
    let recordId: Int64?
    let recordDate: String?
    let sleepDurationMinutes: Int?
    let bedtime: String?
    let wakeUpTime: String?
    let lateNightMeal: Bool?
    let waterIntakeMl: Int?
    let sourceType: RecordSource?

    var recordDateValue: Date? { ServerDate.parse(recordDate) }
    var sleepHours: Double? {
        guard let sleepDurationMinutes else { return nil }
        return Double(sleepDurationMinutes) / 60
    }
}

struct LifestyleRecordRequest: Encodable {
    let recordDate: String
    let sleepDurationMinutes: Int?
    let bedtime: String?
    let wakeUpTime: String?
    let lateNightMeal: Bool?
    let waterIntakeMl: Int?
    let sourceType: RecordSource
}

struct EnvironmentRecord: Decodable {
    let recordId: Int64?
    let recordDate: String?
    let uvIndex: Double?
    let temperature: Double?
    let humidity: Int?
    let fineDust: Int?
    let sourceType: RecordSource?
}

struct EnvironmentRecordRequest: Encodable {
    let recordDate: String
    let uvIndex: Double?
    let temperature: Double?
    let humidity: Int?
    let fineDust: Int?
    let sourceType: RecordSource
}

// MARK: - 피부 사진

enum CaptureDirection: String, Codable {
    case front = "FRONT"
    case left = "LEFT"
    case right = "RIGHT"
}

enum ImageQualityStatus: String, Codable {
    case pending = "PENDING"
    case passed = "PASSED"
    case retakeRecommended = "RETAKE_RECOMMENDED"
    case rejected = "REJECTED"

    var label: String {
        switch self {
        case .pending: return "검사 대기"
        case .passed: return "통과"
        case .retakeRecommended: return "재촬영 권장"
        case .rejected: return "사용 불가"
        }
    }
}

struct SkinImageUploadRequest: Encodable {
    let capturedAt: String
    let direction: CaptureDirection
    let makeupApplied: Bool
}

struct SkinImage: Decodable, Identifiable {
    let imageId: Int64
    let imageUrl: String?
    let capturedAt: String?
    let direction: CaptureDirection?
    let makeupApplied: Bool?
    let contentType: String?
    let fileSize: Int64?
    let qualityStatus: ImageQualityStatus?
    let createdAt: String?

    var id: Int64 { imageId }
}

struct SkinImageQuality: Decodable {
    let qualityResultId: Int64?
    let imageId: Int64?
    let resolutionScore: Int?
    let lightingScore: Int?
    let lightingUniformityScore: Int?
    let sharpnessScore: Int?
    let overallScore: Int?
    let qualityStatus: ImageQualityStatus?
    let messages: [String]?
    let modelVersion: String?
    let analyzedAt: String?
}

// MARK: - 피부 분석

enum SkinAnalysisStatus: String, Codable {
    case pending = "PENDING"
    case processing = "PROCESSING"
    case completed = "COMPLETED"
    case failed = "FAILED"

    var label: String {
        switch self {
        case .pending: return "분석 대기 중"
        case .processing: return "분석 중"
        case .completed: return "분석 완료"
        case .failed: return "분석 실패"
        }
    }
}

struct SkinAnalysis: Decodable, Identifiable {
    let analysisId: Int64
    let imageId: Int64?
    let status: SkinAnalysisStatus?
    let rednessScore: Int?
    let troubleScore: Int?
    let drynessScore: Int?
    let toneUniformityScore: Int?
    let overallScore: Int?
    let confidenceScore: Int?
    let modelVersion: String?
    let failureReason: String?
    let capturedAt: String?
    let analyzedAt: String?
    let requestedAt: String?

    var id: Int64 { analysisId }

    var metricScores: [(SkinMetric, Int)] {
        [(.trouble, troubleScore), (.redness, rednessScore),
         (.dryness, drynessScore), (.toneUniformity, toneUniformityScore)]
            .compactMap { metric, score in score.map { (metric, $0) } }
    }

    /// 온디바이스 모델이 실제로 측정한 지표만. (건조함·톤 균일도는 모델이 없어 중립값이 저장된다)
    var measuredMetricScores: [(SkinMetric, Int)] {
        guard let modelVersion, modelVersion.hasPrefix("skinsense-coreml") else { return metricScores }
        return metricScores.filter { SkinVisionAnalyzer.measuredMetrics.contains($0.0) }
    }

    /// 모델이 아직 측정하지 못하는 지표 이름
    var unmeasuredMetricLabels: [String] {
        guard let modelVersion, modelVersion.hasPrefix("skinsense-coreml") else { return [] }
        return [SkinMetric.dryness, .toneUniformity].map(\.label)
    }
}

struct SkinAnalysisResultRequest: Encodable {
    let rednessScore: Int?
    let troubleScore: Int?
    let drynessScore: Int?
    let toneUniformityScore: Int?
    let overallScore: Int?
    let confidenceScore: Int?
    let modelVersion: String
}

struct SkinScoreSnapshot: Decodable, Identifiable {
    let analysisId: Int64?
    let rednessScore: Int?
    let troubleScore: Int?
    let drynessScore: Int?
    let toneUniformityScore: Int?
    let overallScore: Int?
    let capturedAt: String?

    var id: Int64 { analysisId ?? 0 }
    var capturedAtValue: Date? { ServerDate.parse(capturedAt) }
}

struct SkinScoreChange: Decodable {
    let comparedAnalysisId: Int64?
    let rednessScoreChange: Int?
    let troubleScoreChange: Int?
    let drynessScoreChange: Int?
    let toneUniformityScoreChange: Int?
    let overallScoreChange: Int?
}

struct SkinAnalysisTimeline: Decodable {
    let period: TimelinePeriod?
    let startDate: String?
    let endDate: String?
    let analysisCount: Int?
    let analyses: [SkinScoreSnapshot]?
}

// MARK: - 일일 인사이트

struct DailySkinSnapshot: Decodable {
    let analysisId: Int64?
    let imageId: Int64?
    let capturedAt: String?
    let overallScore: Int?
    let rednessScore: Int?
    let troubleScore: Int?
    let drynessScore: Int?
    let toneUniformityScore: Int?
    let modelConfidenceScore: Int?
}

enum ChangeDirection: String, Decodable {
    case improved = "IMPROVED"
    case unchanged = "UNCHANGED"
    case worsened = "WORSENED"
}

struct LargestSkinChange: Decodable {
    let metric: SkinMetric?
    let amount: Int?
    let direction: ChangeDirection?
}

struct DailySkinChanges: Decodable {
    let baseline: SkinScoreChange?
    let previous: SkinScoreChange?
    let largestChange: LargestSkinChange?
}

struct AssociatedFactor: Decodable, Identifiable {
    let factor: LifestyleFactor?
    let targetMetric: SkinMetric?
    let observedDifference: Double?
    let observationCount: Int?
    let confidenceLevel: ConfidenceLevel?
    let description: String?

    var id: String { (factor?.rawValue ?? "?") + "-" + (targetMetric?.rawValue ?? "?") }
}

struct InsightDataItem: Decodable, Identifiable {
    let type: String?
    let field: String?
    let date: String?
    let description: String?

    var id: String { (type ?? "") + (field ?? "") + (date ?? "") }
}

struct InsightDataUsage: Decodable {
    let usedData: [InsightDataItem]?
    let excludedData: [InsightDataItem]?
}

struct InsightConfidence: Decodable {
    let score: Int?
    let level: ConfidenceLevel?
    let calculatedAt: String?
}

struct DailySkinInsight: Decodable {
    let analysisDate: String?
    let today: DailySkinSnapshot?
    let changes: DailySkinChanges?
    let associatedFactors: [AssociatedFactor]?
    let dataUsage: InsightDataUsage?
    let confidence: InsightConfidence?
    let warnings: [String]?
    let summary: String?
    let notice: String?
}

// MARK: - 개인 요인 분석 / 신뢰도

enum FactorDirection: String, Decodable {
    case positive = "POSITIVE_ASSOCIATION"
    case negative = "NEGATIVE_ASSOCIATION"
    case noDifference = "NO_CLEAR_DIFFERENCE"
    case insufficient = "INSUFFICIENT_DATA"
}

struct FactorMetricAnalysis: Decodable {
    let targetMetric: SkinMetric?
    let status: String?
    let exposedAverage: Double?
    let normalAverage: Double?
    let observedDifference: Double?
    let exposedCount: Int?
    let normalCount: Int?
    let missingCount: Int?
    let averageModelConfidence: Double?
    let confidenceLevel: ConfidenceLevel?
    let direction: FactorDirection?
    let summary: String?
}

struct PersonalFactorAnalysis: Decodable, Identifiable {
    let factor: LifestyleFactor?
    let analyzedFrom: String?
    let analyzedTo: String?
    let calculatedAt: String?
    let metrics: [FactorMetricAnalysis]?
    let notice: String?

    var id: String { factor?.rawValue ?? UUID().uuidString }

    /// 화면에 대표로 보여줄 종합 지표
    var overallMetric: FactorMetricAnalysis? {
        metrics?.first { $0.targetMetric == .overall } ?? metrics?.first
    }
}

struct ConfidenceComponent: Decodable {
    let score: Int?
    let available: Bool?
    let detail: String?
}

struct ConfidenceComponents: Decodable {
    let imageQuality: ConfidenceComponent?
    let skinRecordCoverage: ConfidenceComponent?
    let lifestyleCompleteness: ConfidenceComponent?
    let environmentCompleteness: ConfidenceComponent?
    let repeatedObservations: ConfidenceComponent?
    let experimentEvidence: ConfidenceComponent?
    let modelConfidence: ConfidenceComponent?

    var labelled: [(String, ConfidenceComponent)] {
        [("사진 품질", imageQuality), ("피부 기록 충실도", skinRecordCoverage),
         ("생활 기록 충실도", lifestyleCompleteness), ("환경 기록 충실도", environmentCompleteness),
         ("반복 관측", repeatedObservations), ("실험 근거", experimentEvidence),
         ("모델 신뢰도", modelConfidence)]
            .compactMap { title, component in component.map { (title, $0) } }
    }
}

struct AnalysisConfidence: Decodable {
    let score: Int?
    let level: ConfidenceLevel?
    let analyzedFrom: String?
    let analyzedTo: String?
    let periodDays: Int?
    let components: ConfidenceComponents?
    let reasons: [String]?
    let nextActions: [String]?
    let calculatedAt: String?
}

// MARK: - 대시보드

struct EnvironmentRisk: Decodable, Identifiable {
    let type: String?
    let value: String?
    let message: String?

    var id: String { (type ?? "") + (value ?? "") }
}

struct DashboardEnvironment: Decodable {
    let available: Bool?
    let record: EnvironmentRecord?
    let risks: [EnvironmentRisk]?
}

struct DashboardRoutine: Decodable {
    let available: Bool?
    let status: String?
    let message: String?
}

struct DashboardExperiment: Decodable {
    let experiment: Experiment?
    let progress: ExperimentProgress?
}

struct DdayDashboard: Decodable {
    let dashboardDate: String?
    let goal: SkinGoal?
    let skinInsight: DailySkinInsight?
    let activeExperiment: DashboardExperiment?
    let environment: DashboardEnvironment?
    let timeline: SkinAnalysisTimeline?
    let confidence: AnalysisConfidence?
    let routine: DashboardRoutine?
    let warnings: [String]?
    let generatedAt: String?
}

// MARK: - 리마인더

struct TodayReminderItem: Decodable, Identifiable {
    let settingId: Int64?
    let type: String?
    let localDate: String?
    let scheduledAt: String?
    let status: String?
    let title: String?
    let description: String?
    let skipReason: String?

    var id: String { "\(settingId ?? 0)-\(type ?? "")" }
}

struct TodayReminders: Decodable {
    let reminders: [TodayReminderItem]?
    let message: String?
    let generatedAt: String?
}

// MARK: - 생활 실험

enum ExperimentType: String, Codable, CaseIterable, Identifiable {
    case sleepBeforeMidnight = "SLEEP_BEFORE_MIDNIGHT"
    case sleepAtLeast7Hours = "SLEEP_AT_LEAST_7_HOURS"
    case noLateNightMeal = "NO_LATE_NIGHT_MEAL"
    case waterAtLeast1500 = "WATER_AT_LEAST_1500_ML"
    case keepSunscreen = "KEEP_SUNSCREEN_ROUTINE"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .sleepBeforeMidnight: return "자정 전에 취침하기"
        case .sleepAtLeast7Hours: return "7시간 이상 수면"
        case .noLateNightMeal: return "야식 줄이기"
        case .waterAtLeast1500: return "물 1.5L 마시기"
        case .keepSunscreen: return "자외선 차단제 바르기"
        }
    }

    var emoji: String {
        switch self {
        case .sleepBeforeMidnight, .sleepAtLeast7Hours: return "🌙"
        case .noLateNightMeal: return "🍕"
        case .waterAtLeast1500: return "💧"
        case .keepSunscreen: return "☀️"
        }
    }
}

enum ExperimentStatus: String, Codable {
    case scheduled = "SCHEDULED"
    case active = "ACTIVE"
    case completed = "COMPLETED"
    case cancelled = "CANCELLED"

    var label: String {
        switch self {
        case .scheduled: return "예정"
        case .active: return "진행 중"
        case .completed: return "완료"
        case .cancelled: return "취소됨"
        }
    }
}

struct Experiment: Decodable, Identifiable {
    let experimentId: Int64
    let title: String?
    let experimentType: ExperimentType?
    let experimentPeriod: TimelinePeriod?
    let durationDays: Int?
    let startDate: String?
    let endDate: String?
    let status: ExperimentStatus?
    let completedAt: String?

    var id: Int64 { experimentId }
}

struct CreateExperimentRequest: Encodable {
    let title: String
    let experimentType: ExperimentType
    let experimentPeriod: TimelinePeriod
    let startDate: String
}

struct DailyCheck: Decodable, Identifiable {
    let checkId: Int64?
    let recordDate: String?
    let achieved: Bool?
    let actualValue: String?
    let sourceType: String?
    let note: String?

    var id: String { recordDate ?? "\(checkId ?? 0)" }
    var recordDateValue: Date? { ServerDate.parse(recordDate) }
}

struct DailyCheckRequest: Encodable {
    let achieved: Bool
    let note: String?
}

struct ExperimentProgress: Decodable {
    let experimentId: Int64?
    let status: ExperimentStatus?
    let durationDays: Int?
    let currentDay: Int?
    let remainingDays: Int?
    let recordedDays: Int?
    let achievedDays: Int?
    let missingDays: Int?
    let completionRate: Double?
    let dailyChecks: [DailyCheck]?
}

struct ScoreChange: Decodable {
    let before: Double?
    let after: Double?
    let change: Double?
}

struct ExperimentScoreChanges: Decodable {
    let redness: ScoreChange?
    let trouble: ScoreChange?
    let dryness: ScoreChange?
    let toneUniformity: ScoreChange?
    let overall: ScoreChange?
}

struct ExperimentResult: Decodable {
    let resultId: Int64?
    let experimentId: Int64?
    let period: TimelinePeriod?
    let experimentType: ExperimentType?
    let achievementRate: Double?
    let evaluatedDays: Int?
    let achievedDays: Int?
    let missingDays: Int?
    let scoreChanges: ExperimentScoreChanges?
    let mostChangedMetric: SkinMetric?
    let mostChangedAmount: Double?
    let changeDirection: ChangeDirection?
    let confidenceLevel: ConfidenceLevel?
    let recommendation: String?
    let confidenceReasons: [String]?
    let summary: String?
    let calculatedAt: String?
}

// MARK: - 리포트

enum ReportType: String, Codable, CaseIterable, Identifiable {
    case weekly = "WEEKLY"
    case monthly = "MONTHLY"

    var id: String { rawValue }
    var label: String { self == .weekly ? "주간" : "월간" }
}

struct ReportPeriod: Decodable {
    let startDate: String?
    let endDate: String?
    let periodDays: Int?
}

struct ReportScoreSet: Decodable {
    let redness: Double?
    let trouble: Double?
    let dryness: Double?
    let toneUniformity: Double?
    let overall: Double?

    /// 온디바이스 모델이 측정하는 지표만
    var measured: [(SkinMetric, Double)] {
        [(SkinMetric.trouble, trouble), (.redness, redness)]
            .compactMap { metric, value in value.map { (metric, $0) } }
    }
}

struct ReportMetricChange: Decodable {
    let metric: SkinMetric?
    let change: Double?
}

struct ReportSkinSummary: Decodable {
    let analysisCount: Int?
    let recordedDays: Int?
    let periodDays: Int?
    let recordCoverageRate: Double?
    let averages: ReportScoreSet?
    let previousAverages: ReportScoreSet?
    let changes: ReportScoreSet?
    let mostImprovedMetric: ReportMetricChange?
    let mostWorsenedMetric: ReportMetricChange?
    let averageModelConfidence: Double?
    let averageImageQuality: Double?
    let excludedQualityCount: Int?
}

struct ReportLifestyleSummary: Decodable {
    let recordedDays: Int?
    let averageSleepMinutes: Double?
    let sleepAtLeastSevenHoursDays: Int?
    let bedtimeBeforeMidnightDays: Int?
    let lateNightMealDays: Int?
    let waterAtLeast1500MlDays: Int?
    let fieldCompletenessRate: Double?
}

struct ReportEnvironmentRiskDays: Decodable {
    let highUvDays: Int?
    let lowHumidityDays: Int?
    let highFineDustDays: Int?
    let highTemperatureDays: Int?
    let lowTemperatureDays: Int?
}

struct ReportEnvironmentSummary: Decodable {
    let recordedDays: Int?
    let averageUvIndex: Double?
    let maximumUvIndex: Double?
    let averageTemperature: Double?
    let averageHumidity: Double?
    let averageFineDust: Double?
    let riskDays: ReportEnvironmentRiskDays?
    let fieldCompletenessRate: Double?
}

struct ReportFactor: Decodable, Identifiable {
    let factor: LifestyleFactor?
    let targetMetric: SkinMetric?
    let observedDifference: Double?
    let observationCount: Int?
    let confidenceLevel: ConfidenceLevel?
    let summary: String?

    var id: String { (factor?.rawValue ?? "?") + (targetMetric?.rawValue ?? "?") }
}

struct ReportExperiment: Decodable, Identifiable {
    let experimentId: Int64
    let experimentType: ExperimentType?
    let experimentPeriod: TimelinePeriod?
    let achievementRate: Double?
    let overallScoreChange: Double?
    let confidenceLevel: ConfidenceLevel?
    let recommendation: String?

    var id: Int64 { experimentId }
}

struct SkinReport: Decodable {
    let reportType: ReportType?
    let displayPeriod: ReportPeriod?
    let calculatedPeriod: ReportPeriod?
    let skin: ReportSkinSummary?
    let lifestyle: ReportLifestyleSummary?
    let environment: ReportEnvironmentSummary?
    let topObservedFactors: [ReportFactor]?
    let factorAnalysisNotice: String?
    let completedExperiments: [ReportExperiment]?
    let confidence: InsightConfidence?
    let warnings: [String]?
    let notice: String?
    let generatedAt: String?
}

// MARK: - 리마인더 설정

enum ReminderType: String, Codable, CaseIterable, Identifiable {
    case skinCapture = "SKIN_CAPTURE"
    case lifestyleRecord = "LIFESTYLE_RECORD"
    case waterIntake = "WATER_INTAKE"
    case bedtimePreparation = "BEDTIME_PREPARATION"
    case experimentAction = "EXPERIMENT_ACTION"
    case ddayRoutine = "DDAY_ROUTINE"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .skinCapture: return "피부 촬영"
        case .lifestyleRecord: return "생활 기록"
        case .waterIntake: return "수분 섭취"
        case .bedtimePreparation: return "취침 준비"
        case .experimentAction: return "생활 실험"
        case .ddayRoutine: return "D-Day 루틴"
        }
    }

    var detail: String {
        switch self {
        case .skinCapture: return "매일 같은 시간에 촬영하면 분석이 정확해져요"
        case .lifestyleRecord: return "수면·수분·야식을 기록할 시간"
        case .waterIntake: return "물 마실 시간을 알려드려요"
        case .bedtimePreparation: return "자정 전 취침을 도와드려요"
        case .experimentAction: return "진행 중인 실험 체크"
        case .ddayRoutine: return "목표일까지의 관리 루틴"
        }
    }

    var icon: String {
        switch self {
        case .skinCapture: return "camera"
        case .lifestyleRecord: return "square.and.pencil"
        case .waterIntake: return "drop"
        case .bedtimePreparation: return "moon"
        case .experimentAction: return "flask"
        case .ddayRoutine: return "target"
        }
    }
}

enum ReminderWeekday: String, Codable, CaseIterable, Identifiable {
    case monday = "MONDAY", tuesday = "TUESDAY", wednesday = "WEDNESDAY"
    case thursday = "THURSDAY", friday = "FRIDAY", saturday = "SATURDAY", sunday = "SUNDAY"

    var id: String { rawValue }

    var short: String {
        switch self {
        case .monday: return "월"
        case .tuesday: return "화"
        case .wednesday: return "수"
        case .thursday: return "목"
        case .friday: return "금"
        case .saturday: return "토"
        case .sunday: return "일"
        }
    }
}

struct ReminderSetting: Decodable, Identifiable {
    let settingId: Int64?
    let reminderType: ReminderType?
    let enabled: Bool?
    let reminderTime: String?
    let daysOfWeek: [ReminderWeekday]?
    let timezone: String?

    var id: String { reminderType?.rawValue ?? "\(settingId ?? 0)" }
}

struct ReminderSettingRequest: Encodable {
    let enabled: Bool
    let reminderTime: String
    let daysOfWeek: [ReminderWeekday]
    let timezone: String
}

// MARK: - 기준(베이스라인) 분석

struct SkinAnalysisBaseline: Decodable {
    let baselineId: Int64?
    let analysisId: Int64?
    let imageId: Int64?
    let overallScore: Int?
    let capturedAt: String?
    let selectedAt: String?
}

// MARK: - 실험 진행 요약

struct ProgressTotals: Decodable {
    let elapsedDays: Int?
    let recordedDays: Int?
    let achievedDays: Int?
    let missingDays: Int?
    let completionRate: Double?
}

struct ProgressSegment: Decodable, Identifiable {
    let sequence: Int?
    let startDate: String?
    let endDate: String?
    let plannedDays: Int?
    let elapsedDays: Int?
    let recordedDays: Int?
    let achievedDays: Int?
    let missingDays: Int?
    let completionRate: Double?

    var id: Int { sequence ?? 0 }
}

struct ExperimentProgressSummary: Decodable {
    let experimentId: Int64?
    let status: ExperimentStatus?
    let experimentPeriod: TimelinePeriod?
    let durationDays: Int?
    let overall: ProgressTotals?
    let weeklySummaries: [ProgressSegment]?
    let monthlySummaries: [ProgressSegment]?
}
