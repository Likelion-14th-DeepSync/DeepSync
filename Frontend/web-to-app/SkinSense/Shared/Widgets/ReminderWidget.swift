import SwiftUI

struct ReminderWidgetView: View {
    var family: SnapshotFamily = .small
    let snapshot: SkinSnapshot

    private var primaryText: String {
        snapshot.reminderTitle ?? (snapshot.hasScore ? "오늘 촬영을 마쳤어요" : "오늘 피부 사진을 촬영해보세요")
    }

    var body: some View {
        switch family {
        case .inline:
            Text(primaryText)

        case .rectangular:
            VStack(alignment: .leading, spacing: 1) {
                Text("오늘 할 일").font(.system(size: 12, weight: .semibold))
                Text(primaryText).font(.system(size: 12)).lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

        case .medium:
            VStack(alignment: .leading, spacing: 8) {
                Label("오늘 할 일", systemImage: "checklist")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(SnapshotTheme.primary)

                HStack(spacing: 8) {
                    Image(systemName: snapshot.hasScore ? "checkmark.circle.fill" : "camera.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(snapshot.hasScore ? SnapshotTheme.positive : SnapshotTheme.primary)
                    Text(primaryText)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(SnapshotTheme.ink)
                        .lineLimit(2)
                }

                if snapshot.environmentRisks.isEmpty {
                    if let time = snapshot.reminderTime {
                        Text("알림 시각 \(time)")
                            .font(.system(size: 11))
                            .foregroundStyle(SnapshotTheme.light)
                    }
                } else {
                    ForEach(snapshot.environmentRisks.prefix(2), id: \.self) { risk in
                        HStack(spacing: 6) {
                            Circle().fill(SnapshotTheme.negative).frame(width: 5, height: 5)
                            Text(risk)
                                .font(.system(size: 11))
                                .foregroundStyle(SnapshotTheme.gray)
                                .lineLimit(1)
                        }
                    }
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

        default:
            VStack(alignment: .leading, spacing: 6) {
                Image(systemName: snapshot.hasScore ? "checkmark.seal.fill" : "camera.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(snapshot.hasScore ? SnapshotTheme.positive : SnapshotTheme.primary)
                Spacer(minLength: 0)
                Text(primaryText)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(SnapshotTheme.ink)
                    .lineLimit(3)
                if let risk = snapshot.environmentRisks.first {
                    Text(risk)
                        .font(.system(size: 10))
                        .foregroundStyle(SnapshotTheme.light)
                        .lineLimit(2)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
