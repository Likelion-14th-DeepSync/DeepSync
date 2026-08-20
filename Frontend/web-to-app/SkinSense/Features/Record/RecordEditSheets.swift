import SwiftUI

struct LifestyleEditSheet: View {
    let date: String
    let existing: LifestyleRecord?
    let onSave: (LifestyleRecordRequest) async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var sleepHours: Double = 7
    @State private var bedtime = Date()
    @State private var wakeUpTime = Date()
    @State private var lateNightMeal = false
    @State private var waterIntake: Double = 0
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Section("수면") {
                    HStack {
                        Text("수면 시간")
                        Spacer()
                        Text(String(format: "%.1f시간", sleepHours)).foregroundStyle(Theme.textGray)
                    }
                    Slider(value: $sleepHours, in: 0...12, step: 0.5).tint(Theme.accent)
                    DatePicker("취침", selection: $bedtime, displayedComponents: .hourAndMinute)
                    DatePicker("기상", selection: $wakeUpTime, displayedComponents: .hourAndMinute)
                }
                Section("식생활") {
                    Toggle("야식을 먹었어요", isOn: $lateNightMeal).tint(Theme.accent)
                    HStack {
                        Text("수분 섭취")
                        Spacer()
                        Text("\(Int(waterIntake))ml").foregroundStyle(Theme.textGray)
                    }
                    Slider(value: $waterIntake, in: 0...4000, step: 100).tint(Theme.accent)
                }
            }
            .navigationTitle("생활 기록")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("취소") { dismiss() } }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("저장") {
                        Task {
                            isSaving = true
                            await onSave(LifestyleRecordRequest(
                                recordDate: date,
                                sleepDurationMinutes: Int(sleepHours * 60),
                                bedtime: Self.timeString(bedtime),
                                wakeUpTime: Self.timeString(wakeUpTime),
                                lateNightMeal: lateNightMeal,
                                waterIntakeMl: Int(waterIntake),
                                sourceType: .manual
                            ))
                            isSaving = false
                            dismiss()
                        }
                    }
                    .disabled(isSaving)
                }
            }
            .onAppear {
                if let existing {
                    sleepHours = existing.sleepHours ?? 7
                    bedtime = Self.time(from: existing.bedtime) ?? bedtime
                    wakeUpTime = Self.time(from: existing.wakeUpTime) ?? wakeUpTime
                    lateNightMeal = existing.lateNightMeal ?? false
                    waterIntake = Double(existing.waterIntakeMl ?? 0)
                }
            }
        }
    }

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "HH:mm:ss"
        return f
    }()

    static func timeString(_ date: Date) -> String { timeFormatter.string(from: date) }

    static func time(from string: String?) -> Date? {
        guard let string else { return nil }
        return timeFormatter.date(from: string.count == 5 ? string + ":00" : string)
    }
}

struct EnvironmentEditSheet: View {
    let date: String
    let existing: EnvironmentRecord?
    let onSave: (EnvironmentRecordRequest) async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var uvIndex: Double = 5
    @State private var temperature: Double = 22
    @State private var humidity: Double = 50
    @State private var fineDust: Double = 30
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Section("오늘의 환경") {
                    sliderRow("자외선 지수", $uvIndex, 0...12, "%.0f")
                    sliderRow("기온", $temperature, -20...45, "%.0f°C")
                    sliderRow("습도", $humidity, 0...100, "%.0f%%")
                    sliderRow("미세먼지", $fineDust, 0...300, "%.0f")
                }
            }
            .navigationTitle("환경 기록")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("취소") { dismiss() } }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("저장") {
                        Task {
                            isSaving = true
                            await onSave(EnvironmentRecordRequest(
                                recordDate: date, uvIndex: uvIndex, temperature: temperature,
                                humidity: Int(humidity), fineDust: Int(fineDust), sourceType: .manual
                            ))
                            isSaving = false
                            dismiss()
                        }
                    }
                    .disabled(isSaving)
                }
            }
            .onAppear {
                if let existing {
                    uvIndex = existing.uvIndex ?? uvIndex
                    temperature = existing.temperature ?? temperature
                    humidity = Double(existing.humidity ?? Int(humidity))
                    fineDust = Double(existing.fineDust ?? Int(fineDust))
                }
            }
        }
    }

    @ViewBuilder
    private func sliderRow(_ title: String, _ value: Binding<Double>, _ range: ClosedRange<Double>, _ format: String) -> some View {
        VStack(alignment: .leading, spacing: Theme.s(4)) {
            HStack {
                Text(title)
                Spacer()
                Text(String(format: format, value.wrappedValue)).foregroundStyle(Theme.textGray)
            }
            Slider(value: value, in: range, step: 1).tint(Theme.accent)
        }
    }
}
