import SwiftUI

/// 개인정보처리방침 · 이용약관.
/// ⚠️ 아래 본문은 출시 전 검토용 초안이다. 법무 검토 후 확정하고,
/// App Store Connect에는 웹 URL 버전을 별도로 등록해야 한다.
struct LegalView: View {
    enum Kind: String, Identifiable {
        case privacy, terms
        var id: String { rawValue }

        var title: String { self == .privacy ? "개인정보처리방침" : "이용약관" }
    }

    let kind: Kind
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.s(14)) {
                    Text("초안 — 출시 전 법무 검토 필요")
                        .font(.inter(.bold, 11))
                        .foregroundStyle(Theme.warning)
                        .padding(.horizontal, Theme.s(10))
                        .padding(.vertical, Theme.s(5))
                        .background(Theme.warning.opacity(0.12))
                        .clipShape(Capsule())

                    ForEach(Array(sections.enumerated()), id: \.offset) { _, section in
                        VStack(alignment: .leading, spacing: Theme.s(6)) {
                            Text(section.0)
                                .font(.inter(.bold, 14))
                                .foregroundStyle(Theme.textInk)
                            Text(section.1)
                                .font(.inter(.regular, 12))
                                .foregroundStyle(Theme.textGray)
                                .lineSpacing(Theme.s(3))
                        }
                    }

                    Text("시행일: 2026년 –월 –일 (확정 전)")
                        .font(.inter(.regular, 11))
                        .foregroundStyle(Theme.textTertiary)
                        .padding(.top, Theme.s(8))
                }
                .padding(Theme.s(20))
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle(kind.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) { Button("닫기") { dismiss() } }
            }
        }
    }

    private var sections: [(String, String)] {
        switch kind {
        case .privacy:
            return [
                ("1. 수집하는 개인정보",
                 "이메일 주소, 닉네임, 피부 사진, 피부 분석 결과(홍조·트러블 등 점수), 생활 기록(수면·수분·야식), 환경 기록(자외선·기온·습도·미세먼지), 피부 목표와 생활 실험 기록을 수집합니다. Apple 건강 앱 연동에 동의한 경우 수면·심박·활동 데이터를 기기에서 읽으며, 이 중 수면만 서버에 저장됩니다."),
                ("2. 이용 목적",
                 "피부 상태 분석과 변화 추적, 생활 요인과의 연관성 분석, 맞춤 리마인더 제공을 위해 사용합니다. 피부 분석은 기기 안(온디바이스 AI)에서 수행되며 분석 점수와 사진이 계정에 저장됩니다."),
                ("3. 보관 및 파기",
                 "개인정보는 회원 탈퇴 시 지체 없이 파기합니다. (탈퇴 기능 도입 예정)"),
                ("4. 제3자 제공",
                 "이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다."),
                ("5. 이용자의 권리",
                 "이용자는 언제든지 자신의 개인정보 열람·정정·삭제를 요청할 수 있습니다. 문의: (연락처 기입 필요)"),
                ("6. 건강 데이터",
                 "Apple 건강 앱에서 읽은 데이터는 피부 분석 목적 외에 사용하지 않으며, 마케팅에 활용하거나 제3자에게 판매하지 않습니다."),
            ]
        case .terms:
            return [
                ("1. 서비스 개요",
                 "SkinSense(웰니스케어)는 사진 기반 피부 컨디션 기록과 생활 습관 분석을 제공하는 웰니스 서비스입니다."),
                ("2. 의료 면책",
                 "본 서비스의 분석 결과는 의료적 진단·치료·예방을 목적으로 하지 않습니다. 피부 질환이 의심되는 경우 반드시 전문의와 상담하시기 바랍니다."),
                ("3. 계정",
                 "이용자는 정확한 정보로 가입해야 하며 계정 보안에 대한 책임은 이용자에게 있습니다."),
                ("4. 콘텐츠",
                 "이용자가 업로드한 사진의 권리는 이용자에게 있으며, 서비스 제공 목적 범위에서만 처리됩니다."),
                ("5. 서비스 변경 및 중단",
                 "서비스 내용은 사전 고지 후 변경될 수 있습니다."),
                ("6. 책임의 한계",
                 "회사는 천재지변, 통신 장애 등 불가항력으로 인한 손해에 대해 책임을 지지 않습니다."),
            ]
        }
    }
}
