import SwiftUI
import PhotosUI

struct CameraGuideView: View {
    var onClose: (() -> Void)? = nil

    @StateObject private var camera = CameraController()
    @StateObject private var flow = CaptureFlowViewModel()

    @State private var showFlash = false
    @State private var pickerItem: PhotosPickerItem?

    var body: some View {
        NavigationStack {
            ZStack {
                if camera.isAvailable {
                    CameraPreview(session: camera.session).ignoresSafeArea()
                } else {
                    CameraFeedPlaceholder()
                }
                Color.black.opacity(camera.isAvailable ? 0.15 : 0).ignoresSafeArea()

                // 가이드 오벌 + 안내문 (화면 중앙)
                VStack(spacing: Theme.s(22)) {
                    ScanFrameOverlay()
                        .frame(width: Theme.s(260), height: Theme.s(340))


                    GuideStatusPill(text: flow.isComplete
                                    ? "3장 촬영이 끝났어요.\n아래에서 분석을 시작하세요"
                                    : flow.currentDirection.instruction)

                    if let status = flow.statusMessage {
                        Text(status)
                            .font(.inter(.regular, 12))
                            .foregroundStyle(.white.opacity(0.85))
                    }
                    if let error = flow.errorMessage {
                        Text(error)
                            .font(.inter(.medium, 12))
                            .multilineTextAlignment(.center)
                            .foregroundStyle(.orange)
                            .padding(.horizontal, Theme.s(32))
                    }
                }

                // 상·하단 컨트롤
                VStack(spacing: 0) {
                    topBar
                    CaptureStepsIndicator(current: flow.currentDirection, capturedCount: flow.capturedCount)
                        .padding(.top, Theme.s(14))

                    Spacer()

                    bottomControls.padding(.bottom, Theme.s(28))
                }

                if showFlash {
                    Color.white.opacity(0.85).ignoresSafeArea().transition(.opacity)
                }

                if flow.isUploading {
                    ProgressView()
                        .scaleEffect(1.4)
                        .tint(.white)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(.black.opacity(0.25))
                        .ignoresSafeArea()
                }
            }
            .task {
                await camera.configure()
            }
            .onDisappear { camera.stop() }
            .onChange(of: pickerItem) { _, newValue in
                guard let newValue else { return }
                Task { await loadFromLibrary(newValue) }
            }
            .navigationDestination(item: $flow.createdAnalysisId) { analysisId in
                SkinVisionResultView(analysisId: analysisId,
                                     scores: flow.lastScores,
                                     onFinish: { flow.reset() })
            }
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    // MARK: 상단

    private var topBar: some View {
        HStack {
            if let onClose {
                CircleIconButton(icon: "xmark") { onClose() }
            } else {
                CircleIconButton(icon: "arrow.counterclockwise") { flow.reset() }
            }
            Spacer()
            Text("SkinVision 촬영 가이드")
                .font(.system(size: Theme.s(15), weight: .semibold))
                .foregroundStyle(.white)
            Spacer()
            Button {
                flow.makeupApplied.toggle()
            } label: {
                Text(flow.makeupApplied ? "메이크업 O" : "메이크업 X")
                    .font(.system(size: Theme.s(11), weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(.white.opacity(0.15))
                    .clipShape(Capsule())
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    // MARK: 하단

    private var bottomControls: some View {
        VStack(spacing: 18) {
            if flow.isComplete {
                Button {
                    Task { await flow.requestAnalysis() }
                } label: {
                    Text("분석 시작하기")
                        .font(.system(size: Theme.s(16), weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(Theme.primaryDark)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .padding(.horizontal, 40)
                .disabled(flow.isUploading)
            } else {
                HStack {
                    PhotosPicker(selection: $pickerItem, matching: .images) {
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(.white.opacity(0.15))
                            .frame(width: 48, height: 48)
                            .overlay(
                                Image(systemName: "photo.on.rectangle")
                                    .foregroundStyle(.white.opacity(0.85))
                            )
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(.white.opacity(0.3), lineWidth: 1))
                    }

                    Spacer()

                    ShutterButton(isEnabled: camera.isAvailable && !flow.isUploading) {
                        Task { await captureFromCamera() }
                    }

                    Spacer()

                    Color.clear.frame(width: 48, height: 48)
                }
                .padding(.horizontal, 40)

                if !camera.isAvailable {
                    Text(camera.permissionDenied
                         ? "카메라 권한이 꺼져 있어요. 설정에서 허용하거나 사진 보관함에서 선택해주세요."
                         : "이 기기에서는 카메라를 쓸 수 없어요. 왼쪽 버튼으로 사진을 선택해주세요.")
                        .font(.system(size: Theme.s(11)))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.white.opacity(0.7))
                        .padding(.horizontal, 40)
                }
            }
        }
    }

    // MARK: 동작

    private func captureFromCamera() async {
        withAnimation(.easeOut(duration: 0.12)) { showFlash = true }
        defer {
            withAnimation(.easeIn(duration: 0.25)) { showFlash = false }
        }
        do {
            let data = try await camera.capturePhoto()
            let jpeg = UIImage(data: data)?.jpegForUpload() ?? data
            await flow.submit(imageData: jpeg)
        } catch {
            flow.errorMessage = error.localizedDescription
        }
    }

    private func loadFromLibrary(_ item: PhotosPickerItem) async {
        defer { pickerItem = nil }
        guard let data = try? await item.loadTransferable(type: Data.self),
              let jpeg = UIImage(data: data)?.jpegForUpload() else {
            flow.errorMessage = "사진을 읽지 못했어요."
            return
        }
        await flow.submit(imageData: jpeg)
    }
}

// MARK: - 카메라 없는 환경용 배경

private struct CameraFeedPlaceholder: View {
    var body: some View {
        ZStack {
            RadialGradient(
                colors: [Color(red: 0.18, green: 0.2, blue: 0.22), Color(red: 0.04, green: 0.05, blue: 0.06)],
                center: .center, startRadius: 40, endRadius: 420
            )
            Image(systemName: "person.crop.circle")
                .resizable()
                .scaledToFit()
                .frame(width: 220)
                .foregroundStyle(.white.opacity(0.06))
        }
        .ignoresSafeArea()
    }
}

// MARK: - 스캔 프레임 오버레이

private struct ScanFrameOverlay: View {

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let bracket = Theme.s(24)

            ZStack(alignment: .topLeading) {
                // repeatForever 애니메이션을 이 안에 두면 오벌이 프레임 밖으로
                // 그려지는 문제가 있어 정적인 가이드로 둔다.
                Ellipse()
                    .strokeBorder(Theme.primary.opacity(0.6), lineWidth: Theme.s(2))
                    .frame(width: w, height: h)

                Ellipse()
                    .strokeBorder(Color.white.opacity(0.85),
                                  style: StrokeStyle(lineWidth: Theme.s(2), dash: [Theme.s(1), Theme.s(10)]))
                    .frame(width: w, height: h)

                cornerBracket(rotation: 0).offset(x: 0, y: 0)
                cornerBracket(rotation: 90).offset(x: w - bracket, y: 0)
                cornerBracket(rotation: 180).offset(x: w - bracket, y: h - bracket)
                cornerBracket(rotation: 270).offset(x: 0, y: h - bracket)
            }
            .frame(width: w, height: h)
        }
    }

    private func cornerBracket(rotation: Double) -> some View {
        CornerBracket()
            .stroke(Color.white, style: StrokeStyle(lineWidth: Theme.s(3), lineCap: .round))
            .frame(width: Theme.s(24), height: Theme.s(24))
            .rotationEffect(.degrees(rotation))
    }
}

/// ㄱ 자 모서리 표시
private struct CornerBracket: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        return path
    }
}

// MARK: - 상태 안내 pill

private struct GuideStatusPill: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: Theme.s(14), weight: .medium))
            .multilineTextAlignment(.center)
            .foregroundStyle(.white)
            .lineSpacing(3)
            .padding(.horizontal, 22)
            .padding(.vertical, 12)
            .background(.black.opacity(0.35))
            .clipShape(Capsule())
            .overlay(Capsule().stroke(.white.opacity(0.15), lineWidth: 1))
    }
}

// MARK: - 캡처 단계 인디케이터

private struct CaptureStepsIndicator: View {
    let current: CaptureDirection
    let capturedCount: Int

    private let order: [CaptureDirection] = [.front, .left, .right]

    var body: some View {
        HStack(spacing: 8) {
            ForEach(Array(order.enumerated()), id: \.offset) { index, direction in
                HStack(spacing: 6) {
                    Circle()
                        .fill(index < capturedCount ? Theme.primary : (direction == current ? Color.white : .white.opacity(0.3)))
                        .frame(width: 7, height: 7)
                    Text(direction.korean)
                        .font(.system(size: Theme.s(12), weight: direction == current ? .semibold : .regular))
                        .foregroundStyle(direction == current ? .white : .white.opacity(0.5))
                }
                if index < order.count - 1 {
                    Rectangle().fill(.white.opacity(0.2)).frame(width: 14, height: 1)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(.black.opacity(0.28))
        .clipShape(Capsule())
    }
}

// MARK: - 재사용 컴포넌트

private struct CircleIconButton: View {
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: Theme.s(16), weight: .medium))
                .foregroundStyle(.white)
                .frame(width: 40, height: 40)
                .background(.white.opacity(0.15))
                .clipShape(Circle())
        }
    }
}

private struct ShutterButton: View {
    let isEnabled: Bool
    let action: () -> Void
    @State private var isPressed = false

    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .stroke(.white.opacity(isEnabled ? 1 : 0.4), lineWidth: 4)
                    .frame(width: 76, height: 76)
                Circle()
                    .fill(.white.opacity(isEnabled ? 1 : 0.4))
                    .frame(width: isPressed ? 54 : 62, height: isPressed ? 54 : 62)
            }
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in withAnimation(.easeOut(duration: 0.1)) { isPressed = true } }
                .onEnded { _ in withAnimation(.easeOut(duration: 0.15)) { isPressed = false } }
        )
    }
}

#Preview {
    CameraGuideView()
}
