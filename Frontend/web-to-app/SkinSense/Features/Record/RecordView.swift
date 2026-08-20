import SwiftUI

/// 피그마 "기록" 3탭 (캘린더 34:2039 / 사진 기록 42:4300 / 변화 42:4988)
struct RecordView: View {
    @StateObject private var viewModel = RecordViewModel()
    @State private var editingLifestyle = false
    @State private var editingEnvironment = false
    @State private var showCapture = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScreenHeader(title: "기록")

                SegmentSwitcher(
                    tabs: [(.calendar, "캘린더"), (.photo, "사진 기록"), (.change, "변화")],
                    selection: $viewModel.tab
                )

                ScrollView {
                    VStack(spacing: Theme.s(16)) {
                        if let message = viewModel.errorMessage {
                            Text(message)
                                .font(.inter(.regular, 12))
                                .foregroundStyle(Theme.danger)
                        }

                        switch viewModel.tab {
                        case .calendar:
                            RecordCalendarTab(
                                viewModel: viewModel,
                                onEditLifestyle: { editingLifestyle = true },
                                onEditEnvironment: { editingEnvironment = true }
                            )
                        case .photo:
                            RecordPhotoTab(viewModel: viewModel) { showCapture = true }
                        case .change:
                            RecordChangeTab(viewModel: viewModel)
                        }
                    }
                    .padding(.horizontal, Theme.s(16))
                    .padding(.top, Theme.s(12))
                    .padding(.bottom, Theme.s(120))
                }
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationBarHidden(true)
            .task { await viewModel.loadAll() }
            .refreshable { await viewModel.loadAll() }
            .sheet(isPresented: $editingLifestyle) {
                LifestyleEditSheet(date: viewModel.selectedDateString, existing: viewModel.lifestyle.value) {
                    await viewModel.saveLifestyle($0)
                }
            }
            .sheet(isPresented: $editingEnvironment) {
                EnvironmentEditSheet(date: viewModel.selectedDateString, existing: viewModel.environment.value) {
                    await viewModel.saveEnvironment($0)
                }
            }
            .fullScreenCover(isPresented: $showCapture) {
                CameraGuideView(onClose: {
                    showCapture = false
                    Task { await viewModel.loadAll() }
                })
            }
        }
    }
}

// MARK: - 캘린더 탭

struct RecordCalendarTab: View {
    @ObservedObject var viewModel: RecordViewModel
    let onEditLifestyle: () -> Void
    let onEditEnvironment: () -> Void

    private let weekdays = ["월", "화", "수", "목", "금", "토", "일"]

    var body: some View {
        VStack(spacing: Theme.s(16)) {
            calendarCard
            todaySkinCard
            lifeLogSection
            PrimaryButton(title: "+ 오늘 생활 기록 추가", height: Theme.s(48), action: onEditLifestyle)
        }
    }

    private var calendarCard: some View {
        PanelCard {
            HStack {
                Button { viewModel.shiftMonth(-1) } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: Theme.s(13), weight: .semibold))
                        .foregroundStyle(Theme.textGray)
                }
                .buttonStyle(.plain)
                Spacer()
                Text(viewModel.monthTitle)
                    .font(.inter(.bold, 16))
                    .foregroundStyle(Theme.textInk)
                Spacer()
                Button { viewModel.shiftMonth(1) } label: {
                    Image(systemName: "chevron.right")
                        .font(.system(size: Theme.s(13), weight: .semibold))
                        .foregroundStyle(Theme.textGray)
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 0) {
                ForEach(weekdays, id: \.self) { day in
                    Text(day)
                        .font(.inter(.medium, 12))
                        .foregroundStyle(Theme.textTertiary)
                        .frame(maxWidth: .infinity)
                }
            }

            let grid = viewModel.monthGrid
            VStack(spacing: Theme.s(12)) {
                ForEach(0..<(grid.count / 7), id: \.self) { row in
                    HStack(spacing: 0) {
                        ForEach(0..<7, id: \.self) { col in
                            let date = grid[row * 7 + col]
                            dayCell(date)
                                .frame(maxWidth: .infinity)
                        }
                    }
                }
            }
        }
    }

    private func dayCell(_ date: Date) -> some View {
        let inMonth = viewModel.isInDisplayedMonth(date)
        let selected = viewModel.isSelected(date)
        let score = viewModel.score(on: date)
        let day = Calendar.current.component(.day, from: date)

        return Button {
            viewModel.select(date)
        } label: {
            VStack(spacing: Theme.s(3)) {
                ZStack {
                    Circle()
                        .fill(selected ? Theme.accent : (viewModel.isToday(date) ? Theme.tintSurface : Color.clear))
                        .frame(width: Theme.s(32), height: Theme.s(32))
                    Text("\(day)")
                        .font(.inter(.medium, 13))
                        .foregroundStyle(
                            selected ? .white
                            : !inMonth ? Theme.textTertiary
                            : viewModel.isSunday(date) ? Theme.danger
                            : Theme.textInk
                        )
                }
                Circle()
                    .fill(score != nil ? Theme.accent : Color.clear)
                    .frame(width: Theme.s(4), height: Theme.s(4))
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var todaySkinCard: some View {
        PanelCard {
            Text(viewModel.isToday(viewModel.selectedDate) ? "오늘의 피부" : "\(viewModel.selectedDateString)의 피부")
                .font(.inter(.bold, 15))
                .foregroundStyle(Theme.textInk)

            if let analysis = viewModel.dayAnalysis {
                HStack(alignment: .top, spacing: Theme.s(16)) {
                    RoundedRectangle(cornerRadius: Theme.s(8), style: .continuous)
                        .fill(Theme.violetSurface)
                        .frame(width: Theme.s(72), height: Theme.s(88))
                        .overlay(
                            Image(systemName: "person.crop.square")
                                .font(.system(size: Theme.s(24)))
                                .foregroundStyle(Theme.primary.opacity(0.5))
                        )

                    VStack(alignment: .leading, spacing: Theme.s(6)) {
                        Text("\(analysis.overallScore ?? 0)점")
                            .font(.inter(.extraBold, 28))
                            .foregroundStyle(Theme.accent)
                        ForEach(analysis.measuredMetricScores.prefix(3), id: \.0) { metric, value in
                            HStack {
                                Text(metric.label)
                                    .font(.inter(.regular, 12))
                                    .foregroundStyle(Theme.textGray)
                                Spacer()
                                Text("\(value)")
                                    .font(.inter(.semiBold, 12))
                                    .foregroundStyle(Theme.textInk)
                            }
                        }
                    }
                }
                if let summary = viewModel.dayInsight?.summary {
                    Text(summary)
                        .font(.inter(.regular, 12))
                        .foregroundStyle(Theme.textGray)
                        .fixedSize(horizontal: false, vertical: true)
                }

                ForEach((viewModel.dayInsight?.associatedFactors ?? []).prefix(3)) { factor in
                    HStack(spacing: Theme.s(8)) {
                        Image(systemName: factor.factor?.icon ?? "questionmark")
                            .font(.system(size: Theme.s(12)))
                            .foregroundStyle(Theme.accent)
                        Text(factor.description ?? factor.factor?.label ?? "")
                            .font(.inter(.regular, 11))
                            .foregroundStyle(Theme.textGray)
                            .lineLimit(2)
                        Spacer(minLength: 0)
                    }
                }
            } else {
                EmptyStateBlock(message: "이 날짜에는 분석 기록이 없어요.", icon: "camera.viewfinder")
            }
        }
    }

    private var lifeLogSection: some View {
        VStack(alignment: .leading, spacing: Theme.s(12)) {
            Text("생활 기록")
                .font(.inter(.bold, 15))
                .foregroundStyle(Theme.textInk)

            VStack(spacing: Theme.s(8)) {
                let life = viewModel.lifestyle.value
                let env = viewModel.environment.value

                logRow(icon: "moon.fill", label: "수면",
                       value: life?.sleepDurationMinutes.map { "\($0 / 60)시간 \($0 % 60)분" },
                       action: onEditLifestyle)
                logRow(icon: "drop.fill", label: "수분 섭취",
                       value: life?.waterIntakeMl.map { String(format: "%.1f L", Double($0) / 1000) },
                       action: onEditLifestyle)
                logRow(icon: "fork.knife", label: "야식",
                       value: life?.lateNightMeal.map { $0 ? "있음" : "없음" },
                       action: onEditLifestyle)
                logRow(icon: "sun.max.fill", label: "UV 지수",
                       value: env?.uvIndex.map { uvLabel($0) },
                       action: onEditEnvironment)
                logRow(icon: "cloud.fill", label: "미세먼지",
                       value: env?.fineDust.map { "\(dustLabel($0)) (\($0)µg/m³)" },
                       action: onEditEnvironment)
            }
        }
    }

    private func uvLabel(_ value: Double) -> String {
        switch value {
        case ..<3: return "낮음 (\(Int(value)))"
        case ..<6: return "보통 (\(Int(value)))"
        case ..<8: return "높음 (\(Int(value)))"
        default: return "매우 높음 (\(Int(value)))"
        }
    }

    private func dustLabel(_ value: Int) -> String {
        switch value {
        case ..<16: return "좋음"
        case ..<36: return "보통"
        case ..<76: return "나쁨"
        default: return "매우 나쁨"
        }
    }

    private func logRow(icon: String, label: String, value: String?, action: @escaping () -> Void) -> some View {
        HStack(spacing: Theme.s(8)) {
            Image(systemName: icon)
                .font(.system(size: Theme.s(14)))
                .foregroundStyle(Theme.accent)
                .frame(width: Theme.s(18))
            Text(label)
                .font(.inter(.regular, 14))
                .foregroundStyle(Theme.textGray)
            Spacer()
            Text(value ?? "미기록")
                .font(.inter(.semiBold, 14))
                .foregroundStyle(value == nil ? Theme.textTertiary : Theme.textInk)
            Button(action: action) {
                Text("수정")
                    .font(.inter(.regular, 11))
                    .foregroundStyle(Theme.textTertiary)
                    .padding(.horizontal, Theme.s(8))
                    .padding(.vertical, Theme.s(2))
                    .overlay(
                        RoundedRectangle(cornerRadius: Theme.s(4), style: .continuous)
                            .stroke(Theme.lineBorder, lineWidth: 1)
                    )
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, Theme.s(16))
        .frame(height: Theme.s(42))
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.s(12), style: .continuous)
                .stroke(Theme.panelBorder, lineWidth: 1)
        )
    }
}

#Preview {
    RecordView()
}
