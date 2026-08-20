import Foundation

/// OpenAI Chat Completions 기반 피부 상담.
/// 사용자의 실제 기록(오늘 점수·요인·목표·실험·생활기록)을 컨텍스트로 넣어 답한다.
final class OpenAIService {
    static let shared = OpenAIService()

    struct Turn: Codable {
        let role: String     // "system" | "user" | "assistant"
        let content: String
    }

    enum AIError: LocalizedError {
        case http(Int, String)
        case empty

        var errorDescription: String? {
            switch self {
            case let .http(status, message):
                if status == 429 { return "요청이 많아요. 잠시 뒤 다시 시도해주세요." }
                if status == 401 { return "AI 서비스 인증에 실패했어요." }
                return "AI 응답에 실패했어요. (\(status)) \(message)"
            case .empty:
                return "AI가 빈 응답을 보냈어요."
            }
        }
    }

    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60
        return URLSession(configuration: config)
    }()

    private init() {}

    /// 대화 이력을 보내고 다음 답변을 받는다.
    func reply(history: [Turn]) async throws -> String {
        var request = URLRequest(url: URL(string: "https://api.openai.com/v1/chat/completions")!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(AISecrets.openAIKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        struct Body: Codable {
            let model: String
            let messages: [Turn]
            let max_tokens: Int
            let temperature: Double
        }
        request.httpBody = try JSONEncoder().encode(
            Body(model: "gpt-4o-mini", messages: history, max_tokens: 600, temperature: 0.7)
        )

        let (data, response) = try await session.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0

        struct Choice: Decodable { let message: Turn }
        struct Completion: Decodable { let choices: [Choice] }
        struct APIErrorBody: Decodable {
            struct Inner: Decodable { let message: String? }
            let error: Inner?
        }

        guard (200..<300).contains(status) else {
            let message = (try? JSONDecoder().decode(APIErrorBody.self, from: data))?.error?.message ?? ""
            throw AIError.http(status, message)
        }
        guard let text = try JSONDecoder().decode(Completion.self, from: data)
                .choices.first?.message.content, !text.isEmpty else {
            throw AIError.empty
        }
        return text
    }

    /// 사용자의 최근 기록 전체를 조회해 시스템 프롬프트를 만든다.
    /// "왜 점수가 떨어졌어?" 같은 질문에 일별 수면·수분·환경 데이터를 근거로 답할 수 있도록
    /// 7일치 원자료와 서버의 요인 분석 결과를 모두 포함한다.
    struct BuiltPrompt {
        let text: String
        /// 사용자 데이터가 하나라도 포함됐는지. false면 캐시하지 말고 다음에 다시 시도한다.
        let hasData: Bool
    }

    func buildSystemPrompt() async -> BuiltPrompt {
        // 로그인/토큰 갱신이 진행 중일 수 있어 인증이 설 때까지 잠깐 기다린다.
        for _ in 0..<6 {
            if (try? await SkinSenseAPI.me()) != nil { break }
            try? await Task.sleep(nanoseconds: 1_500_000_000)
        }

        let from = ServerDate.daysAgo(7)
        let to = ServerDate.today

        // 병렬 조회.
        // `async let x = try? …` 조합은 시뮬레이터에서 asyncLet_finish 런타임 abort를
        // 일으켜(취소된 부모에서 암묵 대기) 명시적 Task로 대체한다.
        let insightTask = Task { try? await SkinSenseAPI.todayInsight() }
        let dashboardTask = Task { try? await SkinSenseAPI.dashboard(period: .sevenDays) }
        let timelineTask = Task { try? await SkinSenseAPI.timeline(period: .sevenDays) }
        let lifeTask = Task { (try? await SkinSenseAPI.lifestyleRecords(from: from, to: to)) ?? [] }
        let envTask = Task { (try? await SkinSenseAPI.environmentRecords(from: from, to: to)) ?? [] }
        let factorsTask = Task { (try? await SkinSenseAPI.personalFactors()) ?? [] }
        let reportTask = Task { try? await SkinSenseAPI.weeklyReport() }

        let insight = await insightTask.value
        let dashboard = await dashboardTask.value
        let timeline = await timelineTask.value
        let lifeRecords = await lifeTask.value
        let envRecords = await envTask.value
        let factors = await factorsTask.value
        let report = await reportTask.value

        var lines: [String] = [
            "당신은 피부 웰니스 앱 'SkinSense'의 AI 상담사입니다.",
            "역할: 아래 사용자의 실제 기록을 근거로 피부 상태를 해석하고 실용적인 조언을 한국어로 제공합니다.",
            "규칙:",
            "- 반드시 아래 데이터의 구체적 수치·날짜를 인용해 답합니다. 데이터에 없는 수치는 지어내지 않습니다.",
            "- '점수가 왜 떨어졌나' 류의 질문에는 일별 기록을 비교해 수면·수분·야식·환경 변화를 근거로 설명합니다.",
            "- 의료 진단·처방을 하지 않습니다. 증상이 심각해 보이면 피부과 전문의 상담을 권합니다.",
            "- 답변은 3~6문장, 존댓말(~해요체). 필요하면 핵심만 짧은 목록으로.",
            "- 마크다운 서식(**강조**, # 제목 등)을 쓰지 않습니다. 일반 텍스트로만 답합니다.",
            ""
        ]

        // 1. 오늘 상태
        var today: [String] = []
        if let t = insight?.today {
            var parts: [String] = []
            if let v = t.overallScore { parts.append("종합 \(v)") }
            if let v = t.troubleScore { parts.append("트러블 \(v)") }
            if let v = t.rednessScore { parts.append("홍조 \(v)") }
            if !parts.isEmpty { today.append("오늘 점수: " + parts.joined(separator: ", ")) }
        }
        if let c = insight?.changes?.previous?.overallScoreChange {
            today.append("어제 대비 종합 \(c > 0 ? "+" : "")\(c)점")
        }
        if let summary = insight?.summary { today.append("서버 요약: \(summary)") }
        if !today.isEmpty {
            lines.append("[오늘의 피부]")
            lines.append(contentsOf: today.map { "- \($0)" })
            lines.append("")
        }

        // 2. 최근 7일 점수 추이
        let snapshots = (timeline?.analyses ?? []).sorted {
            (ServerDate.parse($0.capturedAt) ?? .distantPast) < (ServerDate.parse($1.capturedAt) ?? .distantPast)
        }
        if !snapshots.isEmpty {
            lines.append("[최근 7일 점수 추이]")
            for snap in snapshots {
                let day = ServerDate.parse(snap.capturedAt).map { ServerDate.dateString($0) } ?? "-"
                var parts: [String] = []
                if let v = snap.overallScore { parts.append("종합 \(v)") }
                if let v = snap.troubleScore { parts.append("트러블 \(v)") }
                if let v = snap.rednessScore { parts.append("홍조 \(v)") }
                lines.append("- \(day): " + parts.joined(separator: ", "))
            }
            lines.append("")
        }

        // 3. 일별 생활 기록
        if !lifeRecords.isEmpty {
            lines.append("[최근 7일 생활 기록]")
            for record in lifeRecords.sorted(by: { ($0.recordDate ?? "") < ($1.recordDate ?? "") }) {
                var parts: [String] = []
                if let m = record.sleepDurationMinutes { parts.append("수면 \(m / 60)시간\(m % 60 > 0 ? " \(m % 60)분" : "")") }
                if let bed = ServerDate.shortTime(record.bedtime) { parts.append("취침 \(bed)") }
                if let w = record.waterIntakeMl { parts.append("물 \(w)ml") }
                if let late = record.lateNightMeal { parts.append("야식 \(late ? "O" : "X")") }
                lines.append("- \(record.recordDate ?? "-"): " + parts.joined(separator: ", "))
            }
            lines.append("")
        }

        // 4. 일별 환경 기록
        if !envRecords.isEmpty {
            lines.append("[최근 7일 환경]")
            for record in envRecords.sorted(by: { ($0.recordDate ?? "") < ($1.recordDate ?? "") }) {
                var parts: [String] = []
                if let v = record.uvIndex { parts.append("UV \(Int(v))") }
                if let v = record.humidity { parts.append("습도 \(v)%") }
                if let v = record.fineDust { parts.append("미세먼지 \(v)") }
                if let v = record.temperature { parts.append("기온 \(Int(v))°C") }
                lines.append("- \(record.recordDate ?? "-"): " + parts.joined(separator: ", "))
            }
            lines.append("")
        }

        // 5. 서버가 계산한 개인 요인 분석 (노출일 vs 그 외 평균 차이)
        if !factors.isEmpty {
            lines.append("[개인 요인 분석 — 서버 계산 결과]")
            for factor in factors {
                guard let name = factor.factor?.label else { continue }
                for metric in (factor.metrics ?? []).prefix(2) {
                    guard let target = metric.targetMetric?.label,
                          let diff = metric.observedDifference else { continue }
                    let level = metric.confidenceLevel?.label ?? "-"
                    lines.append("- \(name) → \(target): 차이 \(String(format: "%+.1f", diff))점 (신뢰도 \(level))")
                }
            }
            lines.append("")
        }

        // 6. 주간 리포트 요약
        if let skin = report?.skin, (skin.analysisCount ?? 0) > 0 {
            lines.append("[주간 리포트]")
            if let avg = skin.averages?.overall { lines.append("- 이번 주 평균 종합: \(String(format: "%.1f", avg))") }
            if let prev = skin.previousAverages?.overall { lines.append("- 지난 주 평균 종합: \(String(format: "%.1f", prev))") }
            if let life = report?.lifestyle {
                if let m = life.averageSleepMinutes { lines.append("- 주간 평균 수면: \(Int(m) / 60)시간 \(Int(m) % 60)분") }
                if let d = life.lateNightMealDays { lines.append("- 야식 먹은 날: \(d)일") }
                if let d = life.waterAtLeast1500MlDays { lines.append("- 물 1.5L 이상: \(d)일") }
            }
            lines.append("")
        }

        // 7. 목표 · 실험 · 오늘 환경 위험
        var status: [String] = []
        if let goal = dashboard?.goal {
            status.append("D-Day 목표: \(goal.title ?? "") (\(goal.dayLabel ?? ""), 집중: \(goal.targetConcern?.label ?? "-"))")
        }
        if let active = dashboard?.activeExperiment, let experiment = active.experiment {
            let rate = Int((active.progress?.completionRate ?? 0) * 100)
            status.append("진행 중 실험: \(experiment.title ?? "") — Day \(active.progress?.currentDay ?? 0)/\(experiment.durationDays ?? 7), 실천율 \(rate)%")
            let checks = (active.progress?.dailyChecks ?? []).map { check -> String in
                "\(check.recordDate ?? "-") \(check.achieved == true ? "달성" : "미달성")"
            }
            if !checks.isEmpty { status.append("실험 일별: " + checks.joined(separator: " / ")) }
        }
        for risk in (dashboard?.environment?.risks ?? []).prefix(2) {
            if let message = risk.message { status.append("오늘 환경 주의: \(message)") }
        }
        if !status.isEmpty {
            lines.append("[목표 · 실험 · 환경]")
            lines.append(contentsOf: status.map { "- \($0)" })
            lines.append("")
        }

        let hasData = lines.count > 9
        if !hasData {
            lines.append("사용자 데이터: 아직 기록이 없습니다. 촬영과 생활 기록을 시작하도록 부드럽게 안내하세요.")
        }
        return BuiltPrompt(text: lines.joined(separator: "\n"), hasData: hasData)
    }
}
