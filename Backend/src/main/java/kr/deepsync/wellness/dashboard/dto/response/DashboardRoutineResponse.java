package kr.deepsync.wellness.dashboard.dto.response;

public record DashboardRoutineResponse(
        boolean available,
        String status,
        String message
) {
    public static DashboardRoutineResponse notConnected() {
        return new DashboardRoutineResponse(false, "NOT_CONNECTED", "오늘의 AI 루틴 기능이 아직 연결되지 않았습니다.");
    }
}
