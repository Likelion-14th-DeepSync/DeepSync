import AVFoundation
import SwiftUI

/// 전면 카메라 세션과 사진 촬영을 담당한다.
/// 시뮬레이터처럼 카메라가 없는 환경에서는 isAvailable이 false가 되고
/// 촬영 화면이 사진 보관함 선택으로 대체된다.
@MainActor
final class CameraController: ObservableObject {
    @Published private(set) var isAvailable = false
    @Published private(set) var isConfigured = false
    @Published var permissionDenied = false

    let session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private var delegates: [PhotoCaptureDelegate] = []

    func configure() async {
        guard !isConfigured else { return }

        guard AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) != nil else {
            isAvailable = false
            isConfigured = true
            return
        }

        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            break
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            if !granted {
                permissionDenied = true
                isConfigured = true
                return
            }
        default:
            permissionDenied = true
            isConfigured = true
            return
        }

        let session = self.session
        let output = self.photoOutput
        let configured = await Task.detached { () -> Bool in
            session.beginConfiguration()
            session.sessionPreset = .photo
            defer { session.commitConfiguration() }

            guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
                  let input = try? AVCaptureDeviceInput(device: device),
                  session.canAddInput(input), session.canAddOutput(output) else { return false }

            session.addInput(input)
            session.addOutput(output)
            return true
        }.value

        isAvailable = configured
        isConfigured = true
        if configured { start() }
    }

    func start() {
        guard isAvailable, !session.isRunning else { return }
        let session = self.session
        Task.detached { session.startRunning() }
    }

    func stop() {
        guard session.isRunning else { return }
        let session = self.session
        Task.detached { session.stopRunning() }
    }

    /// JPEG 데이터를 반환한다.
    func capturePhoto() async throws -> Data {
        try await withCheckedThrowingContinuation { continuation in
            let settings = AVCapturePhotoSettings()
            let delegate = PhotoCaptureDelegate { [weak self] result in
                Task { @MainActor in
                    self?.delegates.removeAll { $0.id == settings.uniqueID }
                    continuation.resume(with: result)
                }
            }
            delegate.id = settings.uniqueID
            delegates.append(delegate)
            photoOutput.capturePhoto(with: settings, delegate: delegate)
        }
    }
}

private final class PhotoCaptureDelegate: NSObject, AVCapturePhotoCaptureDelegate {
    var id: Int64 = 0
    private let completion: (Result<Data, Error>) -> Void

    init(completion: @escaping (Result<Data, Error>) -> Void) {
        self.completion = completion
    }

    func photoOutput(_ output: AVCapturePhotoOutput,
                     didFinishProcessingPhoto photo: AVCapturePhoto,
                     error: Error?) {
        if let error {
            completion(.failure(error))
        } else if let data = photo.fileDataRepresentation() {
            completion(.success(data))
        } else {
            completion(.failure(CameraError.noImageData))
        }
    }
}

enum CameraError: LocalizedError {
    case noImageData
    case unavailable

    var errorDescription: String? {
        switch self {
        case .noImageData: return "사진 데이터를 만들지 못했어요."
        case .unavailable: return "이 기기에서는 카메라를 사용할 수 없어요."
        }
    }
}

/// AVCaptureVideoPreviewLayer를 SwiftUI에 얹는다.
struct CameraPreview: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> PreviewView {
        let view = PreviewView()
        view.videoPreviewLayer.session = session
        view.videoPreviewLayer.videoGravity = .resizeAspectFill
        return view
    }

    func updateUIView(_ uiView: PreviewView, context: Context) {}

    final class PreviewView: UIView {
        override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
        var videoPreviewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
    }
}
