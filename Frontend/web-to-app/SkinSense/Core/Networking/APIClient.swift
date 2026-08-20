import Foundation

// MARK: - 설정

enum APIConfig {
    static let baseURL = URL(string: "https://deepsync-backend.onrender.com")!
    /// Render 무료 티어는 콜드 스타트에 시간이 걸려 넉넉하게 잡는다.
    static let timeout: TimeInterval = 90
}

// MARK: - 응답 봉투

struct APIEnvelope<T: Decodable>: Decodable {
    let success: Bool
    let data: T?
    let error: APIErrorBody?
}

struct APIErrorBody: Decodable {
    let code: String
    let message: String
}

// MARK: - 오류

enum APIError: LocalizedError {
    case unauthorized
    case notFound(code: String, message: String)
    case failure(status: Int, code: String, message: String)
    case emptyData
    case transport(Error)
    case decoding(Error)

    var errorDescription: String? {
        switch self {
        case .unauthorized:
            return "로그인이 만료되었어요. 다시 로그인해주세요."
        case let .notFound(_, message), let .failure(_, _, message):
            return message
        case .emptyData:
            return "서버 응답이 비어 있어요."
        case .transport:
            return "네트워크 연결을 확인해주세요. 서버가 깨어나는 중이면 잠시 뒤 다시 시도해주세요."
        case .decoding:
            return "응답을 해석하지 못했어요."
        }
    }

    /// 데이터가 아직 없는 정상 상태(빈 화면)인지 여부
    var isNotFound: Bool {
        if case .notFound = self { return true }
        return false
    }
}

// MARK: - 클라이언트

final class APIClient {
    static let shared = APIClient()

    /// 로그인 후 SessionStore가 주입한다.
    var accessToken: String?
    /// 401 발생 시 토큰을 갱신하는 훅. true를 반환하면 원 요청을 한 번 재시도한다.
    var renewToken: (() async -> Bool)?
    /// 갱신까지 실패했을 때 세션을 정리하는 훅
    var onUnauthorized: (() -> Void)?

    /// 동시 401이 여러 번 갱신을 트리거하지 않도록 직렬화한다.
    private var renewalTask: Task<Bool, Never>?

    private func renewOnce() async -> Bool {
        if let running = renewalTask { return await running.value }
        guard let renewToken else { return false }
        let task = Task { await renewToken() }
        renewalTask = task
        let result = await task.value
        renewalTask = nil
        return result
    }

    private let session: URLSession
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = APIConfig.timeout
        config.timeoutIntervalForResource = APIConfig.timeout
        session = URLSession(configuration: config)
    }

    // MARK: 요청 빌더

    private func makeRequest(_ method: String, _ path: String, query: [URLQueryItem]) -> URLRequest {
        var components = URLComponents(
            url: APIConfig.baseURL.appendingPathComponent(path),
            resolvingAgainstBaseURL: false
        )!
        if !query.isEmpty { components.queryItems = query }

        var request = URLRequest(url: components.url!)
        request.httpMethod = method
        if let accessToken {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }
        return request
    }

    // MARK: 실행

    private func run<T: Decodable>(_ request: URLRequest, allowRetry: Bool = true) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.transport(error)
        }

        let status = (response as? HTTPURLResponse)?.statusCode ?? 0

        // 만료 토큰이면 갱신 후 한 번만 재시도한다.
        // 갱신 자체가 로그인 API를 부르므로, /auth/ 경로의 401은 갱신을 시도하지 않는다
        // (갱신 태스크가 자기 자신을 기다리는 교착을 막는다).
        let isAuthPath = request.url?.path.contains("/auth/") ?? false
        if status == 401 {
            if allowRetry, !isAuthPath, await renewOnce(), let accessToken {
                var retried = request
                retried.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
                return try await run(retried, allowRetry: false)
            }
            onUnauthorized?()
            throw APIError.unauthorized
        }

        let envelope: APIEnvelope<T>
        do {
            envelope = try decoder.decode(APIEnvelope<T>.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }

        guard (200..<300).contains(status), envelope.success else {
            let code = envelope.error?.code ?? "UNKNOWN"
            let message = envelope.error?.message ?? "요청을 처리하지 못했어요."
            if status == 404 {
                throw APIError.notFound(code: code, message: message)
            }
            throw APIError.failure(status: status, code: code, message: message)
        }

        guard let value = envelope.data else { throw APIError.emptyData }
        return value
    }

    // MARK: 공개 API

    func get<T: Decodable>(_ path: String, query: [URLQueryItem] = []) async throws -> T {
        try await run(makeRequest("GET", path, query: query))
    }

    func send<T: Decodable>(_ method: String, _ path: String, query: [URLQueryItem] = []) async throws -> T {
        try await run(makeRequest(method, path, query: query))
    }

    func send<Body: Encodable, T: Decodable>(
        _ method: String,
        _ path: String,
        body: Body,
        query: [URLQueryItem] = []
    ) async throws -> T {
        var request = makeRequest(method, path, query: query)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        return try await run(request)
    }

    /// 본문 없이 성공 여부만 확인하는 요청 (DELETE 등)
    func sendNoContent(_ method: String, _ path: String, query: [URLQueryItem] = [], allowRetry: Bool = true) async throws {
        let request = makeRequest(method, path, query: query)
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.transport(error)
        }

        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if status == 401 {
            if allowRetry, await renewOnce() {
                return try await sendNoContent(method, path, query: query, allowRetry: false)
            }
            onUnauthorized?()
            throw APIError.unauthorized
        }
        guard (200..<300).contains(status) else {
            let envelope = try? decoder.decode(APIEnvelope<String?>.self, from: data)
            throw APIError.failure(status: status,
                                   code: envelope?.error?.code ?? "UNKNOWN",
                                   message: envelope?.error?.message ?? "요청을 처리하지 못했어요.")
        }
    }

    /// multipart/form-data 업로드 (이미지 + JSON 메타데이터 파트)
    func upload<Meta: Encodable, T: Decodable>(
        _ path: String,
        imageData: Data,
        fileName: String,
        mimeType: String,
        metadata: Meta
    ) async throws -> T {
        var request = makeRequest("POST", path, query: [])
        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        func append(_ string: String) { body.append(Data(string.utf8)) }

        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"image\"; filename=\"\(fileName)\"\r\n")
        append("Content-Type: \(mimeType)\r\n\r\n")
        body.append(imageData)
        append("\r\n")

        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"metadata\"\r\n")
        append("Content-Type: application/json\r\n\r\n")
        body.append(try encoder.encode(metadata))
        append("\r\n--\(boundary)--\r\n")

        request.httpBody = body
        return try await run(request)
    }

    /// 이미지 원본 바이트 (봉투 없이 그대로 내려온다)
    func download(_ path: String, allowRetry: Bool = true) async throws -> Data {
        let request = makeRequest("GET", path, query: [])
        do {
            let (data, response) = try await session.data(for: request)
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            if status == 401 {
                if allowRetry, await renewOnce() {
                    return try await download(path, allowRetry: false)
                }
                onUnauthorized?()
                throw APIError.unauthorized
            }
            guard (200..<300).contains(status) else {
                throw APIError.failure(status: status, code: "IMAGE_LOAD_FAILED", message: "이미지를 불러오지 못했어요.")
            }
            return data
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.transport(error)
        }
    }
}
