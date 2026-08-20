import Foundation

@MainActor
final class DDayViewModel: ObservableObject {
    @Published var goal: LoadState<SkinGoal> = .loading
    @Published var experiment: Experiment?
    @Published var progress: ExperimentProgress?
    @Published var latestScore: Int?
    @Published var pastExperiments: [Experiment] = []
    @Published var errorMessage: String?

    func loadAll() async {
        async let a: Void = loadGoal()
        async let b: Void = loadExperiment()
        async let c: Void = loadScore()
        _ = await (a, b, c)
    }

    func loadGoal() async {
        do { goal = .loaded(try await SkinSenseAPI.activeSkinGoal()) }
        catch { goal = .from(error) }
    }

    func loadExperiment() async {
        experiment = try? await SkinSenseAPI.activeExperiment()
        if let id = experiment?.experimentId {
            progress = try? await SkinSenseAPI.experimentProgress(id: id)
        } else {
            progress = nil
        }
        let all = (try? await SkinSenseAPI.experiments()) ?? []
        pastExperiments = all.filter { $0.experimentId != experiment?.experimentId }
    }

    /// 생활 기록을 읽어 일별 체크를 자동으로 채운다. (POST /experiments/{id}/sync)
    func syncExperiment() async {
        guard let id = experiment?.experimentId else { return }
        errorMessage = nil
        do {
            let checks = try await SkinSenseAPI.syncExperiment(id: id)
            progress = try? await SkinSenseAPI.experimentProgress(id: id)
            if checks.isEmpty {
                errorMessage = "아직 판정할 생활 기록이 없어요. 생활 기록을 먼저 남겨주세요."
            }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    func loadScore() async {
        latestScore = (try? await SkinSenseAPI.latestAnalysis())?.overallScore
    }

    func createGoal(_ body: SkinGoalRequest) async {
        errorMessage = nil
        do { goal = .loaded(try await SkinSenseAPI.createSkinGoal(body)) }
        catch { errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription }
    }

    func updateGoal(id: Int64, _ body: SkinGoalRequest) async {
        errorMessage = nil
        do { goal = .loaded(try await SkinSenseAPI.updateSkinGoal(id: id, body)) }
        catch { errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription }
    }

    func completeGoal(id: Int64) async {
        do { _ = try await SkinSenseAPI.completeSkinGoal(id: id); await loadGoal() }
        catch { errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription }
    }

    func cancelGoal(id: Int64) async {
        do { _ = try await SkinSenseAPI.cancelSkinGoal(id: id); await loadGoal() }
        catch { errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription }
    }

    func createExperiment(_ body: CreateExperimentRequest) async {
        errorMessage = nil
        do {
            experiment = try await SkinSenseAPI.createExperiment(body)
            await loadExperiment()
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    func toggleCheck(date: Date, achieved: Bool) async {
        guard let id = experiment?.experimentId else { return }
        do {
            _ = try await SkinSenseAPI.setDailyCheck(id: id, date: ServerDate.dateString(date), achieved: achieved)
            progress = try? await SkinSenseAPI.experimentProgress(id: id)
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    func cancelExperiment() async {
        guard let id = experiment?.experimentId else { return }
        do { _ = try await SkinSenseAPI.cancelExperiment(id: id); await loadExperiment() }
        catch { errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription }
    }
}
