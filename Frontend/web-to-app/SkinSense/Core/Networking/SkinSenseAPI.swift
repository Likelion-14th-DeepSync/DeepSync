import Foundation

/// DeepSync 백엔드 엔드포인트 모음.
/// Swagger: https://deepsync-backend.onrender.com/swagger-ui/index.html
enum SkinSenseAPI {
    private static var client: APIClient { .shared }

    // MARK: - 인증

    static func signUp(_ body: SignUpRequest) async throws -> SignUpResponse {
        try await client.send("POST", "/api/v1/auth/signup", body: body)
    }

    static func login(_ body: LoginRequest) async throws -> LoginResponse {
        try await client.send("POST", "/api/v1/auth/login", body: body)
    }

    // MARK: - 회원

    static func me() async throws -> MemberProfile {
        try await client.get("/api/v1/members/me")
    }

    static func updateMe(_ body: UpdateMemberProfileRequest) async throws -> MemberProfile {
        try await client.send("PATCH", "/api/v1/members/me", body: body)
    }

    // MARK: - 피부 목표 (Skin D-Day)


    static func activeSkinGoal() async throws -> SkinGoal {
        try await client.get("/api/v1/skin-goals/active")
    }

    static func createSkinGoal(_ body: SkinGoalRequest) async throws -> SkinGoal {
        try await client.send("POST", "/api/v1/skin-goals", body: body)
    }


    static func updateSkinGoal(id: Int64, _ body: SkinGoalRequest) async throws -> SkinGoal {
        try await client.send("PATCH", "/api/v1/skin-goals/\(id)", body: body)
    }

    static func completeSkinGoal(id: Int64) async throws -> SkinGoal {
        try await client.send("PATCH", "/api/v1/skin-goals/\(id)/complete")
    }

    static func cancelSkinGoal(id: Int64) async throws -> SkinGoal {
        try await client.send("PATCH", "/api/v1/skin-goals/\(id)/cancel")
    }

    // MARK: - 생활 기록



    static func lifestyleRecords(from: String, to: String) async throws -> [LifestyleRecord] {
        try await client.get("/api/v1/lifestyle-records", query: [
            URLQueryItem(name: "startDate", value: from),
            URLQueryItem(name: "endDate", value: to)
        ])
    }

    static func lifestyleRecord(date: String) async throws -> LifestyleRecord {
        try await client.get("/api/v1/lifestyle-records/\(date)")
    }

    static func createLifestyleRecord(_ body: LifestyleRecordRequest) async throws -> LifestyleRecord {
        try await client.send("POST", "/api/v1/lifestyle-records", body: body)
    }

    static func updateLifestyleRecord(date: String, _ body: LifestyleRecordRequest) async throws -> LifestyleRecord {
        try await client.send("PATCH", "/api/v1/lifestyle-records/\(date)", body: body)
    }

    // MARK: - 환경 기록



    static func environmentRecords(from: String, to: String) async throws -> [EnvironmentRecord] {
        try await client.get("/api/v1/environment-records", query: [
            URLQueryItem(name: "startDate", value: from),
            URLQueryItem(name: "endDate", value: to)
        ])
    }

    static func environmentRecord(date: String) async throws -> EnvironmentRecord {
        try await client.get("/api/v1/environment-records/\(date)")
    }

    static func createEnvironmentRecord(_ body: EnvironmentRecordRequest) async throws -> EnvironmentRecord {
        try await client.send("POST", "/api/v1/environment-records", body: body)
    }

    static func updateEnvironmentRecord(date: String, _ body: EnvironmentRecordRequest) async throws -> EnvironmentRecord {
        try await client.send("PATCH", "/api/v1/environment-records/\(date)", body: body)
    }

    // MARK: - 피부 사진

    static func uploadSkinImage(
        imageData: Data,
        capturedAt: Date,
        direction: CaptureDirection,
        makeupApplied: Bool
    ) async throws -> SkinImage {
        let metadata = SkinImageUploadRequest(
            capturedAt: ServerDate.dateTimeString(capturedAt),
            direction: direction,
            makeupApplied: makeupApplied
        )
        return try await client.upload(
            "/api/v1/skin-images",
            imageData: imageData,
            fileName: "skin-\(direction.rawValue.lowercased()).jpg",
            mimeType: "image/jpeg",
            metadata: metadata
        )
    }



    static func skinImages(from: String, to: String) async throws -> [SkinImage] {
        try await client.get("/api/v1/skin-images", query: [
            URLQueryItem(name: "startDate", value: from),
            URLQueryItem(name: "endDate", value: to)
        ])
    }

    static func runQualityCheck(imageId: Int64) async throws -> SkinImageQuality {
        try await client.send("POST", "/api/v1/skin-images/\(imageId)/quality-check")
    }


    static func imageFileData(imageId: Int64) async throws -> Data {
        try await client.download("/api/v1/skin-images/\(imageId)/file")
    }

    // MARK: - 피부 분석

    static func imageQuality(imageId: Int64) async throws -> SkinImageQuality {
        try await client.get("/api/v1/skin-images/\(imageId)/quality")
    }

    static func deleteSkinImage(imageId: Int64) async throws {
        try await client.sendNoContent("DELETE", "/api/v1/skin-images/\(imageId)")
    }

    static func baseline() async throws -> SkinAnalysisBaseline {
        try await client.get("/api/v1/skin-analysis-baseline")
    }

    static func setBaseline(analysisId: Int64) async throws -> SkinAnalysisBaseline {
        try await client.send("PUT", "/api/v1/skin-analysis-baseline/\(analysisId)")
    }

    static func experimentProgressSummary(id: Int64) async throws -> ExperimentProgressSummary {
        try await client.get("/api/v1/experiments/\(id)/progress/summary")
    }

    static func requestAnalysis(imageId: Int64) async throws -> SkinAnalysis {
        try await client.send("POST", "/api/v1/skin-images/\(imageId)/analyses")
    }

    static func analysis(id: Int64) async throws -> SkinAnalysis {
        try await client.get("/api/v1/skin-analyses/\(id)")
    }



    static func analyses(from: String, to: String) async throws -> [SkinAnalysis] {
        try await client.get("/api/v1/skin-analyses", query: [
            URLQueryItem(name: "startDate", value: from),
            URLQueryItem(name: "endDate", value: to)
        ])
    }

    static func latestAnalysis() async throws -> SkinAnalysis {
        try await client.get("/api/v1/skin-analyses/latest")
    }

    static func timeline(period: TimelinePeriod) async throws -> SkinAnalysisTimeline {
        try await client.get("/api/v1/skin-analyses/timeline", query: [
            URLQueryItem(name: "period", value: period.rawValue)
        ])
    }

    static func comparison(analysisId: Int64) async throws -> SkinAnalysisComparison {
        try await client.get("/api/v1/skin-analyses/\(analysisId)/comparison")
    }

    static func startAnalysis(id: Int64) async throws -> SkinAnalysis {
        try await client.send("PATCH", "/api/v1/skin-analyses/\(id)/start")
    }

    /// 온디바이스 Core ML 추론 결과를 서버에 제출한다.
    static func submitAnalysisResult(id: Int64, _ body: SkinAnalysisResultRequest) async throws -> SkinAnalysis {
        try await client.send("PATCH", "/api/v1/skin-analyses/\(id)/result", body: body)
    }


    static func failAnalysis(id: Int64, reason: String) async throws -> SkinAnalysis {
        struct Body: Encodable { let reason: String }
        return try await client.send("PATCH", "/api/v1/skin-analyses/\(id)/failure", body: Body(reason: reason))
    }

    // MARK: - 인사이트 / 대시보드



    static func todayInsight() async throws -> DailySkinInsight {
        try await client.get("/api/v1/analysis/today")
    }

    static func dailyInsight(date: String) async throws -> DailySkinInsight {
        try await client.get("/api/v1/analysis/daily", query: [URLQueryItem(name: "date", value: date)])
    }

    static func factorDetail(_ factor: LifestyleFactor) async throws -> PersonalFactorAnalysis {
        try await client.get("/api/v1/analysis/factors/\(factor.rawValue)")
    }

    static func personalFactors() async throws -> [PersonalFactorAnalysis] {
        try await client.get("/api/v1/analysis/factors")
    }

    static func recalculateFactors() async throws -> [PersonalFactorAnalysis] {
        try await client.send("POST", "/api/v1/analysis/factors/recalculate")
    }

    static func confidence() async throws -> AnalysisConfidence {
        try await client.get("/api/v1/analysis/confidence")
    }

    static func recalculateConfidence() async throws -> AnalysisConfidence {
        try await client.send("POST", "/api/v1/analysis/confidence/recalculate")
    }

    static func dashboard(period: TimelinePeriod = .sevenDays) async throws -> DdayDashboard {
        try await client.get("/api/v1/dashboard/dday", query: [
            URLQueryItem(name: "period", value: period.rawValue)
        ])
    }

    // MARK: - 생활 실험

    static func experiments() async throws -> [Experiment] {
        try await client.get("/api/v1/experiments")
    }

    static func activeExperiment() async throws -> Experiment {
        try await client.get("/api/v1/experiments/active")
    }

    static func createExperiment(_ body: CreateExperimentRequest) async throws -> Experiment {
        try await client.send("POST", "/api/v1/experiments", body: body)
    }

    static func experimentProgress(id: Int64) async throws -> ExperimentProgress {
        try await client.get("/api/v1/experiments/\(id)/progress")
    }

    static func experimentResult(id: Int64) async throws -> ExperimentResult {
        try await client.get("/api/v1/experiments/\(id)/result")
    }

    static func setDailyCheck(id: Int64, date: String, achieved: Bool, note: String? = nil) async throws -> DailyCheck {
        try await client.send("PUT", "/api/v1/experiments/\(id)/daily-checks/\(date)",
                              body: DailyCheckRequest(achieved: achieved, note: note))
    }

    /// 생활 기록으로 일별 체크를 자동 판정한다. 응답은 갱신된 체크 목록이다.
    static func syncExperiment(id: Int64) async throws -> [DailyCheck] {
        try await client.send("POST", "/api/v1/experiments/\(id)/sync")
    }

    /// 실험을 종료한다. 결과 리포트는 completeExperiment 후 experimentResult 로 조회한다.
    static func completeExperiment(id: Int64) async throws -> Experiment {
        try await client.send("POST", "/api/v1/experiments/\(id)/complete")
    }

    static func cancelExperiment(id: Int64) async throws -> Experiment {
        try await client.send("PATCH", "/api/v1/experiments/\(id)/cancel")
    }

    // MARK: - 리포트

    static func weeklyReport(date: String? = nil) async throws -> SkinReport {
        try await client.get("/api/v1/reports/weekly",
                             query: date.map { [URLQueryItem(name: "date", value: $0)] } ?? [])
    }

    static func monthlyReport(year: Int, month: Int) async throws -> SkinReport {
        try await client.get("/api/v1/reports/monthly", query: [
            URLQueryItem(name: "year", value: "\(year)"),
            URLQueryItem(name: "month", value: "\(month)")
        ])
    }

    // MARK: - 리마인더

    static func reminderSettings() async throws -> [ReminderSetting] {
        try await client.get("/api/v1/reminders/settings")
    }

    static func updateReminder(type: ReminderType, _ body: ReminderSettingRequest) async throws -> ReminderSetting {
        try await client.send("PUT", "/api/v1/reminders/settings/\(type.rawValue)", body: body)
    }

    static func disableReminder(type: ReminderType) async throws -> ReminderSetting {
        try await client.send("PATCH", "/api/v1/reminders/settings/\(type.rawValue)/disable")
    }

    static func deleteReminder(type: ReminderType) async throws {
        try await client.sendNoContent("DELETE", "/api/v1/reminders/settings/\(type.rawValue)")
    }

    static func todayReminders() async throws -> TodayReminders {
        try await client.get("/api/v1/reminders/today")
    }
}

struct SkinAnalysisComparison: Decodable {
    let current: SkinScoreSnapshot?
    let baselineComparison: SkinScoreChange?
    let previousComparison: SkinScoreChange?
}
