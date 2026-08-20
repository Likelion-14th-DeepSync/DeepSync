import SwiftUI

/// 피그마 "D-Day"(37:2395) + "D-Day 관리 계획"(42:5710)
struct DDayView: View {
    @StateObject private var viewModel = DDayViewModel()
    @State private var editingGoal = false
    @State private var creatingExperiment = false
    @State private var showingResult = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScreenHeader(title: "D-Day")

                ScrollView {
                    VStack(spacing: Theme.s(16)) {
                        if let message = viewModel.errorMessage {
                            Text(message)
                                .font(.inter(.regular, 12))
                                .foregroundStyle(Theme.danger)
                        }

                        switch viewModel.goal {
                        case .loading:
                            EmptyStateBlock(message: "목표를 불러오는 중이에요", isLoading: true)
                        case let .failed(message):
                            EmptyStateBlock(message: message, icon: "wifi.exclamationmark") {
                                Task { await viewModel.loadGoal() }
                            }
                        case .empty:
                            emptyGoalCard
                        case let .loaded(goal):
                            DDayHeroCard(goal: goal) { editingGoal = true }
                            GoalStatusCard(goal: goal, currentScore: viewModel.latestScore)
                        }

                        ExperimentCard(
                            experiment: viewModel.experiment,
                            progress: viewModel.progress,
                            onCreate: { creatingExperiment = true },
                            onToggle: { date, achieved in
                                Task { await viewModel.toggleCheck(date: date, achieved: achieved) }
                            },
                            onShowResult: { showingResult = true },
                            onSync: { Task { await viewModel.syncExperiment() } }
                        )

                        if !viewModel.pastExperiments.isEmpty {
                            PastExperimentsCard(experiments: viewModel.pastExperiments)
                        }

                        PlanCard()

                        if case let .loaded(goal) = viewModel.goal {
                            HStack(spacing: Theme.s(12)) {
                                Button {
                                    Task { await viewModel.completeGoal(id: goal.goalId) }
                                } label: {
                                    Text("목표 완료")
                                        .font(.inter(.semiBold, 14))
                                        .foregroundStyle(.white)
                                        .frame(maxWidth: .infinity)
                                        .frame(height: Theme.s(44))
                                        .background(Theme.accent)
                                        .clipShape(RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous))
                                }
                                .buttonStyle(.plain)

                                Button {
                                    Task { await viewModel.cancelGoal(id: goal.goalId) }
                                } label: {
                                    Text("목표 취소")
                                        .font(.inter(.semiBold, 14))
                                        .foregroundStyle(Theme.textGray)
                                        .frame(maxWidth: .infinity)
                                        .frame(height: Theme.s(44))
                                        .background(Theme.card)
                                        .clipShape(RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous)
                                                .stroke(Theme.panelBorder, lineWidth: 1)
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(.horizontal, Theme.s(20))
                    .padding(.top, Theme.s(4))
                    .padding(.bottom, Theme.s(120))
                }
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationBarHidden(true)
            .task { await viewModel.loadAll() }
            .refreshable { await viewModel.loadAll() }
            .sheet(isPresented: $editingGoal) {
                GoalEditSheet(existing: viewModel.goal.value) { body in
                    if let goal = viewModel.goal.value {
                        await viewModel.updateGoal(id: goal.goalId, body)
                    } else {
                        await viewModel.createGoal(body)
                    }
                }
            }
            .navigationDestination(isPresented: $showingResult) {
                if let experiment = viewModel.experiment {
                    ExperimentResultView(experiment: experiment)
                }
            }
            .sheet(isPresented: $creatingExperiment) {
                ExperimentCreateSheet { body in
                    await viewModel.createExperiment(body)
                }
            }
        }
    }

    private var emptyGoalCard: some View {
        PanelCard(radius: Theme.radiusLargeCard) {
            EmptyStateBlock(message: "진행 중인 D-Day 목표가 없어요.\n중요한 날을 정하고 관리를 시작해보세요.", icon: "target")
            PrimaryButton(title: "목표 만들기", height: Theme.s(44)) { editingGoal = true }
        }
    }
}

// MARK: - 그라디언트 D-Day 카드

private struct DDayHeroCard: View {
    let goal: SkinGoal
    let onEdit: () -> Void

    var body: some View {
        VStack(spacing: Theme.s(16)) {
            VStack(spacing: Theme.s(6)) {
                Text(goal.targetConcern?.label ?? "피부 관리")
                    .font(.inter(.bold, 11))
                    .foregroundStyle(.white)
                    .padding(.horizontal, Theme.s(10))
                    .padding(.vertical, Theme.s(4))
                    .background(Color.white.opacity(0.19))
                    .clipShape(RoundedRectangle(cornerRadius: Theme.s(6), style: .continuous))

                Text("\(goal.title ?? "목표")까지")
                    .font(.inter(.semiBold, 14))
                    .lineLimit(1)
                    .foregroundStyle(.white.opacity(0.8))

                Text(goal.dayLabel?.replacingOccurrences(of: "D-", with: "D - ") ?? "D - ?")
                    .font(.inter(.black, 42))
                    .foregroundStyle(.white)

                if let date = goal.targetDateValue {
                    Text(formatted(date))
                        .font(.inter(.regular, 12))
                        .foregroundStyle(.white.opacity(0.8))
                }
            }

            Rectangle().fill(Color.white.opacity(0.19)).frame(height: 1)

            HStack {
                HStack(spacing: Theme.s(8)) {
                    Image(systemName: "target")
                        .font(.system(size: Theme.s(13)))
                        .foregroundStyle(.white)
                    Text("목표: \(goal.targetConcern?.label ?? "-") 관리")
                        .font(.inter(.bold, 13))
                        .foregroundStyle(.white)
                }
                Spacer()
                Button(action: onEdit) {
                    Text("수정")
                        .font(.inter(.semiBold, 11))
                        .foregroundStyle(.white)
                        .padding(.horizontal, Theme.s(10))
                        .padding(.vertical, Theme.s(4))
                        .background(Color.white.opacity(0.13))
                        .clipShape(RoundedRectangle(cornerRadius: Theme.s(6), style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(Theme.s(24))
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(colors: [Theme.gradientStart, Theme.gradientEnd],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
        )
        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusLargeCard, style: .continuous))
    }

    private func formatted(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.dateFormat = "yyyy.MM.dd (E)"
        return f.string(from: date)
    }
}

// MARK: - 목표 현황

private struct GoalStatusCard: View {
    let goal: SkinGoal
    let currentScore: Int?

    var body: some View {
        PanelCard {
            SectionHeaderRow(title: "목표 현황")

            HStack {
                VStack(spacing: Theme.s(4)) {
                    Text("현재 피부 점수")
                        .font(.inter(.regular, 11))
                        .foregroundStyle(Theme.textGray)
                    Text(currentScore.map { "\($0)점" } ?? "-")
                        .font(.inter(.extraBold, 24))
                        .foregroundStyle(Theme.textInk)
                }
                .frame(maxWidth: .infinity)

                Image(systemName: "arrow.right")
                    .font(.system(size: Theme.s(15), weight: .semibold))
                    .foregroundStyle(Theme.textTertiary)

                VStack(spacing: Theme.s(4)) {
                    Text("목표 피부 점수")
                        .font(.inter(.regular, 11))
                        .foregroundStyle(Theme.textGray)
                    Text("준비 중")
                        .font(.inter(.semiBold, 15))
                        .foregroundStyle(Theme.textTertiary)
                }
                .frame(maxWidth: .infinity)
            }

            VStack(alignment: .leading, spacing: Theme.s(6)) {
                Text(goal.daysRemaining.map { "목표일까지 \($0)일 남았어요!" } ?? "목표 상태 \(goal.status?.label ?? "-")")
                    .font(.inter(.regular, 12))
                    .foregroundStyle(Theme.textGray)
                ProgressTrack(value: progressValue)
            }

            Text("목표 점수 설정은 백엔드에 필드가 없어 준비 중이에요.")
                .font(.inter(.regular, 10))
                .foregroundStyle(Theme.textTertiary)
        }
    }

    /// 남은 일수 기반 진행률 (전체 기간을 알 수 없어 90일 기준으로 환산)
    private var progressValue: Double {
        guard let remaining = goal.daysRemaining else { return 0 }
        return max(0, min(1, 1 - Double(remaining) / 90.0))
    }
}

// MARK: - 진행 중 생활 실험

private struct ExperimentCard: View {
    let experiment: Experiment?
    let progress: ExperimentProgress?
    let onCreate: () -> Void
    let onToggle: (Date, Bool) -> Void
    let onShowResult: () -> Void
    let onSync: () -> Void

    var body: some View {
        PanelCard {
            SectionHeaderRow(title: "진행 중 생활 실험",
                             actionTitle: experiment == nil ? nil : "결과 보기",
                             action: experiment == nil ? nil : onShowResult)

            if let experiment {
                HStack(spacing: Theme.s(10)) {
                    Text(experiment.experimentType?.emoji ?? "🧪")
                        .font(.system(size: Theme.s(18)))
                    Text(experiment.title ?? experiment.experimentType?.label ?? "실험")
                        .font(.inter(.bold, 14))
                        .foregroundStyle(Theme.textInk)
                    TagBadge(text: "\(experiment.durationDays ?? 7)일 실험")
                    Spacer()
                }

                VStack(alignment: .leading, spacing: Theme.s(6)) {
                    HStack {
                        Text("Day \(progress?.currentDay ?? 0) / \(experiment.durationDays ?? 7)")
                            .font(.inter(.regular, 12))
                            .foregroundStyle(Theme.textGray)
                        Spacer()
                        Text("실천율 \(Int((progress?.completionRate ?? 0) * 100))%")
                            .font(.inter(.bold, 12))
                            .foregroundStyle(Theme.accent)
                    }
                    ProgressTrack(value: progress?.completionRate ?? 0)
                }

                HStack {
                    Button(action: onSync) {
                        Label("생활 기록으로 자동 체크", systemImage: "arrow.triangle.2.circlepath")
                            .font(.inter(.semiBold, 12))
                            .foregroundStyle(Theme.accent)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                }

                Text("수면·수분·야식 실험은 생활 기록으로 자동 판정돼요.")
                    .font(.inter(.regular, 10))
                    .foregroundStyle(Theme.textTertiary)

                if let checks = progress?.dailyChecks, !checks.isEmpty {
                    HStack(spacing: 0) {
                        ForEach(checks.prefix(7)) { check in
                            let isAuto = check.sourceType == "AUTO"
                            VStack(spacing: Theme.s(6)) {
                                Button {
                                    guard !isAuto, let date = check.recordDateValue else { return }
                                    onToggle(date, !(check.achieved ?? false))
                                } label: {
                                    ZStack {
                                        Circle()
                                            .fill(check.achieved == true ? Theme.accent : Color.clear)
                                            .frame(width: Theme.s(24), height: Theme.s(24))
                                            .overlay(
                                                Circle().stroke(check.achieved == true ? Color.clear : Theme.panelBorder,
                                                                lineWidth: 1.5)
                                            )
                                        if check.achieved == true {
                                            Image(systemName: "checkmark")
                                                .font(.system(size: Theme.s(11), weight: .bold))
                                                .foregroundStyle(.white)
                                        }
                                    }
                                }
                                .buttonStyle(.plain)
                                .disabled(isAuto)

                                Text(weekday(check.recordDateValue))
                                    .font(.inter(.regular, 11))
                                    .foregroundStyle(Theme.textGray)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                }
            } else {
                EmptyStateBlock(message: "진행 중인 생활 실험이 없어요.\n7일 실험으로 습관 하나를 시험해보세요.", icon: "flask")
                PrimaryButton(title: "실험 시작하기", height: Theme.s(44), action: onCreate)
            }
        }
    }

    private func weekday(_ date: Date?) -> String {
        guard let date else { return "-" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.dateFormat = "E"
        return f.string(from: date)
    }
}

// MARK: - 지난 실험

private struct PastExperimentsCard: View {
    let experiments: [Experiment]

    var body: some View {
        PanelCard {
            SectionHeaderRow(title: "지난 생활 실험")
            ForEach(experiments.prefix(5)) { experiment in
                NavigationLink {
                    ExperimentResultView(experiment: experiment)
                } label: {
                    HStack(spacing: Theme.s(10)) {
                        Text(experiment.experimentType?.emoji ?? "🧪")
                        VStack(alignment: .leading, spacing: Theme.s(2)) {
                            Text(experiment.title ?? experiment.experimentType?.label ?? "실험")
                                .font(.inter(.semiBold, 13))
                                .foregroundStyle(Theme.textInk)
                            Text("\(experiment.startDate ?? "") ~ \(experiment.endDate ?? "")")
                                .font(.inter(.regular, 11))
                                .foregroundStyle(Theme.textTertiary)
                        }
                        Spacer()
                        TagBadge(text: experiment.status?.label ?? "-")
                        Image(systemName: "chevron.right")
                            .font(.system(size: Theme.s(11)))
                            .foregroundStyle(Theme.textTertiary)
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - 관리 계획 (AI 생성 — 백엔드 없음)

private struct PlanCard: View {
    var body: some View {
        PanelCard {
            SectionHeaderRow(title: "D-Day 관리 계획")
            planRow(title: "이번 주 집중 포인트", detail: "촬영과 생활 기록이 쌓이면 맞춤 포인트를 제안해요.")
            planRow(title: "추천 습관 유지", detail: "실험을 완료하면 유지할 습관을 알려드려요.")
            planRow(title: "다음 실험 제안", detail: "요인 분석 결과를 바탕으로 다음 실험을 추천해요.")
            Text("관리 계획 자동 생성은 준비 중이에요.")
                .font(.inter(.regular, 10))
                .foregroundStyle(Theme.textTertiary)
        }
    }

    private func planRow(title: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: Theme.s(4)) {
            Text(title)
                .font(.inter(.bold, 13))
                .foregroundStyle(Theme.textInk)
            Text(detail)
                .font(.inter(.regular, 11))
                .foregroundStyle(Theme.textGray)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - 시트

struct GoalEditSheet: View {
    let existing: SkinGoal?
    let onSave: (SkinGoalRequest) async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var targetDate = Calendar.current.date(byAdding: .day, value: 30, to: Date()) ?? Date()
    @State private var concern: SkinConcern = .trouble
    @State private var note = ""
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Section("목표") {
                    TextField("예: 결혼식, 면접", text: $title)
                    DatePicker("목표 날짜", selection: $targetDate, in: Date()..., displayedComponents: .date)
                    Picker("집중 관리", selection: $concern) {
                        ForEach(SkinConcern.allCases) { Text($0.label).tag($0) }
                    }
                }
                Section("메모 (선택)") {
                    TextField("관리 계획을 적어보세요", text: $note, axis: .vertical).lineLimit(3...6)
                }
            }
            .navigationTitle(existing == nil ? "새 목표" : "목표 수정")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("취소") { dismiss() } }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("저장") {
                        Task {
                            isSaving = true
                            await onSave(SkinGoalRequest(
                                title: title,
                                targetDate: ServerDate.dateString(targetDate),
                                targetConcern: concern,
                                targetDescription: note.isEmpty ? nil : note
                            ))
                            isSaving = false
                            dismiss()
                        }
                    }
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
                }
            }
            .onAppear {
                if let existing {
                    title = existing.title ?? ""
                    targetDate = existing.targetDateValue ?? targetDate
                    concern = existing.targetConcern ?? .trouble
                    note = existing.targetDescription ?? ""
                }
            }
        }
    }
}

struct ExperimentCreateSheet: View {
    let onSave: (CreateExperimentRequest) async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var type: ExperimentType = .sleepAtLeast7Hours
    @State private var period: TimelinePeriod = .sevenDays
    @State private var startDate = Date()
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Section("실험 종류") {
                    Picker("종류", selection: $type) {
                        ForEach(ExperimentType.allCases) { Text("\($0.emoji) \($0.label)").tag($0) }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }
                Section("기간") {
                    Picker("기간", selection: $period) {
                        ForEach(TimelinePeriod.allCases) { Text($0.label).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    // 서버가 과거 시작일을 거부한다(INVALID_EXPERIMENT_START_DATE)
                    DatePicker("시작일", selection: $startDate, in: Date()..., displayedComponents: .date)
                }
            }
            .navigationTitle("생활 실험 시작")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("취소") { dismiss() } }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("시작") {
                        Task {
                            isSaving = true
                            await onSave(CreateExperimentRequest(
                                title: type.label,
                                experimentType: type,
                                experimentPeriod: period,
                                startDate: ServerDate.dateString(startDate)
                            ))
                            isSaving = false
                            dismiss()
                        }
                    }
                    .disabled(isSaving)
                }
            }
        }
    }
}

#Preview {
    DDayView()
}
