package kr.deepsync.wellness.experiment.dto.response;

public record ScoreChangeResponse(
        double before,
        double after,
        double change
) {
    public static ScoreChangeResponse of(double before, double after) {
        return new ScoreChangeResponse(before, after, round(after - before));
    }

    private static double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
