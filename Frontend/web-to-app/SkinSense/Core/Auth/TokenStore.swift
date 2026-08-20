import Foundation
import Security

/// accessToken과 재로그인용 자격 증명을 키체인에 보관한다.
///
/// 백엔드에 refresh token 엔드포인트가 없고 accessToken 만료가 1시간이라,
/// 만료 시 저장된 자격 증명으로 조용히 재로그인한다. refresh token이 생기면
/// 자격 증명 저장은 제거해야 한다.
enum TokenStore {
    private static let service = "com.mjmac.skinsense.auth"
    private static let account = "accessToken"
    private static let credentialAccount = "credentials"

    static func save(_ token: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)

        var attributes = query
        attributes[kSecValueData as String] = Data(token.utf8)
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(attributes as CFDictionary, nil)
    }

    static func load() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func clear() {
        remove(account: account)
        remove(account: credentialAccount)
    }

    // MARK: 재로그인용 자격 증명

    struct Credentials {
        let email: String
        let password: String
    }

    static func saveCredentials(email: String, password: String) {
        let joined = email + "\u{0}" + password
        write(account: credentialAccount, value: joined)
    }

    static func loadCredentials() -> Credentials? {
        guard let raw = read(account: credentialAccount) else { return nil }
        let parts = raw.components(separatedBy: "\u{0}")
        guard parts.count == 2 else { return nil }
        return Credentials(email: parts[0], password: parts[1])
    }

    // MARK: 키체인 헬퍼

    private static func write(account: String, value: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)

        var attributes = query
        attributes[kSecValueData as String] = Data(value.utf8)
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(attributes as CFDictionary, nil)
    }

    private static func read(account: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private static func remove(account: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
    }
}
