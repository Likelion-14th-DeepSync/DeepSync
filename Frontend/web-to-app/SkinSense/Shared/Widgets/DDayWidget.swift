import SwiftUI

struct DDayWidgetView: View {
    var family: SnapshotFamily = .small
    let snapshot: SkinSnapshot

    private var dayLabel: String { snapshot.goalDayLabel?.replacingOccurrences(of: "D-", with: "D - ") ?? "D - ?" }
    private var hasGoal: Bool { snapshot.goalDayLabel != nil }

    var body: some View {
        switch family {
        case .circular: circular
        case .rectangular: rectangular
        case .inline: inline
        case .medium: medium
        default: small
        }
    }

    private var small: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(snapshot.goalConcern.map { "목표: \($0)" } ?? "Skin D-Day")
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(.white.opacity(0.85))
            Spacer(minLength: 0)
            if hasGoal {
                Text(dayLabel)
                    .font(.system(size: 30, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                Text(snapshot.goalTitle ?? "")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.white.opacity(0.9))
                    .lineLimit(2)
            } else {
                Text("목표 없음")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.white)
                Text("탭해서 목표를 만들어보세요")
                    .font(.system(size: 10))
                    .foregroundStyle(.white.opacity(0.85))
                    .lineLimit(2)
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var medium: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 3) {
                Text(dayLabel)
                    .font(.system(size: 34, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                Text(snapshot.goalTitle ?? "진행 중인 목표가 없어요")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.92))
                    .lineLimit(2)
            }

            Spacer(minLength: 0)

            VStack(alignment: .trailing, spacing: 6) {
                if let score = snapshot.overallScore {
                    VStack(alignment: .trailing, spacing: 0) {
                        Text("현재 점수").font(.system(size: 9)).foregroundStyle(.white.opacity(0.8))
                        Text("\(score)점").font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                    }
                }
                if let concern = snapshot.goalConcern {
                    Text(concern)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(.white.opacity(0.22), in: Capsule())
                }
            }
        }
    }

    private var circular: some View {
        VStack(spacing: 0) {
            Text("D")
                .font(.system(size: 10, weight: .semibold))
            Text(snapshot.goalDaysRemaining.map { "\($0)" } ?? "–")
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .minimumScaleFactor(0.5)
                .lineLimit(1)
        }
    }

    private var rectangular: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(snapshot.goalTitle ?? "Skin D-Day")
                .font(.system(size: 12, weight: .semibold))
                .lineLimit(1)
            Text(hasGoal ? dayLabel : "진행 중인 목표 없음")
                .font(.system(size: 16, weight: .bold, design: .rounded))
            if let concern = snapshot.goalConcern {
                Text("집중 관리: \(concern)")
                    .font(.system(size: 11))
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var inline: some View {
        Text(hasGoal ? "\(snapshot.goalTitle ?? "목표") \(snapshot.goalDayLabel ?? "")" : "D-Day 목표 없음")
    }
}
