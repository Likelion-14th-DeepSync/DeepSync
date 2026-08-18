package kr.deepsync.wellness.dashboard.dto.response;

import kr.deepsync.wellness.experiment.dto.response.ExperimentProgressResponse;
import kr.deepsync.wellness.experiment.dto.response.ExperimentResponse;

public record DashboardExperimentResponse(
        ExperimentResponse experiment,
        ExperimentProgressResponse progress
) {
}
